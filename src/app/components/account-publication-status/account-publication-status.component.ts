import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { WalletService } from '../..//service/wallet.service';
import { BlockchainService } from '../..//service/blockchain.service';
import { PublishAccountDialogComponent } from '../..//dialogs/publish-account-dialog/publish-account-dialog.component';
import { WalletAccount, NO_WALLET_ACCOUNT } from '../..//model/walletAccount';
import { SyncStatusService } from '../..//service/sync-status.service';
import { SyncStatus } from '../..//model/syncProcess';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-account-publication-status',
  templateUrl: './account-publication-status.component.html',
  styleUrls: ['./account-publication-status.component.scss']
})
export class AccountPublicationStatusComponent implements OnInit, OnDestroy {
  account:WalletAccount = NO_WALLET_ACCOUNT;
  canPublish:boolean = false;

  constructor(
    public dialog: MatDialog,
    private walletService: WalletService,
    private blockchainService: BlockchainService,
    private syncService:SyncStatusService) { }

  ngOnInit() {
    this.walletService.getCurrentAccount().pipe(takeUntil(this.unsubscribe$)).subscribe(account =>{
      this.account = account;
    })

    this.syncService.getCurrentBlockchainSyncStatus().pipe(takeUntil(this.unsubscribe$)).subscribe(syncStatus =>{
      this.canPublish = syncStatus === SyncStatus.Synced;
    })
  }

  private unsubscribe$ = new Subject<void>();

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  get showAccountStatus():boolean{
    return this.account !== NO_WALLET_ACCOUNT && this.account.status !== 3;
  }

  publishAccount(accountUuid:string){
    setTimeout(() => {
      let dialogRef = this.dialog.open(PublishAccountDialogComponent, {
        width: '450px',
        data: accountUuid
      });
      
      dialogRef.afterClosed().subscribe(() => {
        this.walletService.refreshWallet(this.blockchainService.currentBlockchain.id);
      })
    });
  }

}
