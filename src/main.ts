import { AuthService } from 'jslib/services/auth.service';

import { LoginCommand } from './commands/login.command';

import { CryptoService } from 'jslib/services/crypto.service';
import { NodeCryptoFunctionService } from 'jslib/services/nodeCryptoFunction.service';
import { NodeStorageService } from './services/nodeStorage.service';
import { ApiService } from 'jslib/services/api.service';
import { NodePlatformUtilsService } from './services/nodePlatformUtils.service';
import { AppIdService } from 'jslib/services/appId.service';
import { TokenService } from 'jslib/services/token.service';
import { EnvironmentService } from 'jslib/services/environment.service';
import { UserService } from 'jslib/services/user.service';
import { ContainerService } from 'jslib/services/container.service';
import { NodeMessagingService } from './services/nodeMessaging.service';
import { SyncCommand } from './commands/sync.command';
import { SyncService } from 'jslib/services/sync.service';
import { SettingsService } from 'jslib/services/settings.service';
import { CipherService } from 'jslib/services/cipher.service';
import { FolderService } from 'jslib/services/folder.service';
import { CollectionService } from 'jslib/services/collection.service';
import { LockService } from 'jslib/services/lock.service';
import { I18nService } from './services/i18n.service';
import { ConstantsService } from 'jslib/services/constants.service';
import { PasswordGenerationService } from 'jslib/services/passwordGeneration.service';
import { TotpService } from 'jslib/services/totp.service';
import { AuditService } from 'jslib/services/audit.service';

import { Program } from './program';

export class Main {
    messagingService: NodeMessagingService;
    storageService: NodeStorageService;
    secureStorageService: NodeStorageService;
    i18nService: I18nService;
    platformUtilsService: NodePlatformUtilsService;
    constantsService: ConstantsService;
    cryptoService: CryptoService;
    tokenService: TokenService;
    appIdService: AppIdService;
    apiService: ApiService;
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
    cryptoFunctionService: NodeCryptoFunctionService;
    authService: AuthService;

    program: Program;

    constructor() {
        this.i18nService = new I18nService('en', '../locales');
        this.platformUtilsService = new NodePlatformUtilsService();
        this.cryptoFunctionService = new NodeCryptoFunctionService();
        this.storageService = new NodeStorageService('Bitwarden CLI');
        this.cryptoService = new CryptoService(this.storageService, this.storageService, this.cryptoFunctionService);
        this.appIdService = new AppIdService(this.storageService);
        this.tokenService = new TokenService(this.storageService);
        this.messagingService = new NodeMessagingService();
        this.apiService = new ApiService(this.tokenService, this.platformUtilsService, (expired: boolean) => { });
        this.environmentService = new EnvironmentService(this.apiService, this.storageService);
        this.userService = new UserService(this.tokenService, this.storageService);
        this.containerService = new ContainerService(this.cryptoService, this.platformUtilsService);
        this.settingsService = new SettingsService(this.userService, this.storageService);
        this.cipherService = new CipherService(this.cryptoService, this.userService, this.settingsService,
            this.apiService, this.storageService, this.i18nService, this.platformUtilsService);
        this.folderService = new FolderService(this.cryptoService, this.userService,
            () => 'No Folder', this.apiService, this.storageService, this.i18nService);
        this.collectionService = new CollectionService(this.cryptoService, this.userService, this.storageService,
            this.i18nService);
        this.lockService = new LockService(this.cipherService, this.folderService, this.collectionService,
            this.cryptoService, this.platformUtilsService, this.storageService, this.messagingService,
            () => { /* do nothing */ });
        this.syncService = new SyncService(this.userService, this.apiService, this.settingsService,
            this.folderService, this.cipherService, this.cryptoService, this.collectionService,
            this.storageService, this.messagingService, (expired: boolean) => { });
        this.authService = new AuthService(this.cryptoService, this.apiService, this.userService, this.tokenService,
            this.appIdService, this.i18nService, this.platformUtilsService, this.messagingService, true);
        this.program = new Program(this);
    }

    private async init() {
        this.containerService.attachToWindow(global);
        await this.environmentService.setUrlsFromStorage();
        const locale = await this.storageService.get<string>(ConstantsService.localeKey);
        await this.i18nService.init(locale);
        await this.authService.init();
    }

    async run() {
        await this.init();
        this.program.run();
    }
}

if (process.env.NODE_ENV === 'debug') {
    new Main().run();
}
