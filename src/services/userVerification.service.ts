import { UserVerificationService as BaseUserVerificationService } from 'jslib-common/services/userVerification.service';

export class UserVerificationService extends BaseUserVerificationService {
    handleError(message: string) {
        throw new Error(message);
    }
}
