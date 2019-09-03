import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ServerConnectionService } from './server-connection.service';
import { BlockchainService } from './blockchain.service';
import { TranslateService } from '@ngx-translate/core';
import { EventTypes } from '../model/serverConnectionEvent';

const NO_BLOCKCHAIN_ID = 0;
const MINING = true;

export class MiningEvent {
  timestamp: Date;
  eventName: string;

  static create(eventName: string): MiningEvent {
    let event = new MiningEvent();
    event.timestamp = new Date(Date.now());
    event.eventName = eventName;
    return event;
  }
}

@Injectable({
  providedIn: 'root'
})
export class MiningService {
  isMining: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(!MINING);
  currentBlockchainId: number = NO_BLOCKCHAIN_ID;
  public miningEventsList: Array<MiningEvent> = [];
  private miningEvents: BehaviorSubject<Array<MiningEvent>> = new BehaviorSubject<Array<MiningEvent>>(this.miningEventsList);

  

  constructor(
    private serverConnection: ServerConnectionService,
    private blockchainService: BlockchainService,
    private translate: TranslateService) {
    this.blockchainService.selectedBlockchain.subscribe(blockchain => {
      this.currentBlockchainId = blockchain.id;
      this.checkServerIsMiningEnabled();
      this.startListeningMiningEvents();
    });
    
    
  }

  checkServerIsMiningEnabled() {
    if (this.currentBlockchainId != NO_BLOCKCHAIN_ID) {
      this.serverConnection.callIsMiningEnabled(this.currentBlockchainId).then(response => {
        this.isMining.next(response);
      })
    }
  }

  startMining() {
    if (this.currentBlockchainId != NO_BLOCKCHAIN_ID) {
      this.serverConnection.callStartMining(this.currentBlockchainId, null).then(response => {
        this.isMining.next(MINING);
      })
    }
  }

  stopMining() {
    if (this.currentBlockchainId != NO_BLOCKCHAIN_ID) {
      this.serverConnection.callStopMining(this.currentBlockchainId).then(response => {
        this.isMining.next(!MINING);
      })
    }
  }

  startListeningMiningEvents() {
    this.serverConnection.eventNotifier.subscribe(event => {
      switch (event.eventType) {
        case EventTypes.MiningBountyAllocated:
          this.addEvent(this.translate.instant("event.MiningBountyAllocated"));
          break;
        case EventTypes.MiningStarted:
          this.addEvent(this.translate.instant("event.MiningStarted"));
          break;
        case EventTypes.MiningEnded:
          this.addEvent(this.translate.instant("event.MiningEnded"));
          break;
        case EventTypes.MiningElected:
          this.addEvent(this.translate.instant("event.MiningElected"));
          break;
        case EventTypes.MiningPrimeElected:
          this.addEvent(this.translate.instant("event.MiningPrimeElected"));
          break;
        case EventTypes.MiningStatusChanged:
          this.addEvent(this.translate.instant("event.MiningStatusChanged"));
          break;
        default:
          break;
      }
    })
  }

  getMiningEvents(): Observable<Array<MiningEvent>> {
    return this.miningEvents;
  }

  private addEvent(eventName: string) {
    this.miningEventsList.push(MiningEvent.create(eventName));
  }

}
