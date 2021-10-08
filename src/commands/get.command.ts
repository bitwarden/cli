import { CipherType } from 'jslib-common/enums/cipherType';

import { ApiService } from 'jslib-common/abstractions/api.service';
import { AuditService } from 'jslib-common/abstractions/audit.service';
import { CipherService } from 'jslib-common/abstractions/cipher.service';
import { CollectionService } from 'jslib-common/abstractions/collection.service';
import { CryptoService } from 'jslib-common/abstractions/crypto.service';
import { FolderService } from 'jslib-common/abstractions/folder.service';
import { SearchService } from 'jslib-common/abstractions/search.service';
import { TotpService } from 'jslib-common/abstractions/totp.service';
import { UserService } from 'jslib-common/abstractions/user.service';

import { Organization } from 'jslib-common/models/domain/organization';

import { Card } from 'jslib-common/models/export/card';
import { Cipher } from 'jslib-common/models/export/cipher';
import { Collection } from 'jslib-common/models/export/collection';
import { Field } from 'jslib-common/models/export/field';
import { Folder } from 'jslib-common/models/export/folder';
import { Identity } from 'jslib-common/models/export/identity';
import { Login } from 'jslib-common/models/export/login';
import { LoginUri } from 'jslib-common/models/export/loginUri';
import { SecureNote } from 'jslib-common/models/export/secureNote';

import { CipherView } from 'jslib-common/models/view/cipherView';
import { CollectionView } from 'jslib-common/models/view/collectionView';
import { FolderView } from 'jslib-common/models/view/folderView';

import { EncString } from 'jslib-common/models/domain/encString';

import { ErrorResponse } from 'jslib-common/models/response/errorResponse';
import { Response } from 'jslib-node/cli/models/response';
import { StringResponse } from 'jslib-node/cli/models/response/stringResponse';

import { SendType } from 'jslib-common/enums/sendType';

import { CipherResponse } from '../models/response/cipherResponse';
import { CollectionResponse } from '../models/response/collectionResponse';
import { FolderResponse } from '../models/response/folderResponse';
import { OrganizationCollectionResponse } from '../models/response/organizationCollectionResponse';
import { OrganizationResponse } from '../models/response/organizationResponse';
import { SendResponse } from '../models/response/sendResponse';
import { TemplateResponse } from '../models/response/templateResponse';

import { OrganizationCollectionRequest } from '../models/request/organizationCollectionRequest';

import { SelectionReadOnly } from '../models/selectionReadOnly';

import { DownloadCommand } from './download.command';

import { CliUtils } from '../utils';

import { Utils } from 'jslib-common/misc/utils';

export class GetCommand extends DownloadCommand {
    constructor(private cipherService: CipherService, private folderService: FolderService,
        private collectionService: CollectionService, private totpService: TotpService,
        private auditService: AuditService, cryptoService: CryptoService,
        private userService: UserService, private searchService: SearchService,
        private apiService: ApiService) {
        super(cryptoService);
    }

    async run(object: string, id: string, cmdOptions: Record<string, any>): Promise<Response> {
        if (id != null) {
            id = id.toLowerCase();
        }

        const normalizedOptions = new Options(cmdOptions);
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
            case 'notes':
                return await this.getNotes(id);
            case 'exposed':
                return await this.getExposed(id);
            case 'attachment':
                return await this.getAttachment(id, normalizedOptions);
            case 'folder':
                return await this.getFolder(id);
            case 'collection':
                return await this.getCollection(id);
            case 'org-collection':
                return await this.getOrganizationCollection(id, normalizedOptions);
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
                decCipher = decCipher.filter(filter);
                if (decCipher.length === 1) {
                    decCipher = decCipher[0];
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

    private async getNotes(id: string) {
        const cipherResponse = await this.getCipher(id,
            c => !Utils.isNullOrWhitespace(c.notes));
        if (!cipherResponse.success) {
            return cipherResponse;
        }

        const cipher = cipherResponse.data as CipherResponse;
        if (Utils.isNullOrWhitespace(cipher.notes)) {
            return Response.error('No notes available for this item.');
        }

        const res = new StringResponse(cipher.notes);
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

    private async getAttachment(id: string, options: Options) {
        if (options.itemId == null || options.itemId === '') {
            return Response.badRequest('`itemid` option is required.');
        }

        const itemId = options.itemId.toLowerCase();
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

        const exactMatches = attachments.filter(a => a.fileName.toLowerCase() === id);
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

        let url: string;
        try {
            const attachmentDownloadResponse = await this.apiService.getAttachmentData(cipher.id, attachments[0].id);
            url = attachmentDownloadResponse.url;
        } catch (e) {
            if (e instanceof ErrorResponse && (e as ErrorResponse).statusCode === 404) {
                url = attachments[0].url;
            } else if (e instanceof ErrorResponse) {
                throw new Error((e as ErrorResponse).getSingleMessage());
            } else {
                throw e;
            }
        }

        const key = attachments[0].key != null ? attachments[0].key :
            await this.cryptoService.getOrgKey(cipher.organizationId);
        return await this.saveAttachmentToFile(url, key, attachments[0].fileName, options.output);
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

    private async getOrganizationCollection(id: string, options: Options) {
        if (options.organizationId == null || options.organizationId === '') {
            return Response.badRequest('`organizationid` option is required.');
        }
        if (!Utils.isGuid(id)) {
            return Response.badRequest('`' + id + '` is not a GUID.');
        }
        if (!Utils.isGuid(options.organizationId)) {
            return Response.badRequest('`' + options.organizationId + '` is not a GUID.');
        }
        try {
            const orgKey = await this.cryptoService.getOrgKey(options.organizationId);
            if (orgKey == null) {
                throw new Error('No encryption key for this organization.');
            }

            const response = await this.apiService.getCollectionDetails(options.organizationId, id);
            const decCollection = new CollectionView(response);
            decCollection.name = await this.cryptoService.decryptToUtf8(
                new EncString(response.name), orgKey);
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
            case 'send.text':
                template = SendResponse.template(SendType.Text);
                break;
            case 'send.file':
                template = SendResponse.template(SendType.File);
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

class Options {
    itemId: string;
    organizationId: string;
    output: string;

    constructor(passedOptions: Record<string, any>) {
        this.organizationId = passedOptions.organizationid || passedOptions.organizationId;
        this.itemId = passedOptions.itemid || passedOptions.itemId;
        this.output = passedOptions.output;
    }
}
