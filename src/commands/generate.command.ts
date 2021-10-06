import { PasswordGenerationService } from 'jslib-common/abstractions/passwordGeneration.service';

import { Response } from 'jslib-node/cli/models/response';
import { StringResponse } from 'jslib-node/cli/models/response/stringResponse';

import { CliUtils } from '../utils';

export class GenerateCommand {
    constructor(private passwordGenerationService: PasswordGenerationService) { }

    async run(cmdOptions: Record<string, any>): Promise<Response> {
        const normalizedOptions = this.normalizeOptions(cmdOptions);
        const options = {
            uppercase: normalizedOptions.uppercase,
            lowercase: normalizedOptions.lowercase,
            number: normalizedOptions.number,
            special: normalizedOptions.special,
            length: normalizedOptions.length,
            type: normalizedOptions.type,
            wordSeparator: normalizedOptions.separator,
            numWords: normalizedOptions.words,
        };
        const enforcedOptions = await this.passwordGenerationService.enforcePasswordGeneratorPoliciesOnOptions(options);
        const password = await this.passwordGenerationService.generatePassword(enforcedOptions[0]);
        const res = new StringResponse(password);
        return Response.success(res);
    }

    private normalizeOptions(passedOptions: Record<string, any>): Options {
        const typedOptions = new Options();
        typedOptions.uppercase = CliUtils.convertBooleanOption(passedOptions.uppercase);
        typedOptions.lowercase = CliUtils.convertBooleanOption(passedOptions.lowercase);
        typedOptions.number = CliUtils.convertBooleanOption(passedOptions.number);
        typedOptions.special = CliUtils.convertBooleanOption(passedOptions.special);
        typedOptions.length = passedOptions.length != null ? parseInt(passedOptions.length, null) : 14;
        typedOptions.type = passedOptions.passphrase ? 'passphrase' : 'password';
        typedOptions.separator = passedOptions.separator == null ? '-' : passedOptions.separator + '';
        typedOptions.words = passedOptions.words != null ? parseInt(passedOptions.words, null) : 3;

        if (!typedOptions.uppercase && !typedOptions.lowercase && !typedOptions.special && !typedOptions.number) {
            typedOptions.lowercase = true;
            typedOptions.uppercase = true;
            typedOptions.number = true;
        }
        if (typedOptions.length < 5) {
            typedOptions.length = 5;
        }
        if (typedOptions.words < 3) {
            typedOptions.words = 3;
        }
        if (typedOptions.separator === 'space') {
            typedOptions.separator = ' ';
        } else if (typedOptions.separator != null && typedOptions.separator.length > 1) {
            typedOptions.separator = typedOptions.separator[0];
        }

        return typedOptions;
    }
}

class Options {
    uppercase: boolean;
    lowercase: boolean;
    number: boolean;
    special: boolean;
    length: number;
    type: 'passphrase' | 'password';
    separator: string;
    words: number;
}
