import * as program from 'commander';

import { LoginCommand } from './commands/login.command';
import { SyncCommand } from './commands/sync.command';
import { ListCommand } from './commands/list.command';
import { GetCommand } from './commands/get.command';

import { Main } from './main';

export class Program {
    constructor(private main: Main) { }

    run() {
        program
            .version('1.0.0', '-v, --version');

        program
            .command('login <email> <password>')
            .description('Log into a Bitwarden user account.')
            .option('-m, --method <method>', '2FA method.')
            .option('-c, --code <code>', '2FA code.')
            .action(async (email: string, password: string, cmd: program.Command) => {
                const command = new LoginCommand(this.main.authService);
                await command.run(email, password, cmd);
                process.exit();
            });

        program
            .command('logout')
            .description('Log out of the current Bitwarden user account.')
            .action((cmd) => {
                console.log('Logging out...');
                process.exit();
            });

        program
            .command('sync')
            .description('Sync user\'s vault from server.')
            .option('-f, --force', 'Force a full sync.')
            .action(async (cmd) => {
                const command = new SyncCommand(this.main.syncService);
                await command.run(cmd);
                process.exit();
            });

        program
            .command('list <object>')
            .description('List objects.')
            .action(async (object, cmd) => {
                const command = new ListCommand(this.main.cipherService, this.main.folderService,
                    this.main.collectionService);
                await command.run(object, cmd);
                process.exit();
            });

        program
            .command('get <object> <id>')
            .description('Get an object.')
            .action(async (object, id, cmd) => {
                const command = new GetCommand(this.main.cipherService, this.main.folderService,
                    this.main.collectionService, this.main.totpService);
                await command.run(object, id, cmd);
                process.exit();
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
    }
}
