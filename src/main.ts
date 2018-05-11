import * as program from 'commander';

program
    .version('1.0.0', '-v, --version');

program
    .command('login <email> <password>')
    .description('Log into a Bitwarden user account.')
    .option('-t, --two_factor <code>', '2FA code.')
    .action((email, password, cmd) => {
        console.log('Logging in...');
        console.log(email);
        console.log(password);
        console.log(cmd.two_factor);
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
