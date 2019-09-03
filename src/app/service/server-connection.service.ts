import { Injectable } from '@angular/core';
import { NotificationService } from './notification.service';
import { HubConnectionBuilder, HttpTransportType, HubConnection, LogLevel } from '@aspnet/signalr';
import { BehaviorSubject, Observable } from 'rxjs';
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
import * as moment from 'moment';

const RETRY_DURATION = 2000;
const MESSAGE_BUFFER_SIZE = 500;

export class ServerMessage {

  public message:string;
  public timestamp:moment.Moment;
public level:string;
public properties:Array<Object>;

  constructor(message:string, timestamp: Date, level:string, properties:Array<Object>){
      this.message = message;
      this.timestamp = moment(timestamp);
      this.level = level;
      this.properties = properties;
  }

  GetThread():object{
    return this.properties[0];
  }
}

@Injectable({
  providedIn: 'root'
})
export class ServerConnectionService {
  private showServerNotConnectedObs: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(true);
  private canManuallyStopServerObs: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  get showServerNotConnected(): Observable<boolean> {
    return this.showServerNotConnectedObs;
  }

  setShowServerNotConnected(value: boolean) {
    this.showServerNotConnectedObs.next(value);
  }

  get canManuallyStopServer(): Observable<boolean> {
    return this.canManuallyStopServerObs;
  }

  setCanManuallyStopServer(value: boolean) {
    this.canManuallyStopServerObs.next(value);
  }

  serverPort: number;
  serverPath: string;
  eventNotifier: BehaviorSubject<ServerConnectionEvent> = new BehaviorSubject<ServerConnectionEvent>(ServerConnectionEvent.NO_EVENT);
  serverConnection: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  private isCurrentlyConnected: boolean = false;

  public messages:Array<ServerMessage> = new Array<ServerMessage>();


  constructor(
    private notificationService: NotificationService,
    private logService: LogService,
    private configService: ConfigService) {

    this.serverPort = this.configService.serverPort;
    this.serverPath = this.configService.serverPath;   

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
    this.listenToLongRunningStatusUpdate();
    this.listenToReturnClientLongRunningEvent();

    this.listenToAccountTotalUpdated();
    this.listenToPeerTotalUpdated();

    this.listenToBlockInserted();

    this.listenToError();
    this.listenToMessage();

    this.listenToEnterKeyPassphrase();
    this.listenToEnterWalletPassphrase();
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
  }

  startListeningMiningEvents() {
    this.listenToMiningBountyAllocated();
    this.listenToMiningElected();
    this.listenToMiningEnded();
    this.listenToMiningStarted();
  }

  

  // DEBUG

  callRefillNeuraliums(accountUuid: string): Promise<boolean> {
    var service = DebugCall.create(this.connection, this.logService);
    return service.callRefillNeuraliums(accountUuid);
  }

  // FIN DEBUG

  //server call methods
  callSetActiveAccount(chainType: number, accountUuid: string): Promise<boolean> {
    var service = AccountCall.create(this.connection, this.logService);
    return service.callSetActiveAccount(chainType, accountUuid);
  }

  callServerShutdown(): Promise<boolean> {
    var service = ServerCall.create(this.connection, this.logService);
    return service.callServerShutdown();
  }

  callCreateNewWallet(chainType: number, wallet: WalletCreation): Promise<number> {
    var service = WalletCall.create(this.connection, this.logService);
    return service.callCreateNewWallet(chainType, wallet);
  }

  callSetWalletPassphrase(correlationId: number, password: string) {
    var service = WalletCall.create(this.connection, this.logService);
    return service.callSetWalletPassphrase(correlationId, password);
  }

  callSetKeysPassphrase(correlationId: number, password: string) {
    var service = WalletCall.create(this.connection, this.logService);
    return service.callSetKeysPassphrase(correlationId, password);
  }

  callQuerySystemVersion() {
    var service = ServerCall.create(this.connection, this.logService);
    return service.callQuerySystemVersion();
  }

  callQueryWalletTransactionHistory(chainType: number, accountUuid: string) {
    var service = TransactionsCall.create(this.connection, this.logService);
    return service.callQueryWalletTransactionHistory(chainType, accountUuid);
  }

  callQueryTransationHistoryDetails(chainType: number, accountUuid: string, transactionId: string) {
    var service = TransactionsCall.create(this.connection, this.logService);
    return service.callQueryTransationHistoryDetails(chainType, accountUuid, transactionId);
  }

  callQueryWalletAccounts(chainType: number) {
    var service = WalletCall.create(this.connection, this.logService);
    return service.callQueryWalletAccounts(chainType);
  }

  callQueryWalletAccountDetails(chainType: number, accountUuid: string) {
    var service = WalletCall.create(this.connection, this.logService);
    return service.callQueryWalletAccountDetails(chainType, accountUuid);
  }

  callQueryBlockChainInfo(chainType: number) {
    var service = BlockchainCall.create(this.connection, this.logService);
    return service.callQueryBlockChainInfo(chainType);
  }

