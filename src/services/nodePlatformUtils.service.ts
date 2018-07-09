
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
        this.identityClientId = 'cli';
    }

    getDevice(): DeviceType {
        if (!this.deviceCache) {
            switch (process.platform) {
                case 'win32':
                    this.deviceCache = DeviceType.WindowsDesktop;
                    break;
                case 'darwin':
                    this.deviceCache = DeviceType.MacOsDesktop;
                    break;
                case 'linux':
                default:
                    this.deviceCache = DeviceType.LinuxDesktop;
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

    isIE() {
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

    lockTimeout(): number {
        return null;
    }

    launchUri(uri: string, options?: any): void {
        throw new Error('Not implemented.');
    }

    saveFile(win: Window, blobData: any, blobOptions: any, fileName: string): void {
        throw new Error('Not implemented.');
    }

    getApplicationVersion(): string {
        return pjson.version;
    }

    supportsU2f(win: Window) {
        return false;
    }

    supportsDuo(): boolean {
        return false;
    }

    showToast(type: 'error' | 'success' | 'warning' | 'info', title: string, text: string, global?: any): void {
        throw new Error('Not implemented.');
    }

    showDialog(text: string, title?: string, confirmText?: string, cancelText?: string, type?: string):
        Promise<boolean> {
        throw new Error('Not implemented.');
    }

    isDev(): boolean {
        return process.env.BWCLI_ENV === 'development';
    }

    isSelfHost(): boolean {
        return false;
    }

    copyToClipboard(text: string, options?: any): void {
        throw new Error('Not implemented.');
    }
}
