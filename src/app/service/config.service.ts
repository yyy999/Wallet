import { Injectable } from '@angular/core';
import { remote } from 'electron';
import { TranslateService } from '@ngx-translate/core';
import * as FS from 'fs-extra';

const Store = require('electron-store');
const app = remote.app;

class Settings {
  language: string;
  serverPath: string;
  serverFileName: string;
  serverPort: number;
  currentPlatform: string;
  softwareLicenseAgreementShown: boolean;
  delegateAccount: string;
}



@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  settings: Settings;
  store = new Store();

  defaultServerPathValid: boolean = false;
  defaultSettingsValue:Settings;

  get defaultSettings():Settings{
    if(this.defaultSettingsValue == void(0)){
      this.defaultSettingsValue = this.defineDefaultSettings();
    }
    return this.defaultSettingsValue;
  }

  constructor(private translateService: TranslateService) {
    this.loadSettings();
  }

  getLanguagesList() {
    return [
      { 'language': 'English', 'code': 'en' },
      { 'language': 'Français', 'code': 'fr' },
      { 'language': 'Español', 'code': 'es' }
    ];
  }

  private loadSettings(): any {
    let message: string = `Load settings`;
    console.log(message)

    

    var os = require('os');
    if (this.store.has('settings')) {
      this.settings = this.store.get('settings');
    }
    else {
      this.settings = new Settings();
    }

    message = `Define default settings if necessary`;
    console.log(message)
    this.defineDefaultSettingIfNecessary("serverFileName", this.defaultSettings.serverFileName);
    this.defineDefaultSettingIfNecessary("serverPort", this.defaultSettings.serverPort);
    this.defineDefaultSettingIfNecessary("currentPlatform", this.defaultSettings.currentPlatform);
    this.defineDefaultSettingIfNecessary("softwareLicenseAgreementShown", this.defaultSettings.softwareLicenseAgreementShown);
    this.defineDefaultSettingIfNecessary("delegateAccount", this.defaultSettings.delegateAccount);

    this.defineDefaultSettingIfNecessary("serverPath", this.defaultSettings.serverPath);
    if (!this.validateServerPath(this.settings["serverPath"],this.settings.serverFileName)) {
      if (this.defaultServerPathValid) {
        this.settings["serverPath"] = this.defaultSettings.serverPath;
      }
      else {
        this.settings["serverPath"] = '';
      }
      alert('The neuralium server path is invalid. Please ensure it is correctly set in the settings panel.');
    }

    this.saveSettings();
  }

  defineDefaultSettings(): Settings {
    var os = require('os');

    var settings: Settings = new Settings();
    settings.currentPlatform = os.platform();
    settings.delegateAccount = "";
    settings.language = "en";
    settings.serverFileName = this.getFileName(os.platform());
    settings.serverPath = this.getFilePath(os.platform());
    
    if (this.validateServerPath(settings.serverPath,settings.serverFileName)) {
      this.defaultServerPathValid = true;
    }
    else {
      this.defaultServerPathValid = false;
    }
    
    settings.serverPort = 12033;
    settings.softwareLicenseAgreementShown = false;

    return settings;
  }

  defineDefaultSettingIfNecessary(setting: string, defaultValue: any) {
    var message : string = `Define ${setting} if necessary with default value ${defaultValue}`;
    console.log(message)
    if (this.settings[setting] === void (0)) {
      this.settings[setting] = defaultValue;
    }
  }


  isServerPathValid(): boolean {
    if (this.settings['serverPath']) {
      return true;
    }
    return false;
  }

  getFilePath(osPlatform: string): string {
    var paths = [];
    
    // WINDOWS
    if (osPlatform.toLowerCase().startsWith("win")) {
      paths.push(
      '..\\neuralium',
      '.\\neuralium',
      '..\\..\\..\\..\\neuralium\\win32'
      );
    }
    // LINUX
    else if (osPlatform.toLowerCase().startsWith("linux")) {
     paths.push(
      '../../neuralium',
      '../neuralium',
      '../../../../neuralium\\linux');
    }
    // MAC
    else {
     paths.push(
      '../../neuralium',
      '../neuralium',
      '../../../../neuralium\\mac');
    }
    
    return this.getExistingNodePath(paths);
  }

  getExistingNodePath(paths:Array<string>): string {
    console.log("Start looking for a valid server path");
    const path = require('path');
    var pathFound: boolean = false;
    var finalPath: string = undefined;

    paths.forEach(pathToCheck => {
      try {
        let fullpath = path.resolve(remote.process.execPath, pathToCheck)
        pathFound = this.checkPath(fullpath);
        if (pathFound) {
          finalPath = fullpath;
        }
      } catch (error) {
        let message: string = `Tried to check if ${pathToCheck} exists but gor error : ${error}`;
        console.log(message)
      }
    })

    return finalPath;
  }

  checkPath(nodeDirectoryPath: string): boolean {
    let message: string = `Check if ${nodeDirectoryPath} exists`;
    console.log(message)
    let result = FS.existsSync(nodeDirectoryPath);
    if (result) {
      message = `${nodeDirectoryPath} exists`;
    }
    else {
      message = `${nodeDirectoryPath} does not exist`;
    }
    console.log(message);
    return result;
  }

  validateServerPath(nodeDirectoryPath: string, exeName:string): string {
    const path = require('path');
    // time to test the value
    if (FS.existsSync(nodeDirectoryPath) === false) {
      // this is critical, even the auto path does not work
      let message: string = `Automatically set server path ${nodeDirectoryPath} does not exist`;
      console.log(message);
      nodeDirectoryPath = '';
    }

    if (nodeDirectoryPath) {
      let fullPath: string = path.join(nodeDirectoryPath, exeName);

      if (FS.existsSync(fullPath) === false) {
        let message: string = `Automatically set server executable path ${fullPath} does not exist`;
        console.log(message);

        nodeDirectoryPath = '';
      }
    }

    if (!nodeDirectoryPath) {
      // what to do if we have no path?

    }

    return nodeDirectoryPath;
  }
  getFileName(osPlatform: string): string {
    if (osPlatform.toLowerCase().startsWith("win")) {
      return "Neuralium.exe";
    }
    else {
      return "Neuralium";
    }
  }

  openSearchServerPathDialog(): Promise<string[]> {

    let defaultPath: string = this.settings.serverPath;

    if (!defaultPath) {
      const homedir = require('os').homedir();
      defaultPath = homedir;
    }

    return new Promise<string[]>((resolve, reject) => {
      remote.dialog.showOpenDialog(
        {
          title: this.translateService.instant("server.SearchForServerPath"),
          defaultPath: this.settings.serverPath,
          properties: ['openDirectory']
        },
        (folderPath) => {
          if (folderPath === undefined) {
            reject(folderPath);
          }
          else {

            let correctedFolderPath: string = this.validateServerPath(folderPath[0], this.settings.serverFileName);

            if (!correctedFolderPath) {
              reject(folderPath);
            }
            else {
              resolve(folderPath);
            }

          }
        })
    })

  }

  saveSettings() {
    this.store.set('settings', this.settings);
  }

  set language(language: string) {
    this.settings.language = language;
  }

  get language(): string {
    return this.settings.language;
  }

  restoreDefaultLanguage() {
    this.language = this.defaultSettings.language;
    this.saveSettings();
  }

  set serverPath(serverPath: string) {
    this.settings.serverPath = serverPath;
  }

  get serverPath(): string {
    return this.settings.serverPath;
  }

  restoreDefaultServerPath() {
    this.serverPath = this.defaultSettings.serverPath;
    this.saveSettings();
  }

  set serverFileName(serverFileName: string) {
    this.settings.serverFileName = serverFileName;
  }

  get serverFileName(): string {
    return this.settings.serverFileName;
  }

  restoreDefaultServerFileName() {
    this.serverFileName = this.defaultSettings.serverFileName;
    this.saveSettings();
  }

  set currentPlatform(currentPlatform: string) {
    this.settings.currentPlatform = currentPlatform;
  }

  get currentPlatform(): string {
    return this.settings.currentPlatform;
  }

  set serverPort(serverPort: number) {
    this.settings.serverPort = serverPort;
  }

  get serverPort(): number {
    return this.settings.serverPort;
  }

  restoreDefaultServerPort() {
    this.serverPort = this.defaultSettings.serverPort;
    this.saveSettings();
  }

  set softwareLicenseAgreementShown(softwareLicenseAgreementShown: boolean) {
    this.settings.softwareLicenseAgreementShown = softwareLicenseAgreementShown;
  }

  get softwareLicenseAgreementShown(): boolean {
    return this.settings.softwareLicenseAgreementShown;
  }

  restoreDefaultTermsOfServiceShown() {
    this.softwareLicenseAgreementShown = this.defaultSettings.softwareLicenseAgreementShown;
    this.saveSettings();
  }

  set delegateAccount(delegateAccount: string) {
    this.settings.delegateAccount = delegateAccount;
  }

  get delegateAccount(): string {
    return this.settings.delegateAccount;
  }

  restoreDefaultDelegateAccount() {
    this.delegateAccount = this.defaultSettings.delegateAccount;
    this.saveSettings();
  }
}