import { Injectable, OnInit } from '@angular/core';
import { BlockChain, NO_BLOCKCHAIN, NEURALIUM_BLOCKCHAIN, CONTRACT_BLOCKCHAIN, SECURITY_BLOCKCHAIN } from '../model/blockchain';
import { Observable, BehaviorSubject } from 'rxjs';
import { WalletService } from './wallet.service';
import { ServerConnectionService } from './server-connection.service';
import { BlockchainInfo, NO_BLOCKCHAIN_INFO, BlockInfo, DigestInfo } from '../model/blockchain-info';
import { EventTypes } from '../model/serverConnectionEvent';

@Injectable({
  providedIn: 'root'
})
export class BlockchainService implements OnInit {
  blockchains: Array<BlockChain>;
  selectedBlockchain: BehaviorSubject<BlockChain> = new BehaviorSubject<BlockChain>(NO_BLOCKCHAIN);
  currentBlockchain: BlockChain = NO_BLOCKCHAIN;

  remainingTimeForNextBlock : BehaviorSubject<number> = new BehaviorSubject<number>(0);

  blockchainInfo: BehaviorSubject<BlockchainInfo> = new BehaviorSubject<BlockchainInfo>(NO_BLOCKCHAIN_INFO);
  currentBlockchainInfo: BlockchainInfo = NO_BLOCKCHAIN_INFO;

  constructor(private walletService: WalletService, private serverConnectionService: ServerConnectionService) {
    this.subscribeToBlockchainEvents();
  }

  ngOnInit() {

  }

  subscribeToBlockchainEvents() {
    this.serverConnectionService.eventNotifier.subscribe(event => {
      switch (event.eventType) {
        case EventTypes.BlockInserted:
          this.updateBlockInfos(event.message);
          break;
        case EventTypes.DigestInserted:
          this.updateDigestInfos(event.message);
          break;
        case EventTypes.BlockchainSyncEnded:
          this.updateCurrentBlockchainInfo(this.currentBlockchain.id);
          break;
        default:
          break;
      }
    })
  }

  updateBlockInfos(infos: any) {
    var blockId: number = infos["blockId"];
    var blockHash: string = infos["hash"];
    var publicBlockId: number = infos["publicBlockId"];
    var blockTimestamp = new Date(infos["timestamp"]);
    var lifespan: number = infos["lifespan"];
    var blockInfo = BlockInfo.create(blockId, blockTimestamp, blockHash, publicBlockId, lifespan);
    this.currentBlockchainInfo.blockInfo = blockInfo;
    this.blockchainInfo.next(this.currentBlockchainInfo);
    this.remainingTimeForNextBlock.next(lifespan);
  }

  updateDigestInfos(infos: any) {
    var digestId: number = infos["digestId"];
    var digestHash: string = infos["digestHash"];
    var digestBlockId: number = infos["digestBlockId"];
    var digestTimestamp: Date = new Date(infos["digestTimestamp"]);
    var publicDigestId: number = infos["publicDigestId"];
    var digestInfo = DigestInfo.create(digestId, digestBlockId, digestTimestamp, digestHash, publicDigestId);
    this.currentBlockchainInfo.digestInfo = digestInfo;
    this.blockchainInfo.next(this.currentBlockchainInfo);
  }

  updateCurrentBlockchainInfo(blockchainId: number) {
    this.serverConnectionService.callQueryBlockChainInfo(blockchainId).then(blockchainInfo => {
      this.currentBlockchainInfo = blockchainInfo;
      this.blockchainInfo.next(this.currentBlockchainInfo);
    })
  }

  getBlockchainInfo(): Observable<BlockchainInfo> {
    return this.blockchainInfo;
  }

  get CurrentBlockchainInfo(): BlockchainInfo {
    return this.currentBlockchainInfo;
  }

  set CurrentBlockchainInfo(blockchainInfo: BlockchainInfo) {
    this.currentBlockchainInfo = blockchainInfo;
    this.blockchainInfo.next(this.currentBlockchainInfo);
  }

  getAvailableBlockchains(): Promise<BlockChain[]> {
    return new Promise<BlockChain[]>((resolve, reject) => {
      this.blockchains = new Array<BlockChain>();
      this.serverConnectionService.callQuerySupportedChains()
        .then(blockchains => {
          blockchains.forEach(blockchain => {
            if (blockchain["Enabled"]) {
              if (blockchain["Id"] == NEURALIUM_BLOCKCHAIN.id) {
                this.blockchains.push(NEURALIUM_BLOCKCHAIN);
              }
              else if (blockchain["Id"] == SECURITY_BLOCKCHAIN.id) {
                this.blockchains.push(SECURITY_BLOCKCHAIN);
              }
              else if (blockchain["Id"] == CONTRACT_BLOCKCHAIN.id) {
                this.blockchains.push(CONTRACT_BLOCKCHAIN);
              }
            }
          });
        }).finally(() => {
          resolve(this.blockchains);
        })
    })
  }

  getSelectedBlockchain(): Observable<BlockChain> {
    return this.selectedBlockchain;
  }

  getCurrentBlockchain() {
    return this.currentBlockchain;
  }

  setSelectedBlockchain(blockchain: BlockChain): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      this.walletService.changeWallet(blockchain.id);
      this.currentBlockchain = blockchain;
      this.selectedBlockchain.next(this.currentBlockchain);
      this.updateCurrentBlockchainInfo(blockchain.id);
      resolve(true);
    })
  }
}
