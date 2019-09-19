export class WalletAccount {
    AccountUuid: string;
    AccountId: string;
    Status: WalletAccountStatus;
    DeclarationBlockId: number;
    AccountType: WalletAccountType;
    FriendlyName: string;
    IsEncrypted: boolean;
    IsActive: boolean;
    AccountHash : string;
    TrustLevel : number;

    static createNew(
        accountUuid: string,
        accountId: string,
        status: WalletAccountStatus,
        declarationBlockId: number,
        accountType: WalletAccountType,
        friendlyName: string,
        isEncrypted: boolean,
        isActive: boolean,
        accountHash:string = "",
        trustLevel:number = 0) {
        var newAccount = new WalletAccount();
        newAccount.AccountUuid = accountUuid;
        newAccount.AccountId = accountId;
        newAccount.Status = status;
        newAccount.DeclarationBlockId = declarationBlockId;
        newAccount.AccountType = accountType;
        newAccount.FriendlyName = friendlyName;
        newAccount.IsEncrypted = isEncrypted;
        newAccount.IsActive = isActive;
        newAccount.AccountHash = accountHash;
        newAccount.TrustLevel = trustLevel;
        return newAccount;
    }
}

/*
export class WalletKey {

    announcementBlockId: number;
    status: string;
}

export class XmssWalletKey inherits WalletKey{
    keyUseIndex: number;
    warningIndex: number;
    maximumUseIndex: number;
    hashBits: number;
    xmssTreeHeight: number;
}
*/

export const NO_WALLET_ACCOUNT = <WalletAccount>{
    AccountUuid: "",
    AccountId: "",
    Status: 1,
    DeclarationBlockId: 0,
    AccountType: 1,
    FriendlyName: "",
    IsEncrypted: false,
    IsActive: false
}

export enum WalletAccountStatus {
    New = 1,
    Dispatched = 2,
    Published = 3
}

export enum WalletAccountType {
    Standard = 1,
    Joint = 2
}