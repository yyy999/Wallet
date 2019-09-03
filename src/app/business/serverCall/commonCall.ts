import { HubConnection } from "@aspnet/signalr";
import { LogService } from "../..//service/log.service";

export abstract class CommonCall {
    protected connection: HubConnection

    constructor(
        connection: HubConnection,
        private logService: LogService) {
        this.connection = connection;
    }

    logEvent(message: string, data: any) {
        this.logService.logDebug(message, data);
    }
}