import { CommonCall } from "./commonCall";
import { LogService } from "../..//service/log.service";
import { ServerConnectionService } from '../..//service/server-connection.service';
import { BlockchainInfo, BlockInfo, DigestInfo } from "../..//model/blockchain-info";
import { WalletAccountStatus } from "../..//model/walletAccount";

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

            this.logEvent("QueryBlockChainInfo - call", { chainType });
            this.serviceConnectionService.invoke<BlockchainInfo>("QueryBlockChainInfo", chainType)
              .then(
                account => {
                  this.logEvent("QueryBlockChainInfo - response", account);
                  var blockId: number = account["blockId"];
                  var blockHash: string = account["blockHash"];
                  var publicBlockId: number = <WalletAccountStatus>account["publicBlockId"];
                  var blockTimestamp = new Date(account["blockTimestamp"]);
                  var blockLifespan: number = account["blockLifespan"];
                  var digestId: number = account["digestId"];
                  var digestHash: string = account["digestHash"];
                  var digestBlockId: number = account["digestBlockId"];
                  var digestTimestamp: Date = new Date(account["digestTimestamp"]);
                  var publicDigestId: number = account["publicDigestId"];
    
                  var blockInfo = BlockInfo.create(blockId, blockTimestamp, blockHash, publicBlockId, blockLifespan);
                  var digestInfo = DigestInfo.create(digestId, digestBlockId, digestTimestamp, digestHash, publicDigestId);
    
                  var blockchainInfo = BlockchainInfo.create(blockInfo, digestInfo);
                  resolve(blockchainInfo);
                })
              .catch(reason => {
                reject("QueryBlockChainInfo error : " + reason);
              });
        });
      }

      callQuerySupportedChains() {
        return new Promise<Array<object>>((resolve, reject) => {

            this.logEvent("querySupportedChains - call", null);
            this.serviceConnectionService.invoke<Array<object>>("QuerySupportedChains")
              .then(
                response => {
                  this.logEvent("querySupportedChains - response", response);
                  resolve(response);
                })
              .catch(reason => {
                reject("QuerySupportedChains error : " + reason);
              });
          });
      }

      callQueryChainStatus(chainType: number) {
        return new Promise<object>((resolve, reject) => {

            this.logEvent("queryChainStatus - call", { 'chainType': chainType });
            this.serviceConnectionService.invoke<object>("QueryChainStatus", chainType)
              .then(
                response => {
                  this.logEvent("queryChainStatus - response", response);
                  resolve(response);
                })
              .catch(reason => {
                reject("QueryChainStatus error : " + reason);
              });
          });
      }

      callQueryBlockchainSynced(chainType: number) {
        return new Promise<boolean>((resolve, reject) => {

            this.logEvent("QueryBlockchainSynced - call", { 'chainType': chainType });
            this.serviceConnectionService.invoke<boolean>("QueryBlockchainSynced", chainType)
              .then(
                response => {
                  this.logEvent("QueryBlockchainSynced - response", response);
                  resolve(response);
                })
              .catch(reason => {
                reject("QueryBlockchainSynced error : " + reason);
              });
          });
      }

      callQueryBlockHeight(chainType: number) {
        return new Promise<number>((resolve, reject) => {

            this.logEvent("queryBlockHeight - call", { 'chainType': chainType });
            this.serviceConnectionService.invoke<number>("QueryBlockHeight", chainType)
              .then(
                response => {
                  this.logEvent("queryBlockHeight - response", response);
                  resolve(response);
                })
              .catch(reason => {
                reject("QueryBlockHeight error : " + reason);
              });
          });
      }

      callIsBlockchainSynced(chainType: number) {
        return new Promise<boolean>((resolve, reject) => {
            this.logEvent("isBlockchainSynced - call", { 'chainType': chainType });
            this.serviceConnectionService.invoke<boolean>("IsBlockchainSynced", chainType)
              .then(
                response => {
                  this.logEvent("isBlockchainSynced - response", response);
                  resolve(response);
                })
              .catch(reason => {
                reject("isBlockchainSynced error : " + reason);
              });
          });
      }
}