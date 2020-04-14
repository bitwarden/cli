import * as program from 'commander';

import { EnvironmentService } from 'jslib/abstractions/environment.service';

import { Response } from 'jslib/cli/models/response';
import { MessageResponse } from 'jslib/cli/models/response/messageResponse';
import { StringResponse } from 'jslib/cli/models/response/stringResponse';

export class ConfigCommand {
    constructor(private environmentService: EnvironmentService) { }

    async run(setting: string, value: string, cmd: program.Command): Promise<Response> {
        setting = setting.toLowerCase();
        switch (setting) {
            case 'server':
                return await this.getOrSetServer(value, cmd);
            default:
                return Response.badRequest('Unknown setting.');
        }

    }

    private async getOrSetServer(url: string, cmd: program.Command): Promise<Response> {
        if ((url == null || url.trim() === '') &&
            !cmd.webVault && !cmd.api && !cmd.identity && !cmd.icons && !cmd.notifications && !cmd.events) {
            const baseUrl = this.environmentService.baseUrl;
            const stringRes = new StringResponse(baseUrl == null ? 'https://bitwarden.com' : baseUrl);
            return Response.success(stringRes);
        }

        url = (url === 'null' || url === 'bitwarden.com' || url === 'https://bitwarden.com' ? null : url);
        await this.environmentService.setUrls({
            base: url,
            webVault: cmd.webVault || null,
            api: cmd.api || null,
            identity: cmd.identity || null,
            icons: cmd.icons || null,
            notifications: cmd.notifications || null,
            events: cmd.events || null,
        });
        const res = new MessageResponse('Saved setting `config`.', null);
        return Response.success(res);
    }
}
