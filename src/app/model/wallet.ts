import { WalletAccount } from "./walletAccount";

export enum EncryptionKey{
    Wallet = 0,
    ChangeKey = 3,
    TransactionKey = 1,
    MessageKey = 2,
    SuperKey = 4
}

export class WalletCreation {
    friendlyName: string;
    encryptWallet: boolean;
    encryptKey: boolean;
    encryptKeysIndividualy:boolean;
    passPhrases:Array<string>;
    publishAccount:boolean;

    private constructor(){
        this.friendlyName = "Default";
        this.encryptWallet = false;
        this.encryptKey = false;
        this.encryptKeysIndividualy = false;
        this.passPhrases = [];
        this.publishAccount = false;
    }

    get passPhrasesAsDictionary():Object{
        var dictionary = new Object();
        for (let index = 0; index < 4; index++) {
            dictionary = this.convertToDictionaryItemAndPush(dictionary,index,this.passPhrases);
        }
        return dictionary;
    }

    private convertToDictionaryItemAndPush(dictionary:Object, key:number, array:Array<string>):Object{
        if(array[key] != void(0)){
            for(let i =0; i < array.length; i++){
                dictionary[key] = array[key];
            }
        };
        return dictionary;
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
}

export const NO_WALLET = <Wallet>{
    id: 0
}

export const WALLET_LOADED = true;
export const WALLET_EXISTS = true;