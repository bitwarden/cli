import { UserVerificationService as BaseUserVerificationService } from 'jslib-common/services/userVerification.service';

export class UserVerificationService extends BaseUserVerificationService {
    showError(message: string) {
        /* noop */
    }
}
