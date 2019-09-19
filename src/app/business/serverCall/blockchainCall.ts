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

            this.logEvent("QueryBlockChainInfo - call", { chainType });
            this.connection.invoke<BlockchainInfo>("QueryBlockChainInfo", chainType)
              .then(
                account => {
                  this.logEvent("QueryBlockChainInfo - response", account);
                  var blockId: number = account["BlockId"];
                  var blockHash: string = account["BlockHash"];
                  var publicBlockId: number = <WalletAccountStatus>account["PublicBlockId"];
                  var blockTimestamp = new Date(account["BlockTimestamp"]);
                  var blockLifespan: number = account["BlockLifespan"];
                  var digestId: number = account["DigestId"];
                  var digestHash: string = account["DigestHash"];
                  var digestBlockId: number = account["DigestBlockId"];
                  var digestTimestamp: Date = new Date(account["DigestTimestamp"]);
                  var publicDigestId: number = account["PublicDigestId"];
    
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
            this.connection.invoke<Array<object>>("QuerySupportedChains")
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
            this.connection.invoke<object>("QueryChainStatus", chainType)
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
            this.connection.invoke<boolean>("QueryBlockchainSynced", chainType)
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
            this.connection.invoke<number>("QueryBlockHeight", chainType)
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
            this.connection.invoke<boolean>("IsBlockchainSynced", chainType)
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