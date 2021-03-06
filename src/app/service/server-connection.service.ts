import { Injectable, OnDestroy } from '@angular/core';
import { NotificationService } from './notification.service';

import { HubConnectionBuilder, HttpTransportType, HubConnection, LogLevel, HubConnectionState } from '@microsoft/signalr';
import { BehaviorSubject, Subject, Observable } from 'rxjs';
import { LogService } from './log.service';
import { WalletCreation } from '../model/wallet';
import { ConfigService } from './config.service';
import { NeuraliumCall } from '../business/serverCall/neuraliumCall';
import { TransactionsCall } from '../business/serverCall/transactionsCall';
import { ServerConnectionEvent, EventTypes, ResponseResult } from '../model/serverConnectionEvent';
import { ServerCall } from '../business/serverCall/serverCall';
import { MiningCall } from '../business/serverCall/miningCall';
import { AccountCall } from '../business/serverCall/accountCall';
import { WalletCall } from '../business/serverCall/walletCall';
import { BlockchainCall } from '../business/serverCall/blockchainCall';
import { DebugCall } from '../business/serverCall/debugCall';
import { KeyPassphraseParameters, PassphraseParameters } from '../model/passphraseRequiredParameters';
import { PassphrasesCall } from '../business/serverCall/passphrasesCall';
import { remote } from 'electron';
import moment, * as momentObj from 'moment';
import { takeUntil } from 'rxjs/operators';

const RETRY_DURATION = 3000;
export const MESSAGE_BUFFER_SIZE = 4000;

export class ServerMessage {

  public message: string;
  public timestamp: moment.Moment;
public level: string;
public properties: Array<Object>;

  constructor(message: string, timestamp: Date, level: string, properties: Array<Object>) {
      this.message = message;
      this.timestamp = moment(timestamp);
      this.level = level;
      this.properties = properties;
  }

  GetThread(): object {
    return this.properties[0];
  }
}

@Injectable({
  providedIn: 'root'
})
export class ServerConnectionService implements OnDestroy {

  get showServerNotConnected(): Observable<boolean> {
    return this.showServerNotConnectedObs;
  }

  constructor(
    private notificationService: NotificationService,
    private logService: LogService,
    private configService: ConfigService) {

    this.serverPort = this.configService.serverPort;
    this.serverPath = this.configService.serverPath;   

    this.beginConnection();
  }

  private unsubscribe$ = new Subject<void>();

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }


  public get IsConnected(): boolean {
    return this.connection && this.connection.state === HubConnectionState.Connected;
}

  get connection(): HubConnection {
    if(!this.cnx){

      this.serverPort = this.configService.serverPort;
      this.cnx = new HubConnectionBuilder()
        .configureLogging(LogLevel.None)
        .withUrl('http://127.0.0.1:' + this.serverPort + '/signal', {
          skipNegotiation: true,
          transport: HttpTransportType.WebSockets
        })
      
        .withAutomaticReconnect()
        .build();

        this.cnx.serverTimeoutInMilliseconds = 60 * 1000;
        this.cnx.keepAliveIntervalInMilliseconds = 30 * 1000;
    }

    this.cnx.onclose(() => {
      this.cnx.stop();
      this.logService.logDebug(' Connection Closed', {  });
      this.notifyServerConnectionStatusIfNeeded(false);
      this.isConnecting = false;
      this.beginConnection();
    });
    
    return this.cnx;
  }
  
  private showServerNotConnectedObs: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(true);

  serverPort: number;
  serverPath: string;
  eventNotifier: Subject<ServerConnectionEvent> = new Subject<ServerConnectionEvent>();
  serverConnection: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  private isCurrentlyConnected: boolean = false;

  public messages:Array<ServerMessage> = new Array<ServerMessage>();
  consoleMessagesEnabled: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);


  private isConnecting:boolean = false;

  private cnx:HubConnection;

  registerConnectionEvent(action:string, newMethod: (...args: any[]) => void): void{
    const cnx = this.connection;

    cnx.off(action);
    cnx.on(action, newMethod);
  }

  setShowServerNotConnected(value: boolean) {
    this.showServerNotConnectedObs.next(value);
  }


  public beginConnection(){
    
    this.tryConnectToServer().then(() => {
      this.notifyServerConnectionStatusIfNeeded(true);
      this.startListeningWalletCreationEvents()
      this.startListeningAccountCreationEvents();
      this.startListeningAccountPublicationEvents();
      this.startListeningBlockchainSyncEvents();
      this.startListeningKeyGenerationEvents();
      this.startListeningMiningEvents();
      this.startListeningTransactionEvents();
      this.startListeningWalletSyncEvents();
      this.startOtherEventsListening();
    })
  }

