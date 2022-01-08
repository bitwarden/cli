import * as program from "commander";
import { ImportService } from "jslib-common/abstractions/import.service";
import { OrganizationService } from "jslib-common/abstractions/organization.service";

import { Response } from "jslib-node/cli/models/response";
import { MessageResponse } from "jslib-node/cli/models/response/messageResponse";

import { CliUtils } from "../utils";

export class ImportCommand {
  constructor(
    private importService: ImportService,
    private organizationService: OrganizationService
  ) {}

  async run(format: string, filepath: string, options: program.OptionValues): Promise<Response> {
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

  private async import(format: string, filepath: string, organizationId: string) {
    if (format == null || format === "") {
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
