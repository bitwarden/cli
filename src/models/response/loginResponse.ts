import { Login } from '../login';

import { LoginView } from 'jslib/models/view';

export class LoginResponse extends Login {
    passwordRevisionDate: Date;

    constructor(o: LoginView) {
        super(o);
        this.passwordRevisionDate = o.passwordRevisionDate != null ? o.passwordRevisionDate : null;
    }
}
