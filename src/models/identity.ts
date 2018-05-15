import { IdentityView } from 'jslib/models/view/identityView';

export class Identity {
    static template(): Identity {
        const req = new Identity();
        req.title = 'Mr';
        req.firstName = 'John';
        req.middleName = 'William';
        req.lastName = 'Doe';
        req.address1 = '123 Any St';
        req.address2 = 'Apt #123';
        req.address3 = null;
        req.city = 'New York';
        req.state = 'NY';
        req.postalCode = '10001';
        req.country = 'US';
        req.company = 'Acme Inc.';
        req.email = 'john@company.com';
        req.phone = '5555551234';
        req.ssn = '000-123-4567';
        req.username = 'jdoe';
        req.passportNumber = 'US-123456789';
        req.licenseNumber = 'D123-12-123-12333';
        return req;
    }

    static toView(req: Identity, view = new IdentityView()) {
        view.title = req.title;
        view.firstName = req.firstName;
        view.middleName = req.middleName;
        view.lastName = req.lastName;
        view.address1 = req.address1;
        view.address2 = req.address2;
        view.address3 = req.address3;
        view.city = req.city;
        view.state = req.state;
        view.postalCode = req.postalCode;
        view.country = req.country;
        view.company = req.company;
        view.email = req.email;
        view.phone = req.phone;
        view.ssn = req.ssn;
        view.username = req.username;
        view.passportNumber = req.passportNumber;
        view.licenseNumber = req.licenseNumber;
        return view;
    }

    title: string;
    firstName: string;
    middleName: string;
    lastName: string;
    address1: string;
    address2: string;
    address3: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    company: string;
    email: string;
    phone: string;
    ssn: string;
    username: string;
    passportNumber: string;
    licenseNumber: string;

    constructor(o?: IdentityView) {
        if (o == null) {
            return;
        }

        this.title = o.title;
        this.firstName = o.firstName;
        this.middleName = o.middleName;
        this.lastName = o.lastName;
        this.address1 = o.address1;
        this.address2 = o.address2;
        this.address3 = o.address3;
        this.city = o.city;
        this.state = o.state;
        this.postalCode = o.postalCode;
        this.country = o.country;
        this.company = o.company;
        this.email = o.email;
        this.phone = o.phone;
        this.ssn = o.ssn;
        this.username = o.username;
        this.passportNumber = o.passportNumber;
        this.licenseNumber = o.licenseNumber;
    }
}
