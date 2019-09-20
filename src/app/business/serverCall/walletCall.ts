import { CommonCall } from "./commonCall";
import { LogService } from "../..//service/log.service";
import { HubConnection } from "@aspnet/signalr";
import { WalletCreation } from "../..//model/wallet";
import { WalletAccount, WalletAccountStatus, WalletAccountType } from "../..//model/walletAccount";

export class WalletCall extends CommonCall {

    private constructor(
        connection: HubConnection,
        logService: LogService) {
        super(connection, logService)
    }

    static create(
        connection: HubConnection,
        logService: LogService) {
        return new WalletCall(connection, logService)
    }

    callCreateNewWallet(chainType: number, wallet: WalletCreation): Promise<number> {
        return new Promise<number>((resolve, reject) => {

            this.logEvent("callCreateNewWallet - call", { 'chainType': chainType, 'wallet': wallet });
            this.connection.invoke<number>("CreateNewWallet", chainType, wallet.friendlyName, wallet.encryptWallet, wallet.encryptKey, wallet.encryptKeysIndividualy, wallet.passPhrases, wallet.publishAccount)
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

      callSetWalletPassphrase(correlationId: number, password: string) {
        return new Promise<number>((resolve, reject) => {

            this.logEvent("setWalletPassphrase - call", { 'correlationId': correlationId, 'password': password });
            this.connection.invoke<number>("SetWalletPassphrase", correlationId, password)
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
            this.connection.invoke<number>("SetKeysPassphrase", correlationId, password)
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
            this.connection.invoke<Array<WalletAccount>>("QueryWalletAccounts", chainType)
              .then(
                response => {
                  this.logEvent("queryWalletAccounts - response", response);
                  var walletAccounts = new Array<WalletAccount>();
                  response.forEach(account => {
                    var accountUuid: string = account.AccountUuid;
                    var accountId: string = <string>account.AccountId;
                    var status: number = <WalletAccountStatus>account.Status;
                    var friendlyName: string = account.FriendlyName;
                    var isActive: boolean = <boolean>account.IsActive;
                    var walletAccount = WalletAccount.createNew(accountUuid, accountId, status, 0, 1, friendlyName, false, isActive);
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
            this.connection.invoke<Array<WalletAccount>>("QueryWalletAccountDetails", chainType, accountUuid)
              .then(
                account => {
                  this.logEvent("QueryWalletAccountDetails - response", account);
                  var accountUuid: string = account["AccountUuid"];
                  var accountId: string = account["AccountId"];
                  var status: number = <WalletAccountStatus>account["Status"];
                  var declarationBlockId = <number>account["DeclarationBlockid"];
                  var accountType = <WalletAccountType>account["AccountType"];
                  var friendlyName: string = account["FriendlyName"];
                  var isEncrypted: boolean = <boolean>account["KeysEncrypted"];
                  var isActive: boolean = <boolean>account["IsActive"];
                  var accountHash = account["AccountHash"];
                  var trustLevel = account["TrustLevel"];
                  var walletAccount = WalletAccount.createNew(accountUuid, accountId, status, declarationBlockId, accountType, friendlyName, isEncrypted, isActive, accountHash, trustLevel);
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
            this.connection.invoke<boolean>("QueryWalletSynced", chainType)
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
            this.connection.invoke<boolean>("IsWalletLoaded", chainType)
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
            this.connection.invoke<boolean>("WalletExists", chainType)
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

      callLoadWallet(chainType: number) {
        return new Promise<number>((resolve, reject) => {

            this.logEvent("loadWallet - call", { 'chainType': chainType });
            this.connection.invoke<number>("LoadWallet", chainType)
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
            this.connection.invoke<boolean>("IsWalletSynced", chainType)
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