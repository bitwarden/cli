import * as program from 'commander';

import { CipherType } from 'jslib/enums/cipherType';

import { ApiService } from 'jslib/abstractions/api.service';
import { AuditService } from 'jslib/abstractions/audit.service';
import { CipherService } from 'jslib/abstractions/cipher.service';
import { CollectionService } from 'jslib/abstractions/collection.service';
import { CryptoService } from 'jslib/abstractions/crypto.service';
import { EnvironmentService } from 'jslib/abstractions/environment.service';
import { FolderService } from 'jslib/abstractions/folder.service';
import { SearchService } from 'jslib/abstractions/search.service';
import { SendService } from 'jslib/abstractions/send.service';
import { TotpService } from 'jslib/abstractions/totp.service';
import { UserService } from 'jslib/abstractions/user.service';

import { Organization } from 'jslib/models/domain/organization';

import { Card } from 'jslib/models/export/card';
import { Cipher } from 'jslib/models/export/cipher';
import { Collection } from 'jslib/models/export/collection';
import { Field } from 'jslib/models/export/field';
import { Folder } from 'jslib/models/export/folder';
import { Identity } from 'jslib/models/export/identity';
import { Login } from 'jslib/models/export/login';
import { LoginUri } from 'jslib/models/export/loginUri';
import { SecureNote } from 'jslib/models/export/secureNote';

import { CipherView } from 'jslib/models/view/cipherView';
import { CollectionView } from 'jslib/models/view/collectionView';
import { FolderView } from 'jslib/models/view/folderView';

import { CipherString } from 'jslib/models/domain/cipherString';

import { Response } from 'jslib/cli/models/response';
import { MessageResponse } from 'jslib/cli/models/response/messageResponse';
import { StringResponse } from 'jslib/cli/models/response/stringResponse';

import { CipherResponse } from '../models/response/cipherResponse';
import { CollectionResponse } from '../models/response/collectionResponse';
import { FolderResponse } from '../models/response/folderResponse';
import { OrganizationCollectionResponse } from '../models/response/organizationCollectionResponse';
import { OrganizationResponse } from '../models/response/organizationResponse';
import { SendFileResponse } from '../models/response/sendFileResponse';
import { SendResponse } from '../models/response/sendResponse';
import { SendTextResponse } from '../models/response/sendTextResponse';
import { TemplateResponse } from '../models/response/templateResponse';

import { OrganizationCollectionRequest } from '../models/request/organizationCollectionRequest';

import { SelectionReadOnly } from '../models/selectionReadOnly';

import { DownloadCommand } from './download.command';

import { CliUtils } from '../utils';

import { Utils } from 'jslib/misc/utils';

export class GetCommand extends DownloadCommand {
    constructor(private cipherService: CipherService, private folderService: FolderService,
        private collectionService: CollectionService, private totpService: TotpService,
        private auditService: AuditService, cryptoService: CryptoService,
        private userService: UserService, private searchService: SearchService,
        private apiService: ApiService, private sendService: SendService,
        private environmentService: EnvironmentService) {
        super(cryptoService);
    }

    async run(object: string, id: string, options: program.OptionValues): Promise<Response> {
        if (id != null) {
            id = id.toLowerCase();
        }

        switch (object.toLowerCase()) {
            case 'item':
                return await this.getCipher(id);
            case 'username':
                return await this.getUsername(id);
            case 'password':
                return await this.getPassword(id);
            case 'uri':
                return await this.getUri(id);
            case 'totp':
                return await this.getTotp(id);
            case 'exposed':
                return await this.getExposed(id);
            case 'attachment':
                return await this.getAttachment(id, options);
            case 'folder':
                return await this.getFolder(id);
            case 'collection':
                return await this.getCollection(id);
            case 'org-collection':
                return await this.getOrganizationCollection(id, options);
            case 'organization':
                return await this.getOrganization(id);
            case 'template':
                return await this.getTemplate(id);
            case 'fingerprint':
                return await this.getFingerprint(id);
            default:
                return Response.badRequest('Unknown object.');
        }
    }

    private async getCipherView(id: string): Promise<CipherView | CipherView[]> {
        let decCipher: CipherView = null;
        if (Utils.isGuid(id)) {
            const cipher = await this.cipherService.get(id);
            if (cipher != null) {
                decCipher = await cipher.decrypt();
            }
        } else if (id.trim() !== '') {
            let ciphers = await this.cipherService.getAllDecrypted();
            ciphers = this.searchService.searchCiphersBasic(ciphers, id);
            if (ciphers.length > 1) {
                return ciphers;
            }
            if (ciphers.length > 0) {
                decCipher = ciphers[0];
            }
        }

        return decCipher;
    }

    private async getCipher(id: string, filter?: (c: CipherView) => boolean) {
        let decCipher = await this.getCipherView(id);
        if (decCipher == null) {
            return Response.notFound();
        }
        if (Array.isArray(decCipher)) {
            if (filter != null) {
                const filteredCiphers = decCipher.filter(filter);
                if (filteredCiphers.length === 1) {
                    decCipher = filteredCiphers[0];
                }
            }
            if (Array.isArray(decCipher)) {
                return Response.multipleResults(decCipher.map(c => c.id));
            }
        }
        const res = new CipherResponse(decCipher);
        return Response.success(res);
    }

