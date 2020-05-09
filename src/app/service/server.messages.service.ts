import { Injectable, OnInit, OnDestroy } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { WalletService } from './wallet.service';
import { ServerConnectionService } from './server-connection.service';
import { EventTypes } from '../model/serverConnectionEvent';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class ServerMessagesService implements OnInit, OnDestroy {
  
  messages: BehaviorSubject<string> = new BehaviorSubject<string>('');

  constructor(private walletService: WalletService, private serverConnectionService: ServerConnectionService) {
    this.subscribeToServerEvents();
  }

  public callback:(message: string) => void; 

  ngOnInit() {

  }

  private unsubscribe$ = new Subject<void>();


  ngOnDestroy(): void {
       this.unsubscribe$.next();
       this.unsubscribe$.complete();
     }

  subscribe(callback:(message: string) => void){
      this.callback = callback;
  }

  subscribeToServerEvents() {
    this.serverConnectionService.eventNotifier.pipe(takeUntil(this.unsubscribe$)).subscribe(event => {
      switch (event.eventType) {
        case EventTypes.Message:
          if( this.callback){
            console.log(event.message);
           this.callback(event.message);
          }
          break;
        default:
          break;
      }
    })
  }

  updateServermessages(message: string) {
    this.messages.next(message);
  }


  getMessages(): Observable<string> {
    return this.messages;
  }
}
