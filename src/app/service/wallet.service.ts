import { Injectable } from '@angular/core';
import { NO_WALLET, Wallet, WalletCreation, EncryptionKey } from '../model/wallet';
import { BehaviorSubject, Observable } from 'rxjs';
import { NEURALIUM_BLOCKCHAIN, SECURITY_BLOCKCHAIN, CONTRACT_BLOCKCHAIN, BlockChain } from '../model/blockchain';
import { SyncStatusService } from './sync-status.service';
import { SyncProcess, ProcessType } from '../model/syncProcess';
import { ServerConnectionService } from './server-connection.service';
import { WalletAccount, NO_WALLET_ACCOUNT } from '../model/walletAccount';
import { EventTypes } from '../model/serverConnectionEvent';

@Injectable({
  providedIn: 'root'
})
export class WalletService {
  selectedWallet: BehaviorSubject<Wallet> = new BehaviorSubject<Wallet>(NO_WALLET);
  wallets: Object = new Object();
  currentBlockchainId: number = 0;
  currentAccount: BehaviorSubject<WalletAccount> = new BehaviorSubject<WalletAccount>(NO_WALLET_ACCOUNT);

  constructor(private syncStatusService: SyncStatusService, private serverConnectionService: ServerConnectionService) {
    this.wallets[NEURALIUM_BLOCKCHAIN.id] = NO_WALLET;
    this.wallets[SECURITY_BLOCKCHAIN.id] = NO_WALLET;
    this.wallets[CONTRACT_BLOCKCHAIN.id] = NO_WALLET;

    this.serverConnectionService.eventNotifier.subscribe(event => {
      if (event.eventType === EventTypes.AccountPublicationEnded) {
        this.refreshWallet(this.currentBlockchainId);
      }
    })
  }

  startCreateWalletProcess(blockchainId: number, walletToCreate: WalletCreation): Promise<SyncProcess> {
    return new Promise<SyncProcess>((resolve, reject) => {
      this.serverConnectionService.callCreateNewWallet(blockchainId, walletToCreate)
        .then(correlationId => {
          var walletSyncProcess = SyncProcess.createNew(correlationId, "Creation of wallet " + walletToCreate.friendlyName, ProcessType.WalletCreation);
          this.syncStatusService.startSync(walletSyncProcess);
          resolve(walletSyncProcess);
        });
    });
  }

  endCreateWalletProcess(walletSyncProcess: SyncProcess) {
    this.syncStatusService.endSync(walletSyncProcess);
  }

  isWalletValide(wallet: WalletCreation): boolean {
    let isValid = true;
    isValid = isValid && !this.isNullOrEmpty(wallet.friendlyName);
    if (isValid && wallet.encryptWallet) {
      isValid = !this.isNullOrEmpty(wallet.passPhrases[EncryptionKey.Wallet]);
    }

    if (isValid && wallet.encryptKey && !wallet.encryptKeysIndividualy) {
      isValid = !this.isNullOrEmpty(wallet.passPhrases[EncryptionKey.TransactionKey]);
    }

    if (isValid && wallet.encryptKey && wallet.encryptKeysIndividualy) {
      isValid = !this.isNullOrEmpty(wallet.passPhrases[EncryptionKey.ChangeKey])
        && !this.isNullOrEmpty(wallet.passPhrases[EncryptionKey.MessageKey])
        && !this.isNullOrEmpty(wallet.passPhrases[EncryptionKey.SuperKey])
        && !this.isNullOrEmpty(wallet.passPhrases[EncryptionKey.TransactionKey]);
    }

    return isValid;
  }

  private isNullOrEmpty(text: string) {
    return !text || text === "";
  }

  getWallet(): Observable<Wallet> {
    return this.selectedWallet;
  }

  getCurrentAccount(): Observable<WalletAccount> {
    return this.currentAccount;
  }

  setCurrentAccount(account: WalletAccount) {
    this.serverConnectionService.callSetActiveAccount(this.currentBlockchainId, account.accountUuid).then(()=>{
      this.serverConnectionService.callQueryWalletAccountDetails(this.currentBlockchainId, account.accountUuid).then(activeAccount =>{
        this.currentAccount.next(activeAccount);
      })
    })
  }

  getWalletAccounts(): Promise<Array<WalletAccount>> {
    return new Promise<Array<WalletAccount>>((resolve, reject) => {
      this.serverConnectionService.callQueryWalletAccounts(this.currentBlockchainId)
        .then(accounts => {
          resolve(accounts);
        })
    });
  }

  loadWallet(blockChainId: number): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      this.serverConnectionService.callWalletExists(blockChainId).then(callWalletExistsResponse => {
        if (callWalletExistsResponse === true) {

          this.serverConnectionService.callIsWalletLoaded(blockChainId).then(callIsWalletLoadedResponse => {
            if (callIsWalletLoadedResponse === false) {

              this.serverConnectionService.callLoadWallet(blockChainId, '')
                .then(longRunningContextId => {

                  this.serverConnectionService.eventNotifier.subscribe((event) => {
                    if(event.correlationId === longRunningContextId){
                      switch (event.eventType) {
                        case EventTypes.WalletLoadingEnded:
                          resolve(true);
                          break;
                        case EventTypes.WalletLoadingError:
                            resolve(false);
                            break;
                        default:
                          return;
                      }
                    }
                  });
                });
            }
            else {
              resolve(true);
            }
          });
        }else {
          resolve(false);
        }
      });
    });
  }

  setWallet(blockchainId: number, wallet: Wallet) {
    var syncProcess = SyncProcess.createNew(new Date().getMilliseconds() * Math.random(), "Set wallet to blockchain cache", ProcessType.SyncingWallet);
    this.syncStatusService.startSync(syncProcess);
    this.currentBlockchainId = blockchainId;
    this.getWalletAccounts()
      .then(accounts => {
        wallet.accounts = accounts;
        if (wallet.accounts && wallet.accounts.length > 0) {
          wallet.accounts.forEach(account => {
            if(account.isActive){
              this.serverConnectionService.callQueryWalletAccountDetails(this.currentBlockchainId, account.accountUuid).then(activeAccount =>{
                this.currentAccount.next(activeAccount);
              })
            }
          });
        }
      })
      .finally(() => {
        this.wallets[blockchainId] = wallet;
        this.changeWallet(blockchainId);
        this.syncStatusService.endSync(syncProcess);
      })
  }

  changeWallet(blockchainId: number) {
    var wallet = this.wallets[blockchainId];
    this.selectedWallet.next(wallet);
  }

  publishAccount(accountUuid: string) {
    this.serverConnectionService.callPublishAccount(this.currentBlockchainId, accountUuid);
  }

  refreshWallet(blockchainId: number):Promise<Wallet> {

    return new Promise<Wallet>((resolve, reject) => {

      if(blockchainId && blockchainId !== 0){
        this.serverConnectionService.callQueryWalletInfo(blockchainId).then(walletInfo => {
          const wallet = Wallet.createNew(walletInfo);
          this.setWallet(blockchainId, wallet);
          resolve(wallet);
        }).catch(error => {
          reject(error);
        });
      }
      resolve(null);
    });
  }
}
