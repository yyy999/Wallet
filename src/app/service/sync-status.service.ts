import { Injectable } from '@angular/core';
import { SyncProcess, SyncStatus, ProcessType } from '../model/syncProcess';
import { BehaviorSubject, Observable } from 'rxjs';
import { ServerConnectionService } from './server-connection.service';
import { SyncUpdate, NO_SYNC_UPDATE } from '../model/sync-update';
import { EventTypes } from '../model/serverConnectionEvent';
import { LogService } from './log.service';



@Injectable({
  providedIn: 'root'
})
export class SyncStatusService {
  blockchainId: number = 0;

  currentBlockchainSyncStatus: BehaviorSubject<SyncStatus> = new BehaviorSubject<SyncStatus>(SyncStatus.NotSynced);
  currentWalletSyncStatus: BehaviorSubject<SyncStatus> = new BehaviorSubject<SyncStatus>(SyncStatus.NotSynced);
  currentBlockchainSyncUpdate: BehaviorSubject<SyncUpdate> = new BehaviorSubject<SyncUpdate>(NO_SYNC_UPDATE);
  currentWalletSyncUpdate: BehaviorSubject<SyncUpdate> = new BehaviorSubject<SyncUpdate>(NO_SYNC_UPDATE);

  syncList: Array<SyncProcess> = [];
  syncListObservable: BehaviorSubject<Array<SyncProcess>> = new BehaviorSubject<Array<SyncProcess>>(this.syncList);
  peerCountObservable: BehaviorSubject<number> = new BehaviorSubject<number>(0);


  walletSyncProcess: SyncProcess = null;
  blockchainSyncProcess: SyncProcess = null;

  constructor(
    private logService: LogService,
    private serverConnectionService: ServerConnectionService
  ) {
    this.clearSync();

    this.getPeerCountFromServer();
    this.subscribeToEvents();
  }

  initialiseStatus(blockchainId: number) {
    this.blockchainId = blockchainId;
    this.initialiseWalletSyncStatus(blockchainId);
    this.initialiseBlockchainSyncStatus(blockchainId);
  }

  private initialiseWalletSyncStatus(blockchainId: number) {
    this.serverConnectionService.callIsWalletSynced(blockchainId)
      .then(isSynced => {
        if (isSynced) {
          this.currentWalletSyncStatus.next(SyncStatus.Synced);
        }
        else {
          this.currentWalletSyncStatus.next(SyncStatus.NotSynced);
        }
      })
      .catch(err => {
        this.logService.logDebug("initialiseWalletSyncStatus error", err);
      })
  }

  private initialiseBlockchainSyncStatus(blockchainId: number) {
    this.serverConnectionService.callQueryBlockchainSynced(blockchainId)
      .then(isSynced => {
        if (isSynced) {
          this.currentBlockchainSyncStatus.next(SyncStatus.Synced);
        }
        else {
          this.currentBlockchainSyncStatus.next(SyncStatus.NotSynced);
        }
      })
      .catch(err => {
        this.logService.logDebug("initialiseBlockchainSyncStatus error", err);
      })
  }

  private subscribeToEvents() {

    this.serverConnectionService.eventNotifier.subscribe(event => {
      switch (event.eventType) {
        case EventTypes.WalletSyncStarted:
          this.walletSyncProcess = SyncProcess.createNew(event.correlationId, event.message, ProcessType.SyncingWallet);
          this.startSync(this.walletSyncProcess);
          this.currentWalletSyncStatus.next(SyncStatus.NotSynced);
          break;
        case EventTypes.WalletSyncEnded:
          this.endSync(this.walletSyncProcess);
          this.currentWalletSyncUpdate.next(NO_SYNC_UPDATE);
          this.currentWalletSyncStatus.next(SyncStatus.Synced);
          break;
        case EventTypes.WalletSyncUpdate:
          var chainType: number = event.message["ChainType"];
          var currentBlockId: number = event.message["CurrentBlockId"];
          var blockHeight: number = event.message["BlockHeight"];
          var percentage: number = event.message["Percentage"];

          this.currentWalletSyncUpdate.next(SyncUpdate.create(chainType, currentBlockId, blockHeight, percentage, ''));
          this.currentWalletSyncStatus.next(SyncStatus.NotSynced);
          break;
        case EventTypes.BlockchainSyncStarted:
          this.blockchainSyncProcess = SyncProcess.createNew(event.correlationId, event.message, ProcessType.SyncingBlockchain);
          this.startSync(this.blockchainSyncProcess);
          this.currentBlockchainSyncStatus.next(SyncStatus.NotSynced);
          break;
        case EventTypes.BlockchainSyncEnded:
          this.endSync(this.blockchainSyncProcess);
          this.currentBlockchainSyncUpdate.next(NO_SYNC_UPDATE);
          this.initialiseBlockchainSyncStatus(this.blockchainId);
          break;
        case EventTypes.BlockchainSyncUpdate:
          var chainType: number = event.message["CchainType"];
          var currentBlockId: number = event.message["currentBlockId"];
          var blockHeight: number = event.message["publicBlockHeight"];
          var percentage: number = event.message["percentage"];

          var estimatedTimeRemaining: string = event.message["estimatedTimeRemaining"];

          this.currentBlockchainSyncUpdate.next(SyncUpdate.create(chainType, currentBlockId, blockHeight, percentage, estimatedTimeRemaining));
          this.currentBlockchainSyncStatus.next(SyncStatus.NotSynced);
          break;
        case EventTypes.PeerTotalUpdated:
          this.getPeerCountFromServer();
        default:
          break;
      }
    })
  }

