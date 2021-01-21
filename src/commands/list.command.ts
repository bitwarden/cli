import * as program from 'commander';

import { CipherView } from 'jslib/models/view/cipherView';

import { ApiService } from 'jslib/abstractions/api.service';
import { CipherService } from 'jslib/abstractions/cipher.service';
import { CollectionService } from 'jslib/abstractions/collection.service';
import { FolderService } from 'jslib/abstractions/folder.service';
import { SearchService } from 'jslib/abstractions/search.service';
import { SendService } from 'jslib/abstractions/send.service';
import { UserService } from 'jslib/abstractions/user.service';

import {
    CollectionDetailsResponse as ApiCollectionDetailsResponse,
    CollectionResponse as ApiCollectionResponse,
} from 'jslib/models/response/collectionResponse';
import { ListResponse as ApiListResponse } from 'jslib/models/response/listResponse';

import { CollectionData } from 'jslib/models/data/collectionData';

import { Collection } from 'jslib/models/domain/collection';

import { Response } from 'jslib/cli/models/response';
import { ListResponse } from 'jslib/cli/models/response/listResponse';

import { CipherResponse } from '../models/response/cipherResponse';
import { CollectionResponse } from '../models/response/collectionResponse';
import { FolderResponse } from '../models/response/folderResponse';
import { OrganizationResponse } from '../models/response/organizationResponse';
import { OrganizationUserResponse } from '../models/response/organizationUserResponse';
import { SendResponse } from '../models/response/sendResponse';

import { CliUtils } from '../utils';

import { Utils } from 'jslib/misc/utils';

export class ListCommand {
    constructor(private cipherService: CipherService, private folderService: FolderService,
        private collectionService: CollectionService, private userService: UserService,
        private searchService: SearchService, private apiService: ApiService, private sendService: SendService) { }

    async run(object: string, cmd: program.Command): Promise<Response> {
        switch (object.toLowerCase()) {
            case 'items':
                return await this.listCiphers(cmd);
            case 'folders':
                return await this.listFolders(cmd);
            case 'collections':
                return await this.listCollections(cmd);
            case 'org-collections':
                return await this.listOrganizationCollections(cmd);
            case 'org-members':
                return await this.listOrganizationMembers(cmd);
            case 'organizations':
                return await this.listOrganizations(cmd);
            case 'sends':
                return await this.listSends(cmd);
            default:
                return Response.badRequest('Unknown object.');
        }
    }

    private async listCiphers(cmd: program.Command) {
        let ciphers: CipherView[];
        cmd.trash = cmd.trash || false;
        if (cmd.url != null && cmd.url.trim() !== '') {
            ciphers = await this.cipherService.getAllDecryptedForUrl(cmd.url);
        } else {
            ciphers = await this.cipherService.getAllDecrypted();
        }

        if (cmd.folderid != null || cmd.collectionid != null || cmd.organizationid != null) {
            ciphers = ciphers.filter((c) => {
                if (cmd.trash !== c.isDeleted) {
                    return false;
                }
                if (cmd.folderid != null) {
                    if (cmd.folderid === 'notnull' && c.folderId != null) {
                        return true;
                    }
                    const folderId = cmd.folderid === 'null' ? null : cmd.folderid;
                    if (folderId === c.folderId) {
                        return true;
                    }
                }

                if (cmd.organizationid != null) {
                    if (cmd.organizationid === 'notnull' && c.organizationId != null) {
                        return true;
                    }
                    const organizationId = cmd.organizationid === 'null' ? null : cmd.organizationid;
                    if (organizationId === c.organizationId) {
                        return true;
                    }
                }

                if (cmd.collectionid != null) {
                    if (cmd.collectionid === 'notnull' && c.collectionIds != null && c.collectionIds.length > 0) {
                        return true;
                    }
                    const collectionId = cmd.collectionid === 'null' ? null : cmd.collectionid;
                    if (collectionId == null && (c.collectionIds == null || c.collectionIds.length === 0)) {
                        return true;
                    }
                    if (collectionId != null && c.collectionIds != null && c.collectionIds.indexOf(collectionId) > -1) {
                        return true;
                    }
                }
                return false;
            });
        } else if (cmd.search == null || cmd.search.trim() === '') {
            ciphers = ciphers.filter((c) => cmd.trash === c.isDeleted);
        }

        if (cmd.search != null && cmd.search.trim() !== '') {
            ciphers = this.searchService.searchCiphersBasic(ciphers, cmd.search, cmd.trash);
        }

        const res = new ListResponse(ciphers.map((o) => new CipherResponse(o)));
        return Response.success(res);
    }

