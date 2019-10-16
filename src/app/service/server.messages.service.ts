import { Injectable, OnInit } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { WalletService } from './wallet.service';
import { ServerConnectionService } from './server-connection.service';
import { EventTypes } from '../model/serverConnectionEvent';

@Injectable({
  providedIn: 'root'
})
export class ServerMessagesService implements OnInit {
  
  messages: BehaviorSubject<string> = new BehaviorSubject<string>('');

  constructor(private walletService: WalletService, private serverConnectionService: ServerConnectionService) {
    this.subscribeToServerEvents();
  }

  public callback:(message: string) => void; 

  ngOnInit() {

  }
  subscribe(callback:(message: string) => void){
      this.callback = callback;
  }

  subscribeToServerEvents() {
    this.serverConnectionService.eventNotifier.subscribe(event => {
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
