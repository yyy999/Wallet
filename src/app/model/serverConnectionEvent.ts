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
WalletLoadingError = 3,
RequestWalletPassphrase = 4,
RequestKeyPassphrase = 5,
RequestCopyWallet = 6,
PeerTotalUpdated = 7,
WalletCreationStarted = 108,
WalletCreationEnded = 109,
WalletCreationMessage = 110,
WalletCreationStep = 111,
WalletCreationError = 112,
AccountCreationStarted = 113,
AccountCreationEnded = 114,
AccountCreationMessage = 115,
AccountCreationStep = 116,
AccountCreationError = 117,
KeyGenerationStarted = 118,
KeyGenerationEnded = 119,
KeyGenerationMessage = 120,
KeyGenerationPercentageUpdate = 121,
KeyGenerationError = 122,
AccountPublicationStarted = 123,
AccountPublicationEnded = 124,
AccountPublicationMessage = 125,
AccountPublicationStep = 126,
AccountPublicationPOWNonceIteration = 127,
AccountPublicationPOWNonceFound = 128,
AccountPublicationError = 129,
WalletSyncStarted = 130,
WalletSyncEnded = 131,
WalletSyncUpdate = 132,
WalletSyncError = 133,
TransactionSent = 134,
TransactionCreated = 135,
TransactionConfirmed = 136,
TransactionReceived = 137,
TransactionMessage = 138,
TransactionRefused = 139,
TransactionError = 140,
BlockchainSyncStarted = 141,
BlockchainSyncEnded = 142,
BlockchainSyncUpdate = 143,
BlockchainSyncError = 144,
MiningStarted = 145,
MiningEnded = 146,
MiningElected = 147,
MiningPrimeElected = 148,
MiningStatusChanged = 149,
BlockInserted = 150,
DigestInserted = 151,
BlockInterpreted = 152,
Message = 153,
Error = 154,
RequestCopyKeyFile = 155,
Alert = 156,
ConnectableStatusChanged = 157,



AccountTotalUpdated = 1001,
NeuraliumMiningBountyAllocated = 1002,
NeuraliumMiningPrimeElected = 1003,

// INTERNAL TO WALLET DESKTOP
ShutdownStarted = 10001,
ShutdownCompleted = 10002

}

