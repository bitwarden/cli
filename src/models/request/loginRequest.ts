import { LoginUriRequest } from './loginUriRequest';

import { LoginView } from 'jslib/models/view';

export class LoginRequest {
    static template(): LoginRequest {
        const req = new LoginRequest();
        req.uris = [];
        req.username = 'jdoe';
        req.password = 'myp@ssword123';
        req.totp = 'JBSWY3DPEHPK3PXP';
        return req;
    }

    static toView(req: LoginRequest) {
        const view = new LoginView();
        if (req.uris != null) {
            view.uris = req.uris.map((u) => LoginUriRequest.toView(u));
        }
        view.username = req.username;
        view.password = req.password;
        view.totp = req.totp;
        return view;
    }

    uris: LoginUriRequest[];
    username: string;
    password: string;
    totp: string;
}