  callQuerySupportedChains() {
    var service = BlockchainCall.create(this.connection, this.logService);
    return service.callQuerySupportedChains();
  }

  callCompleteLongRunningEvent(correlationId: number) {
    var service = ServerCall.create(this.connection, this.logService);
    return service.callCompleteLongRunningEvent(correlationId);
  }

  callRenewLongRunningEvent(correlationId: number) {
    var service = ServerCall.create(this.connection, this.logService);
    return service.callRenewLongRunningEvent(correlationId);
  }

  callQueryChainStatus(chainType: number) {
    var service = BlockchainCall.create(this.connection, this.logService);
    return service.callQueryChainStatus(chainType);
  }

  callStartMining(chainType: number, delegateAccountId: string) {
    var service = MiningCall.create(this.connection, this.logService);
    return service.callStartMining(chainType, delegateAccountId);
  }

  callStopMining(chainType: number) {
    var service = MiningCall.create(this.connection, this.logService);
    return service.callStopMining(chainType);
  }

  callIsMiningEnabled(chainType: number) {
    var service = MiningCall.create(this.connection, this.logService);
    return service.callIsMiningEnabled(chainType);
  }

  callQueryMiningHistory(chainType: number) {
    var service = MiningCall.create(this.connection, this.logService);
    return service.callQueryMiningHistory(chainType);
  }

  callQueryTotalConnectedPeersCount() {
    var service = ServerCall.create(this.connection, this.logService);
    return service.callQueryTotalConnectedPeersCount();
  }

  callQueryBlockchainSynced(chainType: number) {
    var service = BlockchainCall.create(this.connection, this.logService);
    return service.callQueryBlockchainSynced(chainType);
  }

  callIsBlockchainSynced(chainType: number): Promise<boolean> {
    var service = BlockchainCall.create(this.connection, this.logService);
    return service.callIsBlockchainSynced(chainType);
  }

  callQueryWalletSynced(chainType: number) {
    var service = WalletCall.create(this.connection, this.logService);
    return service.callQueryWalletSynced(chainType);
  }

  callIsWalletLoaded(chainType: number) {
    var service = WalletCall.create(this.connection, this.logService);
    return service.callIsWalletLoaded(chainType);
  }

  callWalletExists(chainType: number) {
    var service = WalletCall.create(this.connection, this.logService);
    return service.callWalletExists(chainType);
  }

  callLoadWallet(chainType: number) {
    var service = WalletCall.create(this.connection, this.logService);
    return service.callLoadWallet(chainType);
  }

  callIsWalletSynced(chainType: number): Promise<boolean> {
    var service = WalletCall.create(this.connection, this.logService);
    return service.callIsWalletSynced(chainType);
  }

  callQueryBlockHeight(chainType: number) {
    var service = BlockchainCall.create(this.connection, this.logService);
    return service.callQueryBlockHeight(chainType);
  }

  callPublishAccount(chainType: number, accountUuId: string) {
    var service = AccountCall.create(this.connection, this.logService);
    return service.callPublishAccount(chainType, accountUuId);
  }

  callSendNeuraliums(targetAccountId: string, amount: number, fees: number, note: string) {
    var service = NeuraliumCall.create(this.connection, this.logService);
    return service.callSendNeuraliums(targetAccountId, amount, fees, note);
  }

  callQueryAccountTotalNeuraliums(accountUuid: string) {
    var service = NeuraliumCall.create(this.connection, this.logService);
    return service.callQueryAccountTotalNeuraliums(accountUuid);
  }

  callQueryNeuraliumTimelineHeader(accountUuid: string) {
    var service = NeuraliumCall.create(this.connection, this.logService);
    return service.callQueryNeuraliumTimelineHeader(accountUuid);
  }

  callQueryNeuraliumTimelineSection(accountUuid: string, firstday: Date, skip: number, take: number) {
    var service = NeuraliumCall.create(this.connection, this.logService);
    return service.callQueryNeuraliumTimelineSection(accountUuid, firstday, skip, take);
  }

  // PASSPHRASES CALL

  callEnterWalletPassphrase(correlationId: number, chainType: number, keyCorrelationCode: number, passphrase: string): Promise<boolean> {
    var service = PassphrasesCall.create(this.connection, this.logService);
    return service.callEnterWalletPassphrase(correlationId, chainType, keyCorrelationCode, passphrase);
  }

  callEnterKeyPassphrase(correlationId: number, chainType: number, keyCorrelationCode: number, passphrase: string): Promise<boolean> {
    var service = PassphrasesCall.create(this.connection, this.logService);
    return service.callEnterKeyPassphrase(correlationId, chainType, keyCorrelationCode, passphrase);
  }

