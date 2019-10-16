import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NotificationService } from '../..//service/notification.service';
import { NEURALIUM_BLOCKCHAIN } from '../..//model/blockchain';
import { BlockchainService } from '../..//service/blockchain.service';
import { WalletService } from '../..//service/wallet.service';
import { NO_WALLET_ACCOUNT, WalletAccount, WalletAccountStatus } from '../..//model/walletAccount';
import { TranslateService } from '@ngx-translate/core';
import { ServerConnectionService } from '../..//service/server-connection.service';
import { NeuraliumService } from '../..//service/neuralium.service';
import { TotalNeuralium, NO_NEURALIUM_TOTAL } from '../..//model/total-neuralium';
import { CONNECTED } from '../..//model/serverConnectionEvent';

@Component({
  selector: 'app-send',
  templateUrl: './send.component.html',
  styleUrls: ['./send.component.css']
})
export class SendComponent implements OnInit {
  title = this.translateService.instant("send.Title");
  icon = "fas fa-sign-out-alt";

  currentAccountUuId:string;

  neuraliumTotal: TotalNeuralium = NO_NEURALIUM_TOTAL;

  pattern = new RegExp('^\[0-9\]+.{0,1}\[0-9\]{0,9}$');

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
                if (account != void (0) && account != NO_WALLET_ACCOUNT && account.isActive && account.status == WalletAccountStatus.Published) { //
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

    this.currentAccountUuId = account.accountUuid;
    
  }

  neuraliumsSent(total:number){
    this.translateService.get("send.SendingSuccess").subscribe(message =>{
      this.notificationService.showSuccess(message);
    })
  }
}
