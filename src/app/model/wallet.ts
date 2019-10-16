import { WalletAccount } from "./walletAccount";

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
    id: number;
    accounts:Array<WalletAccount>;

    private constructor(){
        this.id = 0;
        this.accounts = [];
    }

    static createNew(id:number): Wallet {
        var newWallet = new Wallet();
        newWallet.id = id;
        return newWallet;
    }

    get isLoaded(): boolean {
        return  this.id !== 0;
    }

}

export const NO_WALLET = <Wallet>{
    id: 0
}

export enum WalletLoadStatus {
    NotLoaded = 0,
    Loading = 1,
    Loaded = 2
}

export const WALLET_LOADED = true;