import { Component, OnInit } from '@angular/core';
import { trigger, state, style, animate, transition } from '@angular/animations';
import { NeuraliumService } from '../..//service/neuralium.service';
import { TimelineDay, TimelineEntry, EntryType } from '../..//model/timeline';
import { ContactsService } from '../..//service/contacts.service';
import { NO_NEURALIUM_TRANSACTION, NeuraliumTransaction } from '../..//model/transaction';
import { TransactionsService } from '../..//service/transactions.service';
import { NotificationService } from '../..//service/notification.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-neuraliums-history',
  templateUrl: './neuraliums-history.component.html',
  styleUrls: ['./neuraliums-history.component.scss'],
  animations:[
    trigger('sizeChange',[
      state('close',style({
        display: 'none',
        height:'0%',
        opacity:0
      })),
      state('open',style({
        height:'90%',
        opacity:1
      })),
      transition('*=>close',animate(300)),
      transition('*=>open',animate(300))
    ])
  ]
})
export class NeuraliumsHistoryComponent implements OnInit {
  timeline: TimelineDay[];
  canGoNext: boolean;
  canGoPrevious: boolean;

  constructor(
    private contactService: ContactsService,
    private neuraliumService: NeuraliumService,
    private transactionService: TransactionsService,
    private notificationService: NotificationService,
    private translateService : TranslateService) {

  }

  ngOnInit() {
    this.neuraliumService.neuraliumTimeline.subscribe(timeline => {
      this.timeline = timeline;
    });

    this.neuraliumService.canIncrementIndex.subscribe(response => {
      this.canGoPrevious = response;

    });

    this.neuraliumService.canDecrementIndex.subscribe(response => {
      this.canGoNext = response;
    });
  }

  isDebit(entry: TimelineEntry): boolean {
    return entry.type === EntryType.debit;
  }

  isCredit(entry: TimelineEntry): boolean {
    return entry.type === EntryType.credit;
  }

  isMining(entry: TimelineEntry): boolean {
    return entry.type === EntryType.mining;
  }

  nextPeriod() {
    this.neuraliumService.incrementTimelineIndexAndLoad();
  }

  previousPeriod() {
    this.neuraliumService.decrementTimelineIndexAndLoad();
  }

  getAccountName(accountId: string) {
    var contact = this.contactService.getContact(accountId);
    if (contact !== undefined) {
      return "- " + contact.friendlyName;
    }
    else {
      return "";
    }
  }

  showTransaction(entry: TimelineEntry) {
    if(this.isMining(entry)){
      // we do nothing on mining entries
      return;
    }

    if (!entry.transaction || entry.transaction === NO_NEURALIUM_TRANSACTION) {
      this.transactionService.getTransactionDetails(entry.transactionId)
        .then(transaction => {
          if (transaction) {
            entry.transaction = <NeuraliumTransaction>transaction;
            entry.showDetails = true;
            entry.lightState = 'close';
            entry.detailsState = 'open';
          }
          else {
            this.translateService.get("neuralium.NoTransaction").subscribe(message =>{
              this.notificationService.showWarn(message);
            })
          }
        })
    }
    else {
      entry.showDetails = true;
      entry.lightState = 'close';
      entry.detailsState = 'open';
    }
  }

  hideTransaction(entry: TimelineEntry) {

    if(this.isMining(entry)){
      // we do nothing on mining entries
      return;
    }

    entry.showDetails = false;
    entry.lightState = 'open';
      entry.detailsState = 'close';
  }

}
