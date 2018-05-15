import { LoginUri } from './loginUri';

import { LoginView } from 'jslib/models/view/loginView';

export class Login {
    static template(): Login {
        const req = new Login();
        req.uris = [];
        req.username = 'jdoe';
        req.password = 'myp@ssword123';
        req.totp = 'JBSWY3DPEHPK3PXP';
        return req;
    }

    static toView(req: Login, view = new LoginView()) {
        if (req.uris != null) {
            view.uris = req.uris.map((u) => LoginUri.toView(u));
        }
        view.username = req.username;
        view.password = req.password;
        view.totp = req.totp;
        return view;
    }

    uris: LoginUri[];
    username: string;
    password: string;
    totp: string;

    constructor(o?: LoginView) {
        if (o == null) {
            return;
        }

        if (o.uris != null) {
            this.uris = o.uris.map((u) => new LoginUri(u));
        }

        this.username = o.username;
        this.password = o.password;
        this.totp = o.totp;
    }
}
