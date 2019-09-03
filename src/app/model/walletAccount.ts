export class WalletAccount {
    accountUuid: string;
    accountId: string;
    status: WalletAccountStatus;
    declarationBlockId: number;
    accountType: WalletAccountType;
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
        accountType: WalletAccountType,
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

export class XmssWalletKey inherits WalletKey{
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

export enum WalletAccountType {
    Standard = 1,
    Joint = 2
}