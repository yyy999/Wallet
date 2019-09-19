import { CommonCall } from "./commonCall";
import { LogService } from "../..//service/log.service";
import { HubConnection } from "@aspnet/signalr";

export class AccountCall extends CommonCall {

    private constructor(
        connection: HubConnection,
        logService: LogService) {
        super(connection, logService)
    }

    static create(
        connection: HubConnection,
        logService: LogService) {
        return new AccountCall(connection, logService)
    }

    callSetActiveAccount(chainType: number, accountUuid: string): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {

            this.logEvent("SetActiveAccount - call", { chainType, accountUuid });
            this.connection.invoke<boolean>("SetActiveAccount", chainType, accountUuid)
              .then(
                response => {
                  this.logEvent("setActiveAccount - response", response);
                  resolve(response);
                })
              .catch(reason => {
                reject("setActiveAccount error : " + reason);
              });
          });

      }

      callPublishAccount(chainType: number, accountUuId: string) {
        return new Promise<number>((resolve, reject) => {

            this.logEvent("publishAccount - call", { 'chainType': chainType, 'accountUuId': accountUuId });
            this.connection.invoke<number>("PublishAccount", chainType, accountUuId)
              .then(
                response => {
                  this.logEvent("publishAccount - response", response);
                  resolve(response);
                })
              .catch(reason => {
                reject("publishAccount error : " + reason);
              });
          });
      }
}