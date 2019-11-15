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


  get neuraliumTimeline(): Observable<Array<TimelineDay>> {
    return this.timeline;
  }

  get canIncrementIndex():Observable<boolean>{
    return this.canGoPreviousBS;
   
  }

  get canDecrementIndex():Observable<boolean>{
    return this.canGoNextBS;
  }
  private showNeuraliumTotal: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  private neuraliumTotal: BehaviorSubject<TotalNeuralium> = new BehaviorSubject<TotalNeuralium>(NO_NEURALIUM_TOTAL);

  private accountUUid: string;
  private timelineHeader: TimelineHeader;
  private timelineCurrentIndex: number;
  private timelineDays: Array<TimelineDay>;
  private timeline: BehaviorSubject<Array<TimelineDay>> = new BehaviorSubject<Array<TimelineDay>>(this.timelineDays);
  
  private canGoNextBS: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  private canGoPreviousBS: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  timelineStated:boolean = false;

  manageEvent(event:ServerConnectionEvent){
    if(event.eventType === EventTypes.MiningPrimeElected
      || event.eventType === EventTypes.NeuraliumMiningPrimeElected
      || event.eventType === EventTypes.TransactionConfirmed
      || event.eventType === EventTypes.TransactionReceived
      || event.eventType === EventTypes.TransactionSent
      || event.eventType === EventTypes.TransactionCreated){

        if(this.timelineCurrentIndex === CURRENT_DAY_INDEX){
          this.getMiningTimelineSection(true);
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
        if (account && account !== NO_WALLET_ACCOUNT && account.isActive && account.status === WalletAccountStatus.Published) {//&& account.isActive && account.status === WalletAccountStatus.Published
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
  startTimeline() {
    if (this.accountUUid && this.timelineStated === false) {
      this.initialiseTimeline(false);
      this.serverConnectionService.eventNotifier.subscribe(event =>{
          this.manageEvent(event);
      });
      this.timelineStated = true;
    }
  }

  initialiseTimeline(force:boolean):Promise<TimelineHeader>{
    if(this.timelineStated === false || force === true) {
      this.timelineCurrentIndex = 0;
      this.timelineDays = new Array<TimelineDay>();
      var response = this.serverConnectionService.callQueryNeuraliumTimelineHeader(this.accountUUid);
      response.then(header => {
        this.timelineHeader = header;
        this.getMiningTimelineSection(false);
      });

      return response;
    }
    return null;
  }

  incrementTimelineIndexAndLoad() {
    if (this.timelineCurrentIndex > 0) {
      this.timelineCurrentIndex--;
      this.getMiningTimelineSection(true);
    }
    
  }

  decrementTimelineIndexAndLoad() {
    if (this.timelineCurrentIndex < this.timelineHeader.numberOfDays - 1) {
      this.timelineCurrentIndex++;
      this.getMiningTimelineSection(true);
    }
  }


  private getMiningTimelineSection(getMissingHeader:boolean) {

    if(this.timelineHeader.numberOfDays === 0 && getMissingHeader){
      // we dont have a proper header, lets query it again
      var promise = this.initialiseTimeline(true);
      promise.then(header => {
        this.timelineHeader = header;
        this.getMiningTimelineSection(false);
      });
    }
    else{
      this.serverConnectionService.callQueryNeuraliumTimelineSection(this.accountUUid, this.timelineHeader.firstDay, this.timelineCurrentIndex, 1).then(sections => {
        this.timelineDays = [];
        sections.forEach(section => {
          this.timelineDays.push(section);
        });
        this.timeline.next(this.timelineDays);
        this.calculateIndexMoves();
      });
    }
  }

  private calculateIndexMoves(){
    this.canGoPreviousBS.next(this.timelineCurrentIndex < this.timelineHeader.numberOfDays - 1);
    this.canGoNextBS.next(this.timelineCurrentIndex > 0);
  }
}
