import { Component, OnInit, OnDestroy } from '@angular/core';
import { BlockchainService } from '../..//service/blockchain.service';
import { NO_BLOCKCHAIN_INFO, BlockchainInfo } from '../..//model/blockchain-info';
import { WalletAccount, NO_WALLET_ACCOUNT } from '../..//model/walletAccount';
import { WalletService } from '../..//service/wallet.service';
import { SyncStatusService } from '../..//service/sync-status.service';
import { ServerConnectionService } from '../..//service/server-connection.service';
import moment, * as momentObj from 'moment';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';


@Component({
  selector: 'app-blockchain-info',
  templateUrl: './blockchain-info.component.html',
  styleUrls: ['./blockchain-info.component.scss']
})
export class BlockchainInfoComponent implements OnInit, OnDestroy {
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

    this.serverConnection.serverConnection.pipe(takeUntil(this.unsubscribe$)).subscribe((connected) => {
      if(connected === true){
        this.blockchainService.getBlockchainInfo().pipe(takeUntil(this.unsubscribe$)).subscribe(blockchainInfo => {
          this.blockchainInfo = blockchainInfo;
        })
    
        this.walletService.getCurrentAccount().pipe(takeUntil(this.unsubscribe$)).subscribe(account => {
          this.account = account;
        })
    
        this.syncService.getPeerCount().pipe(takeUntil(this.unsubscribe$)).subscribe(count => {
          this.peerCount = count;
        })
    
        this.serverConnection.callQuerySystemVersion().then(version => {
          this.systemVersion = version.version;
        })
      }
    });
    
  }

  private unsubscribe$ = new Subject<void>();

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  

}
