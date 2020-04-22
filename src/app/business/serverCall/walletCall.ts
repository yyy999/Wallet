import { CommonCall } from "./commonCall";
import { LogService } from "../..//service/log.service";
import { ServerConnectionService } from '../..//service/server-connection.service';
import { WalletCreation } from "../..//model/wallet";
import { WalletAccount, WalletAccountStatus, WalletaccountType } from "../..//model/walletAccount";

export class WalletCall extends CommonCall {

    private constructor(
      protected serviceConnectionService : ServerConnectionService,
        logService: LogService) {
        super(serviceConnectionService, logService)
    }

    static create(
      serviceConnectionService : ServerConnectionService,
        logService: LogService) {
        return new WalletCall(serviceConnectionService, logService);
    }

    callCreateNewWallet(chainType: number, wallet: WalletCreation): Promise<number> {
        return new Promise<number>((resolve, reject) => {

            this.logEvent("callCreateNewWallet - call", { 'chainType': chainType, 'wallet': wallet });
            this.serviceConnectionService.invoke<number>("CreateNewWallet", chainType, wallet.friendlyName, wallet.encryptWallet, wallet.encryptKey, wallet.encryptKeysIndividualy, wallet.passPhrases, wallet.publishAccount)
              .then(
                response => {
                  this.logEvent("callCreateNewWallet - response", response);
                  resolve(response);
                })
              .catch(reason => {
                reject("CreateNewWallet error : " + reason);
              });
          });
      }

      callSetWalletPassphrase(correlationId: number, password: string, setKeysToo: boolean) {
        return new Promise<number>((resolve, reject) => {

            this.logEvent("setWalletPassphrase - call", { 'correlationId': correlationId, 'password': password, 'setKeysToo': setKeysToo });
            this.serviceConnectionService.invoke<number>("SetWalletPassphrase", correlationId, password, setKeysToo)
              .then(
                response => {
                  this.logEvent("setWalletPassphrase - response", response);
                  resolve(response);
                })
              .catch(reason => {
                reject("SetWalletPassphrase error : " + reason);
              });
          });
      }

      callSetKeysPassphrase(correlationId: number, password: string) {
        return new Promise<number>((resolve, reject) => {

            this.logEvent("setKeysPassphrase - call", { 'correlationId': correlationId, 'password': password });
            this.serviceConnectionService.invoke<number>("SetKeysPassphrase", correlationId, password)
              .then(
                response => {
                  this.logEvent("setKeysPassphrase - response", response);
                  resolve(response);
                })
              .catch(reason => {
                reject("SetKeysPassphrase error : " + reason);
              });
          });
      }

      callQueryWalletAccounts(chainType: number) {
        return new Promise<Array<WalletAccount>>((resolve, reject) => {
 
            this.logEvent("queryWalletAccounts - call", { 'chainType': chainType });
            this.serviceConnectionService.invoke<Array<WalletAccount>>("QueryWalletAccounts", chainType)
              .then(
                response => {
                  this.logEvent("queryWalletAccounts - response", response);
                  var walletAccounts = new Array<WalletAccount>();
                  response.forEach(account => {
                    var accountUuid: string = account.accountUuid;
                    var accountId: string = <string>account.accountId;
                    var status: number = <WalletAccountStatus>account.status;
                    var correlated: boolean = <boolean>account.correlated;
                    var friendlyName: string = account.friendlyName;
                    var isActive: boolean = <boolean>account.isActive;
                    var walletAccount = WalletAccount.createNew(accountUuid, accountId, status, 0, correlated, 1, friendlyName, false, isActive);
                    walletAccounts.push(walletAccount);
                  })
                  resolve(walletAccounts);
                })
              .catch(reason => {
                reject("QueryWalletAccounts error : " + reason);
              });
          });
      }

      callQueryWalletAccountDetails(chainType: number, accountUuid: string) {
        return new Promise<WalletAccount>((resolve, reject) => {

            this.logEvent("QueryWalletAccountDetails - call", { chainType, accountUuid });
            this.serviceConnectionService.invoke<Array<WalletAccount>>("QueryWalletAccountDetails", chainType, accountUuid)
              .then(
                account => {
                  this.logEvent("QueryWalletAccountDetails - response", account);
                  var accountUuid: string = account["accountUuid"];
                  var accountId: string = account["accountId"];
                  var status: number = <WalletAccountStatus>account["status"];
                  var declarationBlockId = <number>account["declarationBlockid"];
                  var correlated = <boolean>account["correlated"];
                  var accountType = <WalletaccountType>account["accountType"];
                  var friendlyName: string = account["friendlyName"];
                  var isEncrypted: boolean = <boolean>account["keysEncrypted"];
                  var isActive: boolean = <boolean>account["isActive"];
                  var accountHash = account["accountHash"];
                  var trustLevel = account["trustLevel"];
                  var walletAccount = WalletAccount.createNew(accountUuid, accountId, status, declarationBlockId, correlated, accountType, friendlyName, isEncrypted, isActive, accountHash, trustLevel);
                  resolve(walletAccount);
                })
              .catch(reason => {
                reject("QueryWalletAccountDetails error : " + reason);
              });
          })
      }

      callQueryWalletSynced(chainType: number) {
        return new Promise<boolean>((resolve, reject) => {

            this.logEvent("QueryWalletSynced - call", { 'chainType': chainType });
            this.serviceConnectionService.invoke<boolean>("QueryWalletSynced", chainType)
              .then(
                response => {
                  this.logEvent("QueryWalletSynced - response", response);
                  resolve(response);
                })
              .catch(reason => {
                reject("QueryWalletSynced error : " + reason);
              });
          });
      }

      callIsWalletLoaded(chainType: number) {
        return new Promise<boolean>((resolve, reject) => {

            this.logEvent("isWalletLoaded - call", { 'chainType': chainType });
            this.serviceConnectionService.invoke<boolean>("IsWalletLoaded", chainType)
              .then(
                response => {
                  this.logEvent("isWalletLoaded - response", response);
                  resolve(response);
                })
              .catch(reason => {
                reject("IsWalletLoaded error : " + reason);
              });
          });
      }

      callWalletExists(chainType: number) {
        return new Promise<boolean>((resolve, reject) => {

            this.logEvent("walletExists - call", { 'chainType': chainType });
            this.serviceConnectionService.invoke<boolean>("WalletExists", chainType)
              .then(
                response => {
                  this.logEvent("walletExists - response", response);
                  resolve(response);
                })
              .catch(reason => {
                reject("WalletExists error : " + reason);
              });
          });
      }

      callLoadWallet(chainType: number, passphrase : string) {
        return new Promise<number>((resolve, reject) => {

            this.logEvent("loadWallet - call", { 'chainType': chainType });
            this.serviceConnectionService.invoke<number>("LoadWallet", chainType, passphrase)
              .then(
                response => {
                  this.logEvent("loadWallet - response", response);
                  resolve(response);
                })
              .catch(reason => {
                reject("LoadWallet error : " + reason);
              });
          });
      }

      callIsWalletSynced(chainType: number) {
        return new Promise<boolean>((resolve, reject) => {

            this.logEvent("isWalletSynced - call", { 'chainType': chainType });
            this.serviceConnectionService.invoke<boolean>("IsWalletSynced", chainType)
              .then(
                response => {
                  this.logEvent("isWalletSynced - response", response);
                  resolve(response);
                })
              .catch(reason => {
                reject("isWalletSynced error : " + reason);
              });
          });
      }
}