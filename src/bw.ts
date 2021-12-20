import * as program from "commander";
import * as fs from "fs";
import * as jsdom from "jsdom";
import * as path from "path";

import { LogLevelType } from "jslib-common/enums/logLevelType";

import { AuthService } from "jslib-common/services/auth.service";

import { I18nService } from "./services/i18n.service";
import { NodeEnvSecureStorageService } from "./services/nodeEnvSecureStorage.service";

import { CliPlatformUtilsService } from "jslib-node/cli/services/cliPlatformUtils.service";
import { ConsoleLogService } from "jslib-node/cli/services/consoleLog.service";

import { AppIdService } from "jslib-common/services/appId.service";
import { AuditService } from "jslib-common/services/audit.service";
import { CipherService } from "jslib-common/services/cipher.service";
import { CollectionService } from "jslib-common/services/collection.service";
import { ConstantsService } from "jslib-common/services/constants.service";
import { ContainerService } from "jslib-common/services/container.service";
import { CryptoService } from "jslib-common/services/crypto.service";
import { EnvironmentService } from "jslib-common/services/environment.service";
import { ExportService } from "jslib-common/services/export.service";
import { FileUploadService } from "jslib-common/services/fileUpload.service";
import { FolderService } from "jslib-common/services/folder.service";
import { ImportService } from "jslib-common/services/import.service";
import { KeyConnectorService } from "jslib-common/services/keyConnector.service";
import { NoopMessagingService } from "jslib-common/services/noopMessaging.service";
import { PasswordGenerationService } from "jslib-common/services/passwordGeneration.service";
import { PolicyService } from "jslib-common/services/policy.service";
import { SearchService } from "jslib-common/services/search.service";
import { SendService } from "jslib-common/services/send.service";
import { SettingsService } from "jslib-common/services/settings.service";
import { SyncService } from "jslib-common/services/sync.service";
import { TokenService } from "jslib-common/services/token.service";
import { TotpService } from "jslib-common/services/totp.service";
import { UserService } from "jslib-common/services/user.service";
import { UserVerificationService } from "jslib-common/services/userVerification.service";
import { VaultTimeoutService } from "jslib-common/services/vaultTimeout.service";
import { LowdbStorageService } from "jslib-node/services/lowdbStorage.service";
import { NodeApiService } from "jslib-node/services/nodeApi.service";
import { NodeCryptoFunctionService } from "jslib-node/services/nodeCryptoFunction.service";

import { Program } from "./program";
import { SendProgram } from "./send.program";
import { VaultProgram } from "./vault.program";

// Polyfills
(global as any).DOMParser = new jsdom.JSDOM().window.DOMParser;

// tslint:disable-next-line
const packageJson = require("../package.json");

export class Main {
  messagingService: NoopMessagingService;
  storageService: LowdbStorageService;
  secureStorageService: NodeEnvSecureStorageService;
  i18nService: I18nService;
  platformUtilsService: CliPlatformUtilsService;
  constantsService: ConstantsService;
  cryptoService: CryptoService;
  tokenService: TokenService;
  appIdService: AppIdService;
  apiService: NodeApiService;
  environmentService: EnvironmentService;
  userService: UserService;
  settingsService: SettingsService;
  cipherService: CipherService;
  folderService: FolderService;
  collectionService: CollectionService;
  vaultTimeoutService: VaultTimeoutService;
  syncService: SyncService;
  passwordGenerationService: PasswordGenerationService;
  totpService: TotpService;
  containerService: ContainerService;
  auditService: AuditService;
  importService: ImportService;
  exportService: ExportService;
  searchService: SearchService;
  cryptoFunctionService: NodeCryptoFunctionService;
  authService: AuthService;
  policyService: PolicyService;
  program: Program;
  vaultProgram: VaultProgram;
  sendProgram: SendProgram;
  logService: ConsoleLogService;
  sendService: SendService;
  fileUploadService: FileUploadService;
  keyConnectorService: KeyConnectorService;
  userVerificationService: UserVerificationService;

