import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ServerConnectionService } from './server-connection.service';
import { BlockchainService } from './blockchain.service';
import { TranslateService } from '@ngx-translate/core';
import { EventTypes } from '../model/serverConnectionEvent';
import * as moment from 'moment';

const NO_BLOCKCHAIN_ID = 0;

export class MiningEvent {
  timestamp: Date;
  eventName: string;

  static create(eventName: string): MiningEvent {
    let event = new MiningEvent();
    event.timestamp = moment().toDate();
    event.eventName = eventName;
    return event;
  }
}

@Injectable({
  providedIn: 'root'
})
export class MiningService {
  isMining: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  currentBlockchainId: number = NO_BLOCKCHAIN_ID;
  public miningEventsList: Array<MiningEvent> = [];
  private miningEvents: BehaviorSubject<Array<MiningEvent>> = new BehaviorSubject<Array<MiningEvent>>(this.miningEventsList);

  isConnectable: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(null);


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
    if (this.currentBlockchainId !== NO_BLOCKCHAIN_ID) {
      this.serverConnection.callIsMiningEnabled(this.currentBlockchainId).then(response => {
        this.isMining.next(response);
      })
    }
  }

  startMining() {
    if (this.currentBlockchainId !== NO_BLOCKCHAIN_ID) {
      this.serverConnection.callStartMining(this.currentBlockchainId, null).then(response => {
          // the answer means nothing. we must wait for the event
      })
    }
  }

  stopMining() {
    if (this.currentBlockchainId !== NO_BLOCKCHAIN_ID) {
      this.serverConnection.callStopMining(this.currentBlockchainId).then(response => {
        this.isMining.next(false);
      })
    }
  }

  startListeningMiningEvents() {
    this.serverConnection.eventNotifier.subscribe(event => {
      switch (event.eventType) {
       
        case EventTypes.NeuraliumMiningBountyAllocated:
          this.addEvent(this.translate.instant("event.NeuraliumMiningBountyAllocated"));
          break;
        case EventTypes.MiningStarted:
          this.addEvent(this.translate.instant("event.MiningStarted"));
          this.isMining.next(true);
          break;
        case EventTypes.MiningEnded:
          this.addEvent(this.translate.instant("event.MiningEnded"));
          this.isMining.next(false);
          break;
        case EventTypes.MiningElected:
          this.addEvent(this.translate.instant("event.MiningElected"));
          break;
        case EventTypes.MiningPrimeElected:
          //this.addEvent(this.translate.instant("event.MiningPrimeElected"));
          break;
        case EventTypes.NeuraliumMiningPrimeElected:
           this.addEvent(this.translate.instant("event.MiningPrimeElected"));
            break;
        case EventTypes.MiningStatusChanged:
          //this.addEvent(this.translate.instant("event.MiningStatusChanged"));
          this.isMining.next(event.message);
          break;
          case EventTypes.ConnectableStatusChanged:
            this.isConnectable.next(event.message.connectable);
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
