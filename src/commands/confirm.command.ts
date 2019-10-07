import * as program from 'commander';

import { ApiService } from 'jslib/abstractions/api.service';
import { CryptoService } from 'jslib/abstractions/crypto.service';

import { OrganizationUserConfirmRequest } from 'jslib/models/request/organizationUserConfirmRequest';

import { Response } from 'jslib/cli/models/response';

import { Utils } from 'jslib/misc/utils';

export class ConfirmCommand {
    constructor(private apiService: ApiService, private cryptoService: CryptoService) { }

    async run(object: string, id: string, cmd: program.Command): Promise<Response> {
        if (id != null) {
            id = id.toLowerCase();
        }

        switch (object.toLowerCase()) {
            case 'org-member':
                return await this.confirmOrganizationMember(id, cmd);
            default:
                return Response.badRequest('Unknown object.');
        }
    }

    private async confirmOrganizationMember(id: string, cmd: program.Command) {
        if (cmd.organizationid == null || cmd.organizationid === '') {
            return Response.badRequest('--organizationid <organizationid> required.');
        }
        if (!Utils.isGuid(id)) {
            return Response.error('`' + id + '` is not a GUID.');
        }
        if (!Utils.isGuid(cmd.organizationid)) {
            return Response.error('`' + cmd.organizationid + '` is not a GUID.');
        }
        try {
            const orgKey = await this.cryptoService.getOrgKey(cmd.organizationid);
            if (orgKey == null) {
                throw new Error('No encryption key for this organization.');
            }
            const orgUser = await this.apiService.getOrganizationUser(cmd.organizationid, id);
            if (orgUser == null) {
                throw new Error('Member id does not exist for this organization.');
            }
            const publicKeyResponse = await this.apiService.getUserPublicKey(orgUser.userId);
            const publicKey = Utils.fromB64ToArray(publicKeyResponse.publicKey);
            const key = await this.cryptoService.rsaEncrypt(orgKey.key, publicKey.buffer);
            const req = new OrganizationUserConfirmRequest();
            req.key = key.encryptedString;
            await this.apiService.postOrganizationUserConfirm(cmd.organizationid, id, req);
            return Response.success();
        } catch (e) {
            return Response.error(e);
        }
    }
}
