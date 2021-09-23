import * as program from 'commander';
import * as express from 'express';
import * as multer from 'multer';

import { Main } from '../bw';

import { ConfirmCommand } from './confirm.command';
import { CreateCommand } from './create.command';
import { DeleteCommand } from './delete.command';
import { EditCommand } from './edit.command';
import { GenerateCommand } from './generate.command';
import { GetCommand } from './get.command';
import { ListCommand } from './list.command';
import { LockCommand } from './lock.command';
import { RestoreCommand } from './restore.command';
import { ShareCommand } from './share.command';
import { StatusCommand } from './status.command';
import { SyncCommand } from './sync.command';
import { UnlockCommand } from './unlock.command';

import { Response } from 'jslib-node/cli/models/response';
import { FileResponse } from 'jslib-node/cli/models/response/fileResponse';

export class ServeCommand {
    private listCommand: ListCommand;
    private getCommand: GetCommand;
    private createCommand: CreateCommand;
    private editCommand: EditCommand;
    private generateCommand: GenerateCommand;
    private shareCommand: ShareCommand;
    private statusCommand: StatusCommand;
    private syncCommand: SyncCommand;
    private deleteCommand: DeleteCommand;
    private confirmCommand: ConfirmCommand;
    private restoreCommand: RestoreCommand;
    private lockCommand: LockCommand;
    private unlockCommand: UnlockCommand;

    constructor(protected main: Main) {
        this.getCommand = new GetCommand(this.main.cipherService, this.main.folderService,
            this.main.collectionService, this.main.totpService, this.main.auditService,
            this.main.cryptoService, this.main.userService, this.main.searchService,
            this.main.apiService, this.main.sendService, this.main.environmentService);
        this.listCommand = new ListCommand(this.main.cipherService, this.main.folderService,
            this.main.collectionService, this.main.userService, this.main.searchService, this.main.apiService);
        this.createCommand = new CreateCommand(this.main.cipherService, this.main.folderService,
            this.main.userService, this.main.cryptoService, this.main.apiService);
        this.editCommand = new EditCommand(this.main.cipherService, this.main.folderService, this.main.cryptoService,
            this.main.apiService);
        this.generateCommand = new GenerateCommand(this.main.passwordGenerationService);
        this.syncCommand = new SyncCommand(this.main.syncService);
        this.statusCommand = new StatusCommand(this.main.environmentService, this.main.syncService,
            this.main.userService, this.main.vaultTimeoutService);
        this.deleteCommand = new DeleteCommand(this.main.cipherService, this.main.folderService, this.main.userService,
            this.main.apiService);
        this.confirmCommand = new ConfirmCommand(this.main.apiService, this.main.cryptoService);
        this.restoreCommand = new RestoreCommand(this.main.cipherService);
        this.shareCommand = new ShareCommand(this.main.cipherService);
        this.lockCommand = new LockCommand(this.main.vaultTimeoutService);
        this.unlockCommand = new UnlockCommand(this.main.cryptoService, this.main.userService,
            this.main.cryptoFunctionService, this.main.apiService, this.main.logService);
    }

    async run(options: program.OptionValues) {
        const port = options.port || 8087;
        const server = express();
        process.env.BW_SERVE = 'true';
        process.env.BW_NOINTERACTION = 'true';

        server.use(express.json());
        server.use((req, res, next) => {
            const sessionHeader = req.get('Session');
            if (sessionHeader != null && sessionHeader !== '') {
                process.env.BW_SESSION = sessionHeader;
            }
            next();
        });

        server.get('/generate', async (req, res) => {
            const response = await this.generateCommand.run(req.query);
            this.processResponse(res, response);
        });

        server.get('/status', async (req, res) => {
            const response = await this.statusCommand.run();
            this.processResponse(res, response);
        });

        server.get('/list/:object', async (req, res) => {
            const response = await this.listCommand.run(req.params.object, req.query);
            this.processResponse(res, response);
        });

        server.post('/sync', async (req, res) => {
            const response = await this.syncCommand.run(req.query);
            this.processResponse(res, response);
        });

        server.post('/lock', async (req, res) => {
            const response = await this.lockCommand.run(req.query);
            this.processResponse(res, response);
        });

        server.post('/unlock', async (req, res) => {
            const response = await this.unlockCommand.run(
                req.body == null ? null : req.body.password as string, req.query);
            this.processResponse(res, response);
        });

        server.post('/confirm/:object/:id', async (req, res) => {
            const response = await this.confirmCommand.run(req.params.object, req.params.id, req.query);
            this.processResponse(res, response);
        });

        server.post('/restore/:object/:id', async (req, res) => {
            const response = await this.restoreCommand.run(req.params.object, req.params.id, req.query);
            this.processResponse(res, response);
        });

        server.post('/move/:id/:organizationId', async (req, res) => {
            const response = await this.shareCommand.run(req.params.id, req.params.organizationId, req.body, req.query);
            this.processResponse(res, response);
        });

        server.post('/attachment', multer().single('file'), async (req, res) => {
            const response = await this.createCommand.run('attachment', req.body, req.query, {
                fileBuffer: req.file.buffer,
                fileName: req.file.originalname,
            });
            this.processResponse(res, response);
        });

        server.post('/:object', async (req, res) => {
            const response = await this.createCommand.run(req.params.object, req.body, req.query);
            this.processResponse(res, response);
        });

        server.put('/:object/:id', async (req, res) => {
            const response = await this.editCommand.run(req.params.object, req.params.id, req.body, req.query);
            this.processResponse(res, response);
        });

        server.get('/:object/:id', async (req, res) => {
            const response = await this.getCommand.run(req.params.object, req.params.id, req.query);
            this.processResponse(res, response);
        });

        server.delete('/:object/:id', async (req, res) => {
            const response = await this.deleteCommand.run(req.params.object, req.params.id, req.query);
            this.processResponse(res, response);
        });

        server.listen(port, () => {
            this.main.logService.info('Listening on port ' + port);
        });
    }

    private processResponse(res: any, commandResponse: Response) {
        if (!commandResponse.success) {
            res.statusCode = 400;
        }
        if (commandResponse.data instanceof FileResponse) {
            res.writeHead(200, {
                'Content-Type': 'application/octet-stream',
                'Content-Disposition': 'attachment;filename=' + commandResponse.data.fileName,
                'Content-Length': commandResponse.data.data.length,
            });
            res.end(commandResponse.data.data);
        } else {
            res.json(commandResponse);
        }
    }
}
