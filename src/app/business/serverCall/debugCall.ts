import { CommonCall } from "./commonCall";
import { LogService } from "../..//service/log.service";
import { HubConnection } from "@aspnet/signalr";

export class DebugCall extends CommonCall {

    private constructor(
        connection: HubConnection,
        logService: LogService) {
        super(connection, logService)
    }

    static create(
        connection: HubConnection,
        logService: LogService) {
        return new DebugCall(connection, logService)
    }

    callRefillNeuraliums(accountUuid: string): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {

            this.logEvent("RefillNeuraliums - call", { 'accountUuid': accountUuid });
            this.connection.invoke<boolean>("RefillNeuraliums", accountUuid)
              .then(
                response => {
                  this.logEvent("RefillNeuraliums - response", response);
                  resolve(response);
                })
              .catch(reason => {
                reject("RefillNeuraliums error : " + reason);
              });
          });
      }
}