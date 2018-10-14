import * as program from 'commander';

import { CipherView } from 'jslib/models/view/cipherView';

import { CipherService } from 'jslib/abstractions/cipher.service';
import { CollectionService } from 'jslib/abstractions/collection.service';
import { FolderService } from 'jslib/abstractions/folder.service';
import { SearchService } from 'jslib/abstractions/search.service';
import { UserService } from 'jslib/abstractions/user.service';

import { Response } from '../models/response';
import { CipherResponse } from '../models/response/cipherResponse';
import { CollectionResponse } from '../models/response/collectionResponse';
import { FolderResponse } from '../models/response/folderResponse';
import { ListResponse } from '../models/response/listResponse';
import { OrganizationResponse } from '../models/response/organizationResponse';

import { CliUtils } from '../utils';

export class ListCommand {
    constructor(private cipherService: CipherService, private folderService: FolderService,
        private collectionService: CollectionService, private userService: UserService,
        private searchService: SearchService) { }

    async run(object: string, cmd: program.Command): Promise<Response> {
        switch (object.toLowerCase()) {
            case 'items':
                return await this.listCiphers(cmd);
            case 'folders':
                return await this.listFolders(cmd);
            case 'collections':
                return await this.listCollections(cmd);
            case 'organizations':
                return await this.listOrganizations(cmd);
            default:
                return Response.badRequest('Unknown object.');
        }
    }

    private async listCiphers(cmd: program.Command) {
        let ciphers: CipherView[];
        if (cmd.url != null && cmd.url.trim() !== '') {
            ciphers = await this.cipherService.getAllDecryptedForUrl(cmd.url);
        } else {
            ciphers = await this.cipherService.getAllDecrypted();
        }

        if (cmd.folderid != null || cmd.collectionid != null || cmd.organizationid != null) {
            ciphers = ciphers.filter((c) => {
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
                    if (collectionId == null && c.collectionIds == null || c.collectionIds.length === 0) {
                        return true;
                    }
                    if (collectionId != null && c.collectionIds != null && c.collectionIds.indexOf(collectionId) > -1) {
                        return true;
                    }
                }
                return false;
            });
        }

        if (cmd.search != null && cmd.search.trim() !== '') {
            ciphers = this.searchService.searchCiphersBasic(ciphers, cmd.search);
        }

        const res = new ListResponse(ciphers.map((o) => new CipherResponse(o)));
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

    private async listOrganizations(cmd: program.Command) {
        let organizations = await this.userService.getAllOrganizations();

        if (cmd.search != null && cmd.search.trim() !== '') {
            organizations = CliUtils.searchOrganizations(organizations, cmd.search);
        }

        const res = new ListResponse(organizations.map((o) => new OrganizationResponse(o)));
        return Response.success(res);
    }
}
