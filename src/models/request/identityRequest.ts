export class IdentityRequest {
    static template(): IdentityRequest {
        var req = new IdentityRequest();
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
}
