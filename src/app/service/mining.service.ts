import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ServerConnectionService } from './server-connection.service';
import { BlockchainService } from './blockchain.service';
import { ConfigService } from './config.service';

import { TranslateService } from '@ngx-translate/core';
import { EventTypes } from '../model/serverConnectionEvent';
import * as moment from 'moment';
import { NotificationService } from './notification.service';
import { MiningHistory } from '../model/mining-history';

const NO_BLOCKCHAIN_ID = 0;
const MAXIMUM_MESSAGE_COUNT = 30;

export class MiningEvent {
  timestamp: Date;
  eventName: string;

  static create(eventName: string): MiningEvent {
    const event = new MiningEvent();
    event.timestamp = moment().toDate();
    event.eventName = eventName;
    return event;
  }
}

export enum MiningStatus {
  Unknown = 0,
  Mining = 1,
  IpUsed = 2,
  Error = 255
}


@Injectable({
  providedIn: 'root'
})
export class MiningService {
  isMining: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  currentBlockchainId: number = NO_BLOCKCHAIN_ID;
  public miningEvents: Array<MiningEvent> = new Array<MiningEvent>();

  isConnectable: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(null);


  constructor(
    private serverConnection: ServerConnectionService,
    private blockchainService: BlockchainService,
    private translate: TranslateService,
    private notificationService: NotificationService,
    private configService: ConfigService) {
    this.blockchainService.selectedBlockchain.subscribe(blockchain => {

      this.currentBlockchainId = blockchain.id;

      if (this.currentBlockchainId !== 0) {
        this.checkServerIsMiningEnabled();
        this.startListeningMiningEvents();
      }
    });

  }

  queryMiningHistory() {

    this.serverConnection.callQueryMiningHistory(this.currentBlockchainId, 0, 0, this.LogLevel).then(result => {
      this.miningEvents.length = 0;
      for (let i = 0; i < result.length; i++) {
        this.formatEvent(result[i]);
      }
    });
  }

  checkServerIsMiningEnabled() {
    if (this.currentBlockchainId !== NO_BLOCKCHAIN_ID) {
      this.serverConnection.callIsMiningEnabled(this.currentBlockchainId).then(response => {
        this.isMining.next(response);
        if (response) {
          this.queryMiningHistory();
        }
      });
    }
  }

  startMining() {
    if (this.currentBlockchainId !== NO_BLOCKCHAIN_ID) {
      this.serverConnection.callStartMining(this.currentBlockchainId, null).then(response => {
        // the answer means nothing. we must wait for the event
        if (response) {
          this.queryMiningHistory();
        }
      });
    }
  }

  stopMining() {
    if (this.currentBlockchainId !== NO_BLOCKCHAIN_ID) {
      this.serverConnection.callStopMining(this.currentBlockchainId).then(response => {
        this.isMining.next(false);
        this.miningEvents.length = 0;
      });
    }
  }

  startListeningMiningEvents() {
    this.serverConnection.eventNotifier.subscribe(event => {
      switch (event.eventType) {

        case EventTypes.NeuraliumMiningBountyAllocated:
          this.addEvent(this.translate.instant('event.NeuraliumMiningBountyAllocated'));
          this.notificationService.showSuccess('Bounty has been allocated.', 'Bounty Allocated');
          break;
        case EventTypes.MiningStarted:
          this.addEvent(this.translate.instant('event.MiningStarted'));
          this.isMining.next(true);
          this.notificationService.showSuccess('Neuralium mining started.', 'Start Mining');

          break;
        case EventTypes.MiningEnded:
          this.addEvent(this.translate.instant('event.MiningEnded'));
          this.isMining.next(false);

          switch (event.message.status) {
            case MiningStatus.Unknown:
            case MiningStatus.Error:
              this.notificationService.showWarn('Neuralium mining stopped. Unknown reason.', 'Stop Mining');
              break;
            case MiningStatus.IpUsed:
              this.notificationService.showWarn('Neuralium mining stopped. The IP is already registered to another account.', 'Stop Mining');
              break;
          }

          break;
        case EventTypes.MiningElected:

          if (event.message.level <= this.LogLevel) {
            this.addEvent(this.translate.instant('event.MiningElected'));

            this.notificationService.showSuccess('you are candidate.', 'Candidate');
          }

          break;
        case EventTypes.MiningPrimeElected:
          // we listen to the neuralium version instead
          // this.addEvent(this.translate.instant("event.MiningPrimeElected"));
          break;
        case EventTypes.MiningPrimeElectedMissed:
          if (event.message.level <= this.LogLevel) {
            this.addEvent(this.translate.instant('event.MiningPrimeElectedMissed') + event.message.electionBlockId);
            this.notificationService.showInfo('We were not elected in candidature from block ' + event.message.electionBlockId, 'Election missed');
          }

          break;
        case EventTypes.NeuraliumMiningPrimeElected:
          if (event.message.level <= this.LogLevel) {
            this.addEvent(this.translate.instant('event.MiningPrimeElected'));
            this.notificationService.showSuccess('You\'ve been elected.', 'Elected');
          }

          break;
        case EventTypes.MiningStatusChanged:
          // this.addEvent(this.translate.instant("event.MiningStatusChanged"));
          this.isMining.next(event.message);
          break;
        case EventTypes.ConnectableStatusChanged:
          this.isConnectable.next(event.message.connectable);
          break;
        default:
          break;
      }
    });
  }

  get LogLevel(): number {
    return Number(this.configService.miningLogLevel);
  }

  getMiningEvents(): Array<MiningEvent> {
    return this.miningEvents;
  }

  private addEvent(event: string) {

    if (this.miningEvents.length > MAXIMUM_MESSAGE_COUNT) {
      this.miningEvents.shift();
    }
    this.miningEvents.unshift(MiningEvent.create(event));
  }

  private addEvent2(history: MiningHistory) {

    if (this.miningEvents.length > MAXIMUM_MESSAGE_COUNT) {
      this.miningEvents.shift();
    }
   // this.miningEvents.unshift(MiningEvent.create(event));
  }

  private formatEvent(event: MiningHistory): void {

    switch (event.message) {
      case EventTypes.NeuraliumMiningBountyAllocated:
          this.addEvent(this.translate.instant('event.NeuraliumMiningBountyAllocated'));
          break;
        case EventTypes.MiningStarted:
          this.addEvent(this.translate.instant('event.MiningStarted'));
          this.isMining.next(true);

          break;
        case EventTypes.MiningEnded:
          this.addEvent(this.translate.instant('event.MiningEnded'));

          break;
      case EventTypes.MiningElected:

          if (event.level <= this.LogLevel) {
            this.addEvent(this.translate.instant('event.MiningElected'));
          }

          break;
      case EventTypes.MiningPrimeElectedMissed:
          if (event.level <= this.LogLevel) {
            this.addEvent(this.translate.instant('event.MiningPrimeElectedMissed') + event.blockId);
          }

          break;
      case EventTypes.NeuraliumMiningPrimeElected:
        if (event.level <= this.LogLevel) {
          this.addEvent(this.translate.instant('event.MiningPrimeElected'));
        }

        break;
    }
  }
}
