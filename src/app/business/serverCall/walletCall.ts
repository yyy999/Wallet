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
          const cnx = this.connection;
    
          cnx.start().then(() => {
            this.logEvent("callCreateNewWallet - call", { 'chainType': chainType, 'wallet': wallet });
            cnx.invoke<number>("createNewWallet", chainType, wallet.friendlyName, wallet.encryptWallet, wallet.encryptKey, wallet.encryptKeysIndividualy, wallet.passPhrasesAsDictionary, wallet.publishAccount)
              .then(
                response => {
                  this.logEvent("callCreateNewWallet - response", response);
                  resolve(response);
                })
              .catch(reason => {
                reject("CreateNewWallet error : " + reason);
              })
              .finally(() => {
                cnx.stop();
              })
          }).catch(reason => {
            reject("Connection error : " + reason);
          })
        });
      }

      callSetWalletPassphrase(correlationId: number, password: string) {
        return new Promise<number>((resolve, reject) => {
          const cnx = this.connection;
    
          cnx.start().then(() => {
            this.logEvent("setWalletPassphrase - call", { 'correlationId': correlationId, 'password': password });
            cnx.invoke<number>("setWalletPassphrase", correlationId, password)
              .then(
                response => {
                  this.logEvent("setWalletPassphrase - response", response);
                  resolve(response);
                })
              .catch(reason => {
                reject("SetWalletPassphrase error : " + reason);
              })
              .finally(() => {
                cnx.stop();
              })
          }).catch(reason => {
            reject("Connection error : " + reason);
          })
        });
      }

      callSetKeysPassphrase(correlationId: number, password: string) {
        return new Promise<number>((resolve, reject) => {
          const cnx = this.connection;
    
          cnx.start().then(() => {
            this.logEvent("setKeysPassphrase - call", { 'correlationId': correlationId, 'password': password });
            cnx.invoke<number>("setKeysPassphrase", correlationId, password)
              .then(
                response => {
                  this.logEvent("setKeysPassphrase - response", response);
                  resolve(response);
                })
              .catch(reason => {
                reject("SetKeysPassphrase error : " + reason);
              })
              .finally(() => {
                cnx.stop();
              })
          }).catch(reason => {
            reject("Connection error : " + reason);
          })
        });
      }

      callQueryWalletAccounts(chainType: number) {
        return new Promise<Array<WalletAccount>>((resolve, reject) => {
          const cnx = this.connection;
    
          cnx.start().then(() => {
            this.logEvent("queryWalletAccounts - call", { 'chainType': chainType });
            cnx.invoke<Array<WalletAccount>>("queryWalletAccounts", chainType)
              .then(
                response => {
                  this.logEvent("queryWalletAccounts - response", response);
                  var walletAccounts = new Array<WalletAccount>();
                  response.forEach(account => {
                    var accountUuid: string = account.accountUuid;
                    var accountId: string = <string>account.accountId;
                    var status: number = <WalletAccountStatus>account.status;
                    var friendlyName: string = account.friendlyName;
                    var isActive: boolean = <boolean>account.isActive;
                    var walletAccount = WalletAccount.createNew(accountUuid, accountId, status, 0, 1, friendlyName, false, isActive);
                    walletAccounts.push(walletAccount);
                  })
                  resolve(walletAccounts);
                })
              .catch(reason => {
                reject("QueryWalletAccounts error : " + reason);
              })
              .finally(() => {
                cnx.stop();
              })
          }).catch(reason => {
            reject("Connection error : " + reason);
          })
        });
      }

      callQueryWalletAccountDetails(chainType: number, accountUuid: string) {
        return new Promise<WalletAccount>((resolve, reject) => {
          const cnx = this.connection;
    
          cnx.start().then(() => {
            this.logEvent("QueryWalletAccountDetails - call", { chainType, accountUuid });
            cnx.invoke<Array<WalletAccount>>("QueryWalletAccountDetails", chainType, accountUuid)
              .then(
                account => {
                  this.logEvent("QueryWalletAccountDetails - response", account);
                  var accountUuid: string = account["accountUuid"];
                  var accountId: string = account["accountId"];
                  var status: number = <WalletAccountStatus>account["status"];
                  var declarationBlockId = <number>account["declarationBlockid"];
                  var accountType = <WalletAccountType>account["accountType"];
                  var friendlyName: string = account["friendlyName"];
                  var isEncrypted: boolean = <boolean>account["keysEncrypted"];
                  var isActive: boolean = <boolean>account["isActive"];
                  var accountHash = account["accountHash"];
                  var trustLevel = account["trustLevel"];
                  var walletAccount = WalletAccount.createNew(accountUuid, accountId, status, declarationBlockId, accountType, friendlyName, isEncrypted, isActive, accountHash, trustLevel);
                  resolve(walletAccount);
                })
              .catch(reason => {
                reject("QueryWalletAccountDetails error : " + reason);
              })
              .finally(() => {
                cnx.stop();
              })
          }).catch(reason => {
            reject("Connection error : " + reason);
          })
        });
      }

      callQueryWalletSynced(chainType: number) {
        return new Promise<boolean>((resolve, reject) => {
          const cnx = this.connection;
    
          cnx.start().then(() => {
            this.logEvent("QueryWalletSynced - call", { 'chainType': chainType });
            cnx.invoke<boolean>("QueryWalletSynced", chainType)
              .then(
                response => {
                  this.logEvent("QueryWalletSynced - response", response);
                  resolve(response);
                })
              .catch(reason => {
                reject("QueryWalletSynced error : " + reason);
              })
              .finally(() => {
                cnx.stop();
              })
          }).catch(reason => {
            reject("Connection error : " + reason);
          })
        });
      }

      callIsWalletLoaded(chainType: number) {
        return new Promise<boolean>((resolve, reject) => {
          const cnx = this.connection;
    
          cnx.start().then(() => {
            this.logEvent("isWalletLoaded - call", { 'chainType': chainType });
            cnx.invoke<boolean>("isWalletLoaded", chainType)
              .then(
                response => {
                  this.logEvent("isWalletLoaded - response", response);
                  resolve(response);
                })
              .catch(reason => {
                reject("IsWalletLoaded error : " + reason);
              })
              .finally(() => {
                cnx.stop();
              })
          }).catch(reason => {
            reject("Connection error : " + reason);
          })
        });
      }

      callWalletExists(chainType: number) {
        return new Promise<boolean>((resolve, reject) => {
          const cnx = this.connection;
    
          cnx.start().then(() => {
            this.logEvent("walletExists - call", { 'chainType': chainType });
            cnx.invoke<boolean>("walletExists", chainType)
              .then(
                response => {
                  this.logEvent("walletExists - response", response);
                  resolve(response);
                })
              .catch(reason => {
                reject("WalletExists error : " + reason);
              })
              .finally(() => {
                cnx.stop();
              })
          }).catch(reason => {
            reject("Connection error : " + reason);
          })
        });
      }

      callLoadWallet(chainType: number) {
        return new Promise<number>((resolve, reject) => {
          const cnx = this.connection;
    
          cnx.start().then(() => {
            this.logEvent("loadWallet - call", { 'chainType': chainType });
            cnx.invoke<number>("loadWallet", chainType)
              .then(
                response => {
                  this.logEvent("loadWallet - response", response);
                  resolve(response);
                })
              .catch(reason => {
                reject("LoadWallet error : " + reason);
              })
              .finally(() => {
                cnx.stop();
              })
          }).catch(reason => {
            reject("Connection error : " + reason);
          })
        });
      }

      callIsWalletSynced(chainType: number) {
        return new Promise<boolean>((resolve, reject) => {
          const cnx = this.connection;
    
          cnx.start().then(() => {
            this.logEvent("isWalletSynced - call", { 'chainType': chainType });
            cnx.invoke<boolean>("IsWalletSynced", chainType)
              .then(
                response => {
                  this.logEvent("isWalletSynced - response", response);
                  resolve(response);
                })
              .catch(reason => {
                reject("isWalletSynced error : " + reason);
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