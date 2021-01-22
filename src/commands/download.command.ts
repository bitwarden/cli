import * as fet from 'node-fetch';

import { CryptoService } from 'jslib/abstractions/crypto.service';

import { SymmetricCryptoKey } from 'jslib/models/domain/symmetricCryptoKey';

import { Response } from 'jslib/cli/models/response';

import { CliUtils } from '..//utils';

export abstract class DownloadCommand {
    constructor(protected cryptoService: CryptoService) { }
    protected async saveAttachmentToFile(url: string, key: SymmetricCryptoKey, fileName: string, output?: string) {
        const response = await fet.default(new fet.Request(url, { headers: { cache: 'no-cache' } }));
        if (response.status !== 200) {
            return Response.error('A ' + response.status + ' error occurred while downloading the attachment.');
        }

        try {
            const buf = await response.arrayBuffer();
            const decBuf = await this.cryptoService.decryptFromBytes(buf, key);
            return await CliUtils.saveResultToFile(Buffer.from(decBuf), output, fileName);
        } catch (e) {
            if (typeof (e) === 'string') {
                return Response.error(e);
            } else {
                return Response.error('An error occurred while saving the attachment.');
            }
        }
    }

}
