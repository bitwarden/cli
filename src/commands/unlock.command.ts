import { ApiService } from "jslib-common/abstractions/api.service";
import { CryptoService } from "jslib-common/abstractions/crypto.service";
import { CryptoFunctionService } from "jslib-common/abstractions/cryptoFunction.service";
import { EnvironmentService } from "jslib-common/abstractions/environment.service";
import { KeyConnectorService } from "jslib-common/abstractions/keyConnector.service";
import { StateService } from "jslib-common/abstractions/state.service";
import { SyncService } from "jslib-common/abstractions/sync.service";
import { HashPurpose } from "jslib-common/enums/hashPurpose";
import { Utils } from "jslib-common/misc/utils";
import { SecretVerificationRequest } from "jslib-common/models/request/secretVerificationRequest";
import { ConsoleLogService } from "jslib-common/services/consoleLog.service";
import { Response } from "jslib-node/cli/models/response";
import { MessageResponse } from "jslib-node/cli/models/response/messageResponse";

import { CliUtils } from "../utils";

import { ConvertToKeyConnectorCommand } from "./convertToKeyConnector.command";

export class UnlockCommand {
  constructor(
    private cryptoService: CryptoService,
    private stateService: StateService,
    private cryptoFunctionService: CryptoFunctionService,
    private apiService: ApiService,
    private logService: ConsoleLogService,
    private keyConnectorService: KeyConnectorService,
    private environmentService: EnvironmentService,
    private syncService: SyncService,
    private logout: () => Promise<void>
  ) {}

  async run(password: string, cmdOptions: Record<string, any>) {
    const normalizedOptions = new Options(cmdOptions);
    const passwordResult = await CliUtils.getPassword(password, normalizedOptions, this.logService);

    if (passwordResult instanceof Response) {
      return passwordResult;
    } else {
      password = passwordResult;
    }

    await this.setNewSessionKey();
    const email = await this.stateService.getEmail();
    const kdf = await this.stateService.getKdfType();
    const kdfIterations = await this.stateService.getKdfIterations();
    const key = await this.cryptoService.makeKey(password, email, kdf, kdfIterations);
    const storedKeyHash = await this.cryptoService.getKeyHash();

    let passwordValid = false;
    if (key != null) {
      if (storedKeyHash != null) {
        passwordValid = await this.cryptoService.compareAndUpdateKeyHash(password, key);
      } else {
        const serverKeyHash = await this.cryptoService.hashPassword(
          password,
          key,
          HashPurpose.ServerAuthorization
        );
        const request = new SecretVerificationRequest();
        request.masterPasswordHash = serverKeyHash;
        try {
          await this.apiService.postAccountVerifyPassword(request);
          passwordValid = true;
          const localKeyHash = await this.cryptoService.hashPassword(
            password,
            key,
            HashPurpose.LocalAuthorization
          );
          await this.cryptoService.setKeyHash(localKeyHash);
        } catch {
          // Ignore
        }
      }
    }

    if (passwordValid) {
      await this.cryptoService.setKey(key);

      if (await this.keyConnectorService.getConvertAccountRequired()) {
        const convertToKeyConnectorCommand = new ConvertToKeyConnectorCommand(
          this.apiService,
          this.keyConnectorService,
          this.environmentService,
          this.syncService,
          this.logout
        );
        const convertResponse = await convertToKeyConnectorCommand.run();
        if (!convertResponse.success) {
          return convertResponse;
        }
      }

      return this.successResponse();
    } else {
      return Response.error("Invalid master password.");
    }
  }

  private async setNewSessionKey() {
    const key = await this.cryptoFunctionService.randomBytes(64);
    process.env.BW_SESSION = Utils.fromBufferToB64(key);
  }

  private async successResponse() {
    const res = new MessageResponse(
      "Your vault is now unlocked!",
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
    return Response.success(res);
  }
}

class Options {
  passwordEnv: string;
  passwordFile: string;

  constructor(passedOptions: Record<string, any>) {
    this.passwordEnv = passedOptions?.passwordenv || passedOptions?.passwordEnv;
    this.passwordFile = passedOptions?.passwordfile || passedOptions?.passwordFile;
  }
}
