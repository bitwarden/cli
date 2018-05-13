import { StorageService } from 'jslib/abstractions/storage.service';

export class NodeStorageService implements StorageService {
    get<T>(key: string): Promise<T> {
        return Promise.resolve(null);
    }

    save(key: string, obj: any): Promise<any> {
        return Promise.resolve();
    }

    remove(key: string): Promise<any> {
        return Promise.resolve();
    }
}
