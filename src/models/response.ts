import { BaseResponse } from './response/baseResponse';

export class Response {
    static error(message: string): Response {
        const res = new Response();
        res.success = false;
        res.message = message;
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
