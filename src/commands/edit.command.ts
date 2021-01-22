import * as program from 'commander';

import { ApiService } from 'jslib/abstractions/api.service';
import { CipherService } from 'jslib/abstractions/cipher.service';
import { CryptoService } from 'jslib/abstractions/crypto.service';
import { FolderService } from 'jslib/abstractions/folder.service';

import { Cipher } from 'jslib/models/export/cipher';
import { Collection } from 'jslib/models/export/collection';
import { Folder } from 'jslib/models/export/folder';

import { CollectionRequest } from 'jslib/models/request/collectionRequest';
import { SelectionReadOnlyRequest } from 'jslib/models/request/selectionReadOnlyRequest';

import { Response } from 'jslib/cli/models/response';

import { CipherResponse } from '../models/response/cipherResponse';
import { FolderResponse } from '../models/response/folderResponse';
import { OrganizationCollectionResponse } from '../models/response/organizationCollectionResponse';

import { OrganizationCollectionRequest } from '../models/request/organizationCollectionRequest';

import { CliUtils } from '../utils';

import { Utils } from 'jslib/misc/utils';

export class EditCommand {
    constructor(private cipherService: CipherService, private folderService: FolderService,
        private cryptoService: CryptoService, private apiService: ApiService) { }

    async run(object: string, id: string, requestJson: string, cmd: program.Command): Promise<Response> {
        if (requestJson == null || requestJson === '') {
            requestJson = await CliUtils.readStdin();
        }

        if (requestJson == null || requestJson === '') {
            return Response.badRequest('`requestJson` was not provided.');
        }

        let req: any = null;
        try {
            const reqJson = Buffer.from(requestJson, 'base64').toString();
            req = JSON.parse(reqJson);
        } catch (e) {
            return Response.badRequest('Error parsing the encoded request data.');
        }

        if (id != null) {
            id = id.toLowerCase();
        }

        switch (object.toLowerCase()) {
            case 'item':
                return await this.editCipher(id, req);
            case 'item-collections':
                return await this.editCipherCollections(id, req);
            case 'folder':
                return await this.editFolder(id, req);
            case 'org-collection':
                return await this.editOrganizationCollection(id, req, cmd);
            default:
                return Response.badRequest('Unknown object.');
        }
    }

    private async editCipher(id: string, req: Cipher) {
        const cipher = await this.cipherService.get(id);
        if (cipher == null) {
            return Response.notFound();
        }

        let cipherView = await cipher.decrypt();
        if (cipherView.isDeleted) {
            return Response.badRequest('You may not edit a deleted cipher. Use restore item <id> command first.');
        }
        cipherView = Cipher.toView(req, cipherView);
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
            return Response.badRequest('Item does not belong to an organization. Consider sharing it first.');
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

    private async editFolder(id: string, req: Folder) {
        const folder = await this.folderService.get(id);
        if (folder == null) {
            return Response.notFound();
        }

        let folderView = await folder.decrypt();
        folderView = Folder.toView(req, folderView);
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

    private async editOrganizationCollection(id: string, req: OrganizationCollectionRequest, options: program.OptionValues) {
        if (options.organizationid == null || options.organizationid === '') {
            return Response.badRequest('--organizationid <organizationid> required.');
        }
        if (!Utils.isGuid(id)) {
            return Response.error('`' + id + '` is not a GUID.');
        }
        if (!Utils.isGuid(options.organizationid)) {
            return Response.error('`' + options.organizationid + '` is not a GUID.');
        }
        if (options.organizationid !== req.organizationId) {
            return Response.error('--organizationid <organizationid> does not match request object.');
        }
        try {
            const orgKey = await this.cryptoService.getOrgKey(req.organizationId);
            if (orgKey == null) {
                throw new Error('No encryption key for this organization.');
            }

            const groups = req.groups == null ? null :
                req.groups.map((g) => new SelectionReadOnlyRequest(g.id, g.readOnly, g.hidePasswords));
            const request = new CollectionRequest();
            request.name = (await this.cryptoService.encrypt(req.name, orgKey)).encryptedString;
            request.externalId = req.externalId;
            request.groups = groups;
            const response = await this.apiService.putCollection(req.organizationId, id, request);
            const view = Collection.toView(req);
            view.id = response.id;
            const res = new OrganizationCollectionResponse(view, groups);
            return Response.success(res);
        } catch (e) {
            return Response.error(e);
        }
    }
}
