import * as program from "commander";

import { ApiService } from "jslib-common/abstractions/api.service";
import { AuthService } from "jslib-common/abstractions/auth.service";
import { CryptoService } from "jslib-common/abstractions/crypto.service";
import { CryptoFunctionService } from "jslib-common/abstractions/cryptoFunction.service";
import { EnvironmentService } from "jslib-common/abstractions/environment.service";
import { I18nService } from "jslib-common/abstractions/i18n.service";
import { KeyConnectorService } from "jslib-common/abstractions/keyConnector.service";
import { PasswordGenerationService } from "jslib-common/abstractions/passwordGeneration.service";
import { PlatformUtilsService } from "jslib-common/abstractions/platformUtils.service";
import { PolicyService } from "jslib-common/abstractions/policy.service";
import { StateService } from "jslib-common/abstractions/state.service";
import { SyncService } from "jslib-common/abstractions/sync.service";
import { TwoFactorService } from "jslib-common/abstractions/twoFactor.service";
import { Utils } from "jslib-common/misc/utils";
import { LoginCommand as BaseLoginCommand } from "jslib-node/cli/commands/login.command";
import { MessageResponse } from "jslib-node/cli/models/response/messageResponse";

export class LoginCommand extends BaseLoginCommand {
  private options: program.OptionValues;

  constructor(
    authService: AuthService,
    apiService: ApiService,
    cryptoFunctionService: CryptoFunctionService,
    i18nService: I18nService,
    environmentService: EnvironmentService,
    passwordGenerationService: PasswordGenerationService,
    platformUtilsService: PlatformUtilsService,
    stateService: StateService,
    cryptoService: CryptoService,
    policyService: PolicyService,
    twoFactorService: TwoFactorService,
    private syncService: SyncService,
    private keyConnectorService: KeyConnectorService,
    private logoutCallback: () => Promise<void>
  ) {
    super(
      authService,
      apiService,
      i18nService,
      environmentService,
      passwordGenerationService,
      cryptoFunctionService,
      platformUtilsService,
      stateService,
      cryptoService,
      policyService,
      twoFactorService,
      "cli"
    );
    this.logout = this.logoutCallback;
    this.validatedParams = async () => {
      const key = await cryptoFunctionService.randomBytes(64);
      process.env.BW_SESSION = Utils.fromBufferToB64(key);
    };
    this.success = async () => {
      await this.syncService.fullSync(true);

      const usesKeyConnector = await this.keyConnectorService.getUsesKeyConnector();

      if (
        (this.options.sso != null || this.options.apikey != null) &&
        this.canInteract &&
        !usesKeyConnector
      ) {
        const res = new MessageResponse(
          "You are logged in!",
          "\n" + "To unlock your vault, use the `unlock` command. ex:\n" + "$ bw unlock"
        );
        return res;
      } else {
        const res = new MessageResponse(
          "You are logged in!",
          "\n" +
            "To unlock your vault, set your session key to the `BW_SESSION` environment variable. ex:\n" +
            '$ export BW_SESSION="' +
            process.env.BW_SESSION +
            '"\n' +
            '> $env:BW_SESSION="' +
            process.env.BW_SESSION +
            '"\n\n' +
            "You can also pass the session key to any command with the `--session` option. ex:\n" +
            "$ bw list items --session " +
            process.env.BW_SESSION
        );
        res.raw = process.env.BW_SESSION;
        return res;
      }
    };
  }

  run(email: string, password: string, options: program.OptionValues) {
    this.options = options;
    this.email = email;
    return super.run(email, password, options);
  }
}
