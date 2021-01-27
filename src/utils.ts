import * as fs from 'fs';
import * as path from 'path';

import { Response } from 'jslib/cli/models/response';
import { MessageResponse } from 'jslib/cli/models/response/messageResponse';

import { Organization } from 'jslib/models/domain/organization';
import { CollectionView } from 'jslib/models/view/collectionView';
import { FolderView } from 'jslib/models/view/folderView';

import { NodeUtils } from 'jslib/misc/nodeUtils';

export class CliUtils {
    static writeLn(s: string, finalLine: boolean = false, error: boolean = false) {
        const stream = error ? process.stderr : process.stdout;
        if (finalLine && (process.platform === 'win32' || !stream.isTTY)) {
            stream.write(s);
        } else {
            stream.write(s + '\n');
        }
    }

    static readFile(input: string): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            let p: string = null;
            if (input != null && input !== '') {
                const osInput = path.join(input);
                if (osInput.indexOf(path.sep) === -1) {
                    p = path.join(process.cwd(), osInput);
                } else {
                    p = osInput;
                }
            } else {
                reject('You must specify a file path.');
            }
            fs.readFile(p, 'utf8', (err, data) => {
                if (err != null) {
                    reject(err.message);
                }
                resolve(data);
            });
        });
    }

    /**
     * Save the given data to a file and determine the target file if necessary.
     * If output is non-empty, it is used as target filename. Otherwise the target filename is
     * built from the current working directory and the given defaultFileName.
     *
     * @param data to be written to the file.
     * @param output file to write to or empty to choose automatically.
     * @param defaultFileName to use when no explicit output filename is given.
     * @return the chosen output file.
     */
    static saveFile(data: string | Buffer, output: string, defaultFileName: string) {
        let p: string = null;
        let mkdir = false;
        if (output != null && output !== '') {
            const osOutput = path.join(output);
            if (osOutput.indexOf(path.sep) === -1) {
                p = path.join(process.cwd(), osOutput);
            } else {
                mkdir = true;
                if (osOutput.endsWith(path.sep)) {
                    p = path.join(osOutput, defaultFileName);
                } else {
                    p = osOutput;
                }
            }
        } else {
            p = path.join(process.cwd(), defaultFileName);
        }

        p = path.resolve(p);
        if (mkdir) {
            const dir = p.substring(0, p.lastIndexOf(path.sep));
            if (!fs.existsSync(dir)) {
                NodeUtils.mkdirpSync(dir, '700');
            }
        }

        return new Promise<string>((resolve, reject) => {
            fs.writeFile(p, data, 'utf8', (err) => {
                if (err != null) {
                    reject('Cannot save file to ' + p);
                }
                resolve(p);
            });
        });
    }

    /**
     * Process the given data and write it to a file if possible. If the user requested RAW output and
     * no output name is given, the file is directly written to stdout. The resulting Response contains
     * an otherwise empty message then to prevent writing other information to stdout.
     *
     * If an output is given or no RAW output is requested, the rules from [saveFile] apply.
     *
     * @param data to be written to the file or stdout.
     * @param output file to write to or empty to choose automatically.
     * @param defaultFileName to use when no explicit output filename is given.
     * @return an empty [Response] if written to stdout or a [Response] with the chosen output file otherwise.
     */
    static async saveResultToFile(data: string | Buffer, output: string, defaultFileName: string) {
        if ((output == null || output === '') && process.env.BW_RAW === 'true') {
            // No output is given and the user expects raw output. Since the command result is about content,
            // we directly return the command result to stdout (and suppress further messages).
            process.stdout.write(data);
            return Response.success();
        }

        const filePath = await this.saveFile(data, output, defaultFileName);
        const res = new MessageResponse('Saved ' + filePath, null);
        res.raw = filePath;
        return Response.success(res);
    }

    static readStdin(): Promise<string> {
        return new Promise((resolve, reject) => {
            let input: string = '';

            if (process.stdin.isTTY) {
                resolve(input);
                return;
            }

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
                resolve(input);
            });
        });
    }

    static searchFolders(folders: FolderView[], search: string) {
        search = search.toLowerCase();
        return folders.filter((f) => {
            if (f.name != null && f.name.toLowerCase().indexOf(search) > -1) {
                return true;
            }
            return false;
        });
    }

    static searchCollections(collections: CollectionView[], search: string) {
        search = search.toLowerCase();
        return collections.filter((c) => {
            if (c.name != null && c.name.toLowerCase().indexOf(search) > -1) {
                return true;
            }
            return false;
        });
    }

    static searchOrganizations(organizations: Organization[], search: string) {
        search = search.toLowerCase();
        return organizations.filter((o) => {
            if (o.name != null && o.name.toLowerCase().indexOf(search) > -1) {
                return true;
            }
            return false;
        });
    }

    // https://stackoverflow.com/a/31394257
    static bufferToArrayBuffer(buf: Buffer): ArrayBuffer {
        return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
    }
}
