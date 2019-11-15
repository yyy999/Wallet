import { Component, OnInit } from '@angular/core';
import { BlockchainService } from '../..//service/blockchain.service';
import { NO_BLOCKCHAIN_INFO, BlockchainInfo } from '../..//model/blockchain-info';
import { WalletAccount, NO_WALLET_ACCOUNT } from '../..//model/walletAccount';
import { WalletService } from '../..//service/wallet.service';
import { SyncStatusService } from '../..//service/sync-status.service';
import { ServerConnectionService } from '../..//service/server-connection.service';
import * as moment from 'moment';

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

  
  constructor(
    private blockchainService: BlockchainService,
    private walletService: WalletService,
    private syncService: SyncStatusService,
    private serverConnection: ServerConnectionService) { }

    get currentRemainingTime(): Date {
      return this.blockchainService.currentRemainingTime;
    }

    get showRemainingTime(): boolean {
      return this.blockchainService.showRemainingTime;
    }

  ngOnInit() {

    this.serverConnection.serverConnection.subscribe((connected) => {
      if(connected === true){
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
    });
    
  }

  

}
