import { Component, OnInit, Input } from '@angular/core';
import { WalletAccount } from '../..//model/walletAccount';
import { MatDialog } from '@angular/material';
import { WalletService } from '../..//service/wallet.service';
import { BlockchainService } from '../..//service/blockchain.service';
import { PublishAccountDialogComponent } from '../..//dialogs/publish-account-dialog/publish-account-dialog.component';
import { SyncStatusService } from '../..//service/sync-status.service';
import { SyncStatus } from '../..//model/syncProcess';

@Component({
  selector: 'app-account-details',
  templateUrl: './account-details.component.html',
  styleUrls: ['./account-details.component.scss']
})
export class AccountDetailsComponent implements OnInit {
  @Input() account: WalletAccount;
  @Input() isCurrent: boolean;

  canPublish: boolean = false;

  constructor(
    public dialog: MatDialog,
    private walletService: WalletService,
    private blockchainService: BlockchainService,
    private syncService: SyncStatusService) { }

  ngOnInit() {
    this.syncService.getCurrentBlockchainSyncStatus().subscribe(syncStatus => {
      this.canPublish = syncStatus == SyncStatus.Synced;
    })
  }

  publishAccount(accountUuid: string) {
    if (this.canPublish) {
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

  setAccountAsCurrent(account: WalletAccount) {
    this.walletService.setCurrentAccount(account);
  }

}
