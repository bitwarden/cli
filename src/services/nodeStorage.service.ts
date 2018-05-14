import { StorageService } from 'jslib/abstractions/storage.service';
import { Utils } from 'jslib/misc/utils';

let localStorage = Utils.isBrowser ? window.localStorage : null;

export class NodeStorageService implements StorageService {
    constructor(appDirName: string) {
        if (Utils.isNode && localStorage == null) {
            const LocalStorage = require('node-localstorage').LocalStorage;
            let path = null;
            if (process.platform === 'darwin') {
                path = process.env.HOME + 'Library/Application Support';
            } else if (process.platform === 'win32') {
                path = process.env.APPDATA;
            } else {
                path = process.env.HOME + '.config';
            }
            path += ('/' + appDirName + '/data');
            localStorage = new LocalStorage(path);
        }
    }

    get<T>(key: string): Promise<T> {
        const val = localStorage.getItem(key);
        if (val != null) {
            try {
                const obj = JSON.parse(val);
                if (obj != null && obj[key] != null) {
                    return Promise.resolve(obj[key] as T);
                }
            } catch{ }
        }
        return Promise.resolve(null);
    }

    save(key: string, obj: any): Promise<any> {
        let val: string = null;
        if (obj != null) {
            const o: any = {};
            o[key] = obj;
            val = JSON.stringify(o);
        }
        localStorage.setItem(key, val);
        return Promise.resolve();
    }

    remove(key: string): Promise<any> {
        localStorage.removeItem(key);
        return Promise.resolve();
    }
}