    private async listSends(cmd: program.Command): Promise<Response> {
        let sends = await this.sendService.getAllDecrypted();

        if (cmd.search != null && cmd.search.trim() !== '') {
            sends = this.searchService.searchSends(sends, cmd.search);
        }

        const res = new ListResponse(sends.map(s => new SendResponse(s)));
        return Response.success(res);
    }

    private async listFolders(cmd: program.Command) {
        let folders = await this.folderService.getAllDecrypted();

        if (cmd.search != null && cmd.search.trim() !== '') {
            folders = CliUtils.searchFolders(folders, cmd.search);
        }

        const res = new ListResponse(folders.map((o) => new FolderResponse(o)));
        return Response.success(res);
    }

    private async listCollections(cmd: program.Command) {
        let collections = await this.collectionService.getAllDecrypted();

        if (cmd.organizationid != null) {
            collections = collections.filter((c) => {
                if (cmd.organizationid === c.organizationId) {
                    return true;
                }
                return false;
            });
        }

        if (cmd.search != null && cmd.search.trim() !== '') {
            collections = CliUtils.searchCollections(collections, cmd.search);
        }

        const res = new ListResponse(collections.map((o) => new CollectionResponse(o)));
        return Response.success(res);
    }

    private async listOrganizationCollections(cmd: program.Command) {
        if (cmd.organizationid == null || cmd.organizationid === '') {
            return Response.badRequest('--organizationid <organizationid> required.');
        }
        if (!Utils.isGuid(cmd.organizationid)) {
            return Response.error('`' + cmd.organizationid + '` is not a GUID.');
        }
        const organization = await this.userService.getOrganization(cmd.organizationid);
        if (organization == null) {
            return Response.error('Organization not found.');
        }

        try {
            let response: ApiListResponse<ApiCollectionResponse>;
            if (organization.canManageAllCollections) {
                response = await this.apiService.getCollections(cmd.organizationid);
            } else {
                response = await this.apiService.getUserCollections();
            }
            const collections = response.data.filter((c) => c.organizationId === cmd.organizationid).map((r) =>
                new Collection(new CollectionData(r as ApiCollectionDetailsResponse)));
            let decCollections = await this.collectionService.decryptMany(collections);
            if (cmd.search != null && cmd.search.trim() !== '') {
                decCollections = CliUtils.searchCollections(decCollections, cmd.search);
            }
            const res = new ListResponse(decCollections.map((o) => new CollectionResponse(o)));
            return Response.success(res);
        } catch (e) {
            return Response.error(e);
        }
    }

    private async listOrganizationMembers(cmd: program.Command) {
        if (cmd.organizationid == null || cmd.organizationid === '') {
            return Response.badRequest('--organizationid <organizationid> required.');
        }
        if (!Utils.isGuid(cmd.organizationid)) {
            return Response.error('`' + cmd.organizationid + '` is not a GUID.');
        }
        const organization = await this.userService.getOrganization(cmd.organizationid);
        if (organization == null) {
            return Response.error('Organization not found.');
        }

        try {
            const response = await this.apiService.getOrganizationUsers(cmd.organizationid);
            const res = new ListResponse(response.data.map((r) => {
                const u = new OrganizationUserResponse();
                u.email = r.email;
                u.name = r.name;
                u.id = r.id;
                u.status = r.status;
                u.type = r.type;
                u.twoFactorEnabled = r.twoFactorEnabled;
                return u;
            }));
            return Response.success(res);
        } catch (e) {
            return Response.error(e);
        }
    }

    private async listOrganizations(cmd: program.Command) {
        let organizations = await this.userService.getAllOrganizations();

        if (cmd.search != null && cmd.search.trim() !== '') {
            organizations = CliUtils.searchOrganizations(organizations, cmd.search);
        }

        const res = new ListResponse(organizations.map((o) => new OrganizationResponse(o)));
        return Response.success(res);
    }
}
