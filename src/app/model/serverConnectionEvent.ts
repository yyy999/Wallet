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
KeyGenerationError = 120,
AccountPublicationStarted = 121,
AccountPublicationEnded = 122,
AccountPublicationMessage = 123,
AccountPublicationStep = 124,
AccountPublicationPOWNonceIteration = 125,
AccountPublicationPOWNonceFound = 126,
AccountPublicationError = 127,
WalletSyncStarted = 128,
WalletSyncEnded = 129,
WalletSyncUpdate = 130,
WalletSyncError = 131,
TransactionSent = 132,
TransactionCreated = 133,
TransactionConfirmed = 134,
TransactionReceived = 135,
TransactionMessage = 136,
TransactionRefused = 137,
TransactionError = 138,
BlockchainSyncStarted = 139,
BlockchainSyncEnded = 140,
BlockchainSyncUpdate = 141,
BlockchainSyncError = 142,
MiningStarted = 143,
MiningEnded = 144,
MiningElected = 145,
MiningPrimeElected = 146,
MiningStatusChanged = 147,
BlockInserted = 148,
DigestInserted = 149,
BlockInterpreted = 150,
Message = 151,
Error = 152,
RequestCopyKeyFile = 153,
Alert = 154,
ConnectableStatusChanged = 155,

AccountTotalUpdated = 1001,
MiningBountyAllocated = 1002,
NeuraliumMiningPrimeElected = 1003,

// INTERNAL TO WALLET DESKTOP
ShutdownStarted = 10001,
ShutdownCompleted = 10002

}

