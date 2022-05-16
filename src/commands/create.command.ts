import * as fs from "fs";
import * as path from "path";

import { ApiService } from "jslib-common/abstractions/api.service";
import { CipherService } from "jslib-common/abstractions/cipher.service";
import { CryptoService } from "jslib-common/abstractions/crypto.service";
import { FolderService } from "jslib-common/abstractions/folder.service";
import { StateService } from "jslib-common/abstractions/state.service";
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

export class CreateCommand {
  constructor(
    private cipherService: CipherService,
    private folderService: FolderService,
    private stateService: StateService,
    private cryptoService: CryptoService,
    private apiService: ApiService
  ) {}

  async run(
    object: string,
    requestJson: string,
    cmdOptions: Record<string, any>,
    additionalData: any = null
  ): Promise<Response> {
    let req: any = null;
    if (object !== "attachment") {
      if (process.env.BW_SERVE !== "true" && (requestJson == null || requestJson === "")) {
        requestJson = await CliUtils.readStdin();
      }

      if (requestJson == null || requestJson === "") {
        return Response.badRequest("`requestJson` was not provided.");
      }

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
    }

    const normalizedOptions = new Options(cmdOptions);
    switch (object.toLowerCase()) {
      case "item":
        return await this.createCipher(req);
      case "attachment":
        return await this.createAttachment(normalizedOptions, additionalData);
      case "folder":
        return await this.createFolder(req);
      case "org-collection":
        return await this.createOrganizationCollection(req, normalizedOptions);
      default:
        return Response.badRequest("Unknown object.");
    }
  }

  private async createCipher(req: CipherExport) {
    const cipher = await this.cipherService.encrypt(CipherExport.toView(req));
    try {
      await this.cipherService.saveWithServer(cipher);
      const newCipher = await this.cipherService.get(cipher.id);
      const decCipher = await newCipher.decrypt();
      const res = new CipherResponse(decCipher);
      return Response.success(res);
    } catch (e) {
      return Response.error(e);
    }
  }

  private async createAttachment(options: Options, additionalData: any) {
    if (options.itemId == null || options.itemId === "") {
      return Response.badRequest("`itemid` option is required.");
    }
    let fileBuf: Buffer = null;
    let fileName: string = null;
    if (process.env.BW_SERVE === "true") {
      fileBuf = additionalData.fileBuffer;
      fileName = additionalData.fileName;
    } else {
      if (options.file == null || options.file === "") {
        return Response.badRequest("`file` option is required.");
      }
      const filePath = path.resolve(options.file);
      if (!fs.existsSync(options.file)) {
        return Response.badRequest("Cannot find file at " + filePath);
      }
      fileBuf = fs.readFileSync(filePath);
      fileName = path.basename(filePath);
    }

    if (fileBuf == null) {
      return Response.badRequest("File not provided.");
    }
    if (fileName == null || fileName.trim() === "") {
      return Response.badRequest("File name not provided.");
    }

    const itemId = options.itemId.toLowerCase();
    const cipher = await this.cipherService.get(itemId);
    if (cipher == null) {
      return Response.notFound();
    }

    if (cipher.organizationId == null && !(await this.stateService.getCanAccessPremium())) {
      return Response.error("Premium status is required to use this feature.");
    }

    const encKey = await this.cryptoService.getEncKey();
    if (encKey == null) {
      return Response.error(
        "You must update your encryption key before you can use this feature. " +
          "See https://help.bitwarden.com/article/update-encryption-key/"
      );
    }

    try {
      await this.cipherService.saveAttachmentRawWithServer(
        cipher,
        fileName,
        new Uint8Array(fileBuf).buffer
      );
      const updatedCipher = await this.cipherService.get(cipher.id);
      const decCipher = await updatedCipher.decrypt();
      return Response.success(new CipherResponse(decCipher));
    } catch (e) {
      return Response.error(e);
    }
  }

  private async createFolder(req: FolderExport) {
    const folder = await this.folderService.encrypt(FolderExport.toView(req));
    try {
      await this.folderService.saveWithServer(folder);
      const newFolder = await this.folderService.get(folder.id);
      const decFolder = await newFolder.decrypt();
      const res = new FolderResponse(decFolder);
      return Response.success(res);
    } catch (e) {
      return Response.error(e);
    }
  }

  private async createOrganizationCollection(req: OrganizationCollectionRequest, options: Options) {
    if (options.organizationId == null || options.organizationId === "") {
      return Response.badRequest("`organizationid` option is required.");
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
      const response = await this.apiService.postCollection(req.organizationId, request);
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
  itemId: string;
  organizationId: string;
  file: string;

  constructor(passedOptions: Record<string, any>) {
    this.organizationId = passedOptions?.organizationid || passedOptions?.organizationId;
    this.itemId = passedOptions?.itemid || passedOptions?.itemId;
    this.file = passedOptions?.file;
  }
}
