import { Injectable, OnInit, OnDestroy } from '@angular/core';
import { BlockChain, NO_BLOCKCHAIN, NEURALIUM_BLOCKCHAIN, CONTRACT_BLOCKCHAIN, SECURITY_BLOCKCHAIN, ChainStatus } from '../model/blockchain';
import { Observable, BehaviorSubject } from 'rxjs';
import { WalletService } from './wallet.service';
import { ServerConnectionService } from './server-connection.service';
import { BlockchainInfo, NO_BLOCKCHAIN_INFO, BlockInfo, DigestInfo } from '../model/blockchain-info';
import { EventTypes } from '../model/serverConnectionEvent';
import moment, * as momentObj from 'moment';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class BlockchainService implements OnInit, OnDestroy {
  blockchains: Array<BlockChain>;
  selectedBlockchain: BehaviorSubject<BlockChain> = new BehaviorSubject<BlockChain>(NO_BLOCKCHAIN);
  currentBlockchain: BlockChain = NO_BLOCKCHAIN;

  remainingTimeForNextBlock : BehaviorSubject<number> = new BehaviorSubject<number>(0);


  blockchainInfo: BehaviorSubject<BlockchainInfo> = new BehaviorSubject<BlockchainInfo>(NO_BLOCKCHAIN_INFO);
  currentBlockchainInfo: BlockchainInfo = NO_BLOCKCHAIN_INFO;

  private currentRemainingTimeVal = new Date(0, 0, 0, 0, 0, 0);
  private totalRemainingTime: number = 0;
  private remainingTimePercent: number;
  private tempTime: number = 0;
  private timer: NodeJS.Timeout;

  
  constructor(private walletService: WalletService, private serverConnectionService: ServerConnectionService) {
    this.subscribeToBlockchainEvents();

    this.remainingTimeForNextBlock.pipe(takeUntil(this.unsubscribe$)).subscribe(seconds => {
      this.totalRemainingTime = seconds;
      this.tempTime = seconds;
      
      this.currentRemainingTime.setSeconds(this.tempTime);
      this.remainingTimePercent = (this.totalRemainingTime - this.tempTime) / this.totalRemainingTime * 100;
      if (this.timer) {
        clearTimeout(this.timer);
      }
      this.updateRemainingTime();
    });
  }

  get currentRemainingTime(): Date {
    return this.currentRemainingTimeVal;
  }

  get showRemainingTime(): boolean {
    return this.tempTime > 0;
  }

  updateRemainingTime() {
    this.timer = setTimeout(() => {
      this.tempTime--;
      this.currentRemainingTimeVal = new Date(0, 0, 0, 0, 0, 0);
      this.currentRemainingTimeVal.setSeconds(this.tempTime);
      this.remainingTimePercent = (this.totalRemainingTime - this.tempTime) / this.totalRemainingTime * 100;
      if (this.tempTime === 0) {
        clearTimeout(this.timer);
      }
      else {
        this.updateRemainingTime();
      }
    }, 1000);
  }


  ngOnInit() {

  }

  private unsubscribe$ = new Subject<void>();


  ngOnDestroy(): void {
       this.unsubscribe$.next();
       this.unsubscribe$.complete();
     }

  runApiQuery(method:string, parameters:string): Promise<string>{

    return new Promise<string>((resolve, reject) => {
      if(this.currentBlockchain && this.currentBlockchain.id && this.currentBlockchain.id !== 0){
        this.serverConnectionService.callQueryApi(this.currentBlockchain.id, method, parameters).then(json => {
          resolve(json);
        }).catch(error => {
          reject(error);
        });
      }
      else{
        resolve(null);
      }
    });


  }

  queryBlockJson(blockId:number): Promise<string>{

    return new Promise<string>((resolve, reject) => {

      if(this.currentBlockchain && this.currentBlockchain.id && this.currentBlockchain.id !== 0){
        this.serverConnectionService.callQueryBlock(this.currentBlockchain.id, blockId).then(json => {
          resolve(json);
        }).catch(error => {
          reject(error);
        });
      }
      else{
        resolve(null);
      }
    });
  }

  subscribeToBlockchainEvents() {
    this.serverConnectionService.eventNotifier.pipe(takeUntil(this.unsubscribe$)).subscribe(event => {
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

    var blockTimestamp: Date =  moment.utc(infos["timestamp"]).toDate();
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
    var digestTimestamp: Date =  moment.utc(infos["digestTimestamp"]).toDate();
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
            if (blockchain["enabled"]) {
              if (blockchain["id"] === NEURALIUM_BLOCKCHAIN.id) {
                this.blockchains.push(NEURALIUM_BLOCKCHAIN);
              }
              else if (blockchain["id"] === SECURITY_BLOCKCHAIN.id) {
                this.blockchains.push(SECURITY_BLOCKCHAIN);
              }
              else if (blockchain["id"] === CONTRACT_BLOCKCHAIN.id) {
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

  updateChainStatus(): Promise<ChainStatus>{

    return new Promise<ChainStatus>((resolve, reject) => {

      if(this.currentBlockchain && this.currentBlockchain.id && this.currentBlockchain.id !== 0){
        this.serverConnectionService.callQueryChainStatus(this.currentBlockchain.id).then(chainStatus => {
          resolve(chainStatus);
        }).catch(error => {
          reject(error);
        });
      }
      else{
        resolve(null);
      }
    });


  }
}
