import * as program from "commander";
import * as inquirer from "inquirer";

import { ImportService } from "jslib-common/abstractions/import.service";
import { OrganizationService } from "jslib-common/abstractions/organization.service";
import { ImportType } from "jslib-common/enums/importOptions";
import { Importer } from "jslib-common/importers/importer";
import { Response } from "jslib-node/cli/models/response";
import { MessageResponse } from "jslib-node/cli/models/response/messageResponse";

import { CliUtils } from "../utils";

export class ImportCommand {
  constructor(
    private importService: ImportService,
    private organizationService: OrganizationService
  ) {}

  async run(
    format: ImportType,
    filepath: string,
    options: program.OptionValues
  ): Promise<Response> {
    const organizationId = options.organizationid;
    if (organizationId != null) {
      const organization = await this.organizationService.get(organizationId);

      if (organization == null) {
        return Response.badRequest(
          `You do not belong to an organization with the ID of ${organizationId}. Check the organization ID and sync your vault.`
        );
      }

      if (!organization.canAccessImportExport) {
        return Response.badRequest(
          "You are not authorized to import into the provided organization."
        );
      }
    }

    if (options.formats || false) {
      return await this.list();
    } else {
      return await this.import(format, filepath, organizationId);
    }
  }

  private async import(format: ImportType, filepath: string, organizationId: string) {
    if (format == null) {
      return Response.badRequest("`format` was not provided.");
    }
    if (filepath == null || filepath === "") {
      return Response.badRequest("`filepath` was not provided.");
    }

    const importer = await this.importService.getImporter(format, organizationId);
    if (importer === null) {
      return Response.badRequest("Proper importer type required.");
    }

    try {
      let contents;
      if (format === "1password1pux") {
        contents = await CliUtils.extract1PuxContent(filepath);
      } else {
        contents = await CliUtils.readFile(filepath);
      }

      if (contents === null || contents === "") {
        return Response.badRequest("Import file was empty.");
      }

      const response = await this.doImport(importer, contents, organizationId);
      if (response.success) {
        response.data = new MessageResponse("Imported " + filepath, null);
      }
      return response;
    } catch (err) {
      return Response.badRequest(err);
    }
  }

  private async list() {
    const options = this.importService
      .getImportOptions()
      .sort((a, b) => {
        return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
      })
      .map((option) => option.id)
      .join("\n");
    const res = new MessageResponse("Supported input formats:", options);
    res.raw = options;
    return Response.success(res);
  }

  private async doImport(
    importer: Importer,
    contents: string,
    organizationId?: string
  ): Promise<Response> {
    const err = await this.importService.import(importer, contents, organizationId);
    if (err != null) {
      if (err.passwordRequired) {
        importer = this.importService.getImporter(
          "bitwardenpasswordprotected",
          organizationId,
          await this.promptPassword()
        );
        return this.doImport(importer, contents, organizationId);
      }
      return Response.badRequest(err.message);
    }

    return Response.success();
  }

  private async promptPassword() {
    const answer: inquirer.Answers = await inquirer.createPromptModule({
      output: process.stderr,
    })({
      type: "password",
      name: "password",
      message: "Import file password:",
    });
    return answer.password;
  }
}
