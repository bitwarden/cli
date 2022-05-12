import { ApiService } from "jslib-common/abstractions/api.service";
import { CipherService } from "jslib-common/abstractions/cipher.service";
import { CryptoService } from "jslib-common/abstractions/crypto.service";
import { FolderService } from "jslib-common/abstractions/folder.service";
import { Utils } from "jslib-common/misc/utils";
import { CipherExport } from "jslib-common/models/export/cipherExport";
import { CollectionExport } from "jslib-common/models/export/collectionExport";
import { FolderExport } from "jslib-common/models/export/folderExport";
import { CollectionRequest } from "jslib-common/models/request/collectionRequest";
import { SelectionReadOnlyRequest } from "jslib-common/models/request/selectionReadOnlyRequest";
import { Response } from "jslib-node/cli/models/response";

import { OrganizationCollectionRequest } from "../models/request/organizationCollectionRequest";
import { CipherResponse } from "../models/response/cipherResponse";
import { FolderResponse } from "../models/response/folderResponse";
import { OrganizationCollectionResponse } from "../models/response/organizationCollectionResponse";
import { CliUtils } from "../utils";

export class EditCommand {
  constructor(
    private cipherService: CipherService,
    private folderService: FolderService,
    private cryptoService: CryptoService,
    private apiService: ApiService
  ) {}

  async run(
    object: string,
    id: string,
    requestJson: any,
    cmdOptions: Record<string, any>
  ): Promise<Response> {
    if (process.env.BW_SERVE !== "true" && (requestJson == null || requestJson === "")) {
      requestJson = await CliUtils.readStdin();
    }

    if (requestJson == null || requestJson === "") {
      return Response.badRequest("`requestJson` was not provided.");
    }

    let req: any = null;
    if (typeof requestJson !== "string") {
      req = requestJson;
    } else {
      try {
        const reqJson = Buffer.from(requestJson, "base64").toString();
        req = JSON.parse(reqJson);
      } catch (e) {
        return Response.badRequest("Error parsing the encoded request data.");
      }
    }

    if (id != null) {
      id = id.toLowerCase();
    }

    const normalizedOptions = new Options(cmdOptions);
    switch (object.toLowerCase()) {
      case "item":
        return await this.editCipher(id, req);
      case "item-collections":
        return await this.editCipherCollections(id, req);
      case "folder":
        return await this.editFolder(id, req);
      case "org-collection":
        return await this.editOrganizationCollection(id, req, normalizedOptions);
      default:
        return Response.badRequest("Unknown object.");
    }
  }

  private async editCipher(id: string, req: CipherExport) {
    const cipher = await this.cipherService.get(id);
    if (cipher == null) {
      return Response.notFound();
    }

    let cipherView = await cipher.decrypt();
    if (cipherView.isDeleted) {
      return Response.badRequest("You may not edit a deleted item. Use the restore command first.");
    }
    cipherView = CipherExport.toView(req, cipherView);
    const encCipher = await this.cipherService.encrypt(cipherView);
    try {
      await this.cipherService.saveWithServer(encCipher);
      const updatedCipher = await this.cipherService.get(cipher.id);
      const decCipher = await updatedCipher.decrypt();
      const res = new CipherResponse(decCipher);
      return Response.success(res);
    } catch (e) {
      return Response.error(e);
    }
  }

  private async editCipherCollections(id: string, req: string[]) {
    const cipher = await this.cipherService.get(id);
    if (cipher == null) {
      return Response.notFound();
    }
    if (cipher.organizationId == null) {
      return Response.badRequest(
        "Item does not belong to an organization. Consider moving it first."
      );
    }

    cipher.collectionIds = req;
    try {
      await this.cipherService.saveCollectionsWithServer(cipher);
      const updatedCipher = await this.cipherService.get(cipher.id);
      const decCipher = await updatedCipher.decrypt();
      const res = new CipherResponse(decCipher);
      return Response.success(res);
    } catch (e) {
      return Response.error(e);
    }
  }

  private async editFolder(id: string, req: FolderExport) {
    const folder = await this.folderService.get(id);
    if (folder == null) {
      return Response.notFound();
    }

    let folderView = await folder.decrypt();
    folderView = FolderExport.toView(req, folderView);
    const encFolder = await this.folderService.encrypt(folderView);
    try {
      await this.folderService.saveWithServer(encFolder);
      const updatedFolder = await this.folderService.get(folder.id);
      const decFolder = await updatedFolder.decrypt();
      const res = new FolderResponse(decFolder);
      return Response.success(res);
    } catch (e) {
      return Response.error(e);
    }
  }

  private async editOrganizationCollection(
    id: string,
    req: OrganizationCollectionRequest,
    options: Options
  ) {
    if (options.organizationId == null || options.organizationId === "") {
      return Response.badRequest("`organizationid` option is required.");
    }
    if (!Utils.isGuid(id)) {
      return Response.badRequest("`" + id + "` is not a GUID.");
    }
    if (!Utils.isGuid(options.organizationId)) {
      return Response.badRequest("`" + options.organizationId + "` is not a GUID.");
    }
    if (options.organizationId !== req.organizationId) {
      return Response.badRequest("`organizationid` option does not match request object.");
    }
    try {
      const orgKey = await this.cryptoService.getOrgKey(req.organizationId);
      if (orgKey == null) {
        throw new Error("No encryption key for this organization.");
      }

      const groups =
        req.groups == null
          ? null
          : req.groups.map((g) => new SelectionReadOnlyRequest(g.id, g.readOnly, g.hidePasswords));
      const request = new CollectionRequest();
      request.name = (await this.cryptoService.encrypt(req.name, orgKey)).encryptedString;
      request.externalId = req.externalId;
      request.groups = groups;
      const response = await this.apiService.putCollection(req.organizationId, id, request);
      const view = CollectionExport.toView(req);
      view.id = response.id;
      const res = new OrganizationCollectionResponse(view, groups);
      return Response.success(res);
    } catch (e) {
      return Response.error(e);
    }
  }
}

class Options {
  organizationId: string;

  constructor(passedOptions: Record<string, any>) {
    this.organizationId = passedOptions?.organizationid || passedOptions?.organizationId;
  }
}
