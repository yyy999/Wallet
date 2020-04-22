export class WalletAccount {
    accountUuid: string;
    accountId: string;
    status: WalletAccountStatus;
    declarationBlockId: number;
    correlated: boolean;
    accountType: WalletaccountType;
    friendlyName: string;
    isEncrypted: boolean;
    isActive: boolean;
    accountHash : string;
    trustLevel : number;

    static createNew(
        accountUuid: string,
        accountId: string,
        status: WalletAccountStatus,
        declarationBlockId: number,
        correlated: boolean,
        accountType: WalletaccountType,
        friendlyName: string,
        isEncrypted: boolean,
        isActive: boolean,
        accountHash:string = "",
        trustLevel:number = 0) {
        var newAccount = new WalletAccount();
        newAccount.accountUuid = accountUuid;
        newAccount.accountId = accountId;
        newAccount.status = status;
        newAccount.declarationBlockId = declarationBlockId;
        newAccount.correlated = correlated;
        newAccount.accountType = accountType;
        newAccount.friendlyName = friendlyName;
        newAccount.isEncrypted = isEncrypted;
        newAccount.isActive = isActive;
        newAccount.accountHash = accountHash;
        newAccount.trustLevel = trustLevel;
        return newAccount;
    }
}

/*
export class WalletKey {

    announcementBlockId: number;
    status: string;
}

export class XmssWalletKey inheritaccountUuids WalletKey{
    keyUseIndex: number;
    warningIndex: number;
    maximumUseIndex: number;
    hashBits: number;
    xmssTreeHeight: number;
}
*/

export const NO_WALLET_ACCOUNT = <WalletAccount>{
    accountUuid: "",
    accountId: "",
    status: 1,
    declarationBlockId: 0,
    correlated: false,
    accountType: 1,
    friendlyName: "",
    isEncrypted: false,
    isActive: false
}

export enum WalletAccountStatus {
    New = 1,
    Dispatched = 2,
    Published = 3
}

export enum WalletaccountType {
    Standard = 1,
    Joint = 2
}