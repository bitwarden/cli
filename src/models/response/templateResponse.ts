import { BaseResponse } from './baseResponse';

export class TemplateResponse extends BaseResponse {
    template: any;

    constructor(template: any) {
        super('template');
        this.template = template;
    }
}
