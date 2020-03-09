import * as fs from 'fs';
import * as jsdom from 'jsdom';
import * as path from 'path';

import { AuthService } from 'jslib/services/auth.service';

import { I18nService } from './services/i18n.service';
import { NodeEnvSecureStorageService } from './services/nodeEnvSecureStorage.service';

import { CliPlatformUtilsService } from 'jslib/cli/services/cliPlatformUtils.service';

import { AppIdService } from 'jslib/services/appId.service';
import { AuditService } from 'jslib/services/audit.service';
import { CipherService } from 'jslib/services/cipher.service';
import { CollectionService } from 'jslib/services/collection.service';
import { ConstantsService } from 'jslib/services/constants.service';
import { ContainerService } from 'jslib/services/container.service';
import { CryptoService } from 'jslib/services/crypto.service';
import { EnvironmentService } from 'jslib/services/environment.service';
import { ExportService } from 'jslib/services/export.service';
import { FolderService } from 'jslib/services/folder.service';
import { ImportService } from 'jslib/services/import.service';
import { LockService } from 'jslib/services/lock.service';
import { LowdbStorageService } from 'jslib/services/lowdbStorage.service';
import { NodeApiService } from 'jslib/services/nodeApi.service';
import { NodeCryptoFunctionService } from 'jslib/services/nodeCryptoFunction.service';
import { NoopMessagingService } from 'jslib/services/noopMessaging.service';
import { PasswordGenerationService } from 'jslib/services/passwordGeneration.service';
import { PolicyService } from 'jslib/services/policy.service';
import { SearchService } from 'jslib/services/search.service';
import { SettingsService } from 'jslib/services/settings.service';
import { SyncService } from 'jslib/services/sync.service';
import { TokenService } from 'jslib/services/token.service';
import { TotpService } from 'jslib/services/totp.service';
import { UserService } from 'jslib/services/user.service';

import { Program } from './program';

// Polyfills
(global as any).DOMParser = new jsdom.JSDOM().window.DOMParser;

// tslint:disable-next-line
const packageJson = require('../package.json');

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
    lockService: LockService;
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

    constructor() {
        let p = null;
        const relativeDataDir = path.join(path.dirname(process.execPath), 'bw-data');
        if (fs.existsSync(relativeDataDir)) {
            p = relativeDataDir;
        } else if (process.env.BITWARDENCLI_APPDATA_DIR) {
            p = path.resolve(process.env.BITWARDENCLI_APPDATA_DIR);
        } else if (process.platform === 'darwin') {
            p = path.join(process.env.HOME, 'Library/Application Support/Bitwarden CLI');
        } else if (process.platform === 'win32') {
            p = path.join(process.env.APPDATA, 'Bitwarden CLI');
        } else if (process.env.XDG_CONFIG_HOME) {
            p = path.join(process.env.XDG_CONFIG_HOME, 'Bitwarden CLI');
        } else {
            p = path.join(process.env.HOME, '.config/Bitwarden CLI');
        }

        this.i18nService = new I18nService('en', './locales');
        this.platformUtilsService = new CliPlatformUtilsService('cli', packageJson);
        this.cryptoFunctionService = new NodeCryptoFunctionService();
        this.storageService = new LowdbStorageService(null, p, true);
        this.secureStorageService = new NodeEnvSecureStorageService(this.storageService, () => this.cryptoService);
        this.cryptoService = new CryptoService(this.storageService, this.secureStorageService,
            this.cryptoFunctionService);
        this.appIdService = new AppIdService(this.storageService);
        this.tokenService = new TokenService(this.storageService);
        this.messagingService = new NoopMessagingService();
        this.apiService = new NodeApiService(this.tokenService, this.platformUtilsService,
            async (expired: boolean) => await this.logout(),
            'Bitwarden_CLI/' + this.platformUtilsService.getApplicationVersion() +
            ' (' + this.platformUtilsService.getDeviceString().toUpperCase() + ')');
        this.environmentService = new EnvironmentService(this.apiService, this.storageService, null);
        this.userService = new UserService(this.tokenService, this.storageService);
        this.containerService = new ContainerService(this.cryptoService);
        this.settingsService = new SettingsService(this.userService, this.storageService);
        this.cipherService = new CipherService(this.cryptoService, this.userService, this.settingsService,
            this.apiService, this.storageService, this.i18nService, null);
        this.folderService = new FolderService(this.cryptoService, this.userService, this.apiService,
            this.storageService, this.i18nService, this.cipherService);
        this.collectionService = new CollectionService(this.cryptoService, this.userService, this.storageService,
            this.i18nService);
        this.searchService = new SearchService(this.cipherService, this.platformUtilsService);
        this.policyService = new PolicyService(this.userService, this.storageService);
        this.lockService = new LockService(this.cipherService, this.folderService, this.collectionService,
            this.cryptoService, this.platformUtilsService, this.storageService, this.messagingService,
            this.searchService, this.userService, null);
        this.syncService = new SyncService(this.userService, this.apiService, this.settingsService,
            this.folderService, this.cipherService, this.cryptoService, this.collectionService,
            this.storageService, this.messagingService, this.policyService,
            async (expired: boolean) => await this.logout());
        this.passwordGenerationService = new PasswordGenerationService(this.cryptoService, this.storageService,
            this.policyService);
        this.totpService = new TotpService(this.storageService, this.cryptoFunctionService);
        this.importService = new ImportService(this.cipherService, this.folderService, this.apiService,
            this.i18nService, this.collectionService);
        this.exportService = new ExportService(this.folderService, this.cipherService, this.apiService);
        this.authService = new AuthService(this.cryptoService, this.apiService, this.userService, this.tokenService,
            this.appIdService, this.i18nService, this.platformUtilsService, this.messagingService, true);
        this.auditService = new AuditService(this.cryptoFunctionService, this.apiService);
        this.program = new Program(this);
    }

    async run() {
        await this.init();
        this.program.run();
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
        this.storageService.init();
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

        const installedVersion = await this.storageService.get<string>(ConstantsService.installedVersionKey);
        const currentVersion = this.platformUtilsService.getApplicationVersion();
        if (installedVersion == null || installedVersion !== currentVersion) {
            await this.storageService.save(ConstantsService.installedVersionKey, currentVersion);
        }
    }
}

const main = new Main();
main.run();