  //server listening
  listenToServerShutdownStarted() {
    const cnx = this.connection;
    const action = "ShutdownStarted";
    this.manageOnStartAndOnCloseListening(cnx, action);

    cnx.on(action, () => {
      this.logEvent(action + " - event", null);
      this.propagateEvent(0, EventTypes.ShutdownStarted, ResponseResult.Success, "Shutdown Started");
    });
  }

  listenToServerShutdownCompleted() {
    const cnx = this.connection;
    const action = "ShutdownCompleted";
    this.manageOnStartAndOnCloseListening(cnx, action);

    cnx.on(action, () => {
      this.logEvent(action + " - event", null);
      this.propagateEvent(0, EventTypes.ShutdownCompleted, ResponseResult.Success, "Shutdown Completed");
    });
  }

  listenToRequestCopyWallet() {
    const cnx = this.connection;
    const action = "requestCopyWallet";
    this.manageOnStartAndOnCloseListening(cnx, action);

    cnx.on(action, (chainType: number, message: string) => {
      this.logEvent(action + " - event", { 'chainType': chainType, 'message': message });
      this.propagateEvent(chainType, EventTypes.RequestCopyWallet, ResponseResult.Success, message);
    });
  }

  listenToMiningStatusChanged() {
    const cnx = this.connection;
    const action = "miningStatusChanged";
    this.manageOnStartAndOnCloseListening(cnx, action);

    cnx.on(action, (chainType: number, isMining: boolean) => {
      this.logEvent(action + " - event", { 'chainType': chainType, 'isMining': isMining });
      this.propagateEvent(chainType, EventTypes.MiningStatusChanged, ResponseResult.Success, isMining);
    });
  }

  listenToReturnClientLongRunningEvent() {
    const cnx = this.connection;
    const action = "returnClientLongRunningEvent";
    this.manageOnStartAndOnCloseListening(cnx, action);

    cnx.on("returnClientLongRunningEvent", (correlationId: number, result: number, message: string) => {
      this.logEvent("returnClientLongRunningEvent - event", { 'correlationId': correlationId, 'result': result, 'message': message });
      if (result == 0) {
        this.propagateEvent(correlationId, EventTypes.Message, ResponseResult.Success, message);
      }
      else {
        this.propagateEvent(correlationId, EventTypes.Error, ResponseResult.Error, message);
      }
    });
  }

  listenToLongRunningStatusUpdate() {
    const cnx = this.connection;
    const action = "longRunningStatusUpdate";
    this.manageOnStartAndOnCloseListening(cnx, action);

    cnx.on("longRunningStatusUpdate", (correlationId: number, eventId: number, eventType: number, message: any) => {
      var eventName = EventTypes[eventId];
      this.logEvent("longRunningStatusUpdate - event", { 'correlationId': correlationId, 'eventId': eventId, 'eventName': eventName, 'eventType': eventType, 'message': message });
      this.propagateEvent(correlationId, eventId, ResponseResult.Success, message);
    });
  }


  // ACCOUNT EVENTS

  listenToAccountTotalUpdated() {
    const cnx = this.connection;
    const action = "accountTotalUpdated";
    this.manageOnStartAndOnCloseListening(cnx, action);

    cnx.on(action, (correlationId: number, accountId: string, total: number) => {
      this.logEvent(action + " - event", { 'correlationId': correlationId, 'accountId': accountId, 'total': total });
      this.propagateEvent(correlationId, EventTypes.AccountTotalUpdated, ResponseResult.Success, total.toString());
    });
  }

  listenToPeerTotalUpdated() {
    const cnx = this.connection;
    const action = "peerTotalUpdated";
    this.manageOnStartAndOnCloseListening(cnx, action);

    cnx.on(action, (count: number) => {
      this.logEvent(action + " - event", { 'count': count });
      this.propagateEvent(count, EventTypes.PeerTotalUpdated, ResponseResult.Success, count.toString());
    });
  }

  listenToEnterWalletPassphrase() {
    const cnx = this.connection;
    const action = "enterWalletPassphrase";
    this.manageOnStartAndOnCloseListening(cnx, action);

    cnx.on(action, (correlationId: number, chainType: number, keyCorrelationCode: number, attempt: number) => {
      this.logEvent(action + " - event", { 'correlationId': correlationId, 'chainType': chainType, 'keyCorrelationCode': keyCorrelationCode, 'attempt': attempt });
      var event = ServerConnectionEvent.createNew(correlationId, EventTypes.RequestWalletPassphrase, ResponseResult.Success, <PassphraseParameters>{ 'correlationId': correlationId, 'chainType': chainType, 'keyCorrelationCode': keyCorrelationCode, 'attempt': attempt });
      this.eventNotifier.next(event);
    });
  }

