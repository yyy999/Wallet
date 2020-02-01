import { CommonCall } from './commonCall';
import { LogService } from '../..//service/log.service';
import { ServerConnectionService } from '../..//service/server-connection.service';
import { MiningHistory } from '../..//model/mining-history';
import { EventTypes } from '../..//model/serverConnectionEvent';
import * as moment from 'moment';

export class MiningCall extends CommonCall {

  private constructor(
    protected serviceConnectionService: ServerConnectionService,
    logService: LogService) {
    super(serviceConnectionService, logService);
  }

  static create(
    serviceConnectionService: ServerConnectionService,
    logService: LogService) {
    return new MiningCall(serviceConnectionService, logService);
  }

  callStartMining(chainType: number, delegateAccountId: string) {
    return new Promise<boolean>((resolve, reject) => {

        this.logEvent('StartMining - call', { 'chainType': chainType, 'delegateAccountId': delegateAccountId });
        this.serviceConnectionService.invoke<boolean>('StartMining', chainType, delegateAccountId)
          .then(
            response => {
              this.logEvent('StartMining - response', response);
              resolve(response);
            })
          .catch(reason => {
            reject('StartMining error : ' + reason);
          });
      });
  }

  callStopMining(chainType: number) {
    return new Promise<boolean>((resolve, reject) => {

        this.logEvent('StopMining - call', { 'chainType': chainType });
        this.serviceConnectionService.invoke<boolean>('StopMining', chainType)
          .then(
            response => {
              this.logEvent('StopMining - response', response);
              resolve(response);
            })
          .catch(reason => {
            reject('StopMining error : ' + reason);
          });
      });
  }

  callIsMiningEnabled(chainType: number) {
    return new Promise<boolean>((resolve, reject) => {

        this.logEvent('IsMiningEnabled - call', { 'chainType': chainType });
        this.serviceConnectionService.invoke<boolean>('IsMiningEnabled', chainType)
          .then(
            response => {
              this.logEvent('IsMiningEnabled - response', response);
              resolve(response);
            })
          .catch(reason => {
            reject('IsMiningEnabled error : ' + reason);
          });
      });
  }

  callQueryMiningHistory(chainType: number, page: number, pageSize: number, maxLevel: number) {
    return new Promise<Array<MiningHistory>>((resolve, reject) => {

        this.logEvent('QueryMiningHistory - call', { 'chainType': chainType });
        this.serviceConnectionService.invoke<Array<object>>('QueryMiningHistory', chainType, page, pageSize, maxLevel)
          .then(
            response => {
              this.logEvent('QueryMiningHistory - response', response);
              const miningHistoryList = new Array<MiningHistory>();
              response.forEach(miningHistory => {
                try {
                  const blockId = <number>miningHistory['blockId'];
                  const transactionIds = <Array<string>>miningHistory['transactionIds'];
                  const bountyShare = <number>miningHistory['bountyShare'];
                  const transactionTips = <number>miningHistory['transactionTips'];

                  const message = <EventTypes>miningHistory['message'];
                  const timestamp = moment(miningHistory['timestamp']).toDate();
                  const level = <number>miningHistory['level'];
                  const parameters = <Array<Object>>miningHistory['parameters'];

                  miningHistoryList.push(MiningHistory.create(blockId, message, timestamp, level, parameters, transactionIds, bountyShare, transactionTips));
                } catch (error) {
                  this.logEvent('Cannot use mining hitory data.', miningHistory);
                }
              });
              resolve(miningHistoryList);
            })
          .catch(reason => {
            reject('QueryMiningHistory error : ' + reason);
          });
      });
  }


}
