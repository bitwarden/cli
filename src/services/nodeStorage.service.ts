import { StorageService } from 'jslib/abstractions/storage.service';
import { Utils } from 'jslib/misc/utils';

let localStorage = Utils.isBrowser ? window.localStorage : null;

export class NodeStorageService implements StorageService {
    constructor(dirLocation: string) {
        if (Utils.isNode && localStorage == null) {
            const LocalStorage = require('node-localstorage').LocalStorage;
            localStorage = new LocalStorage(dirLocation);
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
