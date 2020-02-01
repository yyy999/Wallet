import { Component, OnInit, AfterViewInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ConfigService } from '../..//service/config.service';
import { NotificationService } from '../..//service/notification.service';
import { Router, ActivatedRoute } from '@angular/router';


@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent implements OnInit, AfterViewInit {
  icon = "fas fa-cog";
  languages : any;
  selectedLanguage:string;
  serverPath:string;
  serverPort:number;
  miningLogLevel:number;

  public primary:boolean;
  constructor(
    private notificationService:NotificationService,
    private configService:ConfigService,
    private translateService:TranslateService,
    private route: ActivatedRoute) { }

  ngOnInit() {
    this.languages = this.configService.getLanguagesList();
    this.loadSettings();
  }

  ngAfterViewInit(){

    this.route.url.subscribe(url => {
      if(!this.serverPath && url[0].path === 'settings'){
        this.ensureServerPath();
      }

    });
  }

  searchServerPath(){
    this.ensureServerPath();
  }

  loadSettings(){
    this.selectedLanguage = this.configService.language;
    this.serverPath = this.configService.serverPath;
    this.serverPort = this.configService.serverPort;
    this.miningLogLevel = this.configService.miningLogLevel;
  }

  saveSettings(){
    this.configService.language = this.selectedLanguage;
    this.configService.serverPath = this.serverPath;
    this.configService.serverPort = this.serverPort;
    this.configService.miningLogLevel = this.miningLogLevel;
    this.configService.saveSettings();
    this.translateService.setDefaultLang(this.selectedLanguage);
    this.translateService.use(this.selectedLanguage);
    this.notificationService.showSuccess(this.translateService.instant("settings.SettingsSaved"));
  }

  refreshSetting(setting:string){
    switch (setting) {
      case "language":
      this.selectedLanguage = this.configService.defaultSettings.language;
        break;
        case "serverPath":

        this.ensureServerPath();
        break;
        case "serverPort":
        this.serverPort = this.configService.defaultSettings.serverPort;
        break;
        case "miningLogLevel":
        this.miningLogLevel = this.configService.defaultSettings.miningLogLevel;
        break;
      default:
        break;
    }
  }

  ensureServerPath(){

    this.serverPath = this.configService.defaultSettings.serverPath;
    let fileName = this.configService.settings.serverFileName;
  
    if(!this.serverPath){
      this.configService.restoreDefaultServerPath();
    }
    this.serverPath = this.configService.validateServerPath(this.serverPath,fileName);

        if(! this.serverPath){
          this.configService.openSearchServerPathDialog().then(path => {

            this.serverPath = path[0];
          }).catch((path) => {
              alert('The selected Neuralium server path is invalid. Please select again.');
          });
        }
  }
}
