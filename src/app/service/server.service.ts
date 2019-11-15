import { Injectable, OnInit } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { ServerConnectionService } from './server-connection.service';
import { NotificationService } from './notification.service';
import { ConfigService } from './config.service';
import { CONNECTED, EventTypes } from '../model/serverConnectionEvent';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
  providedIn: 'root'
})
export class ServerService implements OnInit {

  childPid: number;
  childProcess: any;
  private canManuallyStopServerObs: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  shutdownStartedCallback;
  shutdownCompletedCallback;

  constructor(private serverConnectionService: ServerConnectionService,
    private notificationService: NotificationService,
    private configService: ConfigService,
    private translateService: TranslateService) {

    this.serverConnectionService.eventNotifier.subscribe(event => {
      if (event.eventType === EventTypes.ShutdownStarted) {

        if (this.shutdownStartedCallback) {
          this.shutdownStartedCallback();
        }
      }
      else if (event.eventType === EventTypes.ShutdownCompleted) {

        if (this.shutdownCompletedCallback) {
          this.shutdownCompletedCallback();
        }
      }
    })
  }


  ngOnInit() {

  }

  get canManuallyStopServer(): Observable<boolean> {
    return this.canManuallyStopServerObs;
  }

  setCanManuallyStopServer(value: boolean) {
    this.canManuallyStopServerObs.next(value);
  }


  startServer(): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {

      if (this.childProcess) {

        resolve(true);
        return;
      }

      let serverPath = this.configService.serverPath;
      let serverName = this.configService.serverFileName;
      var path = require('path');

      var filePath = path.join(serverPath, serverName);
      var child_process = require('child_process');

      this.notificationService.showInfo(this.translateService.instant('server.StartingServer'));

      this.childProcess = child_process.spawn(filePath, ['--accept-license-agreement=YES'], { shell: true, windowsHide: true });

      let running = false;
      let timeout:any = null;

      let completed:boolean = false;
      this.childProcess.stdout.on('data', function(data) {
        running = true;
        completedMethod();
      });
      this.childProcess.stderr.on('data', function(data) {
        running = false;
        completedMethod();
      });
      this.childProcess.on('close', function(code) {
        running = false;
        completedMethod();
      });

      let completedMethod = () => {


        if(timeout){
          clearTimeout(timeout);
          timeout = null;
        }
        if(completed){
          return;
        }

        if (this.childProcess && this.childProcess.pid !== 0 && running) {
          this.childPid = this.childProcess.pid;
          this.setCanManuallyStopServer(true);
          this.serverConnectionService.beginConnection();
          this.notificationService.showInfo(this.translateService.instant('server.ServerRunning'));
          resolve(true);
        }
        else {
          this.childProcess = null;
          this.notificationService.showError(this.translateService.instant('server.FailedToStartServer'));
          resolve(false);
        }
        completed = true;
      };

      timeout = setTimeout(completedMethod, 15000);
    });
  }

  stopServer() {
    return new Promise<boolean>((resolve, reject) => {

      let resolved: boolean = false;
      let timeout: any = null;

      if (!this.childProcess) {

        this.notificationService.showWarn(this.translateService.instant('server.ExternallyStarted'));
        resolve(true);
        return;
      }

      let killMethod = () => {

        if (timeout) {
          clearTimeout(timeout);
          timeout = null;
        }

        // we timed out, we need to send a sigterm to the process directly
        if (this.childProcess && !this.childProcess.killed) {
          this.childProcess.kill();
          this.childProcess = null;
          if (!resolved) {
            resolve(true);
            resolved = true;
          }
        }
        else {
          if (!resolved) {
            resolve(false);
            resolved = true;
          }
        }
        try {
          this.serverConnectionService.connection.stop();
        } catch{
          // do nothing
        }
        this.serverConnectionService.notifyServerConnectionStatusIfNeeded(false);
        this.shutdownStartedCallback = null;
        this.shutdownCompletedCallback = null;

      };

      timeout = setTimeout(killMethod, 20000);

      try {

        this.notificationService.showInfo(this.translateService.instant('server.StartingServerShutdown'));

        this.shutdownStartedCallback = () => {
          this.translateService.instant('server.ServerShutdownStarted');
          killMethod();
        };

        this.shutdownCompletedCallback = () => {
          this.translateService.instant('server.ServerShutdownCompleted');
          killMethod();
        };

        this.serverConnectionService.callServerShutdown().then(() => {
          this.setCanManuallyStopServer(false);

        }).catch(error => {
          this.notificationService.showError(error);
          killMethod();
          reject(error);
        });
      } catch (error) {
        this.notificationService.showError(error);
        killMethod();
        reject(error);
      }
    });
  }
}
