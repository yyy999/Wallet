import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { BlockchainService } from './blockchain.service';
import { ServerConnectionService } from './server-connection.service';
import { WalletService } from './wallet.service';
import { BlockChain, NEURALIUM_BLOCKCHAIN } from '../model/blockchain';
import { NO_WALLET_ACCOUNT, WalletAccountStatus } from '../model/walletAccount';
import { TotalNeuralium, NO_NEURALIUM_TOTAL } from '../model/total-neuralium';
import { CONNECTED, EventTypes, ServerConnectionEvent } from '../model/serverConnectionEvent';
import { TimelineDay, TimelineHeader } from '../model/timeline';

const CURRENT_DAY_INDEX : number = 0;

@Injectable({
  providedIn: 'root'
})
export class NeuraliumService {
  private showNeuraliumTotal: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  private neuraliumTotal: BehaviorSubject<TotalNeuralium> = new BehaviorSubject<TotalNeuralium>(NO_NEURALIUM_TOTAL);

  private accountUUid: string;
  private timelineHeader: TimelineHeader;
  private timelineCurrentIndex: number;
  private timelineDays: Array<TimelineDay>;
  private timeline: BehaviorSubject<Array<TimelineDay>> = new BehaviorSubject<Array<TimelineDay>>(this.timelineDays);
  
  private canGoNextBS: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  private canGoPreviousBS: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  constructor(
    private blockchainService: BlockchainService,
    private serverConnectionService: ServerConnectionService,
    private walletService: WalletService
  ) {
    this.serverConnectionService.isConnectedToServer().subscribe(connected => {
      if (connected === CONNECTED) {
        this.blockchainService.getSelectedBlockchain().subscribe(blockchain => {
          this.displayNeuraliums(blockchain);
        });

        this.walletService.getCurrentAccount().subscribe(account => {
          this.accountUUid = account.accountUuid;
          if (account !== NO_WALLET_ACCOUNT && account.isActive) {
            this.startTimeline();
          }
        });
      }
    })
  }

  manageEvent(event:ServerConnectionEvent){
    if(event.eventType === EventTypes.MiningPrimeElected
      || event.eventType === EventTypes.TransactionConfirmed
      || event.eventType === EventTypes.TransactionReceived
      || event.eventType === EventTypes.TransactionSent
      || event.eventType === EventTypes.TransactionCreated){

        if(this.timelineCurrentIndex === CURRENT_DAY_INDEX){
          this.getMiningTimelineSection();
        }

      }
  }

  getNeuraliumTotal(): Observable<TotalNeuralium> {
    return this.neuraliumTotal;
  }

  getShowNeuraliumTotal(): Observable<boolean> {
    return this.showNeuraliumTotal;
  }

  private updateNeuraliumsTotal(accountUuid: any) {
    this.serverConnectionService.callQueryAccountTotalNeuraliums(accountUuid).then(totalNeuralium => {
      this.neuraliumTotal.next(totalNeuralium);
    });
  }

  private displayNeuraliums(blockchain: BlockChain) {
    if (blockchain === NEURALIUM_BLOCKCHAIN && blockchain.menuConfig.showDashboard) {
      this.walletService.getCurrentAccount().subscribe(account => {
        if (account != void (0) && account != NO_WALLET_ACCOUNT && account.isActive && account.status == WalletAccountStatus.Published) {//&& account.isActive && account.status == WalletAccountStatus.Published
          this.updateNeuraliumsTotal(account.accountUuid);
          this.showNeuraliumTotal.next(true);

          this.serverConnectionService.eventNotifier.subscribe(event => {
            if (event.eventType === EventTypes.AccountTotalUpdated) {
              this.updateNeuraliumsTotal(account.accountUuid);
            }
          })
        }
        else {
          this.showNeuraliumTotal.next(false);
        }
      })
    }
  }


  get neuraliumTimeline(): Observable<Array<TimelineDay>> {
    return this.timeline;
  }

  startTimeline() {
    if (this.accountUUid !== void (0)) {
      this.initialiseTimeline();
      this.serverConnectionService.eventNotifier.subscribe(event =>{
          this.manageEvent(event);
      });
    }
  }

  initialiseTimeline(){
    this.timelineCurrentIndex = 0;
    this.timelineDays = new Array<TimelineDay>();
    this.serverConnectionService.callQueryNeuraliumTimelineHeader(this.accountUUid).then(header => {
      this.timelineHeader = header;
      this.getMiningTimelineSection();
    });
  }

  incrementTimelineIndexAndLoad() {
    if (this.timelineCurrentIndex > 0) {
      this.timelineCurrentIndex--;
      this.getMiningTimelineSection();
    }
    
  }

  decrementTimelineIndexAndLoad() {
    if (this.timelineCurrentIndex < this.timelineHeader.numberOfDays - 1) {
      this.timelineCurrentIndex++;
      this.getMiningTimelineSection();
    }
  }


  private getMiningTimelineSection() {
    this.serverConnectionService.callQueryNeuraliumTimelineSection(this.accountUUid, this.timelineHeader.firstDay, this.timelineCurrentIndex, 1).then(sections => {
      this.timelineDays = [];
      sections.forEach(section => {
        this.timelineDays.push(section);
      });
      this.timeline.next(this.timelineDays);
      this.calculateIndexMoves();
    })
  }

  private calculateIndexMoves(){
    this.canGoPreviousBS.next(this.timelineCurrentIndex < this.timelineHeader.numberOfDays - 1);
    this.canGoNextBS.next(this.timelineCurrentIndex > 0);
  }

  get canIncrementIndex():Observable<boolean>{
    return this.canGoPreviousBS;
   
  }

  get canDecrementIndex():Observable<boolean>{
    return this.canGoNextBS;
  }
}
