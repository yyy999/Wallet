import { CommonCall } from "./commonCall";
import { LogService } from "../..//service/log.service";
import { HubConnection } from "@aspnet/signalr";
import { BlockchainInfo, BlockInfo, DigestInfo } from "../..//model/blockchain-info";
import { WalletAccountStatus } from "../..//model/walletAccount";

export class BlockchainCall extends CommonCall {

    private constructor(
        connection: HubConnection,
        logService: LogService) {
        super(connection, logService)
    }

    static create(
        connection: HubConnection,
        logService: LogService) {
        return new BlockchainCall(connection, logService)
    }

    callQueryBlockChainInfo(chainType: number) {
        return new Promise<BlockchainInfo>((resolve, reject) => {
          const cnx = this.connection;
    
          cnx.start().then(() => {
            this.logEvent("QueryBlockChainInfo - call", { chainType });
            cnx.invoke<BlockchainInfo>("QueryBlockChainInfo", chainType)
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
              })
              .finally(() => {
                cnx.stop();
              })
          }).catch(reason => {
            reject("Connection error : " + reason);
          })
        });
      }

      callQuerySupportedChains() {
        return new Promise<Array<object>>((resolve, reject) => {
          const cnx = this.connection;
    
          cnx.start().then(() => {
            this.logEvent("querySupportedChains - call", null);
            cnx.invoke<Array<object>>("querySupportedChains")
              .then(
                response => {
                  this.logEvent("querySupportedChains - response", response);
                  resolve(response);
                })
              .catch(reason => {
                reject("QuerySupportedChains error : " + reason);
              })
              .finally(() => {
                cnx.stop();
              })
          }).catch(reason => {
            reject("Connection error : " + reason);
          })
        });
      }

      callQueryChainStatus(chainType: number) {
        return new Promise<object>((resolve, reject) => {
          const cnx = this.connection;
    
          cnx.start().then(() => {
            this.logEvent("queryChainStatus - call", { 'chainType': chainType });
            cnx.invoke<object>("queryChainStatus", chainType)
              .then(
                response => {
                  this.logEvent("queryChainStatus - response", response);
                  resolve(response);
                })
              .catch(reason => {
                reject("QueryChainStatus error : " + reason);
              })
              .finally(() => {
                cnx.stop();
              })
          }).catch(reason => {
            reject("Connection error : " + reason);
          })
        });
      }

      callQueryBlockchainSynced(chainType: number) {
        return new Promise<boolean>((resolve, reject) => {
          const cnx = this.connection;
    
          cnx.start().then(() => {
            this.logEvent("QueryBlockchainSynced - call", { 'chainType': chainType });
            cnx.invoke<boolean>("QueryBlockchainSynced", chainType)
              .then(
                response => {
                  this.logEvent("QueryBlockchainSynced - response", response);
                  resolve(response);
                })
              .catch(reason => {
                reject("QueryBlockchainSynced error : " + reason);
              })
              .finally(() => {
                cnx.stop();
              })
          }).catch(reason => {
            reject("Connection error : " + reason);
          })
        });
      }

      callQueryBlockHeight(chainType: number) {
        return new Promise<number>((resolve, reject) => {
          const cnx = this.connection;
    
          cnx.start().then(() => {
            this.logEvent("queryBlockHeight - call", { 'chainType': chainType });
            cnx.invoke<number>("queryBlockHeight", chainType)
              .then(
                response => {
                  this.logEvent("queryBlockHeight - response", response);
                  resolve(response);
                })
              .catch(reason => {
                reject("QueryBlockHeight error : " + reason);
              })
              .finally(() => {
                cnx.stop();
              })
          }).catch(reason => {
            reject("Connection error : " + reason);
          })
        });
      }

      callIsBlockchainSynced(chainType: number) {
        return new Promise<boolean>((resolve, reject) => {
          const cnx = this.connection;
    
          cnx.start().then(() => {
            this.logEvent("isBlockchainSynced - call", { 'chainType': chainType });
            cnx.invoke<boolean>("IsBlockchainSynced", chainType)
              .then(
                response => {
                  this.logEvent("isBlockchainSynced - response", response);
                  resolve(response);
                })
              .catch(reason => {
                reject("isBlockchainSynced error : " + reason);
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