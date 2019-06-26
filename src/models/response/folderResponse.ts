import { FolderWithId } from 'jslib/models/export/folderWithId';
import { FolderView } from 'jslib/models/view/folderView';

import { BaseResponse } from 'jslib/cli/models/response/baseResponse';

export class FolderResponse extends FolderWithId implements BaseResponse {
    object: string;

    constructor(o: FolderView) {
        super();
        this.object = 'folder';
        this.build(o);
    }
}
