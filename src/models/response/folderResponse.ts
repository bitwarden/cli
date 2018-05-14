import { FolderView } from 'jslib/models/view/folderView';

import { BaseResponse } from './baseResponse';

export class FolderResponse extends BaseResponse {
    id: string;
    name: string;

    constructor(o: FolderView) {
        super('folder');
        this.id = o.id;
        this.name = o.name;
    }
}
