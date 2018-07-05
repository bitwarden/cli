import * as path from 'path';

import { AuthService } from 'jslib/services/auth.service';

import { I18nService } from './services/i18n.service';
import { NodeEnvSecureStorageService } from './services/nodeEnvSecureStorage.service';
import { NodePlatformUtilsService } from './services/nodePlatformUtils.service';
import { NoopMessagingService } from './services/noopMessaging.service';

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
import { LockService } from 'jslib/services/lock.service';
import { LowdbStorageService } from 'jslib/services/lowdbStorage.service';
import { NodeApiService } from 'jslib/services/nodeApi.service';
import { NodeCryptoFunctionService } from 'jslib/services/nodeCryptoFunction.service';
import { PasswordGenerationService } from 'jslib/services/passwordGeneration.service';
import { SettingsService } from 'jslib/services/settings.service';
import { SyncService } from 'jslib/services/sync.service';
import { TokenService } from 'jslib/services/token.service';
import { TotpService } from 'jslib/services/totp.service';
import { UserService } from 'jslib/services/user.service';

import { Program } from './program';

export class Main {
    messagingService: NoopMessagingService;
    storageService: LowdbStorageService;
    secureStorageService: NodeEnvSecureStorageService;
    i18nService: I18nService;
    platformUtilsService: NodePlatformUtilsService;
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
    exportService: ExportService;
    cryptoFunctionService: NodeCryptoFunctionService;
    authService: AuthService;
    program: Program;

    constructor() {
        let p = null;
        if (process.env.BITWARDENCLI_APPDATA_DIR) {
            p = path.resolve(process.env.BITWARDENCLI_APPDATA_DIR);
        } else if (process.platform === 'darwin') {
            p = path.join(process.env.HOME, 'Library/Application Support/Bitwarden CLI');
        } else if (process.platform === 'win32') {
            p = path.join(process.env.APPDATA, 'Bitwarden CLI');
        } else {
            p = path.join(process.env.HOME, '.config/Bitwarden CLI');
        }

        this.i18nService = new I18nService('en', './locales');
        this.platformUtilsService = new NodePlatformUtilsService();
        this.cryptoFunctionService = new NodeCryptoFunctionService();
        this.storageService = new LowdbStorageService(null, p, true);
        this.secureStorageService = new NodeEnvSecureStorageService(this.storageService, () => this.cryptoService);
        this.cryptoService = new CryptoService(this.storageService, this.secureStorageService,
            this.cryptoFunctionService);
        this.appIdService = new AppIdService(this.storageService);
        this.tokenService = new TokenService(this.storageService);
        this.messagingService = new NoopMessagingService();
        this.apiService = new NodeApiService(this.tokenService, this.platformUtilsService,
            async (expired: boolean) => await this.logout());
        this.environmentService = new EnvironmentService(this.apiService, this.storageService);
        this.userService = new UserService(this.tokenService, this.storageService);
        this.containerService = new ContainerService(this.cryptoService, this.platformUtilsService);
        this.settingsService = new SettingsService(this.userService, this.storageService);
        this.cipherService = new CipherService(this.cryptoService, this.userService, this.settingsService,
            this.apiService, this.storageService, this.i18nService, this.platformUtilsService);
        this.folderService = new FolderService(this.cryptoService, this.userService, this.apiService,
            this.storageService, this.i18nService, this.cipherService);
        this.collectionService = new CollectionService(this.cryptoService, this.userService, this.storageService,
            this.i18nService);
        this.lockService = new LockService(this.cipherService, this.folderService, this.collectionService,
            this.cryptoService, this.platformUtilsService, this.storageService, this.messagingService, null);
        this.syncService = new SyncService(this.userService, this.apiService, this.settingsService,
            this.folderService, this.cipherService, this.cryptoService, this.collectionService,
            this.storageService, this.messagingService, async (expired: boolean) => await this.logout());
        this.passwordGenerationService = new PasswordGenerationService(this.cryptoService, this.storageService);
        this.totpService = new TotpService(this.storageService, this.cryptoFunctionService);
        this.exportService = new ExportService(this.folderService, this.cipherService, this.apiService);
        this.authService = new AuthService(this.cryptoService, this.apiService, this.userService, this.tokenService,
            this.appIdService, this.i18nService, this.platformUtilsService, this.messagingService, true);
        this.auditService = new AuditService(this.cryptoFunctionService);
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
            this.passwordGenerationService.clear(),
        ]);
        process.env.BW_SESSION = null;
    }

    private async init() {
        this.storageService.init();
        this.containerService.attachToWindow(global);
        await this.environmentService.setUrlsFromStorage();
        const locale = await this.storageService.get<string>(ConstantsService.localeKey);
        await this.i18nService.init(locale);
        await this.authService.init();

        const installedVersion = await this.storageService.get<string>(ConstantsService.installedVersionKey);
        const currentVersion = this.platformUtilsService.getApplicationVersion();
        if (installedVersion == null || installedVersion !== currentVersion) {
            await this.storageService.save(ConstantsService.installedVersionKey, currentVersion);
        }
    }
}

const main = new Main();
main.run();
