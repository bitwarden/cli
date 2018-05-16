import * as program from 'commander';

import { PasswordGenerationService } from 'jslib/abstractions/passwordGeneration.service';

import { Response } from '../models/response';
import { StringResponse } from '../models/response/stringResponse';

export class GenerateCommand {
    constructor(private passwordGenerationService: PasswordGenerationService) { }

    async run(cmd: program.Command): Promise<Response> {
        const options = {
            uppercase: cmd.uppercase || false,
            lowercase: cmd.lowercase || false,
            number: cmd.number || false,
            special: cmd.special || false,
            length: cmd.length || 14,
        };
        if (!options.uppercase && !options.lowercase && !options.special && !options.number) {
            options.lowercase = true;
            options.uppercase = true;
            options.number = true;
        }
        if (options.length < 5) {
            options.length = 5;
        }
        const password = await this.passwordGenerationService.generatePassword(options);
        const res = new StringResponse(password);
        return Response.success(res);
    }
}
