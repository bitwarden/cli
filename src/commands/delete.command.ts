import * as program from 'commander';

import { ApiService } from 'jslib/abstractions/api.service';
import { CipherService } from 'jslib/abstractions/cipher.service';
import { FolderService } from 'jslib/abstractions/folder.service';
import { UserService } from 'jslib/abstractions/user.service';

import { Response } from 'jslib/cli/models/response';

import { Utils } from 'jslib/misc/utils';

export class DeleteCommand {
    constructor(private cipherService: CipherService, private folderService: FolderService,
        private userService: UserService, private apiService: ApiService) { }

    async run(object: string, id: string, cmd: program.Command): Promise<Response> {
        if (id != null) {
            id = id.toLowerCase();
        }

        switch (object.toLowerCase()) {
            case 'item':
                return await this.deleteCipher(id, cmd);
            case 'attachment':
                return await this.deleteAttachment(id, cmd);
            case 'folder':
                return await this.deleteFolder(id);
            case 'org-collection':
                return await this.deleteOrganizationCollection(id, cmd);
            default:
                return Response.badRequest('Unknown object.');
        }
    }

    private async deleteCipher(id: string, options: program.OptionValues) {
        const cipher = await this.cipherService.get(id);
        if (cipher == null) {
            return Response.notFound();
        }

        try {
            if (options.permanent) {
                await this.cipherService.deleteWithServer(id);
            } else {
                await this.cipherService.softDeleteWithServer(id);
            }
            return Response.success();
        } catch (e) {
            return Response.error(e);
        }
    }

    private async deleteAttachment(id: string, options: program.OptionValues) {
        if (options.itemid == null || options.itemid === '') {
            return Response.badRequest('--itemid <itemid> required.');
        }

        const itemId = options.itemid.toLowerCase();
        const cipher = await this.cipherService.get(itemId);
        if (cipher == null) {
            return Response.notFound();
        }

        if (cipher.attachments == null || cipher.attachments.length === 0) {
            return Response.error('No attachments available for this item.');
        }

        const attachments = cipher.attachments.filter((a) => a.id.toLowerCase() === id);
        if (attachments.length === 0) {
            return Response.error('Attachment `' + id + '` was not found.');
        }

        if (cipher.organizationId == null && !(await this.userService.canAccessPremium())) {
            return Response.error('Premium status is required to use this feature.');
        }

        try {
            await this.cipherService.deleteAttachmentWithServer(cipher.id, attachments[0].id);
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

    private async deleteOrganizationCollection(id: string, options: program.OptionValues) {
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
            await this.apiService.deleteCollection(options.organizationid, id);
            return Response.success();
        } catch (e) {
            return Response.error(e);
        }
    }
}
