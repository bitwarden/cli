import * as program from 'commander';

import { PasswordGenerationService } from 'jslib/abstractions/passwordGeneration.service';

import { Response } from 'jslib/cli/models/response';
import { StringResponse } from 'jslib/cli/models/response/stringResponse';

export class GenerateCommand {
    constructor(private passwordGenerationService: PasswordGenerationService) { }

    async run(cmdOptions: program.OptionValues): Promise<Response> {
        const options = {
            uppercase: cmdOptions.uppercase || false,
            lowercase: cmdOptions.lowercase || false,
            number: cmdOptions.number || false,
            special: cmdOptions.special || false,
            length: cmdOptions.length || 14,
            type: cmdOptions.passphrase ? 'passphrase' : 'password',
            wordSeparator: cmdOptions.separator == null ? '-' : cmdOptions.separator,
            numWords: cmdOptions.words || 3,
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
