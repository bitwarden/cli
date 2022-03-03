import * as program from "commander";
import * as inquirer from "inquirer";

import { ApiService } from "jslib-common/abstractions/api.service";
import { CryptoService } from "jslib-common/abstractions/crypto.service";
import { CryptoFunctionService } from "jslib-common/abstractions/cryptoFunction.service";
import { EnvironmentService } from "jslib-common/abstractions/environment.service";
import { PlatformUtilsService } from "jslib-common/abstractions/platformUtils.service";
import { SendType } from "jslib-common/enums/sendType";
import { NodeUtils } from "jslib-common/misc/nodeUtils";
import { Utils } from "jslib-common/misc/utils";
import { SendAccess } from "jslib-common/models/domain/sendAccess";
import { SymmetricCryptoKey } from "jslib-common/models/domain/symmetricCryptoKey";
import { SendAccessRequest } from "jslib-common/models/request/sendAccessRequest";
import { ErrorResponse } from "jslib-common/models/response/errorResponse";
import { SendAccessView } from "jslib-common/models/view/sendAccessView";
import { Response } from "jslib-node/cli/models/response";

import { SendAccessResponse } from "../../models/response/sendAccessResponse";
import { DownloadCommand } from "../download.command";

export class SendReceiveCommand extends DownloadCommand {
  private canInteract: boolean;
  private decKey: SymmetricCryptoKey;
  private sendAccessRequest: SendAccessRequest;

  constructor(
    private apiService: ApiService,
    cryptoService: CryptoService,
    private cryptoFunctionService: CryptoFunctionService,
    private platformUtilsService: PlatformUtilsService,
    private environmentService: EnvironmentService
  ) {
    super(cryptoService);
  }

  async run(url: string, options: program.OptionValues): Promise<Response> {
    this.canInteract = process.env.BW_NOINTERACTION !== "true";

    let urlObject: URL;
    try {
      urlObject = new URL(url);
    } catch (e) {
      return Response.badRequest("Failed to parse the provided Send url");
    }

    const apiUrl = this.getApiUrl(urlObject);
    const [id, key] = this.getIdAndKey(urlObject);

    if (Utils.isNullOrWhitespace(id) || Utils.isNullOrWhitespace(key)) {
      return Response.badRequest("Failed to parse url, the url provided is not a valid Send url");
    }

    const keyArray = Utils.fromUrlB64ToArray(key);
    this.sendAccessRequest = new SendAccessRequest();

    let password = options.password;
    if (password == null || password === "") {
      if (options.passwordfile) {
        password = await NodeUtils.readFirstLine(options.passwordfile);
      } else if (options.passwordenv && process.env[options.passwordenv]) {
        password = process.env[options.passwordenv];
      }
    }

    if (password != null && password !== "") {
      this.sendAccessRequest.password = await this.getUnlockedPassword(password, keyArray);
    }

    const response = await this.sendRequest(apiUrl, id, keyArray);

    if (response instanceof Response) {
      // Error scenario
      return response;
    }

    if (options.obj != null) {
      return Response.success(new SendAccessResponse(response));
    }

    switch (response.type) {
      case SendType.Text:
        // Write to stdout and response success so we get the text string only to stdout
        process.stdout.write(response?.text?.text);
        return Response.success();
      case SendType.File: {
        const downloadData = await this.apiService.getSendFileDownloadData(
          response,
          this.sendAccessRequest,
          apiUrl
        );
        return await this.saveAttachmentToFile(
          downloadData.url,
          this.decKey,
          response?.file?.fileName,
          options.output
        );
      }
      default:
        return Response.success(new SendAccessResponse(response));
    }
  }

  private getIdAndKey(url: URL): [string, string] {
    const result = url.hash.slice(1).split("/").slice(-2);
    return [result[0], result[1]];
  }

  private getApiUrl(url: URL) {
    const urls = this.environmentService.getUrls();
    if (url.origin === "https://send.bitwarden.com") {
      return "https://vault.bitwarden.com/api";
    } else if (url.origin === urls.api) {
      return url.origin;
    } else if (this.platformUtilsService.isDev() && url.origin === urls.webVault) {
      return urls.api;
    } else {
      return url.origin + "/api";
    }
  }

  private async getUnlockedPassword(password: string, keyArray: ArrayBuffer) {
    const passwordHash = await this.cryptoFunctionService.pbkdf2(
      password,
      keyArray,
      "sha256",
      100000
    );
    return Utils.fromBufferToB64(passwordHash);
  }

  private async sendRequest(
    url: string,
    id: string,
    key: ArrayBuffer
  ): Promise<Response | SendAccessView> {
    try {
      const sendResponse = await this.apiService.postSendAccess(id, this.sendAccessRequest, url);

      const sendAccess = new SendAccess(sendResponse);
      this.decKey = await this.cryptoService.makeSendKey(key);
      return await sendAccess.decrypt(this.decKey);
    } catch (e) {
      if (e instanceof ErrorResponse) {
        if (e.statusCode === 401) {
          if (this.canInteract) {
            const answer: inquirer.Answers = await inquirer.createPromptModule({
              output: process.stderr,
            })({
              type: "password",
              name: "password",
              message: "Send password:",
            });

            // reattempt with new password
            this.sendAccessRequest.password = await this.getUnlockedPassword(answer.password, key);
            return await this.sendRequest(url, id, key);
          }

          return Response.badRequest("Incorrect or missing password");
        } else if (e.statusCode === 405) {
          return Response.badRequest("Bad Request");
        } else if (e.statusCode === 404) {
          return Response.notFound();
        }
      }
      return Response.error(e);
    }
  }
}