  listenToEnterKeyPassphrase() {
    const cnx = this.connection;
    const action = "enterKeysPassphrase";
    this.manageOnStartAndOnCloseListening(cnx, action);

    cnx.on(action, (correlationId: number, chainType: number, keyCorrelationCode: number, accountID: string, keyname: string, attempt: number) => {
      this.logEvent(action + " - event", { 'correlationId': correlationId, 'chainType': chainType, 'keyCorrelationCode': keyCorrelationCode, 'accountID': accountID, 'keyname': keyname, 'attempt': attempt });
      var event = ServerConnectionEvent.createNew(correlationId, EventTypes.RequestKeyPassphrase, ResponseResult.Success, <KeyPassphraseParameters>{ 'correlationId': correlationId, 'chainType': chainType, 'keyCorrelationCode': keyCorrelationCode, 'accountID': accountID, 'keyname': keyname, 'attempt': attempt });
      this.eventNotifier.next(event);
    });
  }



  // WALLET CREATION EVENTS

  listenToWalletCreationStarted() {
    const cnx = this.connection;
    const action = "walletCreationStarted";
    this.manageOnStartAndOnCloseListening(cnx, action);

    cnx.on(action, (correlationId: number) => {
      this.logEvent(action + " - event", { 'correlationId': correlationId });
      this.propagateEvent(correlationId, EventTypes.WalletCreationStarted);
    });
  }

  listenToWalletCreationEnded() {
    const cnx = this.connection;
    const action = "walletCreationEnded";
    this.manageOnStartAndOnCloseListening(cnx, action);

    cnx.on(action, (correlationId: number) => {
      this.logEvent(action + " - event", { 'correlationId': correlationId });
      this.propagateEvent(correlationId, EventTypes.WalletCreationEnded);
    });
  }


  listenToWalletCreationMessage() {
    const cnx = this.connection;
    const action = "aalletCreationMessage";
    this.manageOnStartAndOnCloseListening(cnx, action);

    cnx.on(action, (correlationId: number, message: string) => {
      this.logEvent(action + " - event", { 'correlationId': correlationId, 'message': message });
      this.propagateEvent(correlationId, EventTypes.WalletCreationMessage, ResponseResult.Success, message);
    });
  }

  listenToWalletCreationStep() {
    const cnx = this.connection;
    const action = "aalletCreationStep";
    this.manageOnStartAndOnCloseListening(cnx, action);

    cnx.on(action, (correlationId: number, stepName: string, stepIndex: number, stepTotal: number) => {
      this.logEvent(action + " - event", { 'correlationId': correlationId, 'stepName': stepName, 'stepIndex': stepIndex, 'stepTotal': stepTotal });
      this.propagateEvent(correlationId, EventTypes.WalletCreationStep, ResponseResult.Success, { 'stepName': stepName, 'stepIndex': stepIndex, 'stepTotal': stepTotal });
    });
  }

  listenToWalletCreationError() {
    const cnx = this.connection;
    const action = "aalletCreationError";
    this.manageOnStartAndOnCloseListening(cnx, action);

    cnx.on(action, (correlationId: number, error: string) => {
      this.logEvent(action + " - event", { 'correlationId': correlationId, 'error': error });
      this.propagateEvent(correlationId, EventTypes.WalletCreationError, ResponseResult.Error, error);
    });
  }

  // ACCOUNT CREATION EVENTS

  listenToAccountCreationStarted() {
    const cnx = this.connection;
    const action = "accountCreationStarted";
    this.manageOnStartAndOnCloseListening(cnx, action);

    cnx.on(action, (correlationId: number) => {
      this.logEvent(action + " - event", { 'correlationId': correlationId });
      this.propagateEvent(correlationId, EventTypes.AccountCreationStarted);
    });
  }

  listenToAccountCreationEnded() {
    const cnx = this.connection;
    const action = "accountCreationEnded";
    this.manageOnStartAndOnCloseListening(cnx, action);

    cnx.on(action, (correlationId: number, accountUuid: string) => {
      this.logEvent(action + " - event", { 'correlationId': correlationId, 'accountUuid': accountUuid });
      this.propagateEvent(correlationId, EventTypes.AccountCreationEnded);
    });
  }

  listenToAccountCreationMessage() {
    const cnx = this.connection;
    const action = "accountCreationMessage";
    this.manageOnStartAndOnCloseListening(cnx, action);

    cnx.on(action, (correlationId: number, message: string) => {
      this.logEvent(action + " - event", { 'correlationId': correlationId, 'message': message });
      this.propagateEvent(correlationId, EventTypes.AccountCreationMessage, ResponseResult.Success, message);
    });
  }

  listenToAccountCreationStep() {
    const cnx = this.connection;
    const action = "accountCreationStep";
    this.manageOnStartAndOnCloseListening(cnx, action);

    cnx.on(action, (correlationId: number, stepName: string, stepIndex: number, stepTotal: number) => {
      this.logEvent(action + " - event", { 'correlationId': correlationId, 'stepName': stepName, 'stepIndex': stepIndex, 'stepTotal': stepTotal });
      this.propagateEvent(correlationId, EventTypes.AccountCreationStep, ResponseResult.Success, { 'stepName': stepName, 'stepIndex': stepIndex, 'stepTotal': stepTotal });
    });
  }

