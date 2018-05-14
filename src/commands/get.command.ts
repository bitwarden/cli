import * as program from 'commander';

import { CipherType } from 'jslib/enums/cipherType';

import { CipherService } from 'jslib/abstractions/cipher.service';
import { CollectionService } from 'jslib/abstractions/collection.service';
import { FolderService } from 'jslib/abstractions/folder.service';
import { TotpService } from 'jslib/abstractions/totp.service';

export class GetCommand {
    constructor(private cipherService: CipherService, private folderService: FolderService,
        private collectionService: CollectionService, private totpService: TotpService) { }

    async run(object: string, id: string, cmd: program.Command) {
        switch (object) {
            case 'item':
                await this.getCipher(id);
                break;
            case 'totp':
                await this.getTotp(id);
                break;
            case 'folder':
                await this.getFolder(id);
                break;
            case 'collection':
                await this.getCollection(id);
                break;
            default:
                console.log('Unknown object: ' + object);
                break;
        }
    }

    private async getCipher(id: string) {
        const cipher = await this.cipherService.get(id);
        if (cipher == null) {
            console.log('Not found.');
            return;
        }

        const decCipher = await cipher.decrypt();
        console.log(JSON.stringify(decCipher));
    }

    private async getTotp(id: string) {
        const cipher = await this.cipherService.get(id);
        if (cipher == null) {
            console.log('Not found.');
            return;
        }

        if (cipher.type !== CipherType.Login) {
            console.log('Not a login.');
            return;
        }

        const decCipher = await cipher.decrypt();
        if (decCipher.login.totp == null || decCipher.login.totp === '') {
            console.log('No TOTP available.');
            return;
        }

        const totp = await this.totpService.getCode(decCipher.login.totp);
        if (totp == null) {
            console.log('Couldn\'t generate TOTP code.');
            return;
        }

        console.log(JSON.stringify(totp));
    }

    private async getFolder(id: string) {
        const folder = await this.folderService.get(id);
        if (folder == null) {
            console.log('Not found.');
            return;
        }

        const decFolder = await folder.decrypt();
        console.log(JSON.stringify(decFolder));
    }

    private async getCollection(id: string) {
        const collection = await this.collectionService.get(id);
        if (collection == null) {
            console.log('Not found.');
            return;
        }

        const decCollection = await collection.decrypt();
        console.log(JSON.stringify(decCollection));
    }
}
