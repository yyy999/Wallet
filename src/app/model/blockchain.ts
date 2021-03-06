import { MenuConfig } from "./ui-config";

export class ChainStatus {
 
  walletInfo : WalletInfo;
  minRequiredPeerCount: number;
  miningTier: number;
}

export class WalletInfo {
  walletExists: boolean;
  isWalletLoaded: boolean;
  walletEncrypted: boolean;
  walletPath: string;
}

export class BlockChain {
  id: number;
  label: string;
  enabled: boolean;
  menuConfig: MenuConfig;
  icon: string = "fas fa-lock";
}

export const NO_BLOCKCHAIN = <BlockChain>{
  id: 0,
  label: "No Blockchain",
  enabled: true,
  menuConfig: {
    showDashboard: false,
    showSend: false,
    showReceive: false,
    showHistory: false,
    showTools: false,
    showContacts: false,
    showSettings: false
  }
}

export const NEURALIUM_BLOCKCHAIN = <BlockChain>{
  id: 1001, label: "Neuralium",
  enabled: true,
  icon: "fas fa-bezier-curve",
  menuConfig: {
    showDashboard: true,
    showSend: true,
    showReceive: true,
    showHistory: true,
    showTools : true,
    showContacts: true,
    showSettings: true
  }
}

export const CONTRACT_BLOCKCHAIN = <BlockChain>{
  id: 2, label: "Contract",
  enabled: true,
  icon: "fas fa-file-signature",
  menuConfig: {
    showDashboard: true,
    showSend: false,
    showReceive: true,
    showHistory: true,
    showTools: true,
    showContacts: true,
    showSettings: true
  }
}

export const SECURITY_BLOCKCHAIN = <BlockChain>{
  id: 3, label: "Security",
  enabled: true,
  icon: "fas fa-shield-alt",
  menuConfig: {
    showDashboard: true,
    showSend: false,
    showReceive: false,
    showHistory: true,
    showTools : true,
    showContacts: true,
    showSettings: true
  }
}