import * as program from 'commander';

import { CipherService } from 'jslib/abstractions/cipher.service';
import { FolderService } from 'jslib/services/folder.service';

import { Response } from '../models/response';

import { CipherRequest } from '../models/request/cipherRequest';
import { FolderRequest } from '../models/request/folderRequest';

export class CreateCommand {
    constructor(private cipherService: CipherService, private folderService: FolderService) { }

    async run(object: string, requestData: string, cmd: program.Command): Promise<Response> {
        let req: any = null;
        try {
            const reqJson = new Buffer(requestData, 'base64').toString();
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

    private async createCipher(req: CipherRequest) {
        const cipher = await this.cipherService.encrypt(CipherRequest.toView(req));
        try {
            await this.cipherService.saveWithServer(cipher);
            return Response.success();
        } catch (e) {
            return Response.error(e.toString());
        }
    }

    private async createFolder(req: FolderRequest) {
        const folder = await this.folderService.encrypt(FolderRequest.toView(req));
        try {
            await this.folderService.saveWithServer(folder);
            return Response.success();
        } catch (e) {
            return Response.error(e.toString());
        }
    }
}
