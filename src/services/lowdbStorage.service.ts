import * as lowdb from 'lowdb';
import * as FileSync from 'lowdb/adapters/FileSync';

import { StorageService } from 'jslib/abstractions/storage.service';
import { Utils } from 'jslib/misc/utils';

export class LowdbStorageService implements StorageService {
    private db: lowdb.LowdbSync<any>;

    constructor(appDirName: string) {
        let path = null;
        if (process.platform === 'darwin') {
            path = process.env.HOME + 'Library/Application Support';
        } else if (process.platform === 'win32') {
            path = process.env.APPDATA;
        } else {
            path = process.env.HOME + '.config';
        }
        path += ('/' + appDirName + '/data.json');

        const adapter = new FileSync(path);
        this.db = lowdb(adapter);
    }

    get<T>(key: string): Promise<T> {
        const val = this.db.get(key).value();
        return Promise.resolve(val as T);
    }

    save(key: string, obj: any): Promise<any> {
        this.db.set(key, obj).write();
        return Promise.resolve();
    }

    remove(key: string): Promise<any> {
        this.db.unset(key).write();
        return Promise.resolve();
    }
}
