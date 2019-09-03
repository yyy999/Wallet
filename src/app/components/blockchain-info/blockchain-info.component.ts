import { Component, OnInit } from '@angular/core';
import { BlockchainService } from '../..//service/blockchain.service';
import { NO_BLOCKCHAIN_INFO, BlockchainInfo } from '../..//model/blockchain-info';
import { WalletAccount, NO_WALLET_ACCOUNT } from '../..//model/walletAccount';
import { WalletService } from '../..//service/wallet.service';
import { SyncStatusService } from '../..//service/sync-status.service';
import { ServerConnectionService } from '../..//service/server-connection.service';
import { timer, Observable } from 'rxjs';
import { TimeoutError } from '@aspnet/signalr';

@Component({
  selector: 'app-blockchain-info',
  templateUrl: './blockchain-info.component.html',
  styleUrls: ['./blockchain-info.component.scss']
})
export class BlockchainInfoComponent implements OnInit {
  blockchainInfo: BlockchainInfo = NO_BLOCKCHAIN_INFO;
  account: WalletAccount = NO_WALLET_ACCOUNT;
  peerCount: number = 0;
  systemVersion: string = "";

  totalRemainingTime: number = 0;
  currentRemainingTime: Date;
  remainingTimePercent: number;
  tempTime: number = 0;
  timer: NodeJS.Timeout;

  get showRemainingTime(): boolean {
    return this.tempTime > 0;
  }

  constructor(
    private blockchainService: BlockchainService,
    private walletService: WalletService,
    private syncService: SyncStatusService,
    private serverConnection: ServerConnectionService) { }

  ngOnInit() {
    this.blockchainService.remainingTimeForNextBlock.subscribe(seconds => {
      this.totalRemainingTime = seconds;
      this.tempTime = seconds;
      this.currentRemainingTime = new Date(0, 0, 0, 0, 0, 0);
      this.currentRemainingTime.setSeconds(this.tempTime);
      this.remainingTimePercent = (this.totalRemainingTime - this.tempTime) / this.totalRemainingTime * 100;
      if (this.timer) {
        clearTimeout(this.timer);
      }
      this.updateRemainingTime();
    })

    this.blockchainService.getBlockchainInfo().subscribe(blockchainInfo => {
      this.blockchainInfo = blockchainInfo;
    })

    this.walletService.getCurrentAccount().subscribe(account => {
      this.account = account;
    })

    this.syncService.getPeerCount().subscribe(count => {
      this.peerCount = count;
    })

    this.serverConnection.callQuerySystemVersion().then(version => {
      this.systemVersion = version.version;
    })
  }

  updateRemainingTime() {
    this.timer = setTimeout(() => {
      this.tempTime--;
      this.currentRemainingTime = new Date(0, 0, 0, 0, 0, 0);
      this.currentRemainingTime.setSeconds(this.tempTime);
      this.remainingTimePercent = (this.totalRemainingTime - this.tempTime) / this.totalRemainingTime * 100;
      if (this.tempTime == 0) {
        clearTimeout(this.timer);
      }
      else {
        this.updateRemainingTime();
      }
    }, 1000);
  }

}