getMessages(): Array<ServerMessage> {
    return this.messages;
  }

  startOtherEventsListening() {
    this.listenToRequestCopyWallet();
    this.listenToRequestCopyWalletKeyFile();
    this.listenToLongRunningStatusUpdate();
    this.listenToReturnClientLongRunningEvent();

    this.listenToAccountTotalUpdated();
    this.listenToPeerTotalUpdated();

    this.listenToServerShutdownStarted();
    this.listenToServerShutdownCompleted();

    this.listenToBlockInserted();

    this.listenToError();
    this.listenToMessage();

    this.listenToEnterKeyPassphrase();
    this.listenToEnterWalletPassphrase();

    this.listenToRequireNodeUpdate();
  }

  startListeningWalletCreationEvents() {
    this.listenToWalletCreationStarted();
    this.listenToWalletCreationEnded();
    this.listenToWalletCreationMessage();
    this.listenToWalletCreationStep();
    this.listenToWalletCreationError();
  }

  startListeningAccountCreationEvents() {
    this.listenToAccountCreationStarted();
    this.listenToAccountCreationEnded();
    this.listenToAccountCreationMessage();
    this.listenToAccountCreationStep();
    this.listenToAccountCreationError();
  }

  startListeningKeyGenerationEvents() {
    this.listenToKeyGenerationEnded();
    this.listenToAccountCreationError();
    this.listenToKeyGenerationMessage();
    this.listenToKeyGenerationPercentageUpdate();
    this.listenToKeyGenerationStarted();
  }

  startListeningAccountPublicationEvents() {
    this.listenToAccountPublicationStarted();
    this.listenToAccountPublicationEnded();
    this.listenToAccountPublicationMessage();
    this.listenToAccountPublicationStep();
    this.listenToAccountPublicationPOWNonceIteration();
    this.listenToAccountPublicationPOWNonceFound();
    this.listenToAccountPublicationError();
  }

  startListeningWalletSyncEvents() {
    this.listenToWalletSyncEnded();
    this.listenToWalletSyncError();
    this.listenToWalletSyncUpdate();
    this.listenToWalletSyncStarted();
  }

  startListeningBlockchainSyncEvents() {
    this.listenToBlockchainSyncEnded();
    this.listenToBlockchainSyncError();
    this.listenToBlockchainSyncUpdate();
    this.listenToBlockchainSyncStarted();
  }

  startListeningTransactionEvents() {
    this.listenToTransactionConfirmed();
    this.listenToTransactionError();
    this.listenToTransactionMessage();
    this.listenToTransactionReceived();
    this.listenToTransactionRefused();
    this.listenToTransactionSent();
    this.listenToTransactionHistoryUpdated();
    this.listenToNeuraliumTimelineUpdated();
  }

  startListeningMiningEvents() {
    this.listenToNeuraliumMiningBountyAllocated();
    this.listenToMiningConnectableStatusChanged();
    this.listenToNeuraliumMiningPrimeElected();
    this.listenToMiningElected();
    this.listenToMiningPrimeElectedMissed();
    this.listenToMiningEnded();
    this.listenToMiningStarted();
    this.listenToElectionContextCached();
    this.listenToElectionProcessingCompleted();
    
  }

  

  // DEBUG

  callRefillNeuraliums(accountUuid: string): Promise<boolean> {
    let service = DebugCall.create(this, this.logService);
    return service.callRefillNeuraliums(accountUuid);
  }

  // FIN DEBUG

  //server call methods
  callSetActiveAccount(chainType: number, accountUuid: string): Promise<boolean> {
    let service = AccountCall.create(this, this.logService);
    return service.callSetActiveAccount(chainType, accountUuid);
  }

  callServerShutdown(): Promise<boolean> {
    let service = ServerCall.create(this, this.logService);
    return service.callServerShutdown();
  }

  callCreateNewWallet(chainType: number, wallet: WalletCreation): Promise<number> {
    let service = WalletCall.create(this, this.logService);
    return service.callCreateNewWallet(chainType, wallet);
  }

  callSetWalletPassphrase(correlationId: number, password: string, setKeysToo : boolean) {
    let service = WalletCall.create(this, this.logService);
    return service.callSetWalletPassphrase(correlationId, password, setKeysToo);
  }

  callSetKeysPassphrase(correlationId: number, password: string) {
    let service = WalletCall.create(this, this.logService);
    return service.callSetKeysPassphrase(correlationId, password);
  }

  callQuerySystemVersion() {
    let service = ServerCall.create(this, this.logService);
    let result = service.callQuerySystemVersion();

    result.then(response => {
      // capture the results
      this.consoleMessagesEnabled.next(response.consoleEnabled);
    });
    return result;
  }

  callQueryWalletTransactionHistory(chainType: number, accountUuid: string) {
    let service = TransactionsCall.create(this, this.logService);
    return service.callQueryWalletTransactionHistory(chainType, accountUuid);
  }

  callQueryTransationHistoryDetails(chainType: number, accountUuid: string, transactionId: string) {
    let service = TransactionsCall.create(this, this.logService);
    return service.callQueryTransationHistoryDetails(chainType, accountUuid, transactionId);
  }

  callQueryWalletAccounts(chainType: number) {
    let service = WalletCall.create(this, this.logService);
    return service.callQueryWalletAccounts(chainType);
  }

  callQueryWalletAccountDetails(chainType: number, accountUuid: string) {
    let service = WalletCall.create(this, this.logService);
    return service.callQueryWalletAccountDetails(chainType, accountUuid);
  }

  callQueryBlockChainInfo(chainType: number) {
    let service = BlockchainCall.create(this, this.logService);
    return service.callQueryBlockChainInfo(chainType);
  }

  callQuerySupportedChains() {
    let service = BlockchainCall.create(this, this.logService);
    return service.callQuerySupportedChains();
  }

  callCompleteLongRunningEvent(correlationId: number) {
    let service = ServerCall.create(this, this.logService);
    return service.callCompleteLongRunningEvent(correlationId);
  }

  callRenewLongRunningEvent(correlationId: number) {
    let service = ServerCall.create(this, this.logService);
    return service.callRenewLongRunningEvent(correlationId);
  }

  callQueryChainStatus(chainType: number) {
    let service = BlockchainCall.create(this, this.logService);
    return service.callQueryChainStatus(chainType);
  }



  callQueryApi(chainType: number, method:string, parameters:string){
    let service = ServerCall.create(this, this.logService);
    return service.callApiQuery(chainType, method, parameters);
  }


  callQueryBlock(chainType: number, blockId:number){
    let service = BlockchainCall.create(this, this.logService);
    return service.callQueryBlock(chainType, blockId);
  }

  callQueryWalletInfo(chainType: number){
    let service = BlockchainCall.create(this, this.logService);
    return service.callQueryWalletInfo(chainType);
  }

  callStartMining(chainType: number, delegateAccountId: string) {
    let service = MiningCall.create(this, this.logService);
    return service.callStartMining(chainType, delegateAccountId);
  }

  callStopMining(chainType: number) {
    let service = MiningCall.create(this, this.logService);
    return service.callStopMining(chainType);
  }

  callIsMiningEnabled(chainType: number) {
    let service = MiningCall.create(this, this.logService);
    return service.callIsMiningEnabled(chainType);
  }

  callQueryMiningHistory(chainType: number, page: number, pageSize: number, maxLevel: number) {
    let service = MiningCall.create(this, this.logService);
    return service.callQueryMiningHistory(chainType, page, pageSize, maxLevel);
  }

  callQueryMiningStatistics(chainType: number) {
    let service = MiningCall.create(this, this.logService);
    return service.callQueryMiningStatistics(chainType);
  }

  callClearCachedCredentials(chainType: number) {
    let service = MiningCall.create(this, this.logService);
    return service.callClearCachedCredentials(chainType);
  }


  callQueryCurrentDifficulty(chainType: number) {
    let service = MiningCall.create(this, this.logService);
    return service.callQueryCurrentDifficulty(chainType);
  }

  callQueryTotalConnectedPeersCount() {
    let service = ServerCall.create(this, this.logService);
    return service.callQueryTotalConnectedPeersCount();
  }

  callQueryMiningPortConnectable(){
    let service = ServerCall.create(this, this.logService);
    return service.callQueryMiningPortConnectable();
  }
  
  callQueryMiningIPMode(chainType: number){
    let service = MiningCall.create(this, this.logService);
    return service.callQueryMiningIPMode(chainType);
  }
  
  callQueryBlockchainSynced(chainType: number) {
    let service = BlockchainCall.create(this, this.logService);
    return service.callQueryBlockchainSynced(chainType);
  }

  callIsBlockchainSynced(chainType: number): Promise<boolean> {
    let service = BlockchainCall.create(this, this.logService);
    return service.callIsBlockchainSynced(chainType);
  }

  callQueryWalletSynced(chainType: number) {
    let service = WalletCall.create(this, this.logService);
    return service.callQueryWalletSynced(chainType);
  }

  callIsWalletLoaded(chainType: number) {
    let service = WalletCall.create(this, this.logService);
    return service.callIsWalletLoaded(chainType);
  }

  callWalletExists(chainType: number) {
    let service = WalletCall.create(this, this.logService);
    return service.callWalletExists(chainType);
  }

  callLoadWallet(chainType: number, passphrase:string) {
    let service = WalletCall.create(this, this.logService);
    return service.callLoadWallet(chainType, passphrase);
  }

  callIsWalletSynced(chainType: number): Promise<boolean> {
    let service = WalletCall.create(this, this.logService);
    return service.callIsWalletSynced(chainType);
  }

  callQueryBlockHeight(chainType: number) {
    let service = BlockchainCall.create(this, this.logService);
    return service.callQueryBlockHeight(chainType);
  }

  callPublishAccount(chainType: number, accountUuId: string) {
    let service = AccountCall.create(this, this.logService);
    return service.callPublishAccount(chainType, accountUuId);
  }

  callSendNeuraliums(targetAccountId: string, amount: number, tip: number, note: string) {
    let service = NeuraliumCall.create(this, this.logService);
    return service.callSendNeuraliums(targetAccountId, amount, tip, note);
  }

  callQueryAccountTotalNeuraliums(accountUuid: string) {
    let service = NeuraliumCall.create(this, this.logService);
    return service.callQueryAccountTotalNeuraliums(accountUuid);
  }

  callQueryNeuraliumTimelineHeader(accountUuid: string) {
    let service = NeuraliumCall.create(this, this.logService);
    return service.callQueryNeuraliumTimelineHeader(accountUuid);
  }

  callQueryNeuraliumTimelineSection(accountUuid: string, firstday: Date, skip: number, take: number) {
    let service = NeuraliumCall.create(this, this.logService);
    return service.callQueryNeuraliumTimelineSection(accountUuid, firstday, skip, take);
  }

  // PASSPHRASES CALL

  callEnterWalletPassphrase(correlationId: number, chainType: number, keyCorrelationCode: number, passphrase: string, setKeysToo: boolean): Promise<boolean> {
    let service = PassphrasesCall.create(this, this.logService);
    return service.callEnterWalletPassphrase(correlationId, chainType, keyCorrelationCode, passphrase, setKeysToo);
  }

  callEnterKeyPassphrase(correlationId: number, chainType: number, keyCorrelationCode: number, passphrase: string): Promise<boolean> {
    let service = PassphrasesCall.create(this, this.logService);
    return service.callEnterKeyPassphrase(correlationId, chainType, keyCorrelationCode, passphrase);
  }

  callWalletKeyFileCopied(correlationId: number, chainType: number, keyCorrelationCode: number): Promise<boolean> {
    let service = PassphrasesCall.create(this, this.logService);
    return service.callWalletKeyFileCopied(correlationId, chainType, keyCorrelationCode);
  }

  callEnableConsoleMessages(enabled:boolean): Promise<boolean> {
    let service = ServerCall.create(this, this.logService);
    let result = service.callEnableConsoleMessages(enabled);

    result.then(enabled => {
      // capture the result and propagate it
      this.consoleMessagesEnabled.next(enabled);
    });
    return result;

  }

  //server listening
  listenToServerShutdownStarted() {
    const cnx = this.connection;
    const action = 'ShutdownStarted';
    

    this.registerConnectionEvent(action, () => {
      this.logEvent(action + ' - event', null);
      this.propagateEvent(0, EventTypes.ShutdownStarted, ResponseResult.Success, 'Shutdown Started');
    });
  }

  listenToServerShutdownCompleted() {
    const cnx = this.connection;
    const action = 'ShutdownCompleted';
    

    this.registerConnectionEvent(action, () => {
      this.logEvent(action + ' - event', null);
      this.propagateEvent(0, EventTypes.ShutdownCompleted, ResponseResult.Success, 'Shutdown Completed');
    });
  }

  listenToRequestCopyWallet() {
    const cnx = this.connection;
    const action = 'requestCopyWallet';
    
    this.registerConnectionEvent(action, (correlationId: number, chainType: number) => {
      this.logEvent(action + ' - event', { 'correlationId': correlationId, 'chainType': chainType });
      this.propagateEvent(correlationId, EventTypes.RequestCopyWallet, ResponseResult.Success, {'correlationId': correlationId, 'chainType': chainType});
    });
  }
  listenToRequestCopyWalletKeyFile() {
    const cnx = this.connection;
    const action = 'requestCopyWalletKeyFile';
    
    this.registerConnectionEvent(action, (correlationId: number, chainType: number, keyCorrelationCode: number, accountID:string, keyname:string, attempt:number) => {
      this.logEvent(action + ' - event', { 'correlationId':correlationId, 'chainType': chainType, 'keyCorrelationCode' : keyCorrelationCode, 'accountID' : accountID, 'keyname' : keyname, 'attempt' : attempt });
      this.propagateEvent(correlationId, EventTypes.RequestCopyKeyFile, ResponseResult.Success, { 'correlationId':correlationId,'chainType': chainType, 'keyCorrelationCode' : keyCorrelationCode, 'accountID' : accountID, 'keyname' : keyname, 'attempt' : attempt });
    });
  }

  
  listenToMiningStatusChanged() {
    const cnx = this.connection;
    const action = 'miningStatusChanged';
    

    this.registerConnectionEvent(action, (chainType: number, isMining: boolean) => {
      this.logEvent(action + ' - event', { 'chainType': chainType, 'isMining': isMining });
      this.propagateEvent(chainType, EventTypes.MiningStatusChanged, ResponseResult.Success, isMining);
    });
  }

  listenToReturnClientLongRunningEvent() {
    const cnx = this.connection;
    const action = 'returnClientLongRunningEvent';
    

    this.registerConnectionEvent('returnClientLongRunningEvent', (correlationId: number, result: number, message: string) => {
      this.logEvent('returnClientLongRunningEvent - event', { 'correlationId': correlationId, 'result': result, 'message': message });
      if (result === 0) {
        this.propagateEvent(correlationId, EventTypes.Message, ResponseResult.Success, message);
      }
      else {
        this.propagateEvent(correlationId, EventTypes.Error, ResponseResult.Error, message);
      }
    });
  }

  listenToLongRunningStatusUpdate() {
    const cnx = this.connection;
    const action = 'longRunningStatusUpdate';
    

    this.registerConnectionEvent('longRunningStatusUpdate', (correlationId: number, eventId: number, eventType: number, message: any) => {
      let eventName = EventTypes[eventId];
      this.logEvent('longRunningStatusUpdate - event', { 'correlationId': correlationId, 'eventId': eventId, 'eventName': eventName, 'eventType': eventType, 'message': message });
      this.propagateEvent(correlationId, eventId, ResponseResult.Success, message);
    });
  }


  // ACCOUNT EVENTS

  listenToAccountTotalUpdated() {
    const cnx = this.connection;
    const action = 'accountTotalUpdated';
    

    this.registerConnectionEvent(action, (accountId: string, total: number) => {
      this.logEvent(action + ' - event', { 'accountId': accountId, 'total': total });
      this.propagateEvent(0, EventTypes.AccountTotalUpdated, ResponseResult.Success, total.toString());
    });
  }

  listenToPeerTotalUpdated() {
    const cnx = this.connection;
    const action = 'peerTotalUpdated';
    

    this.registerConnectionEvent(action, (count: number) => {
      this.logEvent(action + ' - event', { 'count': count });
      this.propagateEvent(count, EventTypes.PeerTotalUpdated, ResponseResult.Success, count.toString());
    });
  }

  listenToEnterWalletPassphrase() {
    const cnx = this.connection;
    const action = 'enterWalletPassphrase';
    

    this.registerConnectionEvent(action, (correlationId: number, chainType: number, keyCorrelationCode: number, attempt: number) => {
      this.logEvent(action + ' - event', { 'correlationId': correlationId, 'chainType': chainType, 'keyCorrelationCode': keyCorrelationCode, 'attempt': attempt });
      let event = ServerConnectionEvent.createNew(correlationId, EventTypes.RequestWalletPassphrase, ResponseResult.Success, <PassphraseParameters>{ 'correlationId': correlationId, 'chainType': chainType, 'keyCorrelationCode': keyCorrelationCode, 'attempt': attempt });
      this.eventNotifier.next(event);
    });
  }

  listenToEnterKeyPassphrase() {
    const cnx = this.connection;
    const action = 'enterKeysPassphrase';
    

    this.registerConnectionEvent(action, (correlationId: number, chainType: number, keyCorrelationCode: number, accountID: string, keyname: string, attempt: number) => {
      this.logEvent(action + ' - event', { 'correlationId': correlationId, 'chainType': chainType, 'keyCorrelationCode': keyCorrelationCode, 'accountID': accountID, 'keyname': keyname, 'attempt': attempt });
      let event = ServerConnectionEvent.createNew(correlationId, EventTypes.RequestKeyPassphrase, ResponseResult.Success, <KeyPassphraseParameters>{ 'correlationId': correlationId, 'chainType': chainType, 'keyCorrelationCode': keyCorrelationCode, 'accountID': accountID, 'keyname': keyname, 'attempt': attempt });
      this.eventNotifier.next(event);
    });
  }


  

  // WALLET CREATION EVENTS

  listenToWalletCreationStarted() {
   
    const action = 'walletCreationStarted';

    this.registerConnectionEvent(action, (correlationId: number) => {
      this.logEvent(action + ' - event', { 'correlationId': correlationId });
      this.propagateEvent(correlationId, EventTypes.WalletCreationStarted);
    });
  }

  listenToWalletCreationEnded() {
    const cnx = this.connection;
    const action = 'walletCreationEnded';
    

    this.registerConnectionEvent(action, (correlationId: number) => {
      this.logEvent(action + ' - event', { 'correlationId': correlationId });
      this.propagateEvent(correlationId, EventTypes.WalletCreationEnded);
    });
  }


  listenToWalletCreationMessage() {
    const cnx = this.connection;
    const action = 'walletCreationMessage';
    

    this.registerConnectionEvent(action, (correlationId: number, message: string) => {
      this.logEvent(action + ' - event', { 'correlationId': correlationId, 'message': message });
      this.propagateEvent(correlationId, EventTypes.WalletCreationMessage, ResponseResult.Success, message);
    });
  }

  listenToWalletCreationStep() {
    const cnx = this.connection;
    const action = 'walletCreationStep';
    

    this.registerConnectionEvent(action, (correlationId: number, stepName: string, stepIndex: number, stepTotal: number) => {
      this.logEvent(action + ' - event', { 'correlationId': correlationId, 'stepName': stepName, 'stepIndex': stepIndex, 'stepTotal': stepTotal });
      this.propagateEvent(correlationId, EventTypes.WalletCreationStep, ResponseResult.Success, { 'stepName': stepName, 'stepIndex': stepIndex, 'stepTotal': stepTotal });
    });
  }

  listenToWalletCreationError() {
    const cnx = this.connection;
    const action = 'walletCreationError';
    

    this.registerConnectionEvent(action, (correlationId: number, error: string) => {
      this.logEvent(action + ' - event', { 'correlationId': correlationId, 'error': error });
      this.propagateEvent(correlationId, EventTypes.WalletCreationError, ResponseResult.Error, error);
    });
  }

  // ACCOUNT CREATION EVENTS

  listenToAccountCreationStarted() {
    const cnx = this.connection;
    const action = 'accountCreationStarted';
    

    this.registerConnectionEvent(action, (correlationId: number) => {
      this.logEvent(action + ' - event', { 'correlationId': correlationId });
      this.propagateEvent(correlationId, EventTypes.AccountCreationStarted);
    });
  }

  listenToAccountCreationEnded() {
    const cnx = this.connection;
    const action = 'accountCreationEnded';
    

    this.registerConnectionEvent(action, (correlationId: number, accountUuid: string) => {
      this.logEvent(action + ' - event', { 'correlationId': correlationId, 'accountUuid': accountUuid });
      this.propagateEvent(correlationId, EventTypes.AccountCreationEnded);
    });
  }

  listenToAccountCreationMessage() {
    const cnx = this.connection;
    const action = 'accountCreationMessage';
    
    this.registerConnectionEvent(action, (correlationId: number, message: string) => {
      this.logEvent(action + ' - event', { 'correlationId': correlationId, 'message': message });
      this.propagateEvent(correlationId, EventTypes.AccountCreationMessage, ResponseResult.Success, message);
    });
  }

  listenToAccountCreationStep() {
    const cnx = this.connection;
    const action = 'accountCreationStep';
    

    this.registerConnectionEvent(action, (correlationId: number, stepName: string, stepIndex: number, stepTotal: number) => {
      this.logEvent(action + ' - event', { 'correlationId': correlationId, 'stepName': stepName, 'stepIndex': stepIndex, 'stepTotal': stepTotal });
      this.propagateEvent(correlationId, EventTypes.AccountCreationStep, ResponseResult.Success, { 'stepName': stepName, 'stepIndex': stepIndex, 'stepTotal': stepTotal });
    });
  }

  listenToAccountCreationError() {
    const cnx = this.connection;
    const action = 'accountCreationError';
    

    this.registerConnectionEvent(action, (correlationId: number, error: string) => {
      this.logEvent(action + ' - event', { 'correlationId': correlationId, 'error': error });
      this.propagateEvent(correlationId, EventTypes.AccountCreationError, ResponseResult.Error, error);
    });
  }

  // KEY CREATION EVENTS

  listenToKeyGenerationStarted() {
    const cnx = this.connection;
    const action = 'keyGenerationStarted';
    

    this.registerConnectionEvent(action, (correlationId: number, keyName: string, keyIndex : number, totalKeys: number) => {
      this.logEvent(action + ' - event', { 'correlationId': correlationId, 'keyName': keyName, 'keyIndex' : keyIndex, 'totalKeys': totalKeys });
      this.propagateEvent(correlationId, EventTypes.KeyGenerationStarted, ResponseResult.Success, { 'keyName': keyName, 'keyIndex': keyIndex, 'totalKeys': totalKeys });
    });
  }

  listenToKeyGenerationEnded() {
    const cnx = this.connection;
    const action = 'keyGenerationEnded';
    

    this.registerConnectionEvent(action, (correlationId: number, keyName: string, keyIndex : number, totalKeys: number) => {
      this.logEvent(action + ' - event', { 'correlationId': correlationId, 'keyName': keyName, 'keyIndex' : keyIndex, 'totalKeys': totalKeys });
      this.propagateEvent(correlationId, EventTypes.KeyGenerationEnded, ResponseResult.Success, { 'keyName': keyName, 'keyIndex': keyIndex, 'totalKeys': totalKeys });
    });
  }

  listenToKeyGenerationMessage() {
    const cnx = this.connection;
    const action = 'keyGenerationMessage';
    

    this.registerConnectionEvent(action, (correlationId: number, keyName: string, message: string) => {
      this.logEvent(action + ' - event', { 'correlationId': correlationId, 'keyName': keyName, 'message': message });
      this.propagateEvent(correlationId, EventTypes.KeyGenerationMessage, ResponseResult.Success, { 'keyName': keyName, 'message': message });
    });
  }

  listenToKeyGenerationPercentageUpdate() {
    const cnx = this.connection;
    const action = 'keyGenerationPercentageUpdate';
    

    this.registerConnectionEvent(action, (correlationId: number, keyName: string, percentage: number) => {
      this.logEvent(action + ' - event', { 'correlationId': correlationId, 'keyName': keyName, 'percentage': percentage });
      this.propagateEvent(correlationId, EventTypes.KeyGenerationPercentageUpdate, ResponseResult.Success, { 'keyName': keyName, 'percentage': percentage });
    });
  }
  

  listenToKeyGenerationError() {
    const cnx = this.connection;
    const action = 'KeyGenerationError';
    

    this.registerConnectionEvent(action, (correlationId: number, keyName: string, error: string) => {
      this.logEvent(action + ' - event', { 'correlationId': correlationId, 'keyName': keyName, 'error': error });
      this.propagateEvent(correlationId, EventTypes.KeyGenerationError, ResponseResult.Error, { 'keyName': keyName, 'error': error });
    });
  }

  // ACCOUNT PUBLICATION EVENTS

  listenToAccountPublicationStarted() {
    const cnx = this.connection;
    const action = 'accountPublicationStarted';
    

    this.registerConnectionEvent(action, (correlationId: number) => {
      this.logEvent(action + ' - event', { 'correlationId': correlationId });
      this.propagateEvent(correlationId, EventTypes.AccountPublicationStarted);
    });
  }

  listenToAccountPublicationEnded() {
    const cnx = this.connection;
    const action = 'accountPublicationEnded';
    

    this.registerConnectionEvent(action, (correlationId: number) => {
      this.logEvent(action + ' - event', { 'correlationId': correlationId });
      this.propagateEvent(correlationId, EventTypes.AccountPublicationEnded);
    });
  }

  listenToAccountPublicationMessage() {
    const cnx = this.connection;
    const action = 'accountPublicationMessage';
    

    this.registerConnectionEvent(action, (correlationId: number, message: string) => {
      this.logEvent(action + ' - event', { 'correlationId': correlationId, 'message': message });
      this.propagateEvent(correlationId, EventTypes.AccountPublicationMessage, ResponseResult.Success, message);
    });
  }

  listenToAccountPublicationStep() {
    const cnx = this.connection;
    const action = 'accountPublicationStep';
    

    this.registerConnectionEvent(action, (correlationId: number, stepName: string, stepIndex: number, stepTotal: number) => {
      this.logEvent(action + ' - event', { 'correlationId': correlationId, 'stepName': stepName, 'stepIndex': stepIndex, 'stepTotal': stepTotal });
      this.propagateEvent(correlationId, EventTypes.AccountPublicationStep, ResponseResult.Success, { 'stepName': stepName, 'stepIndex': stepIndex, 'stepTotal': stepTotal });
    });
  }

  listenToAccountPublicationPOWNonceIteration() {
    const cnx = this.connection;
    const action = 'accountPublicationPOWNonceIteration';
    

    this.registerConnectionEvent(action, (correlationId: number, nonce: number, difficulty: number) => {
      this.logEvent(action + ' - event', { 'correlationId': correlationId, 'nonce': nonce, 'difficulty': difficulty });
      this.propagateEvent(correlationId, EventTypes.AccountPublicationPOWNonceIteration, ResponseResult.Success, { 'nonce': nonce, 'difficulty': difficulty });
    });
  }

  listenToAccountPublicationPOWNonceFound() {
    const cnx = this.connection;
    const action = 'accountPublicationPOWNonceFound';
    

    this.registerConnectionEvent(action, (correlationId: number, nonce: number, difficulty: number, solutions: Array<number>) => {
      this.logEvent(action + ' - event', { 'correlationId': correlationId, 'nonce': nonce, 'difficulty': difficulty, 'solutions': solutions });
      this.propagateEvent(correlationId, EventTypes.AccountPublicationPOWNonceFound, ResponseResult.Success, { 'nonce': nonce, 'difficulty': difficulty, 'solutions': solutions });
    });
  }

  listenToAccountPublicationError() {
    const cnx = this.connection;
    const action = 'accountPublicationError';
    

    this.registerConnectionEvent(action, (correlationId: number, error: string) => {
      this.logEvent(action + ' - event', { 'correlationId': correlationId, 'error': error });
      this.propagateEvent(correlationId, EventTypes.AccountPublicationError, ResponseResult.Error, error);
    });
  }

  // WALLET SYNC EVENT

  listenToWalletSyncStarted() {
    const cnx = this.connection;
    const action = 'walletSyncStarted';
    

    this.registerConnectionEvent(action, (chainType: number, currentBlockId: number, blockHeight: number, percentage: number) => {
      this.logEvent(action + ' - event', { 'chainType': chainType, 'currentBlockId': currentBlockId, 'blockHeight': blockHeight, 'percentage': percentage });
      this.propagateEvent(chainType, EventTypes.WalletSyncStarted, ResponseResult.Success, { 'chainType': chainType, 'currentBlockId': currentBlockId, 'blockHeight': blockHeight, 'percentage': percentage });
    });
  }

  listenToWalletSyncEnded() {
    const cnx = this.connection;
    const action = 'walletSyncEnded';
    

    this.registerConnectionEvent(action, (chainType: number, currentBlockId: number, blockHeight: number, percentage: number) => {
      this.logEvent(action + ' - event', { 'chainType': chainType, 'currentBlockId': currentBlockId, 'blockHeight': blockHeight, 'percentage': percentage });
      this.propagateEvent(chainType, EventTypes.WalletSyncEnded, ResponseResult.Success, { 'chainType': chainType, 'currentBlockId': currentBlockId, 'blockHeight': blockHeight, 'percentage': percentage });
    });
  }

  listenToWalletSyncUpdate() {
    const cnx = this.connection;
    const action = 'WalletSyncUpdate';
    

    this.registerConnectionEvent(action, (chainType: number, currentBlockId: number, blockHeight: number, percentage: number, estimatedTimeRemaining: string) => {
      this.logEvent(action + ' - event', { 'chainType': chainType, 'currentBlockId': currentBlockId, 'blockHeight': blockHeight, 'percentage': percentage, 'estimatedTimeRemaining': estimatedTimeRemaining });
      this.propagateEvent(chainType, EventTypes.WalletSyncUpdate, ResponseResult.Success, { 'chainType': chainType, 'currentBlockId': currentBlockId, 'blockHeight': blockHeight, 'percentage': percentage, 'estimatedTimeRemaining': estimatedTimeRemaining });
    });
  }

  listenToWalletSyncError() {
    const cnx = this.connection;
    const action = 'walletSyncError';
    

    this.registerConnectionEvent(action, (correlationId: number, error: string) => {
      this.logEvent(action + ' - event', { 'correlationId': correlationId, 'error': error });
      this.propagateEvent(correlationId, EventTypes.WalletSyncError, ResponseResult.Error, error);
    });
  }

  // BLOCKCHAIN SYNC EVENT

  listenToBlockchainSyncStarted() {
    const cnx = this.connection;
    const action = 'blockchainSyncStarted';
    

    this.registerConnectionEvent(action, (chainType: number, currentBlockId: number, publicBlockHeight: number) => {
      this.logEvent(action + ' - event', { 'chainType': chainType, 'currentBlockId': currentBlockId, 'publicBlockHeight': publicBlockHeight });
      this.propagateEvent(chainType, EventTypes.BlockchainSyncStarted, ResponseResult.Success, { 'chainType': chainType, 'currentBlockId': currentBlockId, 'publicBlockHeight': publicBlockHeight});
    });
  }

  listenToBlockchainSyncEnded() {
    const cnx = this.connection;
    const action = 'blockchainSyncEnded';
    

    this.registerConnectionEvent(action, (chainType: number, currentBlockId: number, publicBlockHeight: number) => {
      this.logEvent(action + ' - event', { 'chainType': chainType, 'currentBlockId': currentBlockId, 'publicBlockHeight': publicBlockHeight });
      this.propagateEvent(chainType, EventTypes.BlockchainSyncEnded, ResponseResult.Success, { 'chainType': chainType, 'currentBlockId': currentBlockId, 'publicBlockHeight': publicBlockHeight});
    });
  }

  listenToBlockchainSyncUpdate() {
    const cnx = this.connection;
    const action = 'blockchainSyncUpdate';
    

    this.registerConnectionEvent(action, (chainType: number, currentBlockId: number, publicBlockHeight: number, percentage: number, estimatedTimeRemaining: string) => {
      this.logEvent(action + ' - event', { 'chainType': chainType, 'currentBlockId': currentBlockId, 'publicBlockHeight': publicBlockHeight, 'percentage': percentage, 'estimatedTimeRemaining': estimatedTimeRemaining });
      this.propagateEvent(chainType, EventTypes.BlockchainSyncUpdate, ResponseResult.Success, { 'chainType': chainType, 'currentBlockId': currentBlockId, 'publicBlockHeight': publicBlockHeight, 'percentage': percentage, 'estimatedTimeRemaining': estimatedTimeRemaining });
    });
  }

  listenToBlockchainSyncError() {
    const cnx = this.connection;
    const action = 'blockchainSyncError';
    

    this.registerConnectionEvent(action, (correlationId: number, error: string) => {
      this.logEvent(action + ' - event', { 'correlationId': correlationId, 'error': error });
      this.propagateEvent(correlationId, EventTypes.BlockchainSyncError, ResponseResult.Error, error);
    });
  }

  // TRANSACTION EVENT

  
  listenToNeuraliumTimelineUpdated(){
    const cnx = this.connection;
    const action = 'neuraliumTimelineUpdated';
    
    this.registerConnectionEvent(action, () => {
      this.logEvent(action + ' - event', {  });
      this.propagateEvent(0, EventTypes.NeuraliumTimelineUpdated, ResponseResult.Success, {});
    });
  }

  listenToTransactionHistoryUpdated(){
    const cnx = this.connection;
    const action = 'transactionHistoryUpdated';
    
    this.registerConnectionEvent(action, (chainType: number) => {
      this.logEvent(action + ' - event', { 'chainType':chainType });
      this.propagateEvent(0, EventTypes.TransactionHistoryUpdated, ResponseResult.Success, { 'chainType': chainType});
    });
  }

  listenToTransactionSent() {
    const cnx = this.connection;
    const action = 'transactionSent';
    

    this.registerConnectionEvent(action, (correlationId: number, transactionId: string, transaction: any) => {
      this.logEvent(action + ' - event', { 'correlationId':correlationId, 'transactionId': transactionId, 'transaction': transaction });
      this.propagateEvent(correlationId, EventTypes.TransactionSent, ResponseResult.Success, transaction);
    });
  }

  listenToTransactionConfirmed() {
    const cnx = this.connection;
    const action = 'transactionConfirmed';
    

    this.registerConnectionEvent(action, (correlationId: number, transactionId: string, transaction: any) => {
      this.logEvent(action + ' - event', {  'correlationId':correlationId,'transactionId': transactionId, 'transaction': transaction });
      this.propagateEvent(correlationId, EventTypes.TransactionConfirmed, ResponseResult.Success, transaction);
    });
  }

  listenToTransactionReceived() {
    const cnx = this.connection;
    const action = 'transactionReceived';

    this.registerConnectionEvent(action, (correlationId: number, transactionId: string) => {
      this.logEvent(action + ' - event', { 'correlationId':correlationId, 'transactionId': transactionId });
      this.propagateEvent(correlationId, EventTypes.TransactionReceived, ResponseResult.Success, transactionId);
    });
  }
  
  listenToTransactionMessage() {
    const cnx = this.connection;
    const action = 'transactionMessage';
    

    this.registerConnectionEvent(action, (correlationId: number, transactionId: string, message: string) => {
      this.logEvent(action + ' - event', { 'correlationId':correlationId, 'transactionId': transactionId, 'message': message });
      this.propagateEvent(correlationId, EventTypes.TransactionMessage, ResponseResult.Success, message);
    });
  }

  listenToTransactionRefused() {
    const cnx = this.connection;
    const action = 'transactionRefused';
    

    this.registerConnectionEvent(action, (correlationId: number, transactionId: string, message: string) => {
      this.logEvent(action + ' - event', { 'correlationId':correlationId, 'transactionId': transactionId, 'message': message });
      this.propagateEvent(correlationId, EventTypes.TransactionRefused, ResponseResult.Error, message);
    });
  }

  listenToTransactionError() {
    const cnx = this.connection;
    const action = 'transactionError';
    
    this.registerConnectionEvent(action, (correlationId: number, transactionId: string, errorCodes: Array<number>) => {
      this.logEvent(action + ' - event', { 'correlationId':correlationId, 'transactionId': transactionId, 'errorCodes': errorCodes });
      this.propagateEvent(correlationId, EventTypes.TransactionError, ResponseResult.Error, {'transactionId': transactionId, 'errorCodes': errorCodes });
    });
  }

  // MINING EVENTS

  listenToMiningStarted() {
    const cnx = this.connection;
    const action = 'miningStarted';
    
    this.registerConnectionEvent(action, (chainType: number) => {
      this.logEvent(action + ' - event', { 'chainType': chainType });
      this.propagateEvent(chainType, EventTypes.MiningStarted, ResponseResult.Success);
    });
  }

  listenToMiningEnded() {
    const cnx = this.connection;
    const action = 'miningEnded';
    

    this.registerConnectionEvent(action, (chainType: number, status: number) => {
      this.logEvent(action + ' - event', { 'chainType': chainType, 'status': status });
      this.propagateEvent(chainType, EventTypes.MiningEnded, ResponseResult.Success, {chainType, status});
    });
  }

  listenToElectionContextCached() {
    const cnx = this.connection;
    const action = 'electionContextCached';
    

    this.registerConnectionEvent(action, (chainType: number, blockId: number, maturityId: number, difficulty:number) => {
      this.logEvent(action + ' - event', { 'chainType': chainType, 'blockId': blockId, 'maturityId': maturityId, 'difficulty': difficulty });
      this.propagateEvent(chainType, EventTypes.ElectionContextCached, ResponseResult.Success, {chainType, blockId, maturityId, difficulty});
    });
  }

  listenToElectionProcessingCompleted() {
    const cnx = this.connection;
    const action = 'electionProcessingCompleted';
    

    this.registerConnectionEvent(action, (chainType: number, blockId: number, electionResultCount:number) => {
      this.logEvent(action + ' - event', { 'chainType': chainType, 'blockId': blockId, 'electionResultCount': electionResultCount });
      this.propagateEvent(chainType, EventTypes.ElectionProcessingCompleted, ResponseResult.Success, {chainType, blockId, electionResultCount});
    });
  }

  
  

  listenToMiningElected() {
    const cnx = this.connection;
    const action = 'miningElected';

    this.registerConnectionEvent(action, (chainType: number, electionBlockId:number, level:number) => {
      this.logEvent(action + ' - event', { 'chainType': chainType, 'electionBlockId' : electionBlockId, 'level' : level });
      this.propagateEvent(chainType, EventTypes.MiningElected, ResponseResult.Success, {'chainType': chainType, 'electionBlockId' : electionBlockId, 'level' : level});
    });
  }

  listenToMiningPrimeElectedMissed() {
    const cnx = this.connection;
    const action = 'miningPrimeElectedMissed';

    this.registerConnectionEvent(action, (chainType: number, publicationBlockId:number, electionBlockId:number, level:number) => {
      this.logEvent(action + ' - event', { 'chainType': chainType, 'publicationBlockId' : publicationBlockId, 'electionBlockId' : electionBlockId, 'level' : level });
      this.propagateEvent(chainType, EventTypes.MiningPrimeElectedMissed, ResponseResult.Success, {'chainType': chainType, 'publicationBlockId' : publicationBlockId, 'electionBlockId' : electionBlockId, 'level' : level});
    });
  }


  listenToNeuraliumMiningPrimeElected() {
    const cnx = this.connection;
    const action = 'neuraliumMiningPrimeElected';
    
    this.registerConnectionEvent(action, (chainType: number, blockId: number, bounty: number, transactionTip: number, delegateAccountId: string, level:number) => {
      this.logEvent(action + ' - event', { 'chainType': chainType , blockId, bounty, transactionTip, delegateAccountId, level});
      this.propagateEvent(chainType, EventTypes.NeuraliumMiningPrimeElected, ResponseResult.Success, {chainType, blockId, bounty, transactionTip, delegateAccountId, level});
    });
  }

  listenToNeuraliumMiningBountyAllocated() {
    const cnx = this.connection;
    const action = 'neuraliumMiningBountyAllocated';
    

    this.registerConnectionEvent(action, (chainType: number) => {
      this.logEvent(action + ' - event', { 'chainType': chainType });
      this.propagateEvent(chainType, EventTypes.NeuraliumMiningBountyAllocated, ResponseResult.Success);
    });
  }

  listenToMiningConnectableStatusChanged(){
    const cnx = this.connection;
    const action = 'connectableStatusChanged';
    

    this.registerConnectionEvent(action, (connectable: boolean) => {
      this.logEvent(action + ' - event', { 'connectable': connectable });
      this.propagateEvent(0, EventTypes.ConnectableStatusChanged, ResponseResult.Success, { connectable });
    });
  }

  // BLOCKS AND DIGESTS

  listenToBlockInserted() {
    const cnx = this.connection;
    const action = 'blockInserted';
    

    this.registerConnectionEvent(action, (chainType: number, blockId: number, timestamp: Date, hash: string, publicBlockId: number, lifespan: number) => {
      this.logEvent(action + ' - event', { chainType, blockId, publicBlockId, timestamp, hash, lifespan });
      this.propagateEvent(blockId, EventTypes.BlockInserted, ResponseResult.Success, { chainType, blockId, publicBlockId, timestamp, hash, lifespan });
    });
  }

  listenToRequireNodeUpdate(){
    const cnx = this.connection;
    const action = 'requireNodeUpdate';
    

    this.registerConnectionEvent(action, (chainType: number, chainName:string) => {
      this.logEvent(action + ' - event', { chainType, chainName  });
      this.propagateEvent(chainType, EventTypes.RequireNodeUpdate, ResponseResult.Success, { chainType,  chainName });
    });
  }

  // MESSAGE AND ERROR


  listenToMessage() {
    const cnx = this.connection;
    const action = 'message';
    

    this.registerConnectionEvent(action, (message: string, timestamp: Date, level:string, properties:Array<Object>) => {

      if(this.messages.length > MESSAGE_BUFFER_SIZE){
        this.messages.shift();
      }
      this.messages.push(new ServerMessage(message, timestamp, level, properties));

      this.logEvent(action + ' - event', { 'message': message });
      this.propagateEvent(1, EventTypes.Message, ResponseResult.Success, message);
    });
  }

  listenToError() {
    const cnx = this.connection;
    const action = 'error';
    

    this.registerConnectionEvent(action, (correlationId: number, message: string) => {
      this.logEvent(action + ' - event', { 'correlationId': correlationId, 'message': message });
      this.propagateEvent(correlationId, EventTypes.TransactionError, ResponseResult.Error, message);
    });
  }

  // UTILS

  isConnectedToServer(): Observable<boolean> {
    return this.serverConnection;
  }

  isConsoleMessagesEnabled(): Observable<boolean> {
    return this.consoleMessagesEnabled;
  }
  

  logEvent(message: string, data: any) {
    this.logService.logDebug(message, data);
  }

  propagateEvent(correlationId: number,
    eventType: EventTypes = EventTypes.DefaultEvent,
    eventResponse: ResponseResult = ResponseResult.Success,
    message: any = '') {
    let event = ServerConnectionEvent.createNew(correlationId, eventType, eventResponse, message);
    this.eventNotifier.next(event);
  }

  public tryConnectToServer(): Promise<void> {
    return this.tryConnectToServerTyped<void>();
  }
  
  public tryConnectToServerTyped<T = any>(): Promise<T> {
    return new Promise<T>((resolve, reject) => {

      if(this.IsConnected){
        this.isCurrentlyConnected = true;
        this.isConnecting = false;
        resolve();
        return;
      }
      this.isCurrentlyConnected = false;
      this.notifyServerConnectionStatusIfNeeded(false);
      setTimeout(() => {
          if(!this.isCurrentlyConnected && !this.isConnecting){
            this.isConnecting = true;
            this.ping()
              .then(() => {
                this.notifyServerConnectionStatusIfNeeded(true);
                resolve();
                this.isConnecting = false;
              })
              .catch(reason => {
                this.notifyServerConnectionStatusIfNeeded(false);
                this.isConnecting = false;
                //this.logService.logDebug(reason, null);
                this.tryConnectToServer().then(() => resolve());
              });
          }
          else{
            if(!this.isConnecting){
              this.tryConnectToServer().then(() => resolve());
            }
          }
      }, RETRY_DURATION);
    });
  }


  public invoke<T = any>(methodName: string, ...args: any[]): Promise<T>{

    // if we are connected, then go right to the request.
    if(this.IsConnected){
      return this.connection.invoke<T>(methodName, ...args);
    }
    else{

      // now we need to conenct before we fulfill the request.
      return new Promise<T>((resolve, reject) => {
        this.tryConnectToServerTyped<T>().then(() => {
          this.connection.invoke<T>(methodName, ...args).then(() => resolve()).catch(() => reject());
        })
        .catch(reason => {
          console.log('Connection not connected, failed to reconnect.');
          reject();
        });
      });
    }
  }


  notifyServerConnectionStatusIfNeeded(connected: boolean) {
    if (connected !== this.isCurrentlyConnected) {
      this.isCurrentlyConnected = connected;
      this.serverConnection.next(connected);
    }
  }

  // utility method

  ping(): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const cnx = this.connection;

      cnx.start()
        .then(() => {
          cnx.invoke<string>('ping')
            .then(
              response => {
                if (response === 'pong') {
                  resolve();
                }
                else {
                  reject('Ping error : \'pong\' not received => ' + response)
                }
              })
            .catch(reason => {
              cnx.stop();
              reject('Ping error : ' + reason);
            
            });
        })
        .catch(reason => {
          reject('Connection error : ' + reason);
        });
    });
  }

  // test method

  testMiningEvent() {
    setTimeout(() => {
      this.propagateEvent(1000, EventTypes.MiningStarted, ResponseResult.Success);
    }, 20);

    setTimeout(() => {
      this.propagateEvent(1000, EventTypes.MiningStatusChanged, ResponseResult.Success);
    }, 40);

    setTimeout(() => {
      this.propagateEvent(1000, EventTypes.MiningPrimeElected, ResponseResult.Success);
    }, 50);

    setTimeout(() => {
      this.propagateEvent(1000, EventTypes.MiningElected, ResponseResult.Success);
    }, 60);

    setTimeout(() => {
      this.propagateEvent(1000, EventTypes.MiningEnded, ResponseResult.Success);
    }, 80);
  }
}