    private async getUsername(id: string) {
        const cipherResponse = await this.getCipher(id,
            c => c.type === CipherType.Login && !Utils.isNullOrWhitespace(c.login.username));
        if (!cipherResponse.success) {
            return cipherResponse;
        }

        const cipher = cipherResponse.data as CipherResponse;
        if (cipher.type !== CipherType.Login) {
            return Response.badRequest('Not a login.');
        }

        if (Utils.isNullOrWhitespace(cipher.login.username)) {
            return Response.error('No username available for this login.');
        }

        const res = new StringResponse(cipher.login.username);
        return Response.success(res);
    }

    private async getPassword(id: string) {
        const cipherResponse = await this.getCipher(id,
            c => c.type === CipherType.Login && !Utils.isNullOrWhitespace(c.login.password));
        if (!cipherResponse.success) {
            return cipherResponse;
        }

        const cipher = cipherResponse.data as CipherResponse;
        if (cipher.type !== CipherType.Login) {
            return Response.badRequest('Not a login.');
        }

        if (Utils.isNullOrWhitespace(cipher.login.password)) {
            return Response.error('No password available for this login.');
        }

        const res = new StringResponse(cipher.login.password);
        return Response.success(res);
    }

    private async getUri(id: string) {
        const cipherResponse = await this.getCipher(id,
            c => c.type === CipherType.Login && c.login.uris != null && c.login.uris.length > 0 &&
                c.login.uris[0].uri !== '');
        if (!cipherResponse.success) {
            return cipherResponse;
        }

        const cipher = cipherResponse.data as CipherResponse;
        if (cipher.type !== CipherType.Login) {
            return Response.badRequest('Not a login.');
        }

        if (cipher.login.uris == null || cipher.login.uris.length === 0 || cipher.login.uris[0].uri === '') {
            return Response.error('No uri available for this login.');
        }

        const res = new StringResponse(cipher.login.uris[0].uri);
        return Response.success(res);
    }

    private async getTotp(id: string) {
        const cipherResponse = await this.getCipher(id,
            c => c.type === CipherType.Login && !Utils.isNullOrWhitespace(c.login.totp));
        if (!cipherResponse.success) {
            return cipherResponse;
        }

        const cipher = cipherResponse.data as CipherResponse;
        if (cipher.type !== CipherType.Login) {
            return Response.badRequest('Not a login.');
        }

        if (Utils.isNullOrWhitespace(cipher.login.totp)) {
            return Response.error('No TOTP available for this login.');
        }

        const totp = await this.totpService.getCode(cipher.login.totp);
        if (totp == null) {
            return Response.error('Couldn\'t generate TOTP code.');
        }

        const canAccessPremium = await this.userService.canAccessPremium();
        if (!canAccessPremium) {
            const originalCipher = await this.cipherService.get(cipher.id);
            if (originalCipher == null || originalCipher.organizationId == null ||
                !originalCipher.organizationUseTotp) {
                return Response.error('Premium status is required to use this feature.');
            }
        }

        const res = new StringResponse(totp);
        return Response.success(res);
    }

    private async getExposed(id: string) {
        const passwordResponse = await this.getPassword(id);
        if (!passwordResponse.success) {
            return passwordResponse;
        }

        const exposedNumber = await this.auditService.passwordLeaked((passwordResponse.data as StringResponse).data);
        const res = new StringResponse(exposedNumber.toString());
        return Response.success(res);
    }

    private async getAttachment(id: string, options: program.OptionValues) {
        if (options.itemid == null || options.itemid === '') {
            return Response.badRequest('--itemid <itemid> required.');
        }

        const itemId = options.itemid.toLowerCase();
        const cipherResponse = await this.getCipher(itemId);
        if (!cipherResponse.success) {
            return cipherResponse;
        }

        const cipher = await this.getCipherView(itemId);
        if (cipher == null || Array.isArray(cipher) || cipher.attachments == null || cipher.attachments.length === 0) {
            return Response.error('No attachments available for this item.');
        }

        let attachments = cipher.attachments.filter(a => a.id.toLowerCase() === id ||
            (a.fileName != null && a.fileName.toLowerCase().indexOf(id) > -1));
        if (attachments.length === 0) {
            return Response.error('Attachment `' + id + '` was not found.');
        }

        const exactMatches = attachments.filter((a) => a.fileName.toLowerCase() === id);
        if (exactMatches.length === 1) {
            attachments = exactMatches;
        }

        if (attachments.length > 1) {
            return Response.multipleResults(attachments.map(a => a.id));
        }

        if (!(await this.userService.canAccessPremium())) {
            const originalCipher = await this.cipherService.get(cipher.id);
            if (originalCipher == null || originalCipher.organizationId == null) {
                return Response.error('Premium status is required to use this feature.');
            }
        }

        const key = attachments[0].key != null ? attachments[0].key :
            await this.cryptoService.getOrgKey(cipher.organizationId);
        return await this.saveAttachmentToFile(attachments[0].url, key, attachments[0].fileName, options.output);
    }

