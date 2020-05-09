import { CommonCall } from './commonCall';
import { LogService } from '../..//service/log.service';
import { ServerConnectionService } from '../..//service/server-connection.service';
import { BlockchainInfo, BlockInfo, DigestInfo } from '../..//model/blockchain-info';
import { WalletAccountStatus } from '../..//model/walletAccount';
import { ChainStatus, WalletInfo } from '../..//model/blockchain';
import moment, * as momentObj from 'moment';

export class BlockchainCall extends CommonCall {

    private constructor(
      protected serviceConnectionService : ServerConnectionService,
        logService: LogService) {
        super(serviceConnectionService, logService)
    }

    static create(
      serviceConnectionService : ServerConnectionService,
        logService: LogService) {
        return new BlockchainCall(serviceConnectionService, logService)
    }

    callQueryBlockChainInfo(chainType: number) {
        return new Promise<BlockchainInfo>((resolve, reject) => {

            this.logEvent('QueryBlockChainInfo - call', { chainType });
            this.serviceConnectionService.invoke<BlockchainInfo>('QueryBlockChainInfo', chainType)
              .then(
                account => {
                  this.logEvent('QueryBlockChainInfo - response', account);
                  let blockId: number = account['blockId'];
                  let blockHash: string = account['blockHash'];
                  let publicBlockId: number = <WalletAccountStatus>account['publicBlockId'];
                  let blockTimestamp:Date =  moment.utc(account['blockTimestamp']).toDate();
                  let blockLifespan: number = account['blockLifespan'];
                  let digestId: number = account['digestId'];
                  let digestHash: string = account['digestHash'];
                  let digestBlockId: number = account['digestBlockId'];
                  let digestTimestamp: Date =  moment.utc(account["digestTimestamp"]).toDate();
                  let publicDigestId: number = account['publicDigestId'];
    
                  let blockInfo = BlockInfo.create(blockId, blockTimestamp, blockHash, publicBlockId, blockLifespan);
                  let digestInfo = DigestInfo.create(digestId, digestBlockId, digestTimestamp, digestHash, publicDigestId);
    
                  let blockchainInfo = BlockchainInfo.create(blockInfo, digestInfo);
                  resolve(blockchainInfo);
                })
              .catch(reason => {
                reject('QueryBlockChainInfo error : ' + reason);
              });
        });
      }

      callQuerySupportedChains() {
        return new Promise<Array<object>>((resolve, reject) => {

            this.logEvent('querySupportedChains - call', null);
            this.serviceConnectionService.invoke<Array<object>>('QuerySupportedChains')
              .then(
                response => {
                  this.logEvent('querySupportedChains - response', response);
                  resolve(response);
                })
              .catch(reason => {
                reject('QuerySupportedChains error : ' + reason);
              });
          });
      }

      callQueryChainStatus(chainType: number) {
        return new Promise<ChainStatus>((resolve, reject) => {

            this.logEvent('queryChainStatus - call', { 'chainType': chainType });
            this.serviceConnectionService.invoke<ChainStatus>('QueryChainStatus', chainType)
              .then(
                response => {
                  this.logEvent('queryChainStatus - response', response);
                  resolve(response);
                })
              .catch(reason => {
                reject('QueryChainStatus error : ' + reason + '. chain type parameters: ' + chainType);
              });
          });
      }

      callQueryBlock(chainType: number, blockId:number){
        return new Promise<string>((resolve, reject) => {

          this.logEvent('queryBlock - call', { 'chainType': chainType, 'blockId' : blockId });
          this.serviceConnectionService.invoke<string>('QueryBlock', chainType, blockId)
            .then(
              response => {
                this.logEvent('queryBlock - response', response);
                resolve(response);
              })
            .catch(reason => {
              reject('QueryBlock error : ' + reason + '. chain type parameters: ' + chainType + 'blockId: ' + blockId);
            });
        });
      }

      callQueryWalletInfo(chainType: number) {
        return new Promise<WalletInfo>((resolve, reject) => {

            this.logEvent('queryWalletInfo - call', { 'chainType': chainType });
            this.serviceConnectionService.invoke<WalletInfo>('QueryWalletInfo', chainType)
              .then(
                response => {
                  this.logEvent('queryWalletInfo - response', response);
                  resolve(response);
                })
              .catch(reason => {
                reject('QueryWalletInfo error : ' + reason + '. chain type parameters: ' + chainType);
              });
          });
      }

      callQueryBlockchainSynced(chainType: number) {
        return new Promise<boolean>((resolve, reject) => {

            this.logEvent('QueryBlockchainSynced - call', { 'chainType': chainType });
            this.serviceConnectionService.invoke<boolean>('QueryBlockchainSynced', chainType)
              .then(
                response => {
                  this.logEvent('QueryBlockchainSynced - response', response);
                  resolve(response);
                })
              .catch(reason => {
                reject('QueryBlockchainSynced error : ' + reason);
              });
          });
      }

      callQueryBlockHeight(chainType: number) {
        return new Promise<number>((resolve, reject) => {

            this.logEvent('queryBlockHeight - call', { 'chainType': chainType });
            this.serviceConnectionService.invoke<number>('QueryBlockHeight', chainType)
              .then(
                response => {
                  this.logEvent('queryBlockHeight - response', response);
                  resolve(response);
                })
              .catch(reason => {
                reject('QueryBlockHeight error : ' + reason);
              });
          });
      }

      callIsBlockchainSynced(chainType: number) {
        return new Promise<boolean>((resolve, reject) => {
            this.logEvent('isBlockchainSynced - call', { 'chainType': chainType });
            this.serviceConnectionService.invoke<boolean>('IsBlockchainSynced', chainType)
              .then(
                response => {
                  this.logEvent('isBlockchainSynced - response', response);
                  resolve(response);
                })
              .catch(reason => {
                reject('isBlockchainSynced error : ' + reason);
              });
          });
      }
}