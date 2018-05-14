import * as program from 'commander';

import { CipherService } from 'jslib/abstractions/cipher.service';
import { CollectionService } from 'jslib/services/collection.service';
import { FolderService } from 'jslib/services/folder.service';

import { Response } from '../models/response';
import { CipherResponse } from '../models/response/cipherResponse';
import { CollectionResponse } from '../models/response/collectionResponse';
import { FolderResponse } from '../models/response/folderResponse';
import { ListResponse } from '../models/response/listResponse';

export class ListCommand {
    constructor(private cipherService: CipherService, private folderService: FolderService,
        private collectionService: CollectionService) { }

    async run(object: string, cmd: program.Command): Promise<Response> {
        switch (object) {
            case 'items':
                return await this.listCiphers();
            case 'folders':
                return await this.listFolders();
            case 'collections':
                return await this.listCollections();
            default:
                return Response.badRequest('Unknown object.');
        }
    }

    private async listCiphers() {
        const ciphers = await this.cipherService.getAllDecrypted();
        const res = new ListResponse(ciphers.map((o) => new CipherResponse(o)));
        return Response.success(res);
    }

    private async listFolders() {
        const folders = await this.folderService.getAllDecrypted();
        const res = new ListResponse(folders.map((o) => new FolderResponse(o)));
        return Response.success(res);
    }

    private async listCollections() {
        const collections = await this.collectionService.getAllDecrypted();
        const res = new ListResponse(collections.map((o) => new CollectionResponse(o)));
        return Response.success(res);
    }
}
