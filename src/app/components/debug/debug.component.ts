import { Component, OnInit, isDevMode } from '@angular/core';
import { ServerConnectionService } from '../..//service/server-connection.service';
import { WalletService } from '../..//service/wallet.service';
import { NO_WALLET_ACCOUNT, WalletAccountStatus } from '../..//model/walletAccount';
import { NotificationService } from '../..//service/notification.service';
import { ConfigService } from '../..//service/config.service';
import { SyncStatusService } from '../..//service/sync-status.service';
import { EventTypes, ResponseResult } from '../..//model/serverConnectionEvent';
import { PassphraseParameters, KeyPassphraseParameters } from '../..//model/passphraseRequiredParameters';
import { AppConfig } from '../../../environments/environment';

@Component({
  selector: 'app-debug',
  templateUrl: './debug.component.html',
  styleUrls: ['./debug.component.scss']
})
export class DebugComponent implements OnInit {
  currentPlatform: string;
  accountUuid: string;
  addNeuraliumsEnabled: boolean = true;

  showAccountCommands: boolean = false;

  constructor(
    private serverConnection: ServerConnectionService,
    private syncService: SyncStatusService,
    private walletService: WalletService,
    private notification: NotificationService,
    private config: ConfigService
  ) {


  }

  get showMe(): boolean {
    return AppConfig.testNet && this.showAccountCommands;
  }

  ngOnInit() {
    this.currentPlatform = this.config.currentPlatform;

    this.walletService.getCurrentAccount().subscribe(account => {
      if (account != NO_WALLET_ACCOUNT) {
        this.accountUuid = account.accountUuid;
        this.showAccountCommands = true;
        this.addNeuraliumsEnabled = account.status == WalletAccountStatus.Published;
      }
      else {
        this.showAccountCommands = false;
      }
    })
  }

  addNeuraliums() {
    if (this.addNeuraliumsEnabled) {
      this.addNeuraliumsEnabled = false;
      this.serverConnection.callRefillNeuraliums(this.accountUuid)
        .then(() => {
          this.notification.showSuccess("Refill called for " + this.accountUuid);
        })
        .catch(error => {
          this.notification.showError(error);
        })
      setTimeout(() => {
        this.addNeuraliumsEnabled = true;
      }, 5000);
    }
  }

  testSync() {
    this.syncService.lauchTest();
  }

  testMining() {
    this.serverConnection.testMiningEvent();
  }

  testRemainingTime() {
    this.serverConnection.propagateEvent(0, EventTypes.BlockInserted, ResponseResult.Success, { "chainType": 0, "blockId": 1, "timestamp": new Date(Date.now()), "hash": "haché", "lifespan": 20 });
  }

  enterWalletPassphrase(){
    var parameters = new PassphraseParameters();
    parameters.attempt = 1;
    parameters.chainType = 1001;
    parameters.correlationId = 1;
    parameters.keyCorrelationCode = 1;
    this.serverConnection.propagateEvent(1,EventTypes.RequestWalletPassphrase,ResponseResult.Default,parameters);
  }

  enterKeyPassphrase(){
    var parameters = new KeyPassphraseParameters();
    parameters.attempt = 3;
    parameters.chainType = 1001;
    parameters.correlationId = 1;
    parameters.keyCorrelationCode = 1;
    parameters.accountID = "fdvbhvb";
    parameters.keyname = "Key Name";
    this.serverConnection.propagateEvent(1,EventTypes.RequestWalletPassphrase,ResponseResult.Default,parameters);
  }

}
