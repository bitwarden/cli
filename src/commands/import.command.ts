import * as program from "commander";
import * as inquirer from "inquirer";

import { ImportService } from "jslib-common/abstractions/import.service";
import { OrganizationService } from "jslib-common/abstractions/organization.service";

import { ImportType } from "jslib-common/services/import.service";

import { Response } from "jslib-node/cli/models/response";
import { MessageResponse } from "jslib-node/cli/models/response/messageResponse";

import { CliUtils } from "../utils";

export class ImportCommand {
  constructor(
    private importService: ImportService,
    private organizationService: OrganizationService
  ) { }

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

    let importPassword: string = null;
    if (format === "bitwardenpasswordprotected") {
      const answer: inquirer.Answers = await inquirer.createPromptModule({
        output: process.stderr,
      })({
        type: "password",
        name: "password",
        message: "Import file password:",
      });
      importPassword = answer.password;
    }

    if (options.formats || false) {
      return await this.list();
    } else {
      return await this.import(format, filepath, organizationId, importPassword);
    }
  }

  private async import(
    format: ImportType,
    filepath: string,
    organizationId: string,
    importPassword: string
  ) {
    if (format == null) {
      return Response.badRequest("`format` was not provided.");
    }
    if (filepath == null || filepath === "") {
      return Response.badRequest("`filepath` was not provided.");
    }

    const importer = await this.importService.getImporter(format, organizationId, importPassword);
    if (importer === null) {
      return Response.badRequest("Proper importer type required.");
    }

    try {
      const contents = await CliUtils.readFile(filepath);
      if (contents === null || contents === "") {
        return Response.badRequest("Import file was empty.");
      }

      const err = await this.importService.import(importer, contents, organizationId);
      if (err != null) {
        return Response.badRequest(err.message);
      }
      const res = new MessageResponse("Imported " + filepath, null);
      return Response.success(res);
    } catch (err) {
      return Response.badRequest(err);
    }
  }

  private async list() {
    const options = this.importService
      .getImportOptions()
      .concat([{ id: "bitwardenPasswordProtected", name: "Bitwarden Password Protected" }])
      .sort((a, b) => {
        return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
      })
      .map((option) => option.id)
      .join("\n");
    const res = new MessageResponse("Supported input formats:", options);
    res.raw = options;
    return Response.success(res);
  }
}
