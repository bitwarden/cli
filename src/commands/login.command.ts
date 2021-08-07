import * as program from 'commander';
import * as inquirer from 'inquirer';

import { ApiService } from 'jslib-common/abstractions/api.service';
import { AuthService } from 'jslib-common/abstractions/auth.service';
import { CryptoFunctionService } from 'jslib-common/abstractions/cryptoFunction.service';
import { CryptoService } from 'jslib-common/abstractions/crypto.service';
import { EnvironmentService } from 'jslib-common/abstractions/environment.service';
import { I18nService } from 'jslib-common/abstractions/i18n.service';
import { PasswordGenerationService } from 'jslib-common/abstractions/passwordGeneration.service';
import { PlatformUtilsService } from 'jslib-common/abstractions/platformUtils.service';
import { PolicyService } from 'jslib-common/abstractions/policy.service';
import { SyncService } from 'jslib-common/abstractions/sync.service';
import { UserService } from 'jslib-common/abstractions/user.service';

import { MessageResponse } from 'jslib-node/cli/models/response/messageResponse';

import { Utils } from 'jslib-common/misc/utils';

import { LoginCommand as BaseLoginCommand } from 'jslib-node/cli/commands/login.command';

export class LoginCommand extends BaseLoginCommand {
    private options: program.OptionValues;
    private email: string;

    constructor(authService: AuthService, apiService: ApiService,
        cryptoFunctionService: CryptoFunctionService, syncService: SyncService,
        i18nService: I18nService, environmentService: EnvironmentService,
        passwordGenerationService: PasswordGenerationService, platformUtilsService: PlatformUtilsService,
        private userService: UserService, private cryptoService: CryptoService, private policyService: PolicyService,
        private logoutCallback: () => Promise<void>) {
        super(authService, apiService, i18nService, environmentService, passwordGenerationService,
            cryptoFunctionService, platformUtilsService, 'cli');
        this.validatedParams = async () => {
            const key = await cryptoFunctionService.randomBytes(64);
            process.env.BW_SESSION = Utils.fromBufferToB64(key);
        };
        this.success = async () => {
            await syncService.fullSync(true);

            if (await this.userService.getForcePasswordReset()) {
                return await this.updateTempPassword();
            }

            return this.deliverResponse();
        };
    }

    run(email: string, password: string, options: program.OptionValues) {
        this.options = options;
        this.email = email;
        return super.run(email, password, options);
    }

    private deliverResponse(): MessageResponse {
        if ((this.options.sso != null || this.options.apikey != null) && this.canInteract) {
            const res = new MessageResponse('You are logged in!', '\n' +
                'To unlock your vault, use the `unlock` command. ex:\n' +
                '$ bw unlock');
            return res;
        } else {
            const res = new MessageResponse('You are logged in!', '\n' +
                'To unlock your vault, set your session key to the `BW_SESSION` environment variable. ex:\n' +
                '$ export BW_SESSION="' + process.env.BW_SESSION + '"\n' +
                '> $env:BW_SESSION="' + process.env.BW_SESSION + '"\n\n' +
                'You can also pass the session key to any command with the `--session` option. ex:\n' +
                '$ bw list items --session ' + process.env.BW_SESSION);
            res.raw = process.env.BW_SESSION;
            return res;
        }
    }

    private async updateTempPassword(error?: string): Promise<MessageResponse> {
        // If no interaction available, alert user to use web vault
        if (!this.canInteract) {
            await this.logoutCallback();
            this.authService.logOut(() => { /* Do nothing */ });
            return new MessageResponse('An organization administrator recently changed your master password. In order to access the vault, you must update your master password now via the web vault. You have been logged out.', null);
        }

        // Get New Master Password
        const baseMessage = 'An organization administrator recently changed your master password.In order to access the vault, you must update your master password now.\n' + 'Master password: ';
        const firstMessage = error != null ? error + baseMessage : baseMessage;
        const mp: inquirer.Answers = await inquirer.createPromptModule({ output: process.stderr })({
            type: 'password',
            name: 'password',
            message: firstMessage,
        });
        const masterPassword = mp.password;

        // Master Password Validation
        if (masterPassword == null || masterPassword === '') {
            return this.updateTempPassword('Master password is required.\n');
        }

        if (masterPassword.length < 8) {
            return this.updateTempPassword('Master password must be at least 8 characters long.\n');
        }

        // Get New Master Password Re-type
        const retype: inquirer.Answers = await inquirer.createPromptModule({ output: process.stderr })({
            type: 'password',
            name: 'password',
            message: 'Re-type New Master password:',
        });
        const masterPasswordRetype = retype.password;

        // Re-type Validation
        if (masterPassword !== masterPasswordRetype) {
            return this.updateTempPassword('Master password confirmation does not match.\n');
        }

        // Get Hint (optional)
        const hint: inquirer.Answers = await inquirer.createPromptModule({ output: process.stderr })({
            type: 'input',
            name: 'input',
            message: 'Master Password Hint:',
        });
        const masterPasswordHint = hint.input;

        // Retrieve details for key generation
        const enforcedPolicyOptions = await this.policyService.getMasterPasswordPolicyOptions();
        const kdf = await this.userService.getKdf();
        const kdfIterations = await this.userService.getKdfIterations();

        // Strength & Policy Validation
        const strengthResult = this.passwordGenerationService.passwordStrength(masterPassword,
            this.getPasswordStrengthUserInput());

        if (enforcedPolicyOptions != null &&
            !this.policyService.evaluateMasterPassword(
                strengthResult.score,
                masterPassword,
                enforcedPolicyOptions)) {
            return this.updateTempPassword('Your new master password does not meet the policy requirements.\n');
        }

        try {
            // Create new key and hash new password
            const newKey = await this.cryptoService.makeKey(masterPassword, this.email.trim().toLowerCase(),
                kdf, kdfIterations);
            const newPasswordHash = await this.cryptoService.hashPassword(masterPassword, newKey);

            // Grab user's current enc key
            const userEncKey = await this.cryptoService.getEncKey();

            // Create new encKey for the User
            const newEncKey = await this.cryptoService.remakeEncKey(newKey, userEncKey);

            // Create request
            const request = new UpdateTempPasswordRequest();
            request.key = newEncKey[1].encryptedString;
            request.newMasterPasswordHash = newPasswordHash;
            request.masterPasswordHint = masterPasswordHint;

            // Update user's password
            await this.apiService.putUpdateTempPassword(request);
            return this.deliverResponse();
        } catch (e) {
            await this.logoutCallback();
            this.authService.logOut(() => { /* Do nothing */ });
            return e;
        }
    }

    private getPasswordStrengthUserInput() {
        let userInput: string[] = [];
        const atPosition = this.email.indexOf('@');
        if (atPosition > -1) {
            userInput = userInput.concat(this.email.substr(0, atPosition).trim().toLowerCase().split(/[^A-Za-z0-9]/));
        }
        return userInput;
    }
}
