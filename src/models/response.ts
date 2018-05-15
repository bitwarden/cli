import { BaseResponse } from './response/baseResponse';

export class Response {
    static error(error: any): Response {
        const res = new Response();
        res.success = false;
        if (typeof (error) === 'string') {
            res.message = error;
        } else {
            res.message = error.message != null ? error.message : error.toString();
        }
        return res;
    }

    static notFound(): Response {
        return Response.error('Not found.');
    }

    static badRequest(message: string): Response {
        return Response.error(message);
    }

    static success(data?: BaseResponse): Response {
        const res = new Response();
        res.success = true;
        res.data = data;
        return res;
    }

    success: boolean;
    message: string;
    errorCode: number;
    data: BaseResponse;
}
