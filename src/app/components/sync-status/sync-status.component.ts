import { Component, OnInit } from '@angular/core';
import { SyncStatusService } from '../..//service/sync-status.service';
import { SyncProcess, ProcessType, SyncStatus } from '../..//model/syncProcess';
import { SyncUpdate, NO_SYNC_UPDATE } from '../..//model/sync-update';
import { ServerConnectionService } from '../..//service/server-connection.service';
import { MatDialog } from '@angular/material';
import { ServerConnectionDialogComponent } from '../..//dialogs/server-connection-dialog/server-connection-dialog.component';
import { CONNECTED } from '../..//model/serverConnectionEvent';
import { ConfigService } from '../..//service/config.service';


@Component({
  selector: 'app-sync-status',
  templateUrl: './sync-status.component.html',
  styleUrls: ['./sync-status.component.css']
})
export class SyncStatusComponent implements OnInit {
  peersImage:string;
  peersCount:number = 0;

  notSynced: string;
  probablyNotSynced: string;
  synced: string;

  currentWalletSyncStatusColor: string;
  currentBlockchainSyncStatusColor: string;

  currentWalletSyncUpdateColor:string = "primary";
  currentBlockchainSyncUpdateColor:string = "primary";

  currentWalletSyncUpdate:SyncUpdate = NO_SYNC_UPDATE;
  currentBlockchainSyncUpdate:SyncUpdate = NO_SYNC_UPDATE;

  syncingList: Array<SyncProcess>;
  displaySyncList: boolean = false;

  serverNotConnected: boolean = true;
  currentServerConnectionStatusColor:string = "warn";

  constructor(
    private syncStatusService: SyncStatusService,
    private serverConnectionService: ServerConnectionService,
    private configService: ConfigService,
    public dialog: MatDialog){
    
  }

  ngOnInit() {
    this.serverConnectionService.isConnectedToServer().subscribe(connected => {
      if (connected != CONNECTED) {
        if(this.configService.isServerPathValid()){
          this.showServerConnectionDialog(false);
          this.serverConnectionService.tryConnectToServer();
          this.serverNotConnected = true;
          this.currentServerConnectionStatusColor = "warn";
        }
      }
      else{
        this.serverNotConnected = false;
        this.currentServerConnectionStatusColor = "primary";
      }
    })
    
    this.syncStatusService.getCurrentBlockchainSyncStatus().subscribe(status => {
      this.defineBlockchainCurrentSyncStatus(status);
    })

    this.syncStatusService.getCurrentWalletSyncStatus().subscribe(status => {
      this.defineWalletCurrentSyncStatus(status);
    })

    this.syncStatusService.getCurrentBlockchainSyncUpdate().subscribe(update =>{
      this.currentBlockchainSyncUpdate = update;
      this.currentBlockchainSyncUpdateColor = this.defineCurrentSyncUpdateColor(update.percentage);
    })

    this.syncStatusService.getCurrentWalletSyncUpdate().subscribe(update =>{
      this.currentWalletSyncUpdate = update;
      this.currentWalletSyncUpdateColor = this.defineCurrentSyncUpdateColor(update.percentage);
    })

    this.syncStatusService.getSyncList().subscribe(syncList => {
      this.syncingList = syncList;
    });

    this.syncStatusService.getPeerCount().subscribe(count => {
      this.peersCount = count;
      let basePath = "./assets/img/";
      if(count >=4){
        this.peersImage = basePath + "pp5.png";
      }
      else if(count == 3){
        this.peersImage = basePath + "pp4.png";
      }
      else if(count == 2){
        this.peersImage = basePath + "pp3.png";
      }
      else if(count == 1){
        this.peersImage = basePath + "pp2.png";
      }
      else if(count == 0){
        this.peersImage = basePath + "pp1.png";
      }
    })
  }

  get isSyncingWallet(): boolean{
    return this.syncingList.filter(process => { return process.processType == ProcessType.SyncingWallet }).length > 0 || this.showWalletSyncUpdate();
  }

  get isSyncingBlockchain(): boolean{
    return this.syncingList.filter(process => { return process.processType == ProcessType.SyncingBlockchain }).length > 0 || this.showBlockchainSyncUpdate()
  }

  showWalletSyncUpdate():boolean{
    return this.currentWalletSyncUpdate != NO_SYNC_UPDATE;
  }

  showBlockchainSyncUpdate():boolean{
    return this.currentBlockchainSyncUpdate != NO_SYNC_UPDATE;
  }

  defineWalletCurrentSyncStatus(status: SyncStatus) {
    this.currentWalletSyncStatusColor = this.defineCurrentSyncStatusColor(status);
  }

  defineBlockchainCurrentSyncStatus(status: SyncStatus) {
    this.currentBlockchainSyncStatusColor = this.defineCurrentSyncStatusColor(status);
  }

  defineCurrentSyncStatusColor(status: SyncStatus):string {
    switch (status) {
      case SyncStatus.Synced:
        return "primary";
      default:
        return "warn";
    }
  }

  defineCurrentSyncUpdateColor(percentage: number):string {
    if(percentage > 75){
      return "primary";
    }
    else if(percentage > 25){
      return "accent";
    }
    else{
      return "warn";
    }
  }

  get isSyncing(): boolean {
    return this.isSyncingBlockchain || this.isSyncingWallet;
  }

  showServerConnectionDialog(manualyOpened:boolean){
    setTimeout(() => {
      let dialogRef = this.dialog.open(ServerConnectionDialogComponent, {
        width: '350px',
        data:manualyOpened
      });
    });
  }
}
