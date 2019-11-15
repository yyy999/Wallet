import { WalletAccount } from "./walletAccount";
import { WalletInfo } from "./blockchain";

export enum EncryptionKey{
    Wallet = 0,
    TransactionKey = '1',
    MessageKey = '2',
    ChangeKey = '3',
    SuperKey = '4'
}

export class WalletCreation {
    friendlyName: string;
    encryptWallet: boolean;
    encryptKey: boolean;
    encryptKeysIndividualy:boolean;
    passPhrases:Map<string, string>;
    publishAccount:boolean;

    private constructor(){
        this.friendlyName = "Default";
        this.encryptWallet = false;
        this.encryptKey = false;
        this.encryptKeysIndividualy = false;
        this.passPhrases = new Map<string, string>();
        this.publishAccount = false;
    }

    static createNew(): WalletCreation {
        return new WalletCreation();
    }
}

export class Wallet {
    walletInfo: WalletInfo;
    accounts:Array<WalletAccount>;

    private constructor(){
        this.walletInfo = null;
        this.accounts = [];
    }

    static createNew(walletInfo: WalletInfo): Wallet {
        const newWallet = new Wallet();
        newWallet.walletInfo = walletInfo;
        return newWallet;
    }

    get isLoaded(): boolean {
         if (this.walletInfo && this.walletInfo.isWalletLoaded) {
             return true;
         }
         return false;
    }

}

export const NO_WALLET = <Wallet>{

}

export enum WalletLoadStatus {
    NotLoaded = 0,
    Loading = 1,
    Loaded = 2
}

export const WALLET_LOADED = true;