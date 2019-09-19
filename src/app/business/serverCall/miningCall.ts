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

        this.logEvent("StartMining - call", { 'chainType': chainType, 'delegateAccountId': delegateAccountId });
        this.connection.invoke<boolean>("StartMining", chainType, delegateAccountId)
          .then(
            response => {
              this.logEvent("StartMining - response", response);
              resolve(response);
            })
          .catch(reason => {
            reject("StartMining error : " + reason);
          });
      });
  }

  callStopMining(chainType: number) {
    return new Promise<boolean>((resolve, reject) => {
  
        this.logEvent("StopMining - call", { 'chainType': chainType });
        this.connection.invoke<boolean>("StopMining", chainType)
          .then(
            response => {
              this.logEvent("StopMining - response", response);
              resolve(response);
            })
          .catch(reason => {
            reject("StopMining error : " + reason);
          });
      });
  }

  callIsMiningEnabled(chainType: number) {
    return new Promise<boolean>((resolve, reject) => {

        this.logEvent("IsMiningEnabled - call", { 'chainType': chainType });
        this.connection.invoke<boolean>("IsMiningEnabled", chainType)
          .then(
            response => {
              this.logEvent("IsMiningEnabled - response", response);
              resolve(response);
            })
          .catch(reason => {
            reject("IsMiningEnabled error : " + reason);
          });
      });
  }

  callQueryMiningHistory(chainType: number) {
    return new Promise<Array<MiningHistory>>((resolve, reject) => {

        this.logEvent("QueryMiningHistory - call", { 'chainType': chainType });
        this.connection.invoke<Array<object>>("QueryMiningHistory", chainType)
          .then(
            response => {
              this.logEvent("QueryMiningHistory - response", response);
              var miningHistoryList = new Array<MiningHistory>();
              response.forEach(miningHistory => {
                try {
                  var blockId = <number>miningHistory["BlockId"];
                  var transactionIds = <Array<string>>miningHistory["TransactionIds"];
                  var bountyShare = <number>miningHistory["BountyShare"];
                  var transactionTips = <number>miningHistory["TransactionTips"];
                  miningHistoryList.push(MiningHistory.create(blockId, transactionIds, bountyShare, transactionTips));
                } catch (error) {
                  this.logEvent("Cannot use mining hitory data.", miningHistory);
                }
              })
              resolve(miningHistoryList);
            })
          .catch(reason => {
            reject("QueryMiningHistory error : " + reason);
          });
      });
  }

  
}