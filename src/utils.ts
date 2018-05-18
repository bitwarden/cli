import * as fs from 'fs';
import * as path from 'path';

import { Organization } from 'jslib/models/domain/organization';
import { CipherView } from 'jslib/models/view/cipherView';
import { CollectionView } from 'jslib/models/view/collectionView';
import { FolderView } from 'jslib/models/view/folderView';

export class CliUtils {
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
                CliUtils.mkdirpSync(dir, 755);
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

    static mkdirpSync(targetDir: string, mode = 755, relative = false, relativeDir: string = null) {
        const initialDir = path.isAbsolute(targetDir) ? path.sep : '';
        const baseDir = relative ? (relativeDir != null ? relativeDir : __dirname) : '.';
        targetDir.split(path.sep).reduce((parentDir, childDir) => {
            const dir = path.resolve(baseDir, parentDir, childDir);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, mode);
            }
            return dir;
        }, initialDir);
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

    static searchCiphers(ciphers: CipherView[], search: string) {
        search = search.toLowerCase();
        return ciphers.filter((c) => {
            if (c.name != null && c.name.toLowerCase().indexOf(search) > -1) {
                return true;
            }
            if (c.subTitle != null && c.subTitle.toLowerCase().indexOf(search) > -1) {
                return true;
            }
            if (c.login && c.login.uri != null && c.login.uri.toLowerCase().indexOf(search) > -1) {
                return true;
            }
            return false;
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
