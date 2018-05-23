import * as AdmZip from 'adm-zip';
import * as program from 'commander';
import * as fs from 'fs';
import * as fetch from 'node-fetch';
import * as path from 'path';

import { PlatformUtilsService } from 'jslib/abstractions/platformUtils.service';

import { Response } from '../models/response';
import { MessageResponse } from '../models/response/messageResponse';

export class UpdateCommand {
    inPkg: boolean = false;

    constructor(private platformUtilsService: PlatformUtilsService) {
        this.inPkg = !!(process as any).pkg;
    }

    async run(cmd: program.Command): Promise<Response> {
        const currentVersion = this.platformUtilsService.getApplicationVersion();

        const response = await fetch.default('https://api.github.com/repos/bitwarden/cli/releases/latest');
        if (response.status === 200) {
            const responseJson = await response.json();
            const res = new MessageResponse(null, null);

            const tagName: string = responseJson.tag_name;
            if (tagName === ('v' + currentVersion)) {
                res.title = 'No update available.';
                res.noColor = true;
                return Response.success(res);
            }

            let downloadUrl: string = null;
            if (responseJson.assets != null) {
                for (const a of responseJson.assets) {
                    const download: string = a.browser_download_url;
                    if (download == null) {
                        continue;
                    }

                    if (download.indexOf('.zip') === -1) {
                        continue;
                    }

                    if (process.platform === 'win32' && download.indexOf('bw-windows') > -1) {
                        downloadUrl = download;
                        break;
                    } else if (process.platform === 'darwin' && download.indexOf('bw-macos') > -1) {
                        downloadUrl = download;
                        break;
                    } else if (process.platform === 'linux' && download.indexOf('bw-linux') > -1) {
                        downloadUrl = download;
                        break;
                    }
                }
            }

            if ((cmd.self || false) && this.inPkg && process.platform !== 'win32') {
                const zipResponse = await fetch.default(downloadUrl);
                if (zipResponse.status === 200) {
                    const currentDir = path.dirname(process.execPath);
                    try {
                        const zipBuffer = await zipResponse.buffer();
                        const zip = new AdmZip(zipBuffer);
                        const stats = fs.statSync(process.execPath);
                        zip.extractAllTo(currentDir, true);
                        fs.chmodSync(path.join(currentDir, 'bw'), stats.mode);
                        res.title = 'Updated self to ' + tagName + '.';
                        if (responseJson.body != null && responseJson.body !== '') {
                            res.message = responseJson.body;
                        }
                        return Response.success(res);
                    } catch {
                        return Response.error('Error extracting update to ' + currentDir);
                    }
                } else {
                    return Response.error('Error downloading update: ' + zipResponse.status);
                }
            }

            res.title = 'A new version is available: ' + tagName;
            if (downloadUrl == null) {
                downloadUrl = 'https://github.com/bitwarden/cli/releases';
            } else {
                res.raw = downloadUrl;
            }
            res.message = '';
            if (responseJson.body != null && responseJson.body !== '') {
                res.message = responseJson.body + '\n\n';
            }

            res.message += 'You can download this update at ' + downloadUrl;

            if ((cmd.self || false) && process.platform === 'win32') {
                res.message += '\n`--self` updates are not available on Windows.';
            } else if ((cmd.self || false) && !this.inPkg) {
                res.message += '\n`--self` updates are only available in packaged executables.';
            } else if (process.platform !== 'win32') {
                res.message += '\nor just run `bw update --self`';
            }

            if (this.inPkg) {
                res.message += '\n\nIf you installed this CLI through a package manager ' +
                    'you should probably update using its update command instead.';
            } else {
                res.message += '\n\nIf you installed this CLI through NPM ' +
                    'you should update using `npm install -g @bitwarden/cli`';
            }
            return Response.success(res);
        } else {
            return Response.error('Error contacting update API: ' + response.status);
        }
    }
}
