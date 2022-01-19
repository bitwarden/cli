import * as program from "commander";
import * as inquirer from "inquirer";

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

import { Response } from "jslib-node/cli/models/response";
import { MessageResponse } from "jslib-node/cli/models/response/messageResponse";

import { Utils } from "jslib-common/misc/utils";

import { LoginCommand as BaseLoginCommand } from "jslib-node/cli/commands/login.command";

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
      "cli"
    );
    this.logout = this.logoutCallback;
    this.validatedParams = async () => {
      const key = await cryptoFunctionService.randomBytes(64);
      process.env.BW_SESSION = Utils.fromBufferToB64(key);
    };
  }

  run(email: string, password: string, options: program.OptionValues) {
    this.options = options;
    this.email = email;
    return super.run(email, password, options);
  }

  async onSuccessfulLogin(): Promise<Response> {
    // Full sync required for key connector check
    await this.syncService.fullSync(true);

    if (await this.keyConnectorService.userNeedsMigration()) {
      return await this.migrateToKeyConnector();
    }

    return this.successResponse();
  }

  private async successResponse() {
    const usesKeyConnector = await this.keyConnectorService.getUsesKeyConnector();

    if (
      (this.options.sso != null || this.options.apikey != null) &&
      this.canInteract &&
      !usesKeyConnector
    ) {
      const message = new MessageResponse(
        "You are logged in!",
        "\n" + "To unlock your vault, use the `unlock` command. ex:\n" + "$ bw unlock"
      );
      return Response.success(message);
    } else {
      const message = new MessageResponse(
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
      message.raw = process.env.BW_SESSION;
      return Response.success(message);
    }
  }

  private async migrateToKeyConnector(): Promise<Response> {
    // If no interaction available, alert user to use web vault
    if (!this.canInteract) {
      await this.logout();
      this.authService.logOut(() => {
        /* Do nothing */
      });
      return Response.error(
        new MessageResponse(
          "An organization you are a member of is using Key Connector. " +
            "In order to access the vault, you must opt-in to Key Connector now via the web vault. You have been logged out.",
          null
        )
      );
    }

    const organization = await this.keyConnectorService.getManagingOrganization();

    const answer: inquirer.Answers = await inquirer.createPromptModule({ output: process.stderr })({
      type: "list",
      name: "convert",
      message:
        organization.name +
        " is using a self-hosted key server. A master password is no longer required to log in for members of this organization. ",
      choices: [
        {
          name: "Remove master password and log in",
          value: "remove",
        },
        {
          name: "Leave organization and log in",
          value: "leave",
        },
        {
          name: "Exit",
          value: "exit",
        },
      ],
    });

    if (answer.convert === "remove") {
      await this.keyConnectorService.migrateUser();

      // Update environment URL - required for api key login
      const urls = this.environmentService.getUrls();
      urls.keyConnector = organization.keyConnectorUrl;
      await this.environmentService.setUrls(urls, true);

      return this.successResponse();
    } else if (answer.convert === "leave") {
      await this.apiService.postLeaveOrganization(organization.id);
      await this.syncService.fullSync(true);
      return this.successResponse();
    } else {
      await this.logout();
      this.authService.logOut(() => {
        /* Do nothing */
      });
      return Response.error("You have been logged out.");
    }
  }
}
