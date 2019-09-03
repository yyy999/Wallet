import { Component, OnInit, Inject, Optional } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { ServerConnectionService } from '../../service/server-connection.service';
import { NotificationService } from '../../service/notification.service';
import { ConfigService } from '../../service/config.service';
import { TranslateService } from '@ngx-translate/core';
import { CONNECTED, EventTypes } from '../..//model/serverConnectionEvent';

export class ServerConnectionDialog {
  canManuallyStop: boolean = false;
  manuallyOpened: boolean = false;
}

@Component({
  selector: 'app-server-connection-dialog',
  templateUrl: './server-connection-dialog.component.html',
  styleUrls: ['./server-connection-dialog.component.scss']
})
export class ServerConnectionDialogComponent implements OnInit {

  showServerNotConnected: boolean = true;
  canManuallyStopServer: boolean = false;
  manuallyOpened: boolean = false;
  canStartServer:boolean = false;

  constructor(
    private serverConnectionService: ServerConnectionService,
    private notificationService: NotificationService,
    private configService: ConfigService,
    private translateService: TranslateService,
    public dialogRef: MatDialogRef<ServerConnectionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: boolean
  ) { 
    this.manuallyOpened = data;
  }

  ngOnInit() {
    

    /*
    this.serverConnectionService.manuallyOpened.subscribe(manuallyOpened =>{
      this.manuallyOpened = manuallyOpened;
    })
    */

    this.serverConnectionService.isConnectedToServer().subscribe(connected => {
      this.showServerNotConnected = !connected;
      if (connected != CONNECTED) {
        this.serverConnectionService.tryConnectToServer();
        setTimeout(() =>{
          this.canStartServer = true;
        },5000)
      }
      else {
        
        if (!this.manuallyOpened) {
          this.close();
        }
        
      }
    })
  }

  startServer() {
    this.canStartServer = false;
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
    this.close();
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
        this.close();
      });
    } catch (error) {
      this.notificationService.showError(error);
    }

  }

  close() {
    this.dialogRef.close();
  }

}
