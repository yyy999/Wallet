import { Component, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { BlockchainService } from '../..//service/blockchain.service';
import { WalletService } from '../..//service/wallet.service';
import { Router } from '@angular/router';
import { NotificationService } from '../..//service/notification.service';
import { ServerConnectionService } from '../..//service/server-connection.service';
import { NeuraliumService } from '../..//service/neuralium.service';
import { CONNECTED } from '../..//model/serverConnectionEvent';
import { NEURALIUM_BLOCKCHAIN } from '../..//model/blockchain';
import { NO_WALLET_ACCOUNT, WalletAccountStatus, WalletAccount } from '../..//model/walletAccount';
import { TotalNeuralium, NO_NEURALIUM_TOTAL } from '../..//model/total-neuralium';

@Component({
  selector: 'app-tools',
  templateUrl: './tools.component.html',
  styleUrls: ['./tools.component.scss']
})
export class ToolsComponent implements OnInit {
  title = this.translateService.instant("tools.Title");
  icon = "fas fa-sign-out-alt";

  currentAccount: WalletAccount = NO_WALLET_ACCOUNT;

  neuraliumTotal: TotalNeuralium = NO_NEURALIUM_TOTAL;

  constructor(
    private translateService: TranslateService,
    private blockchainService: BlockchainService,
    private walletService: WalletService,
    private router: Router,
    private notificationService: NotificationService,
    private serverConnectionService: ServerConnectionService,
    private neuraliumService: NeuraliumService) { }

  ngOnInit() {
    this.serverConnectionService.isConnectedToServer().subscribe(connected => {
      if (connected !== CONNECTED) {
        this.router.navigate(['/dashboard']);
      }
      else {
        try {
          this.blockchainService.selectedBlockchain.subscribe(blockchain => {
            this.initialise();
          });
        } catch (error) {
          this.notificationService.showError(error, "Error");
        }
      }
    });
  }

  initialise() {

  }

}
