import { Component, OnInit, Input } from '@angular/core';
import { SyncStatusService } from '../..//service/sync-status.service';
import { SyncUpdate, NO_SYNC_UPDATE } from '../..//model/sync-update';
import { SyncProcess, ProcessType, SyncStatus } from '../..//model/syncProcess';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-wallet-sync-display',
  templateUrl: './wallet-sync-display.component.html',
  styleUrls: ['./wallet-sync-display.component.scss']
})
export class WalletSyncDisplayComponent implements OnInit {
  @Input() lightDisplay:boolean;

  notSynced: string;
  probablyNotSynced: string;
  synced: string;

  currentSyncStatusColor: string;
  currentSyncStatusTitle:string;
  currentSyncStatusPercentage:number;

  toolTipText:string;

  currentSyncUpdateColor:string = "primary";

  currentSyncUpdate:SyncUpdate = NO_SYNC_UPDATE;

  syncingList: Array<SyncProcess>;
  displaySyncList: boolean = false;

  constructor(
    private syncStatusService: SyncStatusService,
    private translateService:TranslateService
  ) { }

  ngOnInit() {
    this.syncStatusService.getCurrentWalletSyncStatus().subscribe(status => {
      this.defineCurrentSyncStatus(status);

    })

    this.syncStatusService.getCurrentWalletSyncUpdate().subscribe(update =>{
      this.currentSyncUpdate = update;
      this.currentSyncUpdateColor = this.defineCurrentSyncUpdateColor(update.percentage);
      if(update.percentage < 100){
        this.toolTipText = this.translateService.instant("sync.Syncing") + " " +  this.translateService.instant("wallet.Wallet") + "... " +  update.percentage + "%";
      }
    })

    this.syncStatusService.getSyncList().subscribe(syncList => {
      this.syncingList = syncList;
    });
  }

  get isSyncing(): boolean{
    return this.syncingList.filter(process => { return process.processType == ProcessType.SyncingWallet }).length > 0 || this.showSyncUpdate();
  }

  showSyncUpdate():boolean{
    return this.currentSyncUpdate != NO_SYNC_UPDATE;
  }

  defineCurrentSyncStatus(status: SyncStatus) {
    this.currentSyncStatusPercentage = this.defineCurrentSyncStatusPercentage(status);
    this.currentSyncStatusColor = this.defineCurrentSyncStatusColor(status);
    this.defineCurrentSyncStatusTitle(status);
  }

  defineCurrentSyncStatusColor(status: SyncStatus):string {
    switch (status) {
      case SyncStatus.Synced:
        return "primary";
      default:
        return "warn";
    }
  }

  defineCurrentSyncStatusPercentage(status: SyncStatus):number {
    switch (status) {
      case SyncStatus.Synced:
        return 100;
      default:
        return 0;
    }
  }

  defineCurrentSyncStatusTitle(status: SyncStatus):void {
    let key: string= 'sync.NotSynced';

    if(status === SyncStatus.Synced){
      key = 'sync.Synced';
    }

    this.translateService.get(key).subscribe((res: string) => {
        this.currentSyncStatusTitle = res;
    });
  }

  defineCurrentSyncUpdateColor(percentage: number):string {
    this.currentSyncStatusPercentage = percentage;
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

}
