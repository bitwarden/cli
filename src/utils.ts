import * as fs from 'fs';
import * as path from 'path';

import { Organization } from 'jslib/models/domain/organization';
import { CipherView } from 'jslib/models/view/cipherView';
import { CollectionView } from 'jslib/models/view/collectionView';
import { FolderView } from 'jslib/models/view/folderView';

import { NodeUtils } from 'jslib/misc/nodeUtils';

export class CliUtils {
    static writeLn(s: string, finalLine: boolean = false) {
        if (finalLine && process.platform === 'win32') {
            process.stdout.write(s);
        } else {
            process.stdout.write(s + '\n');
        }
    }

    static readFile(input: string): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            let p: string = null;
            if (input !== null && input !== '') {
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
}
