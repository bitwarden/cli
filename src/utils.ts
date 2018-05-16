import { CipherView } from 'jslib/models/view/cipherView';
import { CollectionView } from 'jslib/models/view/collectionView';
import { FolderView } from 'jslib/models/view/folderView';

export class CliUtils {
    static searchCiphers(ciphers: CipherView[], search: string) {
        search = search.toLowerCase();
        return ciphers.filter((c) => {
            if (c.name != null && c.name.toLowerCase().indexOf(search) > -1) {
                return true;
            }
            if (c.subTitle != null && c.subTitle.toLowerCase().indexOf(search) > -1) {
                return true;
            }
            if (c.login && c.login.uri != null && c.login.uri.toLowerCase().indexOf(search) > -1) {
                return true;
            }
            return false;
        });
    }

    static searchFolders(folders: FolderView[], search: string) {
        search = search.toLowerCase();
        return folders.filter((f) => {
            if (f.name != null && f.name.toLowerCase().indexOf(search) > -1) {
                return true;
            }
            return false;
        });
    }

    static searchCollections(collections: CollectionView[], search: string) {
        search = search.toLowerCase();
        return collections.filter((c) => {
            if (c.name != null && c.name.toLowerCase().indexOf(search) > -1) {
                return true;
            }
            return false;
        });
    }
}
