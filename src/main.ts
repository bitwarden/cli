import * as program from 'commander';

import { AuthService } from 'jslib/services/auth.service';

import { LoginCommand } from './commands/login.command';

program
    .version('1.0.0', '-v, --version');

program
    .command('login <email> <password>')
    .description('Log into a Bitwarden user account.')
    .option('-m, --method <method>', '2FA method.')
    .option('-c, --code <code>', '2FA code.')
    .action((email: string, password: string, cmd: program.Command) => {
        const command = new LoginCommand(null);
        command.run(email, password, cmd);
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
