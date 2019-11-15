import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { MatDialog } from '@angular/material';
import { BlockchainService } from '../..//service/blockchain.service';
import { ServerConnectionService } from '../..//service/server-connection.service';
import { NO_BLOCKCHAIN_INFO, BlockchainInfo } from '../..//model/blockchain-info';


@Component({
  selector: 'app-tools-blockexplorer',
  templateUrl: './blockexplorer.component.html',
  styleUrls: ['./blockexplorer.component.scss']
})
export class BlockExplorerComponent implements OnInit {
 
  blockSource:object;
  blockId:number;
  blockchainInfo: BlockchainInfo = NO_BLOCKCHAIN_INFO;


  constructor(
    private blockchainService: BlockchainService,
    private serverConnection: ServerConnectionService,
    public dialog: MatDialog) { }

  ngOnInit() {
    this.initialiseValues();

    this.serverConnection.serverConnection.subscribe((connected) => {
      if(connected === true){
        this.blockchainService.getBlockchainInfo().subscribe(blockchainInfo => {
          this.blockchainInfo = blockchainInfo;
        })
      }
    });
  }

  canSearch(){
    return this.blockId > 0 && ((!this.blockchainInfo || this.blockchainInfo.blockInfo.id == 0) || this.blockId <= this.blockchainInfo.blockInfo.id);
  }

  search(){

    if(this.canSearch()){
      this.blockchainService.queryBlockJson(this.blockId).then(json => {

        if(json){
          this.blockSource = JSON.parse(json);
        }
        else{
          this.blockSource = JSON.parse('{}');
        }
      }).catch(error => console.log(error));
    }
  }

  initialiseValues(){
    this.blockSource = JSON.parse('{}');
    this.blockId = 0;
  }
}
