import { UriMatchType } from 'jslib/enums/uriMatchType';
import { LoginUriView } from 'jslib/models/view/loginUriView';

export class LoginUriRequest {
    static template(): LoginUriRequest {
        const req = new LoginUriRequest();
        req.uri = 'https://google.com';
        req.match = null;
        return req;
    }

    static toView(req: LoginUriRequest) {
        const view = new LoginUriView();
        view.uri = req.uri;
        view.match = req.match;
        return view;
    }

    uri: string;
    match: UriMatchType = null;
}
