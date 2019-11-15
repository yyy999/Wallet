import { Wallet } from "./wallet";

export enum PassphraseRequestType {
  Wallet, Key
}

export class PassphraseParameters{

    correlationId: number;
    chainType: number;
    keyCorrelationCode: number;
    attempt: number;
  }

  export class KeyPassphraseParameters extends PassphraseParameters{

    accountID: string;
    keyname: string;
  }