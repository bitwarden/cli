import * as program from "commander";

import { CryptoService } from "jslib-common/abstractions/crypto.service";
import { EnvironmentService } from "jslib-common/abstractions/environment.service";
import { SearchService } from "jslib-common/abstractions/search.service";
import { SendService } from "jslib-common/abstractions/send.service";
import { Utils } from "jslib-common/misc/utils";
import { SendView } from "jslib-common/models/view/sendView";
import { Response } from "jslib-node/cli/models/response";

import { SendResponse } from "../../models/response/sendResponse";
import { DownloadCommand } from "../download.command";

export class SendGetCommand extends DownloadCommand {
  constructor(
    private sendService: SendService,
    private environmentService: EnvironmentService,
    private searchService: SearchService,
    cryptoService: CryptoService
  ) {
    super(cryptoService);
  }

  async run(id: string, options: program.OptionValues) {
    const serveCommand = process.env.BW_SERVE === "true";
    if (serveCommand && !Utils.isGuid(id)) {
      return Response.badRequest("`" + id + "` is not a GUID.");
    }

    let sends = await this.getSendView(id);
    if (sends == null) {
      return Response.notFound();
    }

    const webVaultUrl = this.environmentService.getWebVaultUrl();
    let filter = (s: SendView) => true;
    let selector = async (s: SendView): Promise<Response> =>
      Response.success(new SendResponse(s, webVaultUrl));
    if (!serveCommand && options?.text != null) {
      filter = (s) => {
        return filter(s) && s.text != null;
      };
      selector = async (s) => {
        // Write to stdout and response success so we get the text string only to stdout
        process.stdout.write(s.text.text);
        return Response.success();
      };
    }

    if (Array.isArray(sends)) {
      if (filter != null) {
        sends = sends.filter(filter);
      }
      if (sends.length > 1) {
        return Response.multipleResults(sends.map((s) => s.id));
      }
      if (sends.length > 0) {
        return selector(sends[0]);
      } else {
        return Response.notFound();
      }
    }

    return selector(sends);
  }

  private async getSendView(id: string): Promise<SendView | SendView[]> {
    if (Utils.isGuid(id)) {
      const send = await this.sendService.get(id);
      if (send != null) {
        return await send.decrypt();
      }
    } else if (id.trim() !== "") {
      let sends = await this.sendService.getAllDecrypted();
      sends = this.searchService.searchSends(sends, id);
      if (sends.length > 1) {
        return sends;
      } else if (sends.length > 0) {
        return sends[0];
      }
    }
  }
}
