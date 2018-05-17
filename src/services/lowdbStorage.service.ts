import * as fs from 'fs';
import * as lowdb from 'lowdb';
import * as FileSync from 'lowdb/adapters/FileSync';
import * as mkdirp from 'mkdirp';
import * as path from 'path';

import { StorageService } from 'jslib/abstractions/storage.service';
import { Utils } from 'jslib/misc/utils';

export class LowdbStorageService implements StorageService {
    private db: lowdb.LowdbSync<any>;

    constructor(appDirName: string) {
        let p = null;
        if (process.platform === 'darwin') {
            p = path.join(process.env.HOME, 'Library/Application Support', appDirName);
        } else if (process.platform === 'win32') {
            p = path.join(process.env.APPDATA, appDirName);
        } else {
            p = path.join(process.env.HOME, '.config', appDirName);
        }
        if (!fs.existsSync(p)) {
            mkdirp.sync(p, 755);
        }
        p = path.join(p, 'data.json');

        const adapter = new FileSync(p);
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
