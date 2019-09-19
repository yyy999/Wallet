import { CommonCall } from "./commonCall";
import { LogService } from "../../service/log.service";
import { HubConnection } from "@aspnet/signalr";

export class PassphrasesCall extends CommonCall {

    private constructor(
        connection: HubConnection,
        logService: LogService) {
        super(connection, logService)
    }

    static create(
        connection: HubConnection,
        logService: LogService) {
        return new PassphrasesCall(connection, logService)
    }

    callEnterWalletPassphrase(correlationId: number, chainType: number, keyCorrelationCode: number, passphrase: string): Promise<boolean> {
        return this.callEnterPassphrase("enterWalletPassphrase", correlationId, chainType, keyCorrelationCode, passphrase);
    }

    callEnterKeyPassphrase(correlationId: number, chainType: number, keyCorrelationCode: number, passphrase: string): Promise<boolean> {
        return this.callEnterPassphrase("enterKeyPassphrase", correlationId, chainType, keyCorrelationCode, passphrase);
    }

    private callEnterPassphrase(action : string, correlationId: number, chainType: number, keyCorrelationCode: number, passphrase: string): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {

                this.logEvent(action + " - call", { correlationId, chainType, keyCorrelationCode, passphrase });
                this.connection.invoke<boolean>(action, correlationId, chainType, keyCorrelationCode, passphrase)
                    .then(
                        response => {
                            this.logEvent(action + " - response", response);
                            resolve(response);
                        })
                    .catch(reason => {
                        reject(action + " error : " + reason);
                    });
            });
    }
}