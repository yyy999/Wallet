import { Component, OnInit } from '@angular/core';
import { MiningService } from '../..//service/mining.service';
import { ConfigService } from '../..//service/config.service';

@Component({
  selector: 'app-mining',
  templateUrl: './mining.component.html',
  styleUrls: ['./mining.component.scss']
})
export class MiningComponent implements OnInit {

  delegateAccount:string;
  isMining:boolean;


  constructor(private miningService:MiningService,
    private configService:ConfigService) { }

  ngOnInit() {
    this.miningService.isMining.subscribe(mining =>{
      this.isMining = mining;
    })

    this.delegateAccount = this.configService.delegateAccount;
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
    this.miningService.startMining();
  }

  stopMining(){
    this.miningService.stopMining();
  }

  save(){
    this.configService.delegateAccount = this.delegateAccount;
    this.configService.saveSettings();
  }

}
