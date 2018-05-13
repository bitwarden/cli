import * as program from 'commander';

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

const platformUtilsService = new NodePlatformUtilsService();
const cryptoFunctionService = new NodeCryptoFunctionService();
const storageService = new NodeStorageService('./scratch');
const cryptoService = new CryptoService(storageService, storageService, cryptoFunctionService);
const appIdService = new AppIdService(storageService);
const tokenService = new TokenService(storageService);
const messagingService = new NodeMessagingService();
const apiService = new ApiService(tokenService, platformUtilsService,
    (expired: boolean) => { });
const environmentService = new EnvironmentService(apiService, storageService);
const userService = new UserService(tokenService, storageService);
const containerService = new ContainerService(cryptoService, platformUtilsService);
const authService = new AuthService(cryptoService, apiService, userService, tokenService, appIdService,
    null, platformUtilsService, messagingService, true);

containerService.attachToWindow(global);
environmentService.setUrlsFromStorage().then(() => {
    // Do nothing
});

program
    .version('1.0.0', '-v, --version');

program
    .command('login <email> <password>')
    .description('Log into a Bitwarden user account.')
    .option('-m, --method <method>', '2FA method.')
    .option('-c, --code <code>', '2FA code.')
    .action(async (email: string, password: string, cmd: program.Command) => {
        const command = new LoginCommand(authService);
        await command.run(email, password, cmd);
    });

program
    .command('logout')
    .description('Log out of the current Bitwarden user account.')
    .action((cmd) => {
        console.log('Logging out...');
    });

program
    .command('list <object>')
    .description('List objects.')
    .action((object, cmd) => {
        console.log('Listing...');
        console.log(object);
    });

program
    .command('get <object> <id>')
    .description('Get an object.')
    .action((object, id, cmd) => {
        console.log('Getting...');
        console.log(object);
        console.log(id);
    });

program
    .command('edit <object> <id>')
    .description('Edit an object.')
    .action((object, id, cmd) => {
        console.log('Editing...');
        console.log(object);
        console.log(id);
    });

program
    .command('delete <object> <id>')
    .description('Delete an object.')
    .action((object, id, cmd) => {
        console.log('Deleting...');
        console.log(object);
        console.log(id);
    });

program
    .parse(process.argv);
