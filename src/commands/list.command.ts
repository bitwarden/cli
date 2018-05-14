import * as program from 'commander';

import { CipherService } from 'jslib/abstractions/cipher.service';
import { CollectionService } from 'jslib/services/collection.service';
import { FolderService } from 'jslib/services/folder.service';

export class ListCommand {
    constructor(private cipherService: CipherService, private folderService: FolderService,
        private collectionService: CollectionService) { }

    async run(object: string, cmd: program.Command) {
        switch (object) {
            case 'items':
                await this.listCiphers();
                break;
            case 'folders':
                await this.listFolders();
                break;
            case 'collections':
                await this.listCollections();
                break;
            default:
                console.log('Unknown object: ' + object);
                break;
        }
    }

    private async listCiphers() {
        const ciphers = await this.cipherService.getAllDecrypted();
        console.log(JSON.stringify(ciphers));
    }

    private async listFolders() {
        const folders = await this.folderService.getAllDecrypted();
        console.log(JSON.stringify(folders));
    }

    private async listCollections() {
        const collections = await this.collectionService.getAllDecrypted();
        console.log(JSON.stringify(collections));
    }
}
