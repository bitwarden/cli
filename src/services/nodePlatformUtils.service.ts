import { DeviceType } from 'jslib/enums/deviceType';

import { I18nService } from 'jslib/abstractions/i18n.service';
import { PlatformUtilsService } from 'jslib/abstractions/platformUtils.service';

import { Utils } from 'jslib/misc/utils';

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

    isFirefox: () => false;
    isChrome: () => false;
    isEdge: () => false;
    isOpera: () => false;
    isVivaldi: () => false;
    isSafari: () => false;
    isMacAppStore: () => false;
    analyticsId: () => null;

    getDomain(uriString: string): string {
        return Utils.getHostname(uriString);
    }

    isViewOpen: () => false;

    launchUri(uri: string, options?: any): void { }

    saveFile(win: Window, blobData: any, blobOptions: any, fileName: string): void {
    }

    getApplicationVersion(): string {
        return '1.0.0'; // TODO
    }

    supportsU2f: (win: Window) => false;

    showDialog(text: string, title?: string, confirmText?: string, cancelText?: string, type?: string):
        Promise<boolean> {
        console.log(title);
        console.log(text);
        return Promise.resolve(true);
    }

    isDev(): boolean {
        return false; // TODO?
    }

    copyToClipboard(text: string, options?: any): void {
        // TODO?
    }
}
