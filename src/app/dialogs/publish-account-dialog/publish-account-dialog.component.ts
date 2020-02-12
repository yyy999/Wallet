import { Component, OnInit, Inject } from '@angular/core';
import { ServerConnectionService } from '../..//service/server-connection.service';
import { WalletService } from '../..//service/wallet.service';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { EventTypes } from '../..//model/serverConnectionEvent';
import { SyncStatusService } from '../..//service/sync-status.service';
import { TransactionsService } from '../..//service/transactions.service';
import { SyncStatus } from '../..//model/syncProcess';

@Component({
  selector: 'app-publish-account-dialog',
  templateUrl: './publish-account-dialog.component.html',
  styleUrls: ['./publish-account-dialog.component.scss']
})
export class PublishAccountDialogComponent implements OnInit {
  isBlockchainSynced:boolean = false;
  isAccountPublicationRunning: boolean = false;
  isAccountPublicationEnded: boolean = false;
  showCloseButton:boolean = true;
  accountPublicationStep: number;
  accountPublicationStepName: string = "";
  nonceStep: string = "";
  errorOccured: boolean = false;
  
  message: string = "";
  canPublish:boolean = false;

  finalNonce: number = 0;
  solutions: Array<number>;

  constructor(
    private serverConnectionService: ServerConnectionService,
    private walletService: WalletService,
    private synStatusService:SyncStatusService,
    private transactionService:TransactionsService,
    public dialogRef: MatDialogRef<PublishAccountDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public accountUuid: string) {
      
    }

  ngOnInit() {
    this.transactionService.getCanSendTransactions().subscribe(canSend =>{
      this.canPublish = canSend;
    });

    this.synStatusService.getCurrentBlockchainSyncStatus().subscribe(syncStatus =>{
      this.isBlockchainSynced = syncStatus === SyncStatus.Synced;
    });
  }

  startListeningToAccountPublicationEvents() {
    this.serverConnectionService.eventNotifier.subscribe(event => {
      switch (event.eventType) {
        case EventTypes.AccountPublicationStarted:
          this.isAccountPublicationRunning = true;
          this.showCloseButton = false;
          break;
        case EventTypes.AccountPublicationStep:
          var step = event.message;
          this.accountPublicationStepName = step["stepName"];
          var stepIndex = step["stepIndex"];
          var stepTotal = step["stepTotal"];
          this.accountPublicationStep = stepIndex / stepTotal * 100;
          break;
        case EventTypes.AccountPublicationError:
          this.message = event.message;
          this.showCloseButton = true;
          this.errorOccured = true;
          break;
        case EventTypes.AccountPublicationMessage:
          this.message = event.message;
          break;
        case EventTypes.AccountPublicationPOWNonceIteration:
          this.nonceStep = event.message["nonce"];
          break;
        case EventTypes.AccountPublicationPOWNonceFound:
          this.finalNonce = event.message["nonce"];
          this.solutions = event.message["solutions"];
          break;
        case EventTypes.AccountPublicationEnded:
          this.isAccountPublicationRunning = false;
          this.accountPublicationStepName = "";
          this.accountPublicationStep = 100;
          this.isAccountPublicationEnded = true;
          this.showCloseButton = true;
          break;
        default:
          // other events are not relevant
          break;
      }
    })
  }

  startPublishAccount() {
    this.startListeningToAccountPublicationEvents();
    this.walletService.publishAccount(this.accountUuid);
    this.isAccountPublicationRunning = true;
  }

  close() {
    this.dialogRef.close();
  }

}
