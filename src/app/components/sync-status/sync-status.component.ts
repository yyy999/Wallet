import { Component, OnInit, ViewChild } from '@angular/core';
import { SyncStatusService } from '../..//service/sync-status.service';
import { SyncProcess, ProcessType, SyncStatus } from '../..//model/syncProcess';
import { SyncUpdate, NO_SYNC_UPDATE } from '../..//model/sync-update';
import { ServerConnectionService } from '../..//service/server-connection.service';
import { MatDialog } from '@angular/material';
import { ServerConnectionDialogComponent } from '../..//dialogs/server-connection-dialog/server-connection-dialog.component';
import { CONNECTED } from '../..//model/serverConnectionEvent';
import { ConfigService } from '../..//service/config.service';
import { WalletSyncDisplayComponent } from '../../components/wallet-sync-display/wallet-sync-display.component';
import { BlockchainSyncDisplayComponent } from '../../components/blockchain-sync-display/blockchain-sync-display.component';

@Component({
  selector: 'app-sync-status',
  templateUrl: './sync-status.component.html',
  styleUrls: ['./sync-status.component.css']
})
export class SyncStatusComponent implements OnInit {

  @ViewChild('walletSync', null) private walletSync: WalletSyncDisplayComponent;
  @ViewChild('blockchainSync', null) private blockchainSync: BlockchainSyncDisplayComponent;

  peersImage: string;
  peersCount: number = 0;

  notSynced: string;
  probablyNotSynced: string;
  synced: string;

  currentWalletSyncStatusColor: string;
  currentBlockchainSyncStatusColor: string;

  currentWalletSyncUpdateColor: string = "primary";
  currentBlockchainSyncUpdateColor: string = "primary";

  currentWalletSyncUpdate: SyncUpdate = NO_SYNC_UPDATE;
  currentBlockchainSyncUpdate: SyncUpdate = NO_SYNC_UPDATE;

  syncingList: Array<SyncProcess>;
  displaySyncList: boolean = false;

  serverNotConnected: boolean = true;
  currentServerConnectionStatusColor: string = "warn";

  constructor(
    private syncStatusService: SyncStatusService,
    private serverConnectionService: ServerConnectionService,
    private configService: ConfigService,
    public dialog: MatDialog) {

  }

  ngOnInit() {
    this.serverConnectionService.isConnectedToServer().subscribe(connected => {
      if (connected !== CONNECTED) {
        if (this.configService.isServerPathValid()) {
          this.showServerConnectionDialog(false);
          this.serverConnectionService.tryConnectToServer();
          this.serverNotConnected = true;
          this.currentServerConnectionStatusColor = "warn";
        }
      }
      else {
        this.serverNotConnected = false;
        this.currentServerConnectionStatusColor = "primary";
      }
    })

    this.syncStatusService.getSyncList().subscribe(syncList => {
      this.syncingList = syncList;
    });

    this.syncStatusService.getPeerCount().subscribe(count => {
      this.peersCount = count;
      let basePath = "./assets/img/";
      if (count >= 4) {
        this.peersImage = basePath + "pp5.png";
      }
      else if (count === 3) {
        this.peersImage = basePath + "pp4.png";
      }
      else if (count === 2) {
        this.peersImage = basePath + "pp3.png";
      }
      else if (count === 1) {
        this.peersImage = basePath + "pp2.png";
      }
      else if (count === 0) {
        this.peersImage = basePath + "pp1.png";
      }
    })
  }

  get isSyncingWallet(): boolean {
    return this.walletSync.isSyncing;
  }

  get isSyncingBlockchain(): boolean {
    return this.blockchainSync.isSyncing;
  }


  get isSyncing(): boolean {
    return this.isSyncingBlockchain || this.isSyncingWallet;
  }
  
  showServerConnectionDialog(manualyOpened: boolean) {
    setTimeout(() => {
      let dialogRef = this.dialog.open(ServerConnectionDialogComponent, {
        width: '350px',
        data: manualyOpened
      });
    });
  }
}
