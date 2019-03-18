import { ApiService } from 'jslib/abstractions/api.service';
import { AuthService } from 'jslib/abstractions/auth.service';
import { CryptoFunctionService } from 'jslib/abstractions/cryptoFunction.service';
import { I18nService } from 'jslib/abstractions/i18n.service';
import { SyncService } from 'jslib/abstractions/sync.service';

import { MessageResponse } from 'jslib/cli/models/response/messageResponse';

import { Utils } from 'jslib/misc/utils';

import { LoginCommand as BaseLoginCommand } from 'jslib/cli/commands/login.command';

export class LoginCommand extends BaseLoginCommand {
    constructor(authService: AuthService, apiService: ApiService,
        cryptoFunctionService: CryptoFunctionService, syncService: SyncService,
        i18nService: I18nService) {
        super(authService, apiService, i18nService);
        this.validatedParams = async () => {
            const key = await cryptoFunctionService.randomBytes(64);
            process.env.BW_SESSION = Utils.fromBufferToB64(key);
        };
        this.success = async () => {
            await syncService.fullSync(true);
            const res = new MessageResponse('You are logged in!', '\n' +
                'To unlock your vault, set your session key to the `BW_SESSION` environment variable. ex:\n' +
                '$ export BW_SESSION="' + process.env.BW_SESSION + '"\n' +
                '> $env:BW_SESSION="' + process.env.BW_SESSION + '"\n\n' +
                'You can also pass the session key to any command with the `--session` option. ex:\n' +
                '$ bw list items --session ' + process.env.BW_SESSION);
            res.raw = process.env.BW_SESSION;
            return res;
        };
    }
}
