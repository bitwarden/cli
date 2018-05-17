import * as program from 'commander';

import { CipherService } from 'jslib/abstractions/cipher.service';
import { FolderService } from 'jslib/abstractions/folder.service';

import { Response } from '../models/response';

export class DeleteCommand {
    constructor(private cipherService: CipherService, private folderService: FolderService) { }

    async run(object: string, id: string, cmd: program.Command): Promise<Response> {
        if (id != null) {
            id = id.toLowerCase();
        }

        switch (object.toLowerCase()) {
            case 'item':
                if (cmd.attachmentid == null || cmd.attachmentid === '') {
                    return await this.deleteCipher(id);
                } else {
                    return await this.deleteAttachment(id, cmd.attachmentid);
                }
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

    private async deleteAttachment(id: string, attachmentId: string) {
        attachmentId = attachmentId.toLowerCase();

        const encCipher = await this.cipherService.get(id);
        if (encCipher == null) {
            return Response.notFound();
        }

        const cipher = await encCipher.decrypt();
        if (cipher.attachments == null || cipher.attachments.length === 0) {
            return Response.error('No attachments available for this item.');
        }

        const attachments = cipher.attachments.filter((a) =>
            a.id.toLowerCase() === attachmentId || a.fileName.toLowerCase() === attachmentId);
        if (attachments.length === 0) {
            return Response.error('Attachment `' + attachmentId + '` was not found.');
        }
        if (attachments.length > 1) {
            return Response.multipleResults(attachments.map((a) => a.id));
        }

        try {
            await this.cipherService.deleteAttachmentWithServer(id, attachments[0].id);
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
