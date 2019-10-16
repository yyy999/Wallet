import { CommonCall } from "./commonCall";
import { LogService } from "../..//service/log.service";
import { ServerConnectionService } from '../..//service/server-connection.service';
import { MiningHistory } from "../..//model/mining-history";

export class MiningCall extends CommonCall {

  private constructor(
    protected serviceConnectionService : ServerConnectionService,
    logService: LogService) {
    super(serviceConnectionService, logService)
  }

  static create(
    serviceConnectionService : ServerConnectionService,
    logService: LogService) {
    return new MiningCall(serviceConnectionService, logService)
  }

  callStartMining(chainType: number, delegateAccountId: string) {
    return new Promise<boolean>((resolve, reject) => {

        this.logEvent("StartMining - call", { 'chainType': chainType, 'delegateAccountId': delegateAccountId });
        this.serviceConnectionService.invoke<boolean>("StartMining", chainType, delegateAccountId)
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
        this.serviceConnectionService.invoke<boolean>("StopMining", chainType)
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
        this.serviceConnectionService.invoke<boolean>("IsMiningEnabled", chainType)
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
        this.serviceConnectionService.invoke<Array<object>>("QueryMiningHistory", chainType)
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
          });
      });
  }

  
}