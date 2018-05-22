import * as program from 'commander';
import * as fetch from 'node-fetch';

import { PlatformUtilsService } from 'jslib/abstractions/platformUtils.service';

import { Response } from '../models/response';
import { MessageResponse } from '../models/response/messageResponse';

export class UpdateCommand {
    constructor(private platformUtilsService: PlatformUtilsService) { }

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

                    if (process.platform === 'win32' && download.indexOf('bw-windows.zip') > -1) {
                        downloadUrl = download;
                        break;
                    } else if (process.platform === 'darwin' && download.indexOf('bw-macos.zip') > -1) {
                        downloadUrl = download;
                        break;
                    } else if (process.platform === 'linux' && download.indexOf('bw-linux.zip') > -1) {
                        downloadUrl = download;
                        break;
                    }
                }
            }

            res.title = 'A new version is available: ' + tagName;
            if (downloadUrl == null) {
                downloadUrl = 'https://github.com/bitwarden/cli/releases';
            } else {
                res.raw = downloadUrl;
            }
            res.message = 'You can download this update at: ' + downloadUrl + '\n' +
                'If you installed this CLI through a package manager ' +
                'you should probably update using its update command instead.';
            return Response.success(res);
        } else {
            return Response.error('Error contacting update API: ' + response.status);
        }
    }
}
