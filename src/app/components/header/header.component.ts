import { Component, OnInit } from '@angular/core';
import { BlockchainService } from '../../service/blockchain.service'

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {
  showNeuraliums: boolean = false;
  showNotifications: boolean = false;
  neuraliumTotal: string;

  constructor(
    private blockchainService: BlockchainService) { }

  ngOnInit() {
    this.blockchainService.selectedBlockchain.subscribe(blockchain => {
      this.showNotifications = blockchain.menuConfig.showReceive;
    })
  }

}
