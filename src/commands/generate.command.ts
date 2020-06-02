import * as program from 'commander';

import { PasswordGenerationService } from 'jslib/abstractions/passwordGeneration.service';

import { Response } from 'jslib/cli/models/response';
import { StringResponse } from 'jslib/cli/models/response/stringResponse';

export class GenerateCommand {
    constructor(private passwordGenerationService: PasswordGenerationService) { }

    async run(cmd: program.Command): Promise<Response> {
        // Check if options are correct
        if (cmd.passphrase) {
            if (cmd.words && cmd.length) {
                return Response.error(`You can't limit words and length at the same time for passphrases generation.`);
            }
            if (cmd.uppercase || cmd.lowercase || cmd.special) {
                return Response.error('You used options, not viable for passphrase generation.');
            }
            if (cmd.length) {
                cmd.type = 'passphrase_limited';
            }
        } else { // Password
            if (cmd.capitalize || cmd.words || cmd.separator) {
                return Response.error('You used options, not viable for password generation.');
            }
        }

        const options = {
            uppercase: cmd.uppercase || false,
            capitalize: cmd.capitalize || false,
            lowercase: cmd.lowercase || false,
            number: cmd.number || false,
            includeNumber: cmd.number || false,
            special: cmd.special || false,
            length: cmd.length || 14,
            type: cmd.type || (cmd.passphrase ? 'passphrase' : 'password'),
            wordSeparator: cmd.separator == null ? '-' : cmd.separator,
            numWords: cmd.words || 3,
        };
        if (!options.uppercase && !options.lowercase && !options.special && !options.number) {
            options.lowercase = true;
            options.uppercase = true;
            options.number = true;
        }
        if (options.length < 5) {
            options.length = 5;
        }
        if (options.numWords < 3) {
            options.numWords = 3;
        }
        if (options.wordSeparator === 'space') {
            options.wordSeparator = ' ';
        } else if (options.wordSeparator != null && options.wordSeparator.length > 1) {
            options.wordSeparator = options.wordSeparator[0];
        }
        const enforcedOptions = await this.passwordGenerationService.enforcePasswordGeneratorPoliciesOnOptions(options);
        const password = await this.passwordGenerationService.generatePassword(enforcedOptions[0]);
        const res = new StringResponse(password);
        return Response.success(res);
    }
}
