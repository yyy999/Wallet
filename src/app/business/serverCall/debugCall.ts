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
          const cnx = this.connection;
    
          cnx.start().then(() => {
            this.logEvent("RefillNeuraliums - call", { 'accountUuid': accountUuid });
            cnx.invoke<boolean>("refillNeuraliums", accountUuid)
              .then(
                response => {
                  this.logEvent("RefillNeuraliums - response", response);
                  resolve(response);
                })
              .catch(reason => {
                reject("RefillNeuraliums error : " + reason);
              })
              .finally(() => {
                cnx.stop();
              })
          }).catch(reason => {
            reject("Connection error : " + reason);
          })
        });
      }
}