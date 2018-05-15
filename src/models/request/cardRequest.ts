import { CardView } from 'jslib/models/view';

export class CardRequest {
    static template(): CardRequest {
        const req = new CardRequest();
        req.cardholderName = 'John Doe';
        req.brand = 'visa';
        req.number = '4242424242424242';
        req.expMonth = '04';
        req.expYear = '2023';
        req.code = '123';
        return req;
    }

    static toView(req: CardRequest, view = new CardView()) {
        view.cardholderName = req.cardholderName;
        view.brand = req.brand;
        view.number = req.number;
        view.expMonth = req.expMonth;
        view.expYear = req.expYear;
        view.code = req.code;
        return view;
    }

    cardholderName: string;
    brand: string;
    number: string;
    expMonth: string;
    expYear: string;
    code: string;
}
