import { Component } from '@angular/core';
import { BlockChain, NO_BLOCKCHAIN } from './model/blockchain';
import { Observable } from 'rxjs';
import { BlockchainService } from './service/blockchain.service';
import { MatDialog } from '@angular/material/dialog';
import { SelectBlockchainDialogComponent } from './dialogs/select-blockchain-dialog/select-blockchain-dialog.component';
import { NotificationService } from './service/notification.service';
import { ServerService } from './service/server.service';

import { TranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { LanguageSelectionDialogComponent } from './dialogs/language-selection-dialog/language-selection-dialog.component';
import { ConfigService } from './service/config.service';

import { ElectronService } from 'ngx-electron';
import { ServerConnectionService } from './service/server-connection.service';
import { SoftwareLicenseAgreementComponent } from './dialogs/terms-of-service-dialog/software-license-agreement-dialog.component';
import { DialogResult } from './config/dialog-result';

import { remote, ipcRenderer } from 'electron';
import { AboutDialogComponent } from './dialogs/about-dialog/about-dialog.component';
import { CONNECTED, EventTypes } from './model/serverConnectionEvent';
import { AskKeyDialogComponent } from './dialogs/ask-key-dialog/ask-key-dialog.component';
import { PassphraseParameters, KeyPassphraseParameters, PassphraseRequestType } from './model/passphraseRequiredParameters';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  displayChangeBlockchain: boolean = false;
  serverName: string = "";
  serverPath: string = "";
  serverPort: number = 0;
  selectedBlockchain: Observable<BlockChain>;
  currentBlockchain: BlockChain = NO_BLOCKCHAIN;

  constructor(
    private electronService: ElectronService,
    private configService: ConfigService,
    private router: Router,
    private translateService: TranslateService,
    private blockchainService: BlockchainService,
    private notificationService: NotificationService,
    private serverConnectionService: ServerConnectionService,
    private serverService: ServerService,
    private dialog: MatDialog) {
    this.translateService.setDefaultLang("en");
    this.serverPath = this.configService.serverPath;
    this.serverName = this.configService.serverFileName;
    this.serverPort = this.configService.serverPort;

    this.translateService.get("app.Help").subscribe(help =>{ 
      this.translateService.get("app.Refresh").subscribe(refresh =>{
        this.translateService.get("app.About").subscribe(about =>{
          this.translateService.get("app.Quit").subscribe(quit =>{
            this.translateService.get("app.Sla").subscribe(sla =>{
              this.defineMenu(dialog,help,refresh,quit,about, sla);
            })
          })
        })
      });
    });
  }

  ngOnInit() {
    this.electronService.ipcRenderer.on("quit",(event) =>{
      this.serverService.canManuallyStopServer.subscribe(canStop =>{
        if(canStop){

          this.serverService.stopServer().then((success) => {

            event.sender.send("ok-quit");

          }).catch((error) => {
            console.log(error);
            event.sender.send("ok-quit");
          });
        }
        else{
          event.sender.send("ok-quit");
        }
      })
      
      
    })

    var lng = this.configService.language;
    if (!lng) {
      setTimeout(() => {
        let dialogRef = this.dialog.open(LanguageSelectionDialogComponent, {
          width: '600px'
        })

        dialogRef.afterClosed().subscribe(() => {
          this.initialise();
        })
      });
    }
    else {
      this.translateService.setDefaultLang(lng);
      setTimeout(() => {
        this.initialise();
      });
    }

  }

  defineMenu(dialog: MatDialog, help:string, refresh:string, quit:string, about:string, sla:string) {

    let local = this;
    setTimeout(() =>
      {
        const template = [{ label: 'File', submenu:[{
          role: "toggledevtools"
        },{
          label: quit,
          role: "quit"
        }]},{
          label: help,
          submenu: [
            {
              label: refresh,
              role: "forceReload"
            },
            {
              label: sla,
              click: function () {
                local.showSoftwareLicenseAgreement();
              }
            },
            {
              label: about,
              click: function () {
                setTimeout(() =>
                  dialog.open(AboutDialogComponent, {
                    width: '600px',
                    height: '400px'
                  }));
              }
            }
        
          ]
        }];

        const menu = remote.Menu.buildFromTemplate(<Array<Electron.MenuItem>><any>template);
        remote.Menu.setApplicationMenu(menu);
      });
  }

  initialise() {

    
    
    if (!this.configService.softwareLicenseAgreementShown) {
      this.showSoftwareLicenseAgreement();
    }
    else {
      this.serverConnectionService.isConnectedToServer().subscribe(connected => {
        if (connected !== CONNECTED) {
          if(!this.configService.isServerPathValid()){
            this.router.navigate(['/settings']);
          }
          else{
            this.router.navigate(['/dashboard']);
          }
         
        }
        else {
          this.selectedBlockchain = this.blockchainService.getSelectedBlockchain();

          this.selectedBlockchain.subscribe(blockchain => {
            if (blockchain === NO_BLOCKCHAIN) {
              this.blockchainService.getAvailableBlockchains().then(blockchains => {
                let availableBlockchainsCount = blockchains.length
                if (availableBlockchainsCount === 0) {
                  this.notificationService.showWarn("No blockchain available");
                }
                else if (availableBlockchainsCount === 1) {
                  this.currentBlockchain = blockchains[0];
                  this.blockchainService.setSelectedBlockchain(this.currentBlockchain);
                }
                else {
                  this.showChangeBlockchainWindow();
                }
              })
            }
            else {
              this.currentBlockchain = blockchain;
              this.listenToEvents();
            }
          })
        }
      });

    }
  }

  listenToEvents(){
    this.serverConnectionService.eventNotifier.subscribe(event =>{
      switch (event.eventType) {
        case EventTypes.RequestWalletPassphrase:
          this.askForWalletPassphrase(event.message);
          break;
        case EventTypes.RequestKeyPassphrase:
          this.askForKeyPassphrase(event.message);
          break;
        default:
          break;
      }
    })
  }

  askForWalletPassphrase(parameters:PassphraseParameters){
    setTimeout(() =>{
      var dialog = this.dialog.open(AskKeyDialogComponent, {
        width: '450px',
        data: {parameters: parameters, type: PassphraseRequestType.Wallet}
      });

      dialog.afterClosed().subscribe(result =>{
        this.serverConnectionService.callEnterWalletPassphrase(parameters.correlationId, parameters.chainType, parameters.keyCorrelationCode,result);
      })
    });
  }

  askForKeyPassphrase(parameters:KeyPassphraseParameters){
    setTimeout(() =>{
      var dialog = this.dialog.open(AskKeyDialogComponent, {
        width: '450px',
        data: {parameters: parameters, type: PassphraseRequestType.Key}
      })

      dialog.afterClosed().subscribe(result =>{
        this.serverConnectionService.callEnterKeyPassphrase(parameters.correlationId, parameters.chainType, parameters.keyCorrelationCode,result);
      })
    });
  }

  showAboutBox() {
    setTimeout(() =>
      this.dialog.open(AboutDialogComponent, {
        width: '250px'
      }));
  }

  showChangeBlockchainWindow() {
    setTimeout(() =>
      this.dialog.open(SelectBlockchainDialogComponent, {
        width: '250px',
        data: this.currentBlockchain
      }));
  }

  showSoftwareLicenseAgreement() {
    let shown:boolean = this.configService.softwareLicenseAgreementShown;
    setTimeout(() =>
      this.dialog.open(SoftwareLicenseAgreementComponent, {
        width: '650px',
        data: {shown:  shown}

      }).afterClosed().subscribe(dialogResult => {
        if(!shown){
          if (dialogResult === DialogResult.Yes) {
            this.configService.softwareLicenseAgreementShown = true;
            this.configService.saveSettings();
            this.initialise();
          }
          else {
            this.configService.softwareLicenseAgreementShown = false;
            this.configService.saveSettings();
            const remote = require('electron').remote;
            let w = remote.getCurrentWindow();
            w.close();
          }
        }
      }));
  }

}
