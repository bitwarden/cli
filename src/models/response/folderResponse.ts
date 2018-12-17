import { FolderWithId } from 'jslib/models/export/folderWithId';
import { FolderView } from 'jslib/models/view/folderView';

import { BaseResponse } from './baseResponse';

export class FolderResponse extends FolderWithId implements BaseResponse {
    object: string;

    constructor(o: FolderView) {
        super();
        this.object = 'folder';
        this.build(o);
    }
}
