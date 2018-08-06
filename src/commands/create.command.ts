import * as program from 'commander';
import * as fs from 'fs';
import * as path from 'path';

import { CipherService } from 'jslib/abstractions/cipher.service';
import { CryptoService } from 'jslib/abstractions/crypto.service';
import { FolderService } from 'jslib/abstractions/folder.service';
import { TokenService } from 'jslib/abstractions/token.service';

import { Response } from '../models/response';
import { CipherResponse } from '../models/response/cipherResponse';
import { FolderResponse } from '../models/response/folderResponse';

import { Cipher } from '../models/cipher';
import { Folder } from '../models/folder';

import { CliUtils } from '../utils';

export class CreateCommand {
    constructor(private cipherService: CipherService, private folderService: FolderService,
        private tokenService: TokenService, private cryptoService: CryptoService) { }

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

    private async createAttachment(cmd: program.Command) {
        if (cmd.itemid == null || cmd.itemid === '') {
            return Response.badRequest('--itemid <itemid> required.');
        }
        if (cmd.file == null || cmd.file === '') {
            return Response.badRequest('--file <file> required.');
        }
        const filePath = path.resolve(cmd.file);
        if (!fs.existsSync(cmd.file)) {
            return Response.badRequest('Cannot find file at ' + filePath);
        }

        const itemId = cmd.itemid.toLowerCase();
        const cipher = await this.cipherService.get(itemId);
        if (cipher == null) {
            return Response.notFound();
        }

        if (cipher.organizationId == null && !this.tokenService.getPremium()) {
            return Response.error('A premium membership is required to use this feature.');
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
}
