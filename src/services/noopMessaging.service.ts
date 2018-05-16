import { MessagingService } from 'jslib/abstractions/messaging.service';

export class NoopMessagingService implements MessagingService {
    send(subscriber: string, arg: any = {}) {
        // Do nothing...
    }
}
