import { Component, OnInit, OnDestroy } from '@angular/core';
import { MiningService } from '../..//service/mining.service';
import { ConfigService } from '../..//service/config.service';
import { ServerConnectionService } from '../..//service/server-connection.service';
import { CONNECTED, EventTypes } from '../..//model/serverConnectionEvent';
import { TranslateService } from '@ngx-translate/core';
import { AppConfig } from './../../../environments/environment';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { IpMode } from '../../model/enums';


@Component({
  selector: 'app-mining',
  templateUrl: './mining.component.html',
  styleUrls: ['./mining.component.scss']
})
export class MiningComponent implements OnInit, OnDestroy {

  delegateAccount: string;
  isMining: boolean;
  isConnectable: boolean;
  disableMiningButton = false;
  selectedStrategy: string;
  sortingMethod = 'OlderToNewer';
  tipSortingMethod = 'MostToLess';
  timeSortingMethod = 'NewerToOlder';
  sizeSortingMethod = 'LargerToSmaller';
  connectibleText = '';
  miningportalert = '';
  miningTierText = '';
  ipmodeText = '';

  constructor(private miningService: MiningService,
    private configService: ConfigService,
    private translateService: TranslateService,
    private serverConnectionService: ServerConnectionService) {

      this.serverConnectionService.isConnectedToServer().pipe(takeUntil(this.unsubscribe$)).subscribe(connected => {
        if (connected === CONNECTED) {
            this.getMiningPortConnectableFromServer();
        }
       });
    }

    private unsubscribe$ = new Subject<void>();


    ngOnDestroy(): void {
         this.unsubscribe$.next();
         this.unsubscribe$.complete();
       }
   
  ngOnInit() {

    this.serverConnectionService.eventNotifier.pipe(takeUntil(this.unsubscribe$)).subscribe(event => {

      if (event.eventType === EventTypes.MiningStarted) {
        this.queryIpMode();
      }
    });

    this.miningService.isMining.pipe(takeUntil(this.unsubscribe$)).subscribe(mining => {
      this.isMining = mining;
      this.disableMiningButton = false;
    });

    this.miningService.isConnectable.pipe(takeUntil(this.unsubscribe$)).subscribe(connectable => {
      this.IsConnectible = connectable;
    });

    this.miningService.miningTier.pipe(takeUntil(this.unsubscribe$)).subscribe(miningTier => {
      
      let tierKey = 'mining.ThirdTier';
      if(miningTier === 1){
        tierKey = 'mining.FirstTier';
      }
      else if(miningTier === 2){
        tierKey = 'mining.SecondTier';
      }
      else if (miningTier === 3){
        tierKey = 'mining.ThirdTier';
      }
      else if (miningTier === 4){
        tierKey = 'mining.Fourth';
      }
      
      this.translateService.get(tierKey).subscribe(text => {
        this.miningTierText = text;
      });

    });

    this.delegateAccount = this.configService.delegateAccount;

    if (this.miningService.isCurrentlyMining) {
      this.queryIpMode();
    }
  }

  queryIpMode(){
    this.miningService.callQueryMiningIPMode().then(ipmode => {
      let mode:number = ipmode;
      this.ipmodeText = '';
      if(ipmode === IpMode.IPv4){

        this.ipmodeText = 'Ipv4';
      }
      if(ipmode === IpMode.IPv6){
        this.ipmodeText = 'Ipv6';
      }
      if(ipmode === IpMode.Both){
        this.ipmodeText = 'Ipv4 & Ipv6';
      }

    });
  }
  private getMiningPortConnectableFromServer() {
    this.serverConnectionService.callQueryMiningPortConnectable().then(connectable => {
      this.IsConnectible = connectable;
    });
  }

  get IsConnectible(): boolean {
    return this.isConnectable;
  }
  set IsConnectible(value: boolean) {
      this.isConnectable = value;

      let port = '33888';

      if (AppConfig.testnet) {
        port = '33887';
      }
      if (AppConfig.devnet) {
        port = '33886';
      }
      this.translateService.get((this.isConnectable ? 'mining.PortConnectable' : 'mining.PortNotConnectable')).subscribe(text => {
        this.connectibleText = text.replace('33888', port);
      });

    
      // if (this.isConnectable === false) {
      //   this.translateService.get('mining.Miningportalert').subscribe(text => {
      //     this.miningportalert = text.replace('33888', port);
      //   });
      // } else {
      //   this.miningportalert = '';
      // }
  }

  toggleMining() {
    if (this.isMining === true) {
      this.stopMining();
    } else {
      this.startMining();
    }
  }

  startMining() {
    if(this.isConnectable === false){
      this.translateService.get('mining.PortNotConnectableCantMine').subscribe(message => {
        alert(message);
      });
      
      return;
    }
    this.disableMiningButton = true;
    this.miningService.startMining();
  }

  stopMining() {
    this.disableMiningButton = false;
    this.miningService.stopMining();
  }

  save() {
    this.configService.delegateAccount = this.delegateAccount;
    this.configService.saveSettings();
  }

  showSortingOrder(): boolean {

    return this.selectedStrategy === 'CreationTimeStrategy' || this.selectedStrategy === 'TransactionSizeStrategy';

  }

  showTimeSortingOrder(): boolean {

    return this.selectedStrategy === 'HighestTipStrategy';

  }

  showTipSortingOrder(): boolean {

    return this.selectedStrategy === 'HighestTipStrategy';

  }

  showSizeSortingOrder(): boolean {

    return this.selectedStrategy === 'TransactionSizeStrategy';

  }
}
