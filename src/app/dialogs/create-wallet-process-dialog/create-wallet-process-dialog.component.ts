import { Component, OnInit } from '@angular/core';
import { NotificationService } from '../..//service/notification.service';
import { SyncStatusService } from '../..//service/sync-status.service';
import { BlockchainService } from '../..//service/blockchain.service';
import { ServerConnectionService } from '../..//service/server-connection.service';
import { WalletService } from '../..//service/wallet.service';
import { WalletCreation, Wallet } from '../..//model/wallet';
import { SyncProcess, NO_SYNC, ProcessType } from '../..//model/syncProcess';
import { MatDialogRef } from '@angular/material/dialog';
import { DialogResult } from '../..//config/dialog-result';
import { TranslateService } from '@ngx-translate/core';
import { EventTypes } from '../..//model/serverConnectionEvent';

const WALLET_KEY = 0;
const ALL_KEYS = 1;
const TRANSACTION_KEY = 1;
const MESSAGE_KEY = 2;
const CHANGE_KEY = 3;
const SUPER_KEY = 4;

@Component({
  selector: 'app-create-wallet-process-dialog',
  templateUrl: './create-wallet-process-dialog.component.html',
  styleUrls: ['./create-wallet-process-dialog.component.css']
})
export class CreateWalletProcessDialogComponent implements OnInit {
  showPasswords: boolean = false;
  defaultProcess: SyncProcess;
  currentBlockchainId: number = 0;
  walletCreationStep: number = 0;
  accountCreationStep: number = 0;
  keyCreationStep: number = 0;
  walletToCreate: WalletCreation;
  walletCreationSyncProcess: SyncProcess = NO_SYNC;
  walletCreationProcesses: Array<SyncProcess> = [];
  currentStep: string = "";
  accountUuid: string = "";
  isWalletCreationRunning: boolean;
  isAccountCreationRunning: boolean;
  isKeyCreationRunning: boolean;
  passPhrasesConfirm = [];
  keyName: string = '';

  get passWordInputType(): string {
    if (this.showPasswords) {
      return "text";
    }
    else {
      return "password";
    }
  }

  constructor(
    private translateService: TranslateService,
    private walletService: WalletService,
    private serverConnectionService: ServerConnectionService,
    private blockchainService: BlockchainService,
    private notificationService: NotificationService,
    private syncStatusService: SyncStatusService,
    public dialogRef: MatDialogRef<CreateWalletProcessDialogComponent>
  ) { }

  ngOnInit() {
    this.initialiseValues();
  }

  initialiseValues() {
    this.currentBlockchainId = this.blockchainService.getCurrentBlockchain().id;
    this.walletToCreate = WalletCreation.createNew();
    this.walletCreationSyncProcess = NO_SYNC;
  }

  createWallet() {
    if (this.isWalletValid) {
      this.startProcess();
    }
    else {
      this.notificationService.showWarn(this.translateService.instant("error.InformationsNotCorrectPleaseRetry"));
    }
  }

  

  cancel() {
    this.dialogRef.close(DialogResult.Cancel);
  }

  startProcess() {
    this.startSyncStatusProcess();
    this.subscribeToEvents();
    this.walletService.startCreateWalletProcess(this.currentBlockchainId, this.walletToCreate)
      .then((syncProcess) => {
        this.walletCreationSyncProcess = syncProcess;
      });
  }

  endProcess() {
    this.serverConnectionService.callLoadWallet(this.currentBlockchainId).then(walletId => {
      var newWallet = Wallet.createNew(walletId);
      this.walletService.setWallet(this.currentBlockchainId, newWallet);
      this.notificationService.showSuccess(this.translateService.instant("wallet.WalletCreated"));
      this.walletService.endCreateWalletProcess(this.walletCreationSyncProcess);
      if (this.walletToCreate.publishAccount) {
        this.dialogRef.close(this.accountUuid);
      } else {
        this.dialogRef.close(DialogResult.WalletCreated);
      }

    })
  }

  startSyncStatusProcess() {
    this.syncStatusService.syncListObservable.subscribe(processes => {
      this.walletCreationProcesses = processes.filter(process => process.processType == ProcessType.WalletCreation);
    })
  }



  subscribeToEvents() {
    this.serverConnectionService.eventNotifier.subscribe((event) => {
      switch (event.eventType) {
        case EventTypes.WalletCreationStarted:
          this.isWalletCreationRunning = true;
          break;
        case EventTypes.WalletCreationEnded:
          this.isWalletCreationRunning = false;
          this.endProcess();
          break;
        case EventTypes.WalletCreationStep:
          this.isWalletCreationRunning = true;
          var step = event.message;
          var stepIndex = step["stepIndex"];
          var stepTotal = step["stepTotal"];
          this.walletCreationStep = stepIndex / stepTotal * 100;
          break;
        case EventTypes.AccountCreationStarted:
          this.isAccountCreationRunning = true;
          break;
        case EventTypes.AccountCreationStep:
          this.isAccountCreationRunning = true;
          var step = event.message;
          var stepIndex = step["stepIndex"];
          var stepTotal = step["stepTotal"];
          this.accountCreationStep = stepIndex / stepTotal * 100;
          break;
        case EventTypes.AccountCreationEnded:
          this.isAccountCreationRunning = false;
          this.accountUuid = event.message['accountUuid'];
          break;
        case EventTypes.KeyGenerationStarted:
          this.isKeyCreationRunning = true;

          let keyIndex:number =  event.message['keyIndex'];
          let totalKeys:number =  event.message['totalKeys'];

          this.keyCreationStep = 25*(keyIndex-1);
          this.keyName = event.message['keyName'];
          break;
        case EventTypes.KeyGenerationEnded:
            let keyIndex2:number =  event.message['keyIndex'];
            let totalKeys2:number =  event.message['totalKeys'];
            
            if(keyIndex2 === totalKeys2){
              this.isKeyCreationRunning = false;
              this.keyCreationStep = 100;
              this.keyName = '';
            }
          break;
        default:
          break;
      }
    })
  }

  

  get isWalletValid() {
    var isValid: boolean = true;

    isValid = this.accountNameValid;

    if (isValid) {
      if (this.walletToCreate.encryptWallet) {
        isValid = this.passPhraseValid(WALLET_KEY);
      }
    }

    if (isValid) {
      if (this.walletToCreate.encryptKey) {
        if (!this.walletToCreate.encryptKeysIndividualy) {
          isValid = this.passPhraseValid(ALL_KEYS);
        }
        else {
          isValid = this.passPhraseValid(TRANSACTION_KEY) && this.passPhraseValid(MESSAGE_KEY) &&  this.passPhraseValid(CHANGE_KEY) &&  this.passPhraseValid(SUPER_KEY);
        }
      }
    }

    return isValid;;
  }

  passPhraseValid(index: number) {
    if (this.walletToCreate != void (0)) {
      return !this.isNullOrEmpty(this.walletToCreate.passPhrases[index]) && this.passPhraseConfirmed(index);
    }
  }

  passPhraseConfirmed(index: number) {
    if (this.walletToCreate != void (0)) {
      return this.walletToCreate.passPhrases[index] == this.passPhrasesConfirm[index];
    }
  }

  get accountNameValid(): boolean {
    return !this.isNullOrEmpty(this.walletToCreate.friendlyName);
  }

  get accountNameNotValid() :boolean{
    return !this.accountNameValid;
  }

  private isNullOrEmpty(text: string) {
    return text == void (0) || text == "";
  }
}