import { CommonCall } from "./commonCall";
import { LogService } from "../..//service/log.service";
import { HubConnection } from "@aspnet/signalr";
import { SystemInfo } from "../..//model/systemInfo";

export class ServerCall extends CommonCall {

    private constructor(
        connection: HubConnection,
        logService: LogService) {
        super(connection, logService)
    }

    static create(
        connection: HubConnection,
        logService: LogService) {
        return new ServerCall(connection, logService)
    }

    callServerShutdown(): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
          const cnx = this.connection;
    
          cnx.start().then(() => {
            this.logEvent("shutdown - call", null);
            cnx.invoke<boolean>("shutdown")
              .then(
                response => {
                  this.logEvent("shutdown - response", response);
                  resolve(response);
                })
              .catch(reason => {
                reject("shutdown error : " + reason);
              })
              .finally(() => {
                cnx.stop();
              })
          }).catch(reason => {
            reject("Connection error : " + reason);
          })
        })
      }

      callQuerySystemVersion() {
        return new Promise<SystemInfo>((resolve, reject) => {
          const cnx = this.connection;
    
          cnx.start().then(() => {
            this.logEvent("QuerySystemInfo - call", null);
            cnx.invoke<SystemInfo>("QuerySystemInfo")
              .then(
                response => {
                  this.logEvent("QuerySystemInfo - response", response);
                  resolve(response);
                })
              .catch(reason => {
                reject("QuerySystemInfo error : " + reason);
              })
              .finally(() => {
                cnx.stop();
              })
          }).catch(reason => {
            reject("Connection error : " + reason);
          })
        });
      }

      callQueryTotalConnectedPeersCount() {
        return new Promise<number>((resolve, reject) => {
          const cnx = this.connection;
    
          cnx.start().then(() => {
            this.logEvent("QueryTotalConnectedPeersCount - call", null);
            cnx.invoke<number>("QueryTotalConnectedPeersCount")
              .then(
                response => {
                  this.logEvent("QueryTotalConnectedPeersCount - response", response);
                  resolve(response);
                })
              .catch(reason => {
                reject("QueryTotalConnectedPeersCount error : " + reason);
              })
              .finally(() => {
                cnx.stop();
              })
          }).catch(reason => {
            reject("Connection error : " + reason);
          })
        });
      }

      callCompleteLongRunningEvent(correlationId: number) {
        return new Promise<boolean>((resolve, reject) => {
          const cnx = this.connection;
    
          cnx.start().then(() => {
            this.logEvent("completeLongRunningEvent - call", { 'correlationId': correlationId });
            cnx.invoke<boolean>("completeLongRunningEvent", correlationId)
              .then(
                response => {
                  this.logEvent("completeLongRunningEvent - response", response);
                  resolve(response);
                })
              .catch(reason => {
                reject("CompleteLongRunningEvent error : " + reason);
              })
              .finally(() => {
                cnx.stop();
              })
          }).catch(reason => {
            reject("Connection error : " + reason);
          })
        });
      }

      callRenewLongRunningEvent(correlationId: number) {
        return new Promise<boolean>((resolve, reject) => {
          const cnx = this.connection;
    
          cnx.start().then(() => {
            this.logEvent("renewLongRunningEvent - call", { 'correlationId': correlationId });
            cnx.invoke<boolean>("renewLongRunningEvent", correlationId)
              .then(
                response => {
                  this.logEvent("renewLongRunningEvent - response", response);
                  resolve(response);
                })
              .catch(reason => {
                reject("RenewLongRunningEvent error : " + reason);
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