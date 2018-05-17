import * as program from 'commander';

import { CipherService } from 'jslib/abstractions/cipher.service';
import { FolderService } from 'jslib/services/folder.service';

import { Response } from '../models/response';
import { StringResponse } from '../models/response/stringResponse';

import { Cipher } from '../models/cipher';
import { Folder } from '../models/folder';

import { CliUtils } from '../utils';

export class CreateCommand {
    constructor(private cipherService: CipherService, private folderService: FolderService) { }

    async run(object: string, requestJson: string, cmd: program.Command): Promise<Response> {
        if (requestJson == null || requestJson === '') {
            requestJson = await CliUtils.readStdin();
        }

        if (requestJson == null || requestJson === '') {
            return Response.badRequest('`requestJson` was not provided.');
        }

        let req: any = null;
        try {
            const reqJson = new Buffer(requestJson, 'base64').toString();
            req = JSON.parse(reqJson);
        } catch (e) {
            return Response.badRequest('Error parsing the encoded request data.');
        }

        switch (object.toLowerCase()) {
            case 'item':
                return await this.createCipher(req);
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