  listenToAccountCreationError() {
    const cnx = this.connection;
    const action = "accountCreationError";
    this.manageOnStartAndOnCloseListening(cnx, action);

    cnx.on(action, (correlationId: number, error: string) => {
      this.logEvent(action + " - event", { 'correlationId': correlationId, 'error': error });
      this.propagateEvent(correlationId, EventTypes.AccountCreationError, ResponseResult.Error, error);
    });
  }

  // KEY CREATION EVENTS

  listenToKeyGenerationStarted() {
    const cnx = this.connection;
    const action = "keyGenerationStarted";
    this.manageOnStartAndOnCloseListening(cnx, action);

    cnx.on(action, (correlationId: number, keyName: string, keyIndex : number, totalKeys: number) => {
      this.logEvent(action + " - event", { 'correlationId': correlationId, 'keyName': keyName, 'keyIndex' : keyIndex, 'totalKeys': totalKeys });
      this.propagateEvent(correlationId, EventTypes.KeyGenerationStarted, ResponseResult.Success, { 'keyName': keyName, 'keyIndex': keyIndex, 'totalKeys': totalKeys });
    });
  }

  listenToKeyGenerationEnded() {
    const cnx = this.connection;
    const action = "keyGenerationEnded";
    this.manageOnStartAndOnCloseListening(cnx, action);

    cnx.on(action, (correlationId: number, keyName: string, keyIndex : number, totalKeys: number) => {
      this.logEvent(action + " - event", { 'correlationId': correlationId, 'keyName': keyName, 'keyIndex' : keyIndex, 'totalKeys': totalKeys });
      this.propagateEvent(correlationId, EventTypes.KeyGenerationEnded, ResponseResult.Success, { 'keyName': keyName, 'keyIndex': keyIndex, 'totalKeys': totalKeys });
    });
  }

  listenToKeyGenerationMessage() {
    const cnx = this.connection;
    const action = "keyGenerationMessage";
    this.manageOnStartAndOnCloseListening(cnx, action);

    cnx.on(action, (correlationId: number, keyName: string, message: string) => {
      this.logEvent(action + " - event", { 'correlationId': correlationId, 'keyName': keyName, 'message': message });
      this.propagateEvent(correlationId, EventTypes.KeyGenerationMessage, ResponseResult.Success, { 'keyName': keyName, 'message': message });
    });
  }

  listenToKeyGenerationError() {
    const cnx = this.connection;
    const action = "KeyGenerationError";
    this.manageOnStartAndOnCloseListening(cnx, action);

    cnx.on(action, (correlationId: number, keyName: string, error: string) => {
      this.logEvent(action + " - event", { 'correlationId': correlationId, 'keyName': keyName, 'error': error });
      this.propagateEvent(correlationId, EventTypes.KeyGenerationError, ResponseResult.Error, { 'keyName': keyName, 'error': error });
    });
  }

  // ACCOUNT PUBLICATION EVENTS

  listenToAccountPublicationStarted() {
    const cnx = this.connection;
    const action = "accountPublicationStarted";
    this.manageOnStartAndOnCloseListening(cnx, action);

    cnx.on(action, (correlationId: number) => {
      this.logEvent(action + " - event", { 'correlationId': correlationId });
      this.propagateEvent(correlationId, EventTypes.AccountPublicationStarted);
    });
  }

  listenToAccountPublicationEnded() {
    const cnx = this.connection;
    const action = "accountPublicationEnded";
    this.manageOnStartAndOnCloseListening(cnx, action);

    cnx.on(action, (correlationId: number) => {
      this.logEvent(action + " - event", { 'correlationId': correlationId });
      this.propagateEvent(correlationId, EventTypes.AccountPublicationEnded);
    });
  }

  listenToAccountPublicationMessage() {
    const cnx = this.connection;
    const action = "accountPublicationMessage";
    this.manageOnStartAndOnCloseListening(cnx, action);

    cnx.on(action, (correlationId: number, message: string) => {
      this.logEvent(action + " - event", { 'correlationId': correlationId, 'message': message });
      this.propagateEvent(correlationId, EventTypes.AccountPublicationMessage, ResponseResult.Success, message);
    });
  }

  listenToAccountPublicationStep() {
    const cnx = this.connection;
    const action = "accountPublicationStep";
    this.manageOnStartAndOnCloseListening(cnx, action);

    cnx.on(action, (correlationId: number, stepName: string, stepIndex: number, stepTotal: number) => {
      this.logEvent(action + " - event", { 'correlationId': correlationId, 'stepName': stepName, 'stepIndex': stepIndex, 'stepTotal': stepTotal });
      this.propagateEvent(correlationId, EventTypes.AccountPublicationStep, ResponseResult.Success, { 'stepName': stepName, 'stepIndex': stepIndex, 'stepTotal': stepTotal });
    });
  }

