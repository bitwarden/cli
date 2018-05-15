import * as program from 'commander';

import { Response } from '../models/response';
import { StringResponse } from '../models/response/stringResponse';

export class EncodeCommand {
    run(cmd: program.Command): Promise<Response> {
        if (process.stdin == null || process.stdin.isTTY) {
            return Promise.resolve(Response.badRequest('No stdin was piped in.'));
        }

        return new Promise((resolve, reject) => {
            let input: string = '';
            process.stdin.setEncoding('utf8');
            process.stdin.on('readable', () => {
                while (true) {
                    const chunk = process.stdin.read();
                    if (chunk == null) {
                        break;
                    }
                    input += chunk;
                }
            });
            process.stdin.on('end', () => {
                const b64 = new Buffer(input, 'utf8').toString('base64');
                const res = new StringResponse(b64);
                resolve(Response.success(res));
            });
        });
    }
}
