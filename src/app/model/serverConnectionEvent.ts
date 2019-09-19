export const CONNECTED = true;

export class ServerConnectionEvent {
    correlationId: number;
    eventType: EventTypes;
    eventResponse: ResponseResult;
    message: any;

    static createNew(
        correlationId: number,
        eventType: EventTypes = EventTypes.DefaultEvent,
        eventResponse: ResponseResult = ResponseResult.Success,
        message: any = "")
        : ServerConnectionEvent {
        var item = new ServerConnectionEvent();
        item.correlationId = correlationId;
        item.eventType = eventType;
        item.eventResponse = eventResponse;
        item.message = message;
        return item;
    }

    static NO_EVENT = <ServerConnectionEvent>{ correlationId: 0, message: "No event" };
}

export enum ResponseResult {
    Default = 0,
    Success = 1,
    Error = 99
}

export enum EventTypes {
    DefaultEvent = 0,
    WalletLoadingStarted = 1,
    WalletLoadingEnded = 2,
    RequestWalletPassphrase = 3,
    RequestKeyPassphrase = 4,
    RequestCopyWallet = 5,
    PeerTotalUpdated = 6,
    WalletCreationStarted = 107,
    WalletCreationEnded = 108,
    WalletCreationMessage = 109,
    WalletCreationStep = 110,
    WalletCreationError = 111,
    AccountCreationStarted = 112,
    AccountCreationEnded = 113,
    AccountCreationMessage = 114,
    AccountCreationStep = 115,
    AccountCreationError = 116,
    KeyGenerationStarted = 117,
    KeyGenerationEnded = 118,
    KeyGenerationMessage = 119,
    KeyGenerationPercentageUpdate = 120,
    KeyGenerationError = 121,
    AccountPublicationStarted = 122,
    AccountPublicationEnded = 123,
    AccountPublicationMessage = 124,
    AccountPublicationStep = 125,
    AccountPublicationPOWNonceIteration = 126,
    AccountPublicationPOWNonceFound = 127,
    AccountPublicationError = 128,
    WalletSyncStarted = 129,
    WalletSyncEnded = 130,
    WalletSyncUpdate = 131,
    WalletSyncError = 132,
    TransactionSent = 133,
    TransactionCreated = 134,
    TransactionConfirmed = 135,
    TransactionReceived = 136,
    TransactionMessage = 137,
    TransactionRefused = 138,
    TransactionError = 139,
    BlockchainSyncStarted = 140,
    BlockchainSyncEnded = 141,
    BlockchainSyncUpdate = 142,
    BlockchainSyncError = 143,
    MiningStarted = 144,
    MiningEnded = 145,
    MiningElected = 146,
    MiningPrimeElected = 147,
    MiningStatusChanged = 148,
    BlockInserted = 149,
    DigestInserted = 150,
    BlockInterpreted = 151,
    Message = 152,
    Error = 153,
    RequestCopyKeyFile = 154,
    Alert = 155,
    ConnectableStatusChanged = 156,

AccountTotalUpdated = 1001,
MiningBountyAllocated = 1002,
NeuraliumMiningPrimeElected = 1003,

// INTERNAL TO WALLET DESKTOP
ShutdownStarted = 10001,
ShutdownCompleted = 10002

}

