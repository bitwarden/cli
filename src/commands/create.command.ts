import * as program from 'commander';
import * as fs from 'fs';
import * as path from 'path';

import { CipherService } from 'jslib/abstractions/cipher.service';
import { FolderService } from 'jslib/services/folder.service';

import { Response } from '../models/response';
import { StringResponse } from '../models/response/stringResponse';

import { Attachment } from '../models/attachment';
import { Cipher } from '../models/cipher';
import { Folder } from '../models/folder';

import { CliUtils } from '../utils';

export class CreateCommand {
    constructor(private cipherService: CipherService, private folderService: FolderService) { }

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
                const reqJson = new Buffer(requestJson, 'base64').toString();
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
            return Response.success(new StringResponse(cipher.id));
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

        // TODO: premium and key check

        const cipher = await this.cipherService.get(cmd.itemid);
        if (cipher == null) {
            return Response.notFound();
        }

        try {
            const fileBuf = fs.readFileSync(filePath);
            await this.cipherService.saveAttachmentRawWithServer(cipher, path.basename(filePath),
                new Uint8Array(fileBuf).buffer);
            return Response.success();
        } catch (e) {
            return Response.error(e);
        }
    }

    private async createFolder(req: Folder) {
        const folder = await this.folderService.encrypt(Folder.toView(req));
        try {
            await this.folderService.saveWithServer(folder);
            return Response.success(new StringResponse(folder.id));
        } catch (e) {
            return Response.error(e);
        }
    }
}