  listenToAccountPublicationPOWNonceIteration() {
    const cnx = this.connection;
    const action = "accountPublicationPOWNonceIteration";
    this.manageOnStartAndOnCloseListening(cnx, action);

    cnx.on(action, (correlationId: number, nonce: number, difficulty: number) => {
      this.logEvent(action + " - event", { 'correlationId': correlationId, 'nonce': nonce, 'difficulty': difficulty });
      this.propagateEvent(correlationId, EventTypes.AccountPublicationPOWNonceIteration, ResponseResult.Success, { 'nonce': nonce, 'difficulty': difficulty });
    });
  }

  listenToAccountPublicationPOWNonceFound() {
    const cnx = this.connection;
    const action = "accountPublicationPOWNonceFound";
    this.manageOnStartAndOnCloseListening(cnx, action);

    cnx.on(action, (correlationId: number, nonce: number, difficulty: number, solutions: Array<number>) => {
      this.logEvent(action + " - event", { 'correlationId': correlationId, 'nonce': nonce, 'difficulty': difficulty, 'solutions': solutions });
      this.propagateEvent(correlationId, EventTypes.AccountPublicationPOWNonceFound, ResponseResult.Success, { 'nonce': nonce, 'difficulty': difficulty, 'solutions': solutions });
    });
  }

  listenToAccountPublicationError() {
    const cnx = this.connection;
    const action = "accountPublicationError";
    this.manageOnStartAndOnCloseListening(cnx, action);

    cnx.on(action, (correlationId: number, error: string) => {
      this.logEvent(action + " - event", { 'correlationId': correlationId, 'error': error });
      this.propagateEvent(correlationId, EventTypes.AccountPublicationError, ResponseResult.Error, error);
    });
  }

  // WALLET SYNC EVENT

  listenToWalletSyncStarted() {
    const cnx = this.connection;
    const action = "walletSyncStarted";
    this.manageOnStartAndOnCloseListening(cnx, action);

    cnx.on(action, (chainType: number) => {
      this.logEvent(action + " - event", { 'chainType': chainType });
      this.propagateEvent(chainType, EventTypes.WalletSyncStarted, ResponseResult.Success);
    });
  }

  listenToWalletSyncEnded() {
    const cnx = this.connection;
    const action = "walletSyncEnded";
    this.manageOnStartAndOnCloseListening(cnx, action);

    cnx.on(action, (chainType: number) => {
      this.logEvent(action + " - event", { 'chainType': chainType });
      this.propagateEvent(chainType, EventTypes.WalletSyncEnded, ResponseResult.Success);
    });
  }

  listenToWalletSyncUpdate() {
    const cnx = this.connection;
    const action = "WalletSyncUpdate";
    this.manageOnStartAndOnCloseListening(cnx, action);

    cnx.on(action, (chainType: number, currentBlockId: number, blockHeight: number, percentage: number) => {
      this.logEvent(action + " - event", { 'chainType': chainType, 'currentBlockId': currentBlockId, 'blockHeight': blockHeight, 'percentage': percentage });
      this.propagateEvent(chainType, EventTypes.WalletSyncUpdate, ResponseResult.Success, { 'chainType': chainType, 'currentBlockId': currentBlockId, 'blockHeight': blockHeight, 'percentage': percentage });
    });
  }

  listenToWalletSyncError() {
    const cnx = this.connection;
    const action = "walletSyncError";
    this.manageOnStartAndOnCloseListening(cnx, action);

    cnx.on(action, (correlationId: number, error: string) => {
      this.logEvent(action + " - event", { 'correlationId': correlationId, 'error': error });
      this.propagateEvent(correlationId, EventTypes.WalletSyncError, ResponseResult.Error, error);
    });
  }

  // BLOCKCHAIN SYNC EVENT

  listenToBlockchainSyncStarted() {
    const cnx = this.connection;
    const action = "blockchainSyncStarted";
    this.manageOnStartAndOnCloseListening(cnx, action);

    cnx.on(action, (chainType: number) => {
      this.logEvent(action + " - event", { 'chainType': chainType });
      this.propagateEvent(chainType, EventTypes.BlockchainSyncStarted, ResponseResult.Success);
    });
  }

  listenToBlockchainSyncEnded() {
    const cnx = this.connection;
    const action = "blockchainSyncEnded";
    this.manageOnStartAndOnCloseListening(cnx, action);

    cnx.on(action, (chainType: number) => {
      this.logEvent(action + " - event", { 'chainType': chainType });
      this.propagateEvent(chainType, EventTypes.BlockchainSyncEnded, ResponseResult.Success);
    });
  }

