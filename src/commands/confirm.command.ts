import { ApiService } from 'jslib-common/abstractions/api.service';
import { CryptoService } from 'jslib-common/abstractions/crypto.service';

import { OrganizationUserConfirmRequest } from 'jslib-common/models/request/organizationUserConfirmRequest';

import { Response } from 'jslib-node/cli/models/response';

import { Utils } from 'jslib-common/misc/utils';

export class ConfirmCommand {
    constructor(private apiService: ApiService, private cryptoService: CryptoService) { }

    async run(object: string, id: string, cmdOptions: Record<string, any>): Promise<Response> {
        if (id != null) {
            id = id.toLowerCase();
        }

        const normalizedOptions = this.normalizeOptions(cmdOptions);
        switch (object.toLowerCase()) {
            case 'org-member':
                return await this.confirmOrganizationMember(id, normalizedOptions);
            default:
                return Response.badRequest('Unknown object.');
        }
    }

    private async confirmOrganizationMember(id: string, options: Options) {
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
            const orgUser = await this.apiService.getOrganizationUser(options.organizationId, id);
            if (orgUser == null) {
                throw new Error('Member id does not exist for this organization.');
            }
            const publicKeyResponse = await this.apiService.getUserPublicKey(orgUser.userId);
            const publicKey = Utils.fromB64ToArray(publicKeyResponse.publicKey);
            const key = await this.cryptoService.rsaEncrypt(orgKey.key, publicKey.buffer);
            const req = new OrganizationUserConfirmRequest();
            req.key = key.encryptedString;
            await this.apiService.postOrganizationUserConfirm(options.organizationId, id, req);
            return Response.success();
        } catch (e) {
            return Response.error(e);
        }
    }

    private normalizeOptions(passedOptions: Record<string, any>): Options {
        const typedOptions = new Options();
        typedOptions.organizationId = passedOptions.organizationid || passedOptions.organizationId;
        return typedOptions;
    }
}

class Options {
    organizationId: string;
}
