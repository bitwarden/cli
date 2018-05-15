import * as program from 'commander';

import { CipherService } from 'jslib/abstractions/cipher.service';
import { FolderService } from 'jslib/abstractions/folder.service';

import { Response } from '../models/response';

export class DeleteCommand {
    constructor(private cipherService: CipherService, private folderService: FolderService) { }

    async run(object: string, id: string, cmd: program.Command): Promise<Response> {
        switch (object.toLowerCase()) {
            case 'item':
                return await this.deleteCipher(id);
            case 'folder':
                return await this.deleteFolder(id);
            default:
                return Response.badRequest('Unknown object.');
        }
    }

    private async deleteCipher(id: string) {
        const cipher = await this.cipherService.get(id);
        if (cipher == null) {
            return Response.notFound();
        }

        try {
            await this.cipherService.deleteWithServer(id);
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
}
