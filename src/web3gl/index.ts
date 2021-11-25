import Onboard from "bnc-onboard";
import { ethers } from "ethers";
import { hexlify, parseUnits } from "ethers/lib/utils";
import { GTS } from "gts-client-dev";

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
  gtsConnect: () => void;
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
  gtsConnect,
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

const gtsService: GTS = new GTS("test1", "12345");
let userWalletAddress: string;

async function gtsConnect() {
  await gtsService.init();
  await gtsService.whitelist(window.web3gl.connectAccount);
  userWalletAddress = await gtsService.userWallet(window.web3gl.connectAccount);
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


const method = "transfer"
const abi = `[{"constant":false,"inputs":[{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"transfer","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"}]`;
const contract = "0x6c7179bB7105344b91B56328Fcc72E9c18b845d5"
const args = `["0x5D8f7aEe31782f37D02E133d08E3Ff1D22179b19", "1000000000000000000"]`
const value = 0
const gasLimit = 2500000
const gasPrice = 1000000000 // 1 gwei
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
  const safeTx = await gtsService.buildSafeTx(method, abi, contract, JSON.parse(args), value, gasLimit, gasPrice, provider, provider.getSigner(), userWalletAddress);
  const tx = await gtsService.sendTx(safeTx);

  console.log("TX", tx); // TODO: remove
  console.log("HASH:", tx.hash); // TODO: remove

  tx.wait()
    .then((receipt: any) => {
      console.log("RECEIPT", receipt); // TODO: remove
      window.web3gl.sendGTSResponse = receipt;
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
