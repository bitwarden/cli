import { FolderView } from 'jslib/models/view/folderView';

import { BaseResponse } from './baseResponse';

import { Folder } from '../folder';

export class FolderResponse extends Folder implements BaseResponse {
    object: string;
    id: string;

    constructor(o: FolderView) {
        super();
        this.object = 'folder';
        this.id = o.id;
        this.build(o);
    }
}