    private async getFolder(id: string) {
        let decFolder: FolderView = null;
        if (Utils.isGuid(id)) {
            const folder = await this.folderService.get(id);
            if (folder != null) {
                decFolder = await folder.decrypt();
            }
        } else if (id.trim() !== '') {
            let folders = await this.folderService.getAllDecrypted();
            folders = CliUtils.searchFolders(folders, id);
            if (folders.length > 1) {
                return Response.multipleResults(folders.map(f => f.id));
            }
            if (folders.length > 0) {
                decFolder = folders[0];
            }
        }

        if (decFolder == null) {
            return Response.notFound();
        }
        const res = new FolderResponse(decFolder);
        return Response.success(res);
    }

    private async getCollection(id: string) {
        let decCollection: CollectionView = null;
        if (Utils.isGuid(id)) {
            const collection = await this.collectionService.get(id);
            if (collection != null) {
                decCollection = await collection.decrypt();
            }
        } else if (id.trim() !== '') {
            let collections = await this.collectionService.getAllDecrypted();
            collections = CliUtils.searchCollections(collections, id);
            if (collections.length > 1) {
                return Response.multipleResults(collections.map(c => c.id));
            }
            if (collections.length > 0) {
                decCollection = collections[0];
            }
        }

        if (decCollection == null) {
            return Response.notFound();
        }
        const res = new CollectionResponse(decCollection);
        return Response.success(res);
    }

    private async getOrganizationCollection(id: string, options: program.OptionValues) {
        if (options.organizationid == null || options.organizationid === '') {
            return Response.badRequest('--organizationid <organizationid> required.');
        }
        if (!Utils.isGuid(id)) {
            return Response.error('`' + id + '` is not a GUID.');
        }
        if (!Utils.isGuid(options.organizationid)) {
            return Response.error('`' + options.organizationid + '` is not a GUID.');
        }
        try {
            const orgKey = await this.cryptoService.getOrgKey(options.organizationid);
            if (orgKey == null) {
                throw new Error('No encryption key for this organization.');
            }

            const response = await this.apiService.getCollectionDetails(options.organizationid, id);
            const decCollection = new CollectionView(response);
            decCollection.name = await this.cryptoService.decryptToUtf8(
                new CipherString(response.name), orgKey);
            const groups = response.groups == null ? null :
                response.groups.map(g => new SelectionReadOnly(g.id, g.readOnly, g.hidePasswords));
            const res = new OrganizationCollectionResponse(decCollection, groups);
            return Response.success(res);
        } catch (e) {
            return Response.error(e);
        }
    }

    private async getOrganization(id: string) {
        let org: Organization = null;
        if (Utils.isGuid(id)) {
            org = await this.userService.getOrganization(id);
        } else if (id.trim() !== '') {
            let orgs = await this.userService.getAllOrganizations();
            orgs = CliUtils.searchOrganizations(orgs, id);
            if (orgs.length > 1) {
                return Response.multipleResults(orgs.map(c => c.id));
            }
            if (orgs.length > 0) {
                org = orgs[0];
            }
        }

        if (org == null) {
            return Response.notFound();
        }
        const res = new OrganizationResponse(org);
        return Response.success(res);
    }

    private async getTemplate(id: string) {
        let template: any = null;
        switch (id.toLowerCase()) {
            case 'item':
                template = Cipher.template();
                break;
            case 'item.field':
                template = Field.template();
                break;
            case 'item.login':
                template = Login.template();
                break;
            case 'item.login.uri':
                template = LoginUri.template();
                break;
            case 'item.card':
                template = Card.template();
                break;
            case 'item.identity':
                template = Identity.template();
                break;
            case 'item.securenote':
                template = SecureNote.template();
                break;
            case 'folder':
                template = Folder.template();
                break;
            case 'collection':
                template = Collection.template();
                break;
            case 'item-collections':
                template = ['collection-id1', 'collection-id2'];
                break;
            case 'org-collection':
                template = OrganizationCollectionRequest.template();
                break;
            case 'send':
                template = SendResponse.template();
                break;
            case 'send.text':
                template = SendTextResponse.template();
                break;
            case 'send.file':
                template = SendFileResponse.template();
                break;
            default:
                return Response.badRequest('Unknown template object.');
        }

        const res = new TemplateResponse(template);
        return Response.success(res);
    }

    private async getFingerprint(id: string) {
        let fingerprint: string[] = null;
        if (id === 'me') {
            fingerprint = await this.cryptoService.getFingerprint(await this.userService.getUserId());
        } else if (Utils.isGuid(id)) {
            try {
                const response = await this.apiService.getUserPublicKey(id);
                const pubKey = Utils.fromB64ToArray(response.publicKey);
                fingerprint = await this.cryptoService.getFingerprint(id, pubKey.buffer);
            } catch { }
        }

        if (fingerprint == null) {
            return Response.notFound();
        }
        const res = new StringResponse(fingerprint.join('-'));
        return Response.success(res);
    }
}
