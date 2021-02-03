import * as program from 'commander';

import { EnvironmentService } from 'jslib/abstractions/environment.service';

import { Response } from 'jslib/cli/models/response';
import { MessageResponse } from 'jslib/cli/models/response/messageResponse';
import { StringResponse } from 'jslib/cli/models/response/stringResponse';

export class ConfigCommand {
    constructor(private environmentService: EnvironmentService) { }

    async run(setting: string, value: string, options: program.OptionValues): Promise<Response> {
        setting = setting.toLowerCase();
        switch (setting) {
            case 'server':
                return await this.getOrSetServer(value, options);
            default:
                return Response.badRequest('Unknown setting.');
        }

    }

    private async getOrSetServer(url: string, options: program.OptionValues): Promise<Response> {
        if ((url == null || url.trim() === '') &&
            !options.webVault && !options.api && !options.identity && !options.icons && !options.notifications && !options.events) {
            const baseUrl = this.environmentService.baseUrl;
            const stringRes = new StringResponse(baseUrl == null ? 'https://bitwarden.com' : baseUrl);
            return Response.success(stringRes);
        }

        url = (url === 'null' || url === 'bitwarden.com' || url === 'https://bitwarden.com' ? null : url);
        await this.environmentService.setUrls({
            base: url,
            webVault: options.webVault || null,
            api: options.api || null,
            identity: options.identity || null,
            icons: options.icons || null,
            notifications: options.notifications || null,
            events: options.events || null,
        });
        const res = new MessageResponse('Saved setting `config`.', null);
        return Response.success(res);
    }
}
