import { UriMatchType } from 'jslib/enums/uriMatchType';

export class LoginUriRequest {
    static template(): LoginUriRequest {
        var req = new LoginUriRequest();
        req.uri = 'https://google.com';
        req.match = null;
        return req;
    }

    uri: string;
    match: UriMatchType = null;
}
