import { CommonCall } from "./commonCall";
import { LogService } from "../../service/log.service";
import { ServerConnectionService } from '../..//service/server-connection.service';

export class PassphrasesCall extends CommonCall {

    private constructor(
        serviceConnectionService : ServerConnectionService,
        logService: LogService) {
        super(serviceConnectionService, logService)
    }

    static create(
        serviceConnectionService : ServerConnectionService,
        logService: LogService) {
        return new PassphrasesCall(serviceConnectionService, logService)
    }

    callEnterWalletPassphrase(correlationId: number, chainType: number, keyCorrelationCode: number, passphrase: string): Promise<boolean> {
        return this.callEnterPassphrase("EnterWalletPassphrase", correlationId, chainType, keyCorrelationCode, passphrase);
    }

    callEnterKeyPassphrase(correlationId: number, chainType: number, keyCorrelationCode: number, passphrase: string): Promise<boolean> {
        return this.callEnterPassphrase("EnterKeyPassphrase", correlationId, chainType, keyCorrelationCode, passphrase);
    }

    private callEnterPassphrase(action : string, correlationId: number, chainType: number, keyCorrelationCode: number, passphrase: string): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {

                this.logEvent(action + " - call", { correlationId, chainType, keyCorrelationCode, passphrase });
                this.serviceConnectionService.invoke<boolean>(action, correlationId, chainType, keyCorrelationCode, passphrase)
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