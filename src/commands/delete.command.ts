import * as program from 'commander';

import { CipherService } from 'jslib/abstractions/cipher.service';
import { FolderService } from 'jslib/abstractions/folder.service';
import { UserService } from 'jslib/abstractions/user.service';

import { Response } from '../models/response';

export class DeleteCommand {
    constructor(private cipherService: CipherService, private folderService: FolderService,
        private userService: UserService) { }

    async run(object: string, id: string, cmd: program.Command): Promise<Response> {
        if (id != null) {
            id = id.toLowerCase();
        }

        switch (object.toLowerCase()) {
            case 'item':
                return await this.deleteCipher(id);
            case 'attachment':
                return await this.deleteAttachment(id, cmd);
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

    private async deleteAttachment(id: string, cmd: program.Command) {
        if (cmd.itemid == null || cmd.itemid === '') {
            return Response.badRequest('--itemid <itemid> required.');
        }

        const itemId = cmd.itemid.toLowerCase();
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
}
