import { UriMatchType } from 'jslib/enums/uriMatchType';

import { LoginUriView } from 'jslib/models/view/loginUriView';

export class LoginUri {
    static template(): LoginUri {
        const req = new LoginUri();
        req.uri = 'https://google.com';
        req.match = null;
        return req;
    }

    static toView(req: LoginUri, view = new LoginUriView()) {
        view.uri = req.uri;
        view.match = req.match;
        return view;
    }

    uri: string;
    match: UriMatchType = null;

    constructor(o?: LoginUriView) {
        if (o == null) {
            return;
        }

        this.uri = o.uri;
        this.match = o.match;
    }
}