  constructor() {
    let p = null;
    const relativeDataDir = path.join(path.dirname(process.execPath), "bw-data");
    if (fs.existsSync(relativeDataDir)) {
      p = relativeDataDir;
    } else if (process.env.BITWARDENCLI_APPDATA_DIR) {
      p = path.resolve(process.env.BITWARDENCLI_APPDATA_DIR);
    } else if (process.platform === "darwin") {
      p = path.join(process.env.HOME, "Library/Application Support/Bitwarden CLI");
    } else if (process.platform === "win32") {
      p = path.join(process.env.APPDATA, "Bitwarden CLI");
    } else if (process.env.XDG_CONFIG_HOME) {
      p = path.join(process.env.XDG_CONFIG_HOME, "Bitwarden CLI");
    } else {
      p = path.join(process.env.HOME, ".config/Bitwarden CLI");
    }

    this.i18nService = new I18nService("en", "./locales");
    this.platformUtilsService = new CliPlatformUtilsService("cli", packageJson);
    this.logService = new ConsoleLogService(
      this.platformUtilsService.isDev(),
      (level) => process.env.BITWARDENCLI_DEBUG !== "true" && level <= LogLevelType.Info
    );
    this.cryptoFunctionService = new NodeCryptoFunctionService();
    this.storageService = new LowdbStorageService(this.logService, null, p, true);
    this.secureStorageService = new NodeEnvSecureStorageService(
      this.storageService,
      this.logService,
      () => this.cryptoService
    );
    this.cryptoService = new CryptoService(
      this.storageService,
      this.secureStorageService,
      this.cryptoFunctionService,
      this.platformUtilsService,
      this.logService
    );
    this.appIdService = new AppIdService(this.storageService);
    this.tokenService = new TokenService(this.storageService);
    this.messagingService = new NoopMessagingService();
    this.environmentService = new EnvironmentService(this.storageService);
    this.apiService = new NodeApiService(
      this.tokenService,
      this.platformUtilsService,
      this.environmentService,
      async (expired: boolean) => await this.logout(),
      "Bitwarden_CLI/" +
        this.platformUtilsService.getApplicationVersionSync() +
        " (" +
        this.platformUtilsService.getDeviceString().toUpperCase() +
        ")",
      (clientId, clientSecret) => this.authService.logInApiKey(clientId, clientSecret)
    );
    this.userService = new UserService(this.tokenService, this.storageService);
    this.containerService = new ContainerService(this.cryptoService);
    this.settingsService = new SettingsService(this.userService, this.storageService);
    this.fileUploadService = new FileUploadService(this.logService, this.apiService);
    this.cipherService = new CipherService(
      this.cryptoService,
      this.userService,
      this.settingsService,
      this.apiService,
      this.fileUploadService,
      this.storageService,
      this.i18nService,
      null,
      this.logService
    );
    this.folderService = new FolderService(
      this.cryptoService,
      this.userService,
      this.apiService,
      this.storageService,
      this.i18nService,
      this.cipherService
    );
    this.collectionService = new CollectionService(
      this.cryptoService,
      this.userService,
      this.storageService,
      this.i18nService
    );
    this.searchService = new SearchService(this.cipherService, this.logService, this.i18nService);
    this.policyService = new PolicyService(this.userService, this.storageService, this.apiService);
    this.sendService = new SendService(
      this.cryptoService,
      this.userService,
      this.apiService,
      this.fileUploadService,
      this.storageService,
      this.i18nService,
      this.cryptoFunctionService
    );
    this.keyConnectorService = new KeyConnectorService(
      this.storageService,
      this.userService,
      this.cryptoService,
      this.apiService,
      this.tokenService,
      this.logService
    );
    this.vaultTimeoutService = new VaultTimeoutService(
      this.cipherService,
      this.folderService,
      this.collectionService,
      this.cryptoService,
      this.platformUtilsService,
      this.storageService,
      this.messagingService,
      this.searchService,
      this.userService,
      this.tokenService,
      this.policyService,
      this.keyConnectorService,
      async () => await this.cryptoService.clearStoredKey("auto"),
      null
    );
    this.syncService = new SyncService(
      this.userService,
      this.apiService,
      this.settingsService,
      this.folderService,
      this.cipherService,
      this.cryptoService,
      this.collectionService,
      this.storageService,
      this.messagingService,
      this.policyService,
      this.sendService,
      this.logService,
      this.tokenService,
      this.keyConnectorService,
      async (expired: boolean) => await this.logout()
    );
    this.passwordGenerationService = new PasswordGenerationService(
      this.cryptoService,
      this.storageService,
      this.policyService
    );
    this.totpService = new TotpService(
      this.storageService,
      this.cryptoFunctionService,
      this.logService
    );
    this.importService = new ImportService(
      this.cipherService,
      this.folderService,
      this.apiService,
      this.i18nService,
      this.collectionService,
      this.platformUtilsService,
      this.cryptoService
    );
    this.exportService = new ExportService(
      this.folderService,
      this.cipherService,
      this.apiService,
      this.cryptoService
    );
    this.authService = new AuthService(
      this.cryptoService,
      this.apiService,
      this.userService,
      this.tokenService,
      this.appIdService,
      this.i18nService,
      this.platformUtilsService,
      this.messagingService,
      this.vaultTimeoutService,
      this.logService,
      this.cryptoFunctionService,
      this.environmentService,
      this.keyConnectorService,
      true
    );
    this.auditService = new AuditService(this.cryptoFunctionService, this.apiService);
    this.program = new Program(this);
    this.vaultProgram = new VaultProgram(this);
    this.sendProgram = new SendProgram(this);
    this.userVerificationService = new UserVerificationService(
      this.cryptoService,
      this.i18nService,
      this.apiService
    );
  }

  async run() {
    await this.init();

    await this.program.register();
    await this.vaultProgram.register();
    await this.sendProgram.register();

    program.parse(process.argv);

    if (process.argv.slice(2).length === 0) {
      program.outputHelp();
    }
  }

  async logout() {
    const userId = await this.userService.getUserId();
    await Promise.all([
      this.syncService.setLastSync(new Date(0)),
      this.tokenService.clearToken(),
      this.cryptoService.clearKeys(),
      this.userService.clear(),
      this.settingsService.clear(userId),
      this.cipherService.clear(userId),
      this.folderService.clear(userId),
      this.collectionService.clear(userId),
      this.policyService.clear(userId),
      this.passwordGenerationService.clear(),
    ]);
    process.env.BW_SESSION = null;
  }

  private async init() {
    await this.storageService.init();
    this.containerService.attachToWindow(global);
    await this.environmentService.setUrlsFromStorage();
    // Dev Server URLs. Comment out the line above.
    // this.apiService.setUrls({
    //     base: null,
    //     api: 'http://localhost:4000',
    //     identity: 'http://localhost:33656',
    // });
    const locale = await this.storageService.get<string>(ConstantsService.localeKey);
    await this.i18nService.init(locale);
    this.authService.init();

    const installedVersion = await this.storageService.get<string>(
      ConstantsService.installedVersionKey
    );
    const currentVersion = await this.platformUtilsService.getApplicationVersion();
    if (installedVersion == null || installedVersion !== currentVersion) {
      await this.storageService.save(ConstantsService.installedVersionKey, currentVersion);
    }
  }
}

const main = new Main();
main.run();
