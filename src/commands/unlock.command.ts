import * as program from "commander";
import * as inquirer from "inquirer";

import { ApiService } from "jslib-common/abstractions/api.service";
import { CryptoService } from "jslib-common/abstractions/crypto.service";
import { CryptoFunctionService } from "jslib-common/abstractions/cryptoFunction.service";
import { EnvironmentService } from "jslib-common/abstractions/environment.service";
import { KeyConnectorService } from "jslib-common/abstractions/keyConnector.service";
import { StateService } from "jslib-common/abstractions/state.service";
import { SyncService } from "jslib-common/abstractions/sync.service";
import { ConsoleLogService } from "jslib-common/services/consoleLog.service";

import { Response } from "jslib-node/cli/models/response";
import { MessageResponse } from "jslib-node/cli/models/response/messageResponse";

import { SecretVerificationRequest } from "jslib-common/models/request/secretVerificationRequest";

import { Utils } from "jslib-common/misc/utils";

import { HashPurpose } from "jslib-common/enums/hashPurpose";
import { NodeUtils } from "jslib-common/misc/nodeUtils";

export class UnlockCommand {
  constructor(
    private cryptoService: CryptoService,
    private stateService: StateService,
    private cryptoFunctionService: CryptoFunctionService,
    private apiService: ApiService,
    private logService: ConsoleLogService,
    private keyConnectorService: KeyConnectorService,
    private environmentService: EnvironmentService,
    private syncService: SyncService,
    private logout: () => Promise<void>
  ) {}

  async run(password: string, options: program.OptionValues) {
    const canInteract = process.env.BW_NOINTERACTION !== "true";
    if (password == null || password === "") {
      if (options?.passwordfile) {
        password = await NodeUtils.readFirstLine(options.passwordfile);
      } else if (options?.passwordenv) {
        if (process.env[options.passwordenv]) {
          password = process.env[options.passwordenv];
        } else {
          this.logService.warning(
            `Warning: Provided passwordenv ${options.passwordenv} is not set`
          );
        }
      }
    }

    if (password == null || password === "") {
      if (canInteract) {
        const answer: inquirer.Answers = await inquirer.createPromptModule({
          output: process.stderr,
        })({
          type: "password",
          name: "password",
          message: "Master password:",
        });

        password = answer.password;
      } else {
        return Response.badRequest("Master password is required.");
      }
    }

    this.setNewSessionKey();
    const email = await this.stateService.getEmail();
    const kdf = await this.stateService.getKdfType();
    const kdfIterations = await this.stateService.getKdfIterations();
    const key = await this.cryptoService.makeKey(password, email, kdf, kdfIterations);
    const storedKeyHash = await this.cryptoService.getKeyHash();

    let passwordValid = false;
    if (key != null) {
      if (storedKeyHash != null) {
        passwordValid = await this.cryptoService.compareAndUpdateKeyHash(password, key);
      } else {
        const serverKeyHash = await this.cryptoService.hashPassword(
          password,
          key,
          HashPurpose.ServerAuthorization
        );
        const request = new SecretVerificationRequest();
        request.masterPasswordHash = serverKeyHash;
        try {
          await this.apiService.postAccountVerifyPassword(request);
          passwordValid = true;
          const localKeyHash = await this.cryptoService.hashPassword(
            password,
            key,
            HashPurpose.LocalAuthorization
          );
          await this.cryptoService.setKeyHash(localKeyHash);
        } catch {}
      }
    }

    if (passwordValid) {
      await this.cryptoService.setKey(key);

      if (await this.keyConnectorService.userNeedsMigration()) {
        return await this.migrateToKeyConnector();
      }

      return this.successResponse();
    } else {
      return Response.error("Invalid master password.");
    }
  }

  private async setNewSessionKey() {
    const key = await this.cryptoFunctionService.randomBytes(64);
    process.env.BW_SESSION = Utils.fromBufferToB64(key);
  }

  private async successResponse() {
    const res = new MessageResponse(
      "Your vault is now unlocked!",
      "\n" +
        "To unlock your vault, set your session key to the `BW_SESSION` environment variable. ex:\n" +
        '$ export BW_SESSION="' +
        process.env.BW_SESSION +
        '"\n' +
        '> $env:BW_SESSION="' +
        process.env.BW_SESSION +
        '"\n\n' +
        "You can also pass the session key to any command with the `--session` option. ex:\n" +
        "$ bw list items --session " +
        process.env.BW_SESSION
    );
    res.raw = process.env.BW_SESSION;
    return Response.success(res);
  }

  private async migrateToKeyConnector(): Promise<Response> {
    // If no interaction available, alert user to use web vault
    const canInteract = process.env.BW_NOINTERACTION !== "true";
    if (!canInteract) {
      await this.logout();
      return Response.error(
        new MessageResponse(
          "An organization you are a member of is using Key Connector. " +
            "In order to access the vault, you must opt-in to Key Connector now via the web vault. You have been logged out.",
          null
        )
      );
    }

    const organization = await this.keyConnectorService.getManagingOrganization();

    const answer: inquirer.Answers = await inquirer.createPromptModule({ output: process.stderr })({
      type: "list",
      name: "convert",
      message:
        organization.name +
        " is using a self-hosted key server. A master password is no longer required to log in for members of this organization. ",
      choices: [
        {
          name: "Remove master password and unlock",
          value: "remove",
        },
        {
          name: "Leave organization and unlock",
          value: "leave",
        },
        {
          name: "Log out",
          value: "exit",
        },
      ],
    });

    if (answer.convert === "remove") {
      try {
        await this.keyConnectorService.migrateUser();
      } catch (e) {
        await this.logout();
        throw e;
      }

      // Update environment URL - required for api key login
      const urls = this.environmentService.getUrls();
      urls.keyConnector = organization.keyConnectorUrl;
      await this.environmentService.setUrls(urls, true);

      return this.successResponse();
    } else if (answer.convert === "leave") {
      await this.apiService.postLeaveOrganization(organization.id);
      await this.syncService.fullSync(true);
      return this.successResponse();
    } else {
      await this.logout();
      return Response.error("You have been logged out.");
    }
  }
}