  listenToBlockchainSyncUpdate() {
    const cnx = this.connection;
    const action = "blockchainSyncUpdate";
    this.manageOnStartAndOnCloseListening(cnx, action);

    cnx.on(action, (chainType: number, currentBlockId: number, publicBlockHeight: number, percentage: number, estimatedTimeRemaining: string) => {
      this.logEvent(action + " - event", { 'chainType': chainType, 'currentBlockId': currentBlockId, 'publicBlockHeight': publicBlockHeight, 'percentage': percentage, 'estimatedTimeRemaining': estimatedTimeRemaining });
      this.propagateEvent(chainType, EventTypes.BlockchainSyncUpdate, ResponseResult.Success, { 'chainType': chainType, 'currentBlockId': currentBlockId, 'publicBlockHeight': publicBlockHeight, 'percentage': percentage, 'estimatedTimeRemaining': estimatedTimeRemaining });
    });
  }

  listenToBlockchainSyncError() {
    const cnx = this.connection;
    const action = "blockchainSyncError";
    this.manageOnStartAndOnCloseListening(cnx, action);

    cnx.on(action, (correlationId: number, error: string) => {
      this.logEvent(action + " - event", { 'correlationId': correlationId, 'error': error });
      this.propagateEvent(correlationId, EventTypes.BlockchainSyncError, ResponseResult.Error, error);
    });
  }

  // TRANSACTION EVENT

  listenToTransactionSent() {
    const cnx = this.connection;
    const action = "transactionSent";
    this.manageOnStartAndOnCloseListening(cnx, action);

    cnx.on(action, (transactionId: number, transaction: any) => {
      this.logEvent(action + " - event", { 'transactionId': transactionId, 'transaction': transaction });
      this.propagateEvent(transactionId, EventTypes.TransactionSent, ResponseResult.Success, transaction);
    });
  }

  listenToTransactionConfirmed() {
    const cnx = this.connection;
    const action = "transactionConfirmed";
    this.manageOnStartAndOnCloseListening(cnx, action);

    cnx.on(action, (transactionId: number, transaction: any) => {
      this.logEvent(action + " - event", { 'transactionId': transactionId, 'transaction': transaction });
      this.propagateEvent(transactionId, EventTypes.TransactionConfirmed, ResponseResult.Success, transaction);
    });
  }

  listenToTransactionReceived() {
    const cnx = this.connection;
    const action = "transactionReceived";
    this.manageOnStartAndOnCloseListening(cnx, action);

    cnx.on(action, (transactionId: number, transaction: any) => {
      this.logEvent(action + " - event", { 'transactionId': transactionId, 'transaction': transaction });
      this.propagateEvent(transactionId, EventTypes.TransactionReceived, ResponseResult.Success, transaction);
    });
  }

  listenToTransactionMessage() {
    const cnx = this.connection;
    const action = "transactionMessage";
    this.manageOnStartAndOnCloseListening(cnx, action);

    cnx.on(action, (transactionId: number, message: string) => {
      this.logEvent(action + " - event", { 'transactionId': transactionId, 'message': message });
      this.propagateEvent(transactionId, EventTypes.TransactionMessage, ResponseResult.Success, message);
    });
  }

  listenToTransactionRefused() {
    const cnx = this.connection;
    const action = "transactionRefused";
    this.manageOnStartAndOnCloseListening(cnx, action);

    cnx.on(action, (transactionId: number, message: string) => {
      this.logEvent(action + " - event", { 'transactionId': transactionId, 'message': message });
      this.propagateEvent(transactionId, EventTypes.TransactionRefused, ResponseResult.Error, message);
    });
  }

  listenToTransactionError() {
    const cnx = this.connection;
    const action = "transactionError";
    this.manageOnStartAndOnCloseListening(cnx, action);

    cnx.on(action, (transactionId: number, errorCodes: Array<number>) => {
      this.logEvent(action + " - event", { 'transactionId': transactionId, 'message': errorCodes });
      this.propagateEvent(transactionId, EventTypes.TransactionError, ResponseResult.Error, errorCodes);
    });
  }

  // MINING EVENTS

  listenToMiningStarted() {
    const cnx = this.connection;
    const action = "miningStarted";
    this.manageOnStartAndOnCloseListening(cnx, action);

    cnx.on(action, (chainType: number) => {
      this.logEvent(action + " - event", { 'chainType': chainType });
      this.notificationService.showSuccess("Neuralium mining started.", "Start Mining");
      this.propagateEvent(chainType, EventTypes.MiningStarted, ResponseResult.Success);
    });
  }

  listenToMiningEnded() {
    const cnx = this.connection;
    const action = "miningEnded";
    this.manageOnStartAndOnCloseListening(cnx, action);

    cnx.on(action, (chainType: number) => {
      this.logEvent(action + " - event", { 'chainType': chainType });
      this.notificationService.showSuccess("Neuralium mining stopped.", "Stop Mining");
      this.propagateEvent(chainType, EventTypes.MiningEnded, ResponseResult.Success);
    });
  }

  listenToMiningElected() {
    const cnx = this.connection;
    const action = "miningElected";
    this.manageOnStartAndOnCloseListening(cnx, action);

    cnx.on(action, (chainType: number) => {
      this.logEvent(action + " - event", { 'chainType': chainType });
      this.notificationService.showSuccess("You've been elected.", "Elected");
      this.propagateEvent(chainType, EventTypes.MiningElected, ResponseResult.Success);
    });
  }

