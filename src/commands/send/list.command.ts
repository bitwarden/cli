import * as program from 'commander';

import { EnvironmentService } from 'jslib-common/abstractions/environment.service';
import { SearchService } from 'jslib-common/abstractions/search.service';
import { SendService } from 'jslib-common/abstractions/send.service';

import { Response } from 'jslib-node/cli/models/response';
import { ListResponse } from 'jslib-node/cli/models/response/listResponse';

import { SendResponse } from '../..//models/response/sendResponse';

export class SendListCommand {

    constructor(private sendService: SendService, private environmentService: EnvironmentService,
        private searchService: SearchService) { }

    async run(options: program.OptionValues): Promise<Response> {
        let sends = await this.sendService.getAllDecrypted();

        if (options.search != null && options.search.trim() !== '') {
            sends = this.searchService.searchSends(sends, options.search);
        }

        const webVaultUrl = this.environmentService.getWebVaultUrl();
        const res = new ListResponse(sends.map(s => new SendResponse(s, webVaultUrl)));
        return Response.success(res);
    }
}
