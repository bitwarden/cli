import * as program from 'commander';
import * as fs from 'fs';
import * as path from 'path';

import { ApiService } from 'jslib/abstractions/api.service';
import { CipherService } from 'jslib/abstractions/cipher.service';
import { CryptoService } from 'jslib/abstractions/crypto.service';
import { FolderService } from 'jslib/abstractions/folder.service';
import { UserService } from 'jslib/abstractions/user.service';

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

export class CreateCommand {
    constructor(private cipherService: CipherService, private folderService: FolderService,
        private userService: UserService, private cryptoService: CryptoService,
        private apiService: ApiService) { }

    async run(object: string, requestJson: string, cmd: program.Command): Promise<Response> {
        let req: any = null;
        if (object !== 'attachment') {
            if (requestJson == null || requestJson === '') {
                requestJson = await CliUtils.readStdin();
            }

            if (requestJson == null || requestJson === '') {
                return Response.badRequest('`requestJson` was not provided.');
            }

            try {
                const reqJson = Buffer.from(requestJson, 'base64').toString();
                req = JSON.parse(reqJson);
            } catch (e) {
                return Response.badRequest('Error parsing the encoded request data.');
            }
        }

        switch (object.toLowerCase()) {
            case 'item':
                return await this.createCipher(req);
            case 'attachment':
                return await this.createAttachment(cmd);
            case 'folder':
                return await this.createFolder(req);
            case 'org-collection':
                return await this.createOrganizationCollection(req, cmd);
            default:
                return Response.badRequest('Unknown object.');
        }
    }

    private async createCipher(req: Cipher) {
        const cipher = await this.cipherService.encrypt(Cipher.toView(req));
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

    private async createAttachment(options: program.OptionValues) {
        if (options.itemid == null || options.itemid === '') {
            return Response.badRequest('--itemid <itemid> required.');
        }
        if (options.file == null || options.file === '') {
            return Response.badRequest('--file <file> required.');
        }
        const filePath = path.resolve(options.file);
        if (!fs.existsSync(options.file)) {
            return Response.badRequest('Cannot find file at ' + filePath);
        }

        const itemId = options.itemid.toLowerCase();
        const cipher = await this.cipherService.get(itemId);
        if (cipher == null) {
            return Response.notFound();
        }

        if (cipher.organizationId == null && !(await this.userService.canAccessPremium())) {
            return Response.error('Premium status is required to use this feature.');
        }

        const encKey = await this.cryptoService.getEncKey();
        if (encKey == null) {
            return Response.error('You must update your encryption key before you can use this feature. ' +
                'See https://help.bitwarden.com/article/update-encryption-key/');
        }

        try {
            const fileBuf = fs.readFileSync(filePath);
            await this.cipherService.saveAttachmentRawWithServer(cipher, path.basename(filePath),
                new Uint8Array(fileBuf).buffer);
            const updatedCipher = await this.cipherService.get(cipher.id);
            const decCipher = await updatedCipher.decrypt();
            const res = new CipherResponse(decCipher);
            return Response.success(res);
        } catch (e) {
            return Response.error(e);
        }
    }

    private async createFolder(req: Folder) {
        const folder = await this.folderService.encrypt(Folder.toView(req));
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

    private async createOrganizationCollection(req: OrganizationCollectionRequest, options: program.OptionValues) {
        if (options.organizationid == null || options.organizationid === '') {
            return Response.badRequest('--organizationid <organizationid> required.');
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
            const response = await this.apiService.postCollection(req.organizationId, request);
            const view = Collection.toView(req);
            view.id = response.id;
            const res = new OrganizationCollectionResponse(view, groups);
            return Response.success(res);
        } catch (e) {
            return Response.error(e);
        }
    }
}
