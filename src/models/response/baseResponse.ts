export abstract class BaseResponse {
    object: string;

    constructor(object?: string) {
        if (object != null) {
            this.object = object;
        }
    }
}
