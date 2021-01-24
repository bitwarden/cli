import * as program from 'commander';

import { EnvironmentService } from 'jslib/abstractions/environment.service';
import { SearchService } from 'jslib/abstractions/search.service';
import { SendService } from 'jslib/abstractions/send.service';

import { Response } from 'jslib/cli/models/response';
import { ListResponse } from 'jslib/cli/models/response/listResponse';

import { SendResponse } from '../..//models/response/sendResponse';

export class SendListCommand {

    constructor(private sendService: SendService, private environmentService: EnvironmentService,
        private searchService: SearchService) { }

    async run(options: program.OptionValues): Promise<Response> {
        let sends = await this.sendService.getAllDecrypted();

        if (options.search != null && options.search.trim() !== '') {
            sends = this.searchService.searchSends(sends, options.search);
        }

        const apiUrl = await this.environmentService.apiUrl;
        const res = new ListResponse(sends.map(s => new SendResponse(s, apiUrl)));
        return Response.success(res);
    }
}