  listenToMiningBountyAllocated() {
    const cnx = this.connection;
    const action = "miningBountyAllocated";
    this.manageOnStartAndOnCloseListening(cnx, action);

    cnx.on(action, (chainType: number) => {
      this.logEvent(action + " - event", { 'chainType': chainType });
      this.notificationService.showSuccess("Bounty has been allocated.", "Bounty Allocated");
      this.propagateEvent(chainType, EventTypes.MiningBountyAllocated, ResponseResult.Success);
    });
  }

  // BLOCKS AND DIGESTS

  listenToBlockInserted() {
    const cnx = this.connection;
    const action = "blockInserted";
    this.manageOnStartAndOnCloseListening(cnx, action);

    cnx.on(action, (chainType: number, blockId: number, timestamp: Date, hash: string, publicBlockId: number, lifespan: number) => {
      this.logEvent(action + " - event", { chainType, blockId, publicBlockId, timestamp, hash, lifespan });
      this.propagateEvent(blockId, EventTypes.BlockInserted, ResponseResult.Success, { chainType, blockId, publicBlockId, timestamp, hash, lifespan });
    });
  }



  // MESSAGE AND ERROR


  listenToMessage() {
    const cnx = this.connection;
    const action = "message";
    this.manageOnStartAndOnCloseListening(cnx, action);

    cnx.on(action, (message: string, timestamp: Date, level:string, properties:Array<Object>) => {

      if(this.messages.length > MESSAGE_BUFFER_SIZE){
        this.messages.shift();
      }
      this.messages.push(new ServerMessage(message, timestamp, level, properties));

      this.logEvent(action + " - event", { 'message': message });
      this.propagateEvent(1, EventTypes.Message, ResponseResult.Success, message);
    });
  }

  listenToError() {
    const cnx = this.connection;
    const action = "error";
    this.manageOnStartAndOnCloseListening(cnx, action);

    cnx.on(action, (correlationId: number, message: string) => {
      this.logEvent(action + " - event", { 'correlationId': correlationId, 'message': message });
      this.propagateEvent(correlationId, EventTypes.TransactionError, ResponseResult.Error, message);
    });
  }

  // UTILS

  isConnectedToServer(): Observable<boolean> {
    return this.serverConnection;
  }

  tryConnectToServer(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      setTimeout(() => {
        this.ping()
          .then(() => {
            this.notifyServerConnectionStatusIfNeeded(true);
            resolve();
          })
          .catch(reason => {
            this.notifyServerConnectionStatusIfNeeded(false);
            //this.logService.logDebug(reason, null);
            this.tryConnectToServer().then(() => resolve());
          })
      }, RETRY_DURATION);
    });
  }

  logEvent(message: string, data: any) {
    this.logService.logDebug(message, data);
  }

  propagateEvent(correlationId: number,
    eventType: EventTypes = EventTypes.DefaultEvent,
    eventResponse: ResponseResult = ResponseResult.Success,
    message: any = "") {
    var event = ServerConnectionEvent.createNew(correlationId, eventType, eventResponse, message);
    this.eventNotifier.next(event);
  }

  get connection(): HubConnection {
    this.serverPort = this.configService.serverPort;
    var cnx = new HubConnectionBuilder()
      .configureLogging(LogLevel.None)
      .withUrl("http://127.0.0.1:" + this.serverPort + "/signal", {
        skipNegotiation: true,
        transport: HttpTransportType.WebSockets
      })
      .build();

    cnx.serverTimeoutInMilliseconds = 60 * 60 * 1000;

    return cnx;
  }

  manageOnStartAndOnCloseListening(cnx: HubConnection, action: string) {
    try {
      cnx.onclose(() => {
        this.logService.logDebug(action + " Connection Closed", { cnx, action });
        this.tryConnectToServer().then(() => {
          setTimeout(() => { this.manageOnStartAndOnCloseListening(cnx, action) }, RETRY_DURATION);
        });
      });

      cnx.start()
        .then(() => {
        })
        .catch(reason => {
          this.logService.logDebug(action + " start : " + reason, { cnx, action });
          setTimeout(() => { this.manageOnStartAndOnCloseListening(cnx, action) }, RETRY_DURATION);
        });
    }
    catch(error){
      console.log(error);
    }
  }

  notifyServerConnectionStatusIfNeeded(connected: boolean) {
    if (connected != this.isCurrentlyConnected) {
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
          cnx.invoke<string>("ping")
            .then(
              response => {
                if (response === "pong") {
                  resolve();
                }
                else {
                  reject("Ping error : 'pong' not received => " + response)
                }
              })
            .catch(reason => {
              reject("Ping error : " + reason);
            })
            .finally(() => {
              cnx.stop();
            })
        })
        .catch(reason => {
          reject("Connection error : " + reason)
        })
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