  private getPeerCountFromServer() {
    this.serverConnectionService.callQueryTotalConnectedPeersCount().then(total => {
      this.peerCountObservable.next(total);
    })
  }

  refreshPeerCount() {
    this.getPeerCountFromServer();
  }

  getPeerCount(): Observable<number> {
    return this.peerCountObservable;
  }

  private notifySyncing() {
    this.syncListObservable.next(this.syncList);
  }

  getCurrentBlockchainSyncStatus(): Observable<SyncStatus> {
    return this.currentBlockchainSyncStatus;
  }

  getCurrentWalletSyncStatus(): Observable<SyncStatus> {
    return this.currentWalletSyncStatus;
  }

  getCurrentBlockchainSyncUpdate(): Observable<SyncUpdate> {
    return this.currentBlockchainSyncUpdate;
  }

  getCurrentWalletSyncUpdate(): Observable<SyncUpdate> {
    return this.currentWalletSyncUpdate;
  }

  getSyncList(): Observable<Array<SyncProcess>> {
    return this.syncListObservable;
  }

  startSync(syncProcess: SyncProcess) {
    this.syncList.push(syncProcess);
    this.notifySyncing();
  }

  endSync(syncProcess: SyncProcess) {
    this.syncList = this.syncList.filter(item => item.id !== syncProcess.id);
    this.notifySyncing();
  }

  endSyncWithId(id: number) {
    this.syncList = this.syncList.filter(item => item.id !== id);
    this.notifySyncing();
  }

  clearSync() {
    this.syncList = [];
    this.notifySyncing();
    //this.updateWalletSyncStatusFromServer();
    //this.updateBlockchainSyncStatusFromServer();
  }
  /*
    updateWalletSyncStatusFromServer(){
      this.serverConnectionService.callQueryWalletSynced(this.blockchainService.currentBlockchain.id)
        .then(isSynced =>{
          if(isSynced){
            this.currentWalletSyncStatus.next(SyncStatus.Synced);
          }
          else{
            this.currentWalletSyncStatus.next(SyncStatus.NotSynced);
          }
        })
        .catch((reason)=>{
          this.logService.logDebug("Wallet Sync error",reason);
          this.currentWalletSyncStatus.next(SyncStatus.NotSynced);
        })
    }
  
    updateBlockchainSyncStatusFromServer(){
      this.serverConnectionService.callQueryBlockchainSynced(this.blockchainService.currentBlockchain.id)
        .then(isSynced =>{
          if(isSynced){
            this.currentBlockchainSyncStatus.next(SyncStatus.Synced);
          }
          else{
            this.currentBlockchainSyncStatus.next(SyncStatus.NotSynced);
          }
        })
        .catch((reason)=>{
          this.logService.logDebug("Blockchain Sync error",reason);
          this.currentBlockchainSyncStatus.next(SyncStatus.NotSynced);
        })
    }
    */

  lauchTest(): any {
    this.walletSyncProcess = SyncProcess.createNew(1, "", ProcessType.SyncingWallet);
    this.startSync(this.walletSyncProcess);
    this.currentWalletSyncStatus.next(SyncStatus.NotSynced);

    setTimeout(() => {
      this.currentWalletSyncUpdate.next(SyncUpdate.create(1, 1, 5, 20, "2 days"));
      this.currentWalletSyncStatus.next(SyncStatus.NotSynced);
    }, 1000);

    setTimeout(() => {
      this.currentWalletSyncUpdate.next(SyncUpdate.create(1, 2, 5, 40, "2 days"));
      this.currentWalletSyncStatus.next(SyncStatus.NotSynced);
    }, 2000);

    setTimeout(() => {
      this.currentWalletSyncUpdate.next(SyncUpdate.create(1, 3, 5, 60, "2 days"));
      this.currentWalletSyncStatus.next(SyncStatus.NotSynced);
    }, 3000);

    setTimeout(() => {
      this.currentWalletSyncUpdate.next(SyncUpdate.create(1, 4, 5, 80, "2 days"));
      this.currentWalletSyncStatus.next(SyncStatus.NotSynced);
    }, 4000);

    setTimeout(() => {
      this.currentWalletSyncUpdate.next(SyncUpdate.create(1, 5, 5, 100, "2 days"));
      this.currentWalletSyncStatus.next(SyncStatus.NotSynced);
    }, 5000);

    setTimeout(() => {
      this.endSync(this.walletSyncProcess);
      this.currentWalletSyncUpdate.next(NO_SYNC_UPDATE);
      this.currentWalletSyncStatus.next(SyncStatus.Synced);
    }, 6000);
  }
}
