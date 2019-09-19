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

            this.logEvent("shutdown - call", null);
            this.connection.invoke<boolean>("Shutdown")
              .then(
                response => {
                  this.logEvent("shutdown - response", response);
                  resolve(response);
                })
              .catch(reason => {
                reject("shutdown error : " + reason);
              });
          });
      }

      callQuerySystemVersion() {
        return new Promise<SystemInfo>((resolve, reject) => {

            this.logEvent("QuerySystemInfo - call", null);
            this.connection.invoke<SystemInfo>("QuerySystemInfo")
              .then(
                response => {
                  this.logEvent("QuerySystemInfo - response", response);
                  resolve(response);
                })
              .catch(reason => {
                reject("QuerySystemInfo error : " + reason);
              });
          });
      }

      callQueryTotalConnectedPeersCount() {
        return new Promise<number>((resolve, reject) => {

            this.logEvent("QueryTotalConnectedPeersCount - call", null);
            this.connection.invoke<number>("QueryTotalConnectedPeersCount")
              .then(
                response => {
                  this.logEvent("QueryTotalConnectedPeersCount - response", response);
                  resolve(response);
                })
              .catch(reason => {
                reject("QueryTotalConnectedPeersCount error : " + reason);
              });
          });
      }

      callCompleteLongRunningEvent(correlationId: number) {
        return new Promise<boolean>((resolve, reject) => {

            this.logEvent("completeLongRunningEvent - call", { 'correlationId': correlationId });
            this.connection.invoke<boolean>("CompleteLongRunningEvent", correlationId)
              .then(
                response => {
                  this.logEvent("completeLongRunningEvent - response", response);
                  resolve(response);
                })
              .catch(reason => {
                reject("CompleteLongRunningEvent error : " + reason);
              });
          });
      }

      callRenewLongRunningEvent(correlationId: number) {
        return new Promise<boolean>((resolve, reject) => {

            this.logEvent("renewLongRunningEvent - call", { 'correlationId': correlationId });
            this.connection.invoke<boolean>("RenewLongRunningEvent", correlationId)
              .then(
                response => {
                  this.logEvent("renewLongRunningEvent - response", response);
                  resolve(response);
                })
              .catch(reason => {
                reject("RenewLongRunningEvent error : " + reason);
              });
          });
      }
}