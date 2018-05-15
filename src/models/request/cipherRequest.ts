import { CipherType } from 'jslib/enums/cipherType';

import { CardRequest } from './cardRequest';
import { FieldRequest } from './fieldRequest';
import { IdentityRequest } from './identityRequest';
import { LoginRequest } from './loginRequest';
import { SecureNoteRequest } from './secureNoteRequest';

import { CipherView } from 'jslib/models/view/cipherView';

export class CipherRequest {
    static template(): CipherRequest {
        const req = new CipherRequest();
        req.type = CipherType.Login;
        req.folderId = null;
        req.organizationId = null;
        req.name = 'Item name';
        req.notes = 'Some notes about this item.';
        req.favorite = false;
        req.fields = [];
        req.login = null;
        req.secureNote = null;
        req.card = null;
        req.identity = null;
        return req;
    }

    static toView(req: CipherRequest, view = new CipherView()) {
        view.type = req.type;
        view.folderId = req.folderId;
        view.organizationId = req.organizationId;
        view.name = req.name;
        view.notes = req.notes;
        view.favorite = req.favorite;

        if (req.fields != null) {
            view.fields = req.fields.map((f) => FieldRequest.toView(f));
        }

        switch (req.type) {
            case CipherType.Login:
                view.login = LoginRequest.toView(req.login);
                break;
            case CipherType.SecureNote:
                view.secureNote = SecureNoteRequest.toView(req.secureNote);
                break;
            case CipherType.Card:
                view.card = CardRequest.toView(req.card);
                break;
            case CipherType.Identity:
                view.identity = IdentityRequest.toView(req.identity);
                break;
        }

        return view;
    }

    type: CipherType;
    folderId: string;
    organizationId: string;
    name: string;
    notes: string;
    favorite: boolean;
    fields: FieldRequest[];
    login: LoginRequest;
    secureNote: SecureNoteRequest;
    card: CardRequest;
    identity: IdentityRequest;
}
