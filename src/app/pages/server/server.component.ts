import { Component, ChangeDetectionStrategy, OnInit, ElementRef, ViewChild, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { ConfigService } from '../../service/config.service';
import { NotificationService } from '../../service/notification.service';
import { ServerConnectionService, ServerMessage } from '../..//service/server-connection.service';
import { ServerMessagesService } from '../..//service/server.messages.service';
import { CONNECTED, EventTypes } from '../..//model/serverConnectionEvent';

@Component({
  selector: 'app-server',
  templateUrl: './server.component.html',
  styleUrls: ['./server.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ServerComponent implements OnInit {

  @ViewChild('Console', null) private consoleContainer: ElementRef;
  
  icon = "fas fa-server";
  serverMessages:Array<ServerMessage> = [];
  showServerNotConnected: boolean = true;
  canManuallyStopServer: boolean = false;
  manuallyOpened: boolean = false;

  constructor(
    private notificationService: NotificationService,
    private configService: ConfigService,
    private translateService: TranslateService,
    private serverConnectionService: ServerConnectionService,
    private serverMessagesService: ServerMessagesService,
    private cdr: ChangeDetectorRef,
    private router: Router) {

      // should we set this?
      this.manuallyOpened = true;
  }

  ngOnInit() {
    this.serverMessages = this.serverConnectionService.getMessages();

    this.serverMessagesService.subscribe((message) => {

      if (message) {
        this.updateMessages();
      }
    });

    this.updateMessages();
    this.scrollToBottom();

    this.serverConnectionService.isConnectedToServer().subscribe(connected => {
      this.showServerNotConnected = !connected;
      if (connected != CONNECTED) {
        this.serverConnectionService.tryConnectToServer();
      }
      else {
        
        if (!this.manuallyOpened) {
          
        }
        
      }
    })
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  updateMessages() {
    if(this.router.isActive){
      setTimeout(() => {
        try{
          this.cdr.detectChanges();
          this.scrollToBottom();
        }
        catch{
            // do nothing
        }
      }, 0);
      this.scrollToBottom();
    }
  }

  scrollToBottom(): void {
    try {
      this.consoleContainer.nativeElement.scrollTop = this.consoleContainer.nativeElement.scrollHeight;
    } catch (err) { }
  }

  startServer() {
    let serverPath = this.configService.serverPath;
    let serverName = this.configService.serverFileName;
    var path = require('path');
    
    var filePath = path.join(serverPath, serverName) + " --accept-license-agreement=YES";
    var child_process = require('child_process');

    this.notificationService.showInfo(this.translateService.instant("server.StartingServer"));
     
    const server = child_process.execFile(filePath, { shell:true }, (error, stdout, stderr) => {
      if (error) {
        console.log(error);
      }

      if(stderr){
        console.log(stderr);
      }

      console.log(stdout);
    });
    this.serverConnectionService.setCanManuallyStopServer(true);
  }

  stopServer() {
    try {
      this.notificationService.showInfo(this.translateService.instant("server.StartingServerShutdown"));
      this.serverConnectionService.eventNotifier.subscribe(event => {
        if (event.eventType == EventTypes.ShutdownStarted) {
          this.translateService.instant("server.ServerShutdownStarted");
        }
        else if (event.eventType == EventTypes.ShutdownCompleted) {
          this.translateService.instant("server.ServerShutdownCompleted");
        }
      })
      this.serverConnectionService.callServerShutdown().then(() => {
        this.serverConnectionService.setCanManuallyStopServer(false);

      });
    } catch (error) {
      this.notificationService.showError(error);
    }

  }
  test() {



  }

}
