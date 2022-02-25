import { ApiService } from "jslib-common/abstractions/api.service";
import { CipherService } from "jslib-common/abstractions/cipher.service";
import { FolderService } from "jslib-common/abstractions/folder.service";
import { StateService } from "jslib-common/abstractions/state.service";
import { Utils } from "jslib-common/misc/utils";
import { Response } from "jslib-node/cli/models/response";

import { CliUtils } from "src/utils";

export class DeleteCommand {
  constructor(
    private cipherService: CipherService,
    private folderService: FolderService,
    private stateService: StateService,
    private apiService: ApiService
  ) {}

  async run(object: string, id: string, cmdOptions: Record<string, any>): Promise<Response> {
    if (id != null) {
      id = id.toLowerCase();
    }

    const normalizedOptions = new Options(cmdOptions);
    switch (object.toLowerCase()) {
      case "item":
        return await this.deleteCipher(id, normalizedOptions);
      case "attachment":
        return await this.deleteAttachment(id, normalizedOptions);
      case "folder":
        return await this.deleteFolder(id);
      case "org-collection":
        return await this.deleteOrganizationCollection(id, normalizedOptions);
      default:
        return Response.badRequest("Unknown object.");
    }
  }

  private async deleteCipher(id: string, options: Options) {
    const cipher = await this.cipherService.get(id);
    if (cipher == null) {
      return Response.notFound();
    }

    try {
      if (options.permanent) {
        await this.cipherService.deleteWithServer(id);
      } else {
        await this.cipherService.softDeleteWithServer(id);
      }
      return Response.success();
    } catch (e) {
      return Response.error(e);
    }
  }

  private async deleteAttachment(id: string, options: Options) {
    if (options.itemId == null || options.itemId === "") {
      return Response.badRequest("`itemid` option is required.");
    }

    const itemId = options.itemId.toLowerCase();
    const cipher = await this.cipherService.get(itemId);
    if (cipher == null) {
      return Response.notFound();
    }

    if (cipher.attachments == null || cipher.attachments.length === 0) {
      return Response.error("No attachments available for this item.");
    }

    const attachments = cipher.attachments.filter((a) => a.id.toLowerCase() === id);
    if (attachments.length === 0) {
      return Response.error("Attachment `" + id + "` was not found.");
    }

    if (cipher.organizationId == null && !(await this.stateService.getCanAccessPremium())) {
      return Response.error("Premium status is required to use this feature.");
    }

    try {
      await this.cipherService.deleteAttachmentWithServer(cipher.id, attachments[0].id);
      return Response.success();
    } catch (e) {
      return Response.error(e);
    }
  }

  private async deleteFolder(id: string) {
    const folder = await this.folderService.get(id);
    if (folder == null) {
      return Response.notFound();
    }

    try {
      await this.folderService.deleteWithServer(id);
      return Response.success();
    } catch (e) {
      return Response.error(e);
    }
  }

  private async deleteOrganizationCollection(id: string, options: Options) {
    if (options.organizationId == null || options.organizationId === "") {
      return Response.badRequest("`organizationid` options is required.");
    }
    if (!Utils.isGuid(id)) {
      return Response.badRequest("`" + id + "` is not a GUID.");
    }
    if (!Utils.isGuid(options.organizationId)) {
      return Response.badRequest("`" + options.organizationId + "` is not a GUID.");
    }
    try {
      await this.apiService.deleteCollection(options.organizationId, id);
      return Response.success();
    } catch (e) {
      return Response.error(e);
    }
  }
}

class Options {
  itemId: string;
  organizationId: string;
  permanent: boolean;

  constructor(passedOptions: Record<string, any>) {
    this.organizationId = passedOptions?.organizationid || passedOptions?.organizationId;
    this.itemId = passedOptions?.itemid || passedOptions?.itemId;
    this.permanent = CliUtils.convertBooleanOption(passedOptions?.permanent);
  }
}
