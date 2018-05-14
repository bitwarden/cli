import * as program from 'commander';

import { CipherType } from 'jslib/enums/cipherType';

import { CipherService } from 'jslib/abstractions/cipher.service';
import { CollectionService } from 'jslib/abstractions/collection.service';
import { FolderService } from 'jslib/abstractions/folder.service';
import { TotpService } from 'jslib/abstractions/totp.service';

import { Response } from '../models/response';
import { CipherResponse } from '../models/response/cipherResponse';
import { CollectionResponse } from '../models/response/collectionResponse';
import { FolderResponse } from '../models/response/folderResponse';
import { StringResponse } from '../models/response/stringResponse';
import { TemplateResponse } from '../models/response/templateResponse';

import { CipherRequest } from '../models/request/cipherRequest';
import { LoginRequest } from '../models/request/loginRequest';
import { LoginUriRequest } from '../models/request/loginUriRequest';
import { FieldRequest } from '../models/request/fieldRequest';
import { CardRequest } from '../models/request/cardRequest';
import { IdentityRequest } from '../models/request/identityRequest';
import { SecureNoteRequest } from '../models/request/secureNoteRequest';

export class GetCommand {
    constructor(private cipherService: CipherService, private folderService: FolderService,
        private collectionService: CollectionService, private totpService: TotpService) { }

    async run(object: string, id: string, cmd: program.Command): Promise<Response> {
        switch (object.toLowerCase()) {
            case 'item':
                return await this.getCipher(id);
            case 'totp':
                return await this.getTotp(id);
            case 'folder':
                return await this.getFolder(id);
            case 'collection':
                return await this.getCollection(id);
            case 'template':
                return await this.getTemplate(id);
            default:
                return Response.badRequest('Unknown object.');
        }
    }

    private async getCipher(id: string) {
        const cipher = await this.cipherService.get(id);
        if (cipher == null) {
            return Response.notFound();
        }

        const decCipher = await cipher.decrypt();
        const res = new CipherResponse(decCipher);
        return Response.success(res);
    }

    private async getTotp(id: string) {
        const cipher = await this.cipherService.get(id);
        if (cipher == null) {
            return Response.notFound();
        }

        if (cipher.type !== CipherType.Login) {
            return Response.badRequest('Not a login.');
        }

        const decCipher = await cipher.decrypt();
        if (decCipher.login.totp == null || decCipher.login.totp === '') {
            return Response.error('No TOTP available for this login.');
        }

        const totp = await this.totpService.getCode(decCipher.login.totp);
        if (totp == null) {
            return Response.error('Couldn\'t generate TOTP code.');
        }

        const res = new StringResponse(totp);
        return Response.success(res);
    }

    private async getFolder(id: string) {
        const folder = await this.folderService.get(id);
        if (folder == null) {
            return Response.notFound();
        }

        const decFolder = await folder.decrypt();
        const res = new FolderResponse(decFolder);
        return Response.success(res);
    }

    private async getCollection(id: string) {
        const collection = await this.collectionService.get(id);
        if (collection == null) {
            return Response.notFound();
        }

        const decCollection = await collection.decrypt();
        const res = new CollectionResponse(decCollection);
        return Response.success(res);
    }

    private async getTemplate(id: string) {
        let template: any = null;
        switch (id.toLowerCase()) {
            case 'item':
                template = CipherRequest.template();
                break;
            case 'field':
                template = FieldRequest.template();
                break;
            case 'login':
                template = LoginRequest.template();
                break;
            case 'loginuri':
                template = LoginUriRequest.template();
                break;
            case 'card':
                template = CardRequest.template();
                break;
            case 'identity':
                template = IdentityRequest.template();
                break;
            case 'securenote':
                template = SecureNoteRequest.template();
                break;
            default:
                return Response.badRequest('Unknown object.');

        }
        const res = new TemplateResponse(template);
        return Response.success(res);
    }
}
