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
          const cnx = this.connection;
    
          cnx.start().then(() => {
            this.logEvent("SetActiveAccount - call", { chainType, accountUuid });
            cnx.invoke<boolean>("setActiveAccount", chainType, accountUuid)
              .then(
                response => {
                  this.logEvent("setActiveAccount - response", response);
                  resolve(response);
                })
              .catch(reason => {
                reject("setActiveAccount error : " + reason);
              })
              .finally(() => {
                cnx.stop();
              })
          }).catch(reason => {
            reject("Connection error : " + reason);
          })
        })
      }

      callPublishAccount(chainType: number, accountUuId: string) {
        return new Promise<number>((resolve, reject) => {
          const cnx = this.connection;
    
          cnx.start().then(() => {
            this.logEvent("publishAccount - call", { 'chainType': chainType, 'accountUuId': accountUuId });
            cnx.invoke<number>("PublishAccount", chainType, accountUuId)
              .then(
                response => {
                  this.logEvent("publishAccount - response", response);
                  resolve(response);
                })
              .catch(reason => {
                reject("publishAccount error : " + reason);
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