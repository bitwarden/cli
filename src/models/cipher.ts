import { CipherType } from 'jslib/enums/cipherType';

import { CipherRequest } from 'jslib/models/request/cipherRequest';
import { CipherView } from 'jslib/models/view/cipherView';

import { Card } from './card';
import { Field } from './field';
import { Identity } from './identity';
import { Login } from './login';
import { SecureNote } from './secureNote';

export class Cipher {
    static template(): Cipher {
        const req = new Cipher();
        req.organizationId = null;
        req.folderId = null;
        req.type = CipherType.Login;
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
        if (view.organizationId == null) {
            view.organizationId = req.organizationId;
        }
        view.name = req.name;
        view.notes = req.notes;
        view.favorite = req.favorite;

        if (req.fields != null) {
            view.fields = req.fields.map((f) => Field.toView(f));
        }

        switch (req.type) {
            case CipherType.Login:
                view.login = Login.toView(req.login);
                break;
            case CipherType.SecureNote:
                view.secureNote = SecureNote.toView(req.secureNote);
                break;
            case CipherType.Card:
                view.card = Card.toView(req.card);
                break;
            case CipherType.Identity:
                view.identity = Identity.toView(req.identity);
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
    fields: Field[];
    login: Login;
    secureNote: SecureNote;
    card: Card;
    identity: Identity;

    // Use build method instead of ctor so that we can control order of JSON stringify for pretty print
    build(o: CipherView) {
        this.organizationId = o.organizationId;
        this.folderId = o.folderId;
        this.type = o.type;
        this.name = o.name;
        this.notes = o.notes;
        this.favorite = o.favorite;

        if (o.fields != null) {
            this.fields = o.fields.map((f) => new Field(f));
        }

        switch (o.type) {
            case CipherType.Login:
                this.login = new Login(o.login);
                break;
            case CipherType.SecureNote:
                this.secureNote = new SecureNote(o.secureNote);
                break;
            case CipherType.Card:
                this.card = new Card(o.card);
                break;
            case CipherType.Identity:
                this.identity = new Identity(o.identity);
                break;
        }
    }
}
