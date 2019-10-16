import { Component, OnInit } from '@angular/core';
import { MiningService } from '../..//service/mining.service';
import { ConfigService } from '../..//service/config.service';
import { ServerConnectionService } from '../..//service/server-connection.service';
import { CONNECTED, EventTypes } from '../..//model/serverConnectionEvent';

@Component({
  selector: 'app-mining',
  templateUrl: './mining.component.html',
  styleUrls: ['./mining.component.scss']
})
export class MiningComponent implements OnInit {

  delegateAccount:string;
  isMining:boolean;
  isConnectable:boolean;
  disableMiningButton:boolean = false;
  selectedStrategy:string;
  sortingMethod:string = 'OlderToNewer';
  tipSortingMethod:string = 'MostToLess';
  timeSortingMethod:string = 'NewerToOlder';
  sizeSortingMethod:string = 'LargerToSmaller';

  constructor(private miningService:MiningService,
    private configService:ConfigService,
    private serverConnectionService: ServerConnectionService) { 

      this.serverConnectionService.isConnectedToServer().subscribe(connected => {
        if (connected === CONNECTED) {
            this.getMiningPortConnectableFromServer();
        }
       });
    }

  ngOnInit() {
    this.miningService.isMining.subscribe(mining =>{
      this.isMining = mining;
      this.disableMiningButton = false;
    });

    this.miningService.isConnectable.subscribe(connectable =>{
      this.isConnectable = connectable;
    });

    this.delegateAccount = this.configService.delegateAccount;
  }

  private getMiningPortConnectableFromServer() {
    this.serverConnectionService.callQueryMiningPortConnectable().then(connectable => {
      this.isConnectable = connectable;
    });
  }

  toggleMining(){
    if(this.isMining===true){
      this.stopMining();
    }
    else{
      this.startMining();
    }
  }

  startMining(){
    this.disableMiningButton = true;
    this.miningService.startMining();
  }

  stopMining(){
    this.disableMiningButton = false;
    this.miningService.stopMining();
  }

  save(){
    this.configService.delegateAccount = this.delegateAccount;
    this.configService.saveSettings();
  }

  showSortingOrder():boolean{

    return this.selectedStrategy === 'CreationTimeStrategy' || this.selectedStrategy === 'TransactionSizeStrategy';

  }

  showTimeSortingOrder():boolean{

    return this.selectedStrategy === 'HighestTipStrategy';

  }

  showTipSortingOrder():boolean{

    return this.selectedStrategy === 'HighestTipStrategy';

  }

  showSizeSortingOrder():boolean{

    return this.selectedStrategy === 'TransactionSizeStrategy';

  }
}
