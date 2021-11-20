import Onboard from "bnc-onboard";
import { ethers } from "ethers";
import { hexlify, parseUnits } from "ethers/lib/utils";

let provider: ethers.providers.Web3Provider;

// declare types
declare global {
  interface Window {
    ethereum: any;
    web3NetworkId: number; // network.js
    infuraKey: string; // network.js
    web3gl: Web3GL;
  }
}
interface Web3GL {
  connect: () => void;
  connectAccount: string;
  sendContract: (
    method: string,
    abi: string,
    contract: string,
    args: string,
    value: string,
    gasLimit: string,
    gasPrice: string
  ) => void;
  sendContractResponse: string;
  sendTransaction: (
    to: string,
    value: string,
    gasLimit: string,
    gasPrice: string
  ) => void;
  sendGTS: (
    method: string,
    abi: string,
    contract: string,
    args: string,
    value: string,
    gasLimit: string,
    gasPrice: string
  ) => void;
  sendGTSResponse: string;
  sendTransactionResponse: string;
  signMessage: (message: string) => void;
  signMessageResponse: string;
  networkId: number;
}

// global variables
window.web3gl = {
  connect,
  connectAccount: "",
  sendContract,
  sendContractResponse: "",
  sendTransaction,
  sendTransactionResponse: "",
  signMessage,
  signMessageResponse: "",
  sendGTS,
  sendGTSResponse: "",
  networkId: window.web3NetworkId,
};

let initialLogin = true;

// https://docs.blocknative.com/onboard
const onboard = Onboard({
  networkId: window.web3NetworkId, // from network.js

  subscriptions: {
    address: () => {
      if (!initialLogin) {
        window.location.reload();
        connect();
      }
    },
    wallet: (wallet) => {
      provider = new ethers.providers.Web3Provider(wallet.provider);
    },
    network: (id) => {
      window.web3gl.networkId = id;
    },
  },
  walletSelect: {
    wallets: [
      { walletName: "metamask", preferred: true },
      {
        walletName: "walletConnect",
        infuraKey: window.infuraKey,
      },
      { walletName: "torus" },
    ],
  },
});

// call window.web3gl.connect() to display onboardjs modal
async function connect() {
  const walletSelected = await onboard.walletSelect();
  if (!walletSelected) window.location.reload();
  const walletChecked = await onboard.walletCheck();
  if (!walletChecked) window.location.reload();
  initialLogin = false;
  window.web3gl.connectAccount = await provider.getSigner().getAddress();
}

/*
sign message to verify user address.
window.web3gl.signMessage("hello")
*/
async function signMessage(message: string) {
  try {
    const signature: string = await provider.getSigner().signMessage(message);
    window.web3gl.signMessageResponse = signature;
  } catch (error: any) {
    window.web3gl.signMessageResponse = error.message;
  }
}

/*
const method = "increment"
const abi = `[ { "inputs": [], "name": "increment", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "name": "x", "outputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ], "stateMutability": "view", "type": "function" } ]`;
const contract = "0xB6B8bB1e16A6F73f7078108538979336B9B7341C"
const args = "[]"
const value = "0"
const gasLimit = ""
const gasPrice = ""
window.web3gl.sendGTS(method, abi, contract, args, value, gasLimit, gasPrice)
*/
async function sendGTS(
  method: string,
  abi: string,
  contract: string,
  args: string,
  value: string,
  gasLimit: string,
  gasPrice: string
) {
  // create contract data
  const Contract = new ethers.Contract(
    "0x0000000000000000000000000000000000000000",
    JSON.parse(abi),
    provider
  );
  const { data } = await Contract.populateTransaction[method](
    ...JSON.parse(args)
  );
  // sign transaction with contract data
  provider
    .getSigner()
    .sendTransaction({
      from: await provider.getSigner().getAddress(),
      to: contract,
      value: parseUnits(value, "wei"),
      gasLimit: gasLimit ? hexlify(Number(gasLimit)) : undefined,
      gasPrice: gasPrice ? hexlify(Number(gasPrice)) : undefined,
      data,
    })
    .then((signedContract: any) => {
      console.log(signedContract);
      window.web3gl.sendGTSResponse = signedContract;
    })
    .catch((error: any) => {
      window.web3gl.sendGTSResponse = error.message;
    });
}

/*
const method = "increment"
const abi = `[ { "inputs": [], "name": "increment", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "name": "x", "outputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ], "stateMutability": "view", "type": "function" } ]`;
const contract = "0xB6B8bB1e16A6F73f7078108538979336B9B7341C"
const args = "[]"
const value = "0"
const gasLimit = "222222"
const gasPrice = "333333333333"
window.web3gl.sendContract(method, abi, contract, args, value, gasLimit, gasPrice)
*/
async function sendContract(
  method: string,
  abi: string,
  contract: string,
  args: string,
  value: string,
  gasLimit: string,
  gasPrice: string
) {
  // create contract data
  const Contract = new ethers.Contract(
    "0x0000000000000000000000000000000000000000",
    JSON.parse(abi),
    provider
  );
  const { data } = await Contract.populateTransaction[method](
    ...JSON.parse(args)
  );
  // send transaction with contract data
  provider
    .getSigner()
    .sendTransaction({
      from: await provider.getSigner().getAddress(),
      to: contract,
      value: parseUnits(value, "wei"),
      gasLimit: gasLimit ? hexlify(Number(gasLimit)) : undefined,
      gasPrice: gasPrice ? hexlify(Number(gasPrice)) : undefined,
      data,
    })
    .then((transactionHash: any) => {
      window.web3gl.sendTransactionResponse = transactionHash;
    })
    .catch((error: any) => {
      window.web3gl.sendTransactionResponse = error.message;
    });
}

/*
const to = "0xdD4c825203f97984e7867F11eeCc813A036089D1"
const value = "12300000000000000"
const gasLimit = "22222"
const gasPrice = "33333333333"
window.web3gl.sendTransaction(to, value, gasLimit, gasPrice);
*/
async function sendTransaction(
  to: string,
  value: string,
  gasLimit: string,
  gasPrice: string
) {
  provider
    .getSigner()
    .sendTransaction({
      from: await provider.getSigner().getAddress(),
      to,
      value: parseUnits(value, "wei"),
      gasLimit: gasLimit ? hexlify(Number(gasLimit)) : undefined,
      gasPrice: gasPrice ? hexlify(Number(gasPrice)) : undefined,
    })
    .then((transactionHash: any) => {
      window.web3gl.sendTransactionResponse = transactionHash;
    })
    .catch((error: any) => {
      window.web3gl.sendTransactionResponse = error.message;
    });
}
