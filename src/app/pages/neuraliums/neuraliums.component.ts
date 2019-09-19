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
  selector: 'app-neuraliums',
  templateUrl: './neuraliums.component.html',
  styleUrls: ['./neuraliums.component.scss']
})
export class NeuraliumsComponent implements OnInit {
  title = this.translateService.instant("neuralium.Title");
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
      if (connected != CONNECTED) {
        this.router.navigate(['/dashboard']);
      }
      else {
        try {
          this.blockchainService.selectedBlockchain.subscribe(blockchain => {
            if (blockchain == NEURALIUM_BLOCKCHAIN && blockchain.menuConfig.showSend) {
              this.walletService.getCurrentAccount().subscribe(account => {
                if (account != void (0) && account != NO_WALLET_ACCOUNT && account.IsActive && account.Status == WalletAccountStatus.Published) { // && account.Status == WalletAccountStatus.Published
                  this.initialise(account);
                }
                else {
                  var text = this.translateService.instant('send.NoAccountOrAccountNotActiveOrNotPublished')
                  this.notificationService.showError(text);
                  this.router.navigate(["/"]);
                }
              });
            }
            else {
              var text = this.translateService.instant('send.BlockchainDoesNotAllowSend')
              this.notificationService.showError(text);
              this.router.navigate(["/"]);
            }
          });
        } catch (error) {
          this.notificationService.showError(error, "Error");
        }
      }
    });
  }

  initialise(account: WalletAccount) {
    this.neuraliumService.getNeuraliumTotal().subscribe(total => this.neuraliumTotal = total);

    this.currentAccount = account;
    
  }

  get hasCurrentAccount(): boolean {
    return this.currentAccount != NO_WALLET_ACCOUNT;
  }

  neuraliumsSent(total:number){
    this.translateService.get("send.SendingSuccess").subscribe(message =>{
      this.notificationService.showSuccess(message);
    })
  }


}
