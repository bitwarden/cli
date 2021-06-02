import * as program from 'commander';
import { ApiService, CipherService, CollectionService, UserService } from 'jslib/abstractions';
import { ExportService } from 'jslib/abstractions/export.service';
import { Response } from 'jslib/cli/models/response';
import { EventType } from 'jslib/enums/eventType';
import { Utils } from 'jslib/misc/utils';
import { Organization } from 'jslib/models/domain/organization';
import { ListResponse } from 'jslib/models/response';
import { EventResponse } from 'jslib/models/response/eventResponse';
import * as papa from 'papaparse';
import { OrganizationUserResponse } from '../models/response/organizationUserResponse';
import { CliUtils } from '../utils';

export class PasswordAccessReportCommand {
    constructor(private exportService: ExportService,
                private userService: UserService,
                private apiService: ApiService,
                private cipherService: CipherService,
                private collectionService: CollectionService,
    ) {
    }

    async run(username: string, from: string, to: string, options: program.OptionValues): Promise<Response> {

        const organization = await this.getOrganization(options);
        const members = await this.listOrganizationMembers(organization);
        const user = members.filter(member => member.email === username)?.[0];
        if (user === undefined) {
            return Response.badRequest('User does not exists for Organization!');
        }

        try {
            const userEvents = await this.getUserEvents(organization, user.id, from, to);
            const ciphersDecrypted = (await this.cipherService.getAllDecrypted())
                // filter unused ciphers
                .filter(cad => userEvents.map(fe => fe.cipherId).includes(cad.id));
            // latest modified cipher event for each cipher
            const lastModifiedCipherEvents = await Promise.all(ciphersDecrypted.map(async cipherDecrypted => {
                const lastModifiedEvent = await this.getCipherLastModifiedEvent(cipherDecrypted.id, from, to);
                const latestEditUser = members.find(m => m.userId === lastModifiedEvent?.actingUserId);
                const lastModified = {
                    'username': latestEditUser?.name,
                    'email': latestEditUser?.email,
                    'date': lastModifiedEvent.date,
                    'type': lastModifiedEvent.type.toString(),
                    'type_name': EventType[lastModifiedEvent.type],
                };

                return [cipherDecrypted.id, lastModified] as [string, { date: string; type_name: string; type: string; email: string; username: string }];
            }));
            const cipherEvents = new Map(lastModifiedCipherEvents);
            const collectionAllDecrypted = await this.collectionService.getAllDecrypted();
            const userPasswordAccessEvents = userEvents.map(e => {
                const cipherEvent = ciphersDecrypted.find(cd => cd.id === e.cipherId);
                const collectionEvent = collectionAllDecrypted.filter(cd => cipherEvent.collectionIds.includes(cd.id));
                const lastModifiedEvent = cipherEvents.get(cipherEvent.id);

                return {
                    'name': cipherEvent.name,
                    'date': e.date,
                    'type': e.type.toString(),
                    'type_name': EventType[e.type],
                    'collections': collectionEvent.map(ce => ce.name).join(','),
                    'uri': cipherEvent.login.uri,
                    'last_modified_username': lastModifiedEvent.username,
                    'last_modified_email': lastModifiedEvent.email,
                    'last_modified_date': lastModifiedEvent.date,
                    'last_modified_type_name': lastModifiedEvent.type_name,
                    'last_modified_type': lastModifiedEvent.type,
                };
            });
            const format = options.format !== 'json' ? 'csv' : 'json';

            let exportContent;
            if (format === 'csv') {
                exportContent = papa.unparse(userPasswordAccessEvents);
            } else {
                exportContent = JSON.stringify(userPasswordAccessEvents);
            }

            return await this.saveFile(exportContent, options, format);
        } catch (e) {
            return Response.badRequest(e);
        }
    }

    private async getUserEvents(organization: Organization, userId: string, from: string, to: string): Promise<EventResponse[]> {
        const eventsPageList = [];
        let continuationToken = null;
        do {
            const eventsPage: ListResponse<EventResponse> = await this.apiService.getEventsOrganizationUser(organization.id, userId, from, to, continuationToken);
            eventsPageList.push(eventsPage.data);
            continuationToken = eventsPage.continuationToken;
        }
        while (continuationToken);

        const eventTypes = [
            EventType.Cipher_Created,
            EventType.Cipher_ClientToggledPasswordVisible,
            EventType.Cipher_ClientToggledHiddenFieldVisible,
            EventType.Cipher_ClientCopiedPassword,
            EventType.Cipher_ClientCopiedHiddenField,
        ];
        const filteredEventsMap = new Map(
            ([] as EventResponse[]).concat(...eventsPageList)
                .reverse()
                .filter(event => eventTypes.includes(event.type))
                .map(key => [key.cipherId, key] as [string, EventResponse]));

        return Array.from(filteredEventsMap, ([k, v]) => v);
    }

    private async getCipherLastModifiedEvent(cipherId: string, from: string, to: string): Promise<EventResponse> {
        const eventsPageList = [];
        let continuationToken = null;
        do {
            const eventsPage: ListResponse<EventResponse> = await this.apiService.getEventsCipher(cipherId, from, null, continuationToken);
            eventsPageList.push(eventsPage.data);
            continuationToken = eventsPage.continuationToken;
        }
        while (continuationToken);

        const allEvents = await Promise.all(eventsPageList);
        return ([] as EventResponse[]).concat(...allEvents)
            .filter(event => [
                    EventType.Cipher_Created,
                    EventType.Cipher_Updated,
                ].includes(event.type)
            ).reverse()[0];
    }

    private async saveFile(exportContent: string, options: program.OptionValues, format: string): Promise<Response> {
        try {
            const fileName = this.exportService.getFileName(options.organizationid != null ? 'user_last_password_access' : null, format);
            return await CliUtils.saveResultToFile(exportContent, options.output, fileName);
        } catch (e) {
            return Response.error(e.toString());
        }
    }

    private async getOrganization(options: program.OptionValues): Promise<Organization> {
        if (options.organizationid == null || options.organizationid === '') {
            throw new Error('--organizationid <organizationid> required.');
        }
        if (!Utils.isGuid(options.organizationid)) {
            throw new Error('`' + options.organizationid + '` is not a GUID.');
        }
        const organization = await this.userService.getOrganization(options.organizationid);
        if (organization == null) {
            throw new Error('Organization not found.');
        }
        return organization;
    }

    private async listOrganizationMembers(organization: Organization): Promise<OrganizationUserResponse[]> {
        try {
            const response = await this.apiService.getOrganizationUsers(organization.id);
            return response.data.map(r => {
                const u = new OrganizationUserResponse();
                u.email = r.email;
                u.name = r.name;
                u.id = r.id;
                u.status = r.status;
                u.type = r.type;
                u.twoFactorEnabled = r.twoFactorEnabled;
                u.userId = r.userId;
                return u;
            });
        } catch (e) {
            throw e;
        }
    }
}
