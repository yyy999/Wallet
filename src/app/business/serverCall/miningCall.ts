import { CommonCall } from "./commonCall";
import { LogService } from "../..//service/log.service";
import { HubConnection } from "@aspnet/signalr";
import { MiningHistory } from "../..//model/mining-history";

export class MiningCall extends CommonCall {

  private constructor(
    connection: HubConnection,
    logService: LogService) {
    super(connection, logService)
  }

  static create(
    connection: HubConnection,
    logService: LogService) {
    return new MiningCall(connection, logService)
  }

  callStartMining(chainType: number, delegateAccountId: string) {
    return new Promise<boolean>((resolve, reject) => {
      const cnx = this.connection;

      cnx.start().then(() => {
        this.logEvent("StartMining - call", { 'chainType': chainType, 'delegateAccountId': delegateAccountId });
        cnx.invoke<boolean>("startMining", chainType, delegateAccountId)
          .then(
            response => {
              this.logEvent("StartMining - response", response);
              resolve(response);
            })
          .catch(reason => {
            reject("StartMining error : " + reason);
          })
          .finally(() => {
            cnx.stop();
          })
      }).catch(reason => {
        reject("Connection error : " + reason);
      })
    });
  }

  callStopMining(chainType: number) {
    return new Promise<boolean>((resolve, reject) => {
      const cnx = this.connection;

      cnx.start().then(() => {
        this.logEvent("StopMining - call", { 'chainType': chainType });
        cnx.invoke<boolean>("stopMining", chainType)
          .then(
            response => {
              this.logEvent("StopMining - response", response);
              resolve(response);
            })
          .catch(reason => {
            reject("StopMining error : " + reason);
          })
          .finally(() => {
            cnx.stop();
          })
      }).catch(reason => {
        reject("Connection error : " + reason);
      })
    });
  }

  callIsMiningEnabled(chainType: number) {
    return new Promise<boolean>((resolve, reject) => {
      const cnx = this.connection;

      cnx.start().then(() => {
        this.logEvent("IsMiningEnabled - call", { 'chainType': chainType });
        cnx.invoke<boolean>("IsMiningEnabled", chainType)
          .then(
            response => {
              this.logEvent("IsMiningEnabled - response", response);
              resolve(response);
            })
          .catch(reason => {
            reject("IsMiningEnabled error : " + reason);
          })
          .finally(() => {
            cnx.stop();
          })
      }).catch(reason => {
        reject("Connection error : " + reason);
      })
    });
  }

  callQueryMiningHistory(chainType: number) {
    return new Promise<Array<MiningHistory>>((resolve, reject) => {
      const cnx = this.connection;

      cnx.start().then(() => {
        this.logEvent("QueryMiningHistory - call", { 'chainType': chainType });
        cnx.invoke<Array<object>>("QueryMiningHistory", chainType)
          .then(
            response => {
              this.logEvent("QueryMiningHistory - response", response);
              var miningHistoryList = new Array<MiningHistory>();
              response.forEach(miningHistory => {
                try {
                  var blockId = <number>miningHistory["blockId"];
                  var transactionIds = <Array<string>>miningHistory["transactionIds"];
                  var bountyShare = <number>miningHistory["bountyShare"];
                  var transactionTips = <number>miningHistory["transactionTips"];
                  miningHistoryList.push(MiningHistory.create(blockId, transactionIds, bountyShare, transactionTips));
                } catch (error) {
                  this.logEvent("Cannot use mining hitory data.", miningHistory);
                }
              })
              resolve(miningHistoryList);
            })
          .catch(reason => {
            reject("QueryMiningHistory error : " + reason);
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