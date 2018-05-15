
import { DeviceType } from 'jslib/enums/deviceType';

import { I18nService } from 'jslib/abstractions/i18n.service';
import { PlatformUtilsService } from 'jslib/abstractions/platformUtils.service';

import { Utils } from 'jslib/misc/utils';

// tslint:disable-next-line
const pjson = require('../../package.json');

export class NodePlatformUtilsService implements PlatformUtilsService {
    identityClientId: string;

    private deviceCache: DeviceType = null;

    constructor() {
        this.identityClientId = 'desktop'; // TODO: cli
    }

    getDevice(): DeviceType {
        if (!this.deviceCache) {
            switch (process.platform) {
                case 'win32':
                    this.deviceCache = DeviceType.Windows;
                    break;
                case 'darwin':
                    this.deviceCache = DeviceType.MacOs;
                    break;
                case 'linux':
                default:
                    this.deviceCache = DeviceType.Linux;
                    break;
            }
        }

        return this.deviceCache;
    }

    getDeviceString(): string {
        return DeviceType[this.getDevice()].toLowerCase();
    }

    isFirefox() {
        return false;
    }

    isChrome() {
        return false;
    }

    isEdge() {
        return false;
    }

    isOpera() {
        return false;
    }

    isVivaldi() {
        return false;
    }

    isSafari() {
        return false;
    }

    isMacAppStore() {
        return false;
    }

    analyticsId() {
        return null as string;
    }

    getDomain(uriString: string): string {
        return Utils.getHostname(uriString);
    }

    isViewOpen() {
        return false;
    }

    launchUri(uri: string, options?: any): void {
        // TODO
    }

    saveFile(win: Window, blobData: any, blobOptions: any, fileName: string): void {
        // TODO
    }

    getApplicationVersion(): string {
        return pjson.version;
    }

    supportsU2f(win: Window) {
        return false;
    }

    showDialog(text: string, title?: string, confirmText?: string, cancelText?: string, type?: string):
        Promise<boolean> {
        process.stdout.write(title + '\n');
        process.stdout.write(text);
        return Promise.resolve(true);
    }

    isDev(): boolean {
        return process.env.ENV === 'development';
    }

    copyToClipboard(text: string, options?: any): void {
        // TODO?
    }
}
