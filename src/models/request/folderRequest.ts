import { FolderView } from 'jslib/models/view/folderView';

export class FolderRequest {
    static toView(req: FolderRequest, view = new FolderView()) {
        view.name = req.name;
        return view;
    }

    name: string;
}
