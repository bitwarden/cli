import { LoginUriRequest } from './loginUriRequest';

export class LoginRequest {
    static template(): LoginRequest {
        var req = new LoginRequest();
        req.uris = [];
        req.username = 'jdoe';
        req.password = 'myp@ssword123';
        req.totp = 'JBSWY3DPEHPK3PXP';
        return req;
    }

    uris: LoginUriRequest[];
    username: string;
    password: string;
    totp: string;
}
