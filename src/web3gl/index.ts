import Onboard from "bnc-onboard";
import Web3 from "web3";

let web3: Web3;

// declare types
declare global {
  interface Window {
    web3NetworkName: string; // network.js
    web3NetworkId: number; // network.js
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
    gas: string
  ) => void;
  sendContractResponse: string;
  sendTransaction: (to: string, value: string, gas: string) => void;
  sendTransactionResponse: string;
  signMessage: (message: string) => void;
  signMessageResponse: string;
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
};

let initialLogin = true;

// https://docs.blocknative.com/onboard
const onboard = Onboard({
  networkName: window.web3NetworkName, // from network.js
  networkId: window.web3NetworkId, // from network.js

  subscriptions: {
    address: () => {
      if (!initialLogin) {
        window.location.reload();
        connect();
      }
    },
    wallet: (wallet) => {
      web3 = new Web3(wallet.provider);
    },
    network: () => {
      if (!initialLogin) {
        window.location.reload();
        connect();
      }
    },
  },
  walletSelect: {
    wallets: [
      { walletName: "metamask", preferred: true },
      {
        walletName: "walletConnect",
        infuraKey: "2d0062a43e9e4086829df115488b45a8",
        preferred: true,
      },
      { walletName: "torus", preferred: true },
    ],
  },
});

// call window.web3gl.connect() to display onboardjs modal
async function connect() {
  await onboard.walletSelect();
  const walletChecked = await onboard.walletCheck();
  // if cancels login
  if (!walletChecked) window.location.reload();
  initialLogin = false;
  if ((await web3.eth.net.getId()) === window.web3NetworkId) {
    window.web3gl.connectAccount = (await web3.eth.getAccounts())[0];
  }
}

/*
sign message to verify user address.
window.web3gl.signMessage("hello")
*/
async function signMessage(message: string) {
  try {
    const from: string = (await web3.eth.getAccounts())[0];
    const signature: string = await web3.eth.personal.sign(message, from, "");
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
const gas = "1000000" // gas limit
window.web3gl.sendContract(method, abi, contract, args, value, gas)
*/
async function sendContract(
  method: string,
  abi: string,
  contract: string,
  args: string,
  value: string,
  gas: string
) {
  const from = (await web3.eth.getAccounts())[0];
  new web3.eth.Contract(JSON.parse(abi), contract).methods[method](
    ...JSON.parse(args)
  )
    .send({
      from,
      value,
      gas: gas ? gas : undefined,
    })
    .on("transactionHash", (transactionHash: any) => {
      window.web3gl.sendContractResponse = transactionHash;
    })
    .on("error", (error: any) => {
      window.web3gl.sendContractResponse = error.message;
    });
}

/*
const to = "0xB6B8bB1e16A6F73f7078108538979336B9B7341C"
const value = "12300000000000000"
const gas = "21000"
sendTransaction(to, value, gas);
*/
async function sendTransaction(to: string, value: string, gas: string) {
  const from = (await web3.eth.getAccounts())[0];
  web3.eth
    .sendTransaction({
      from,
      to,
      value,
      gas: gas ? gas : undefined,
    })
    .on("transactionHash", (transactionHash: any) => {
      window.web3gl.sendTransactionResponse = transactionHash;
    })
    .on("error", (error: any) => {
      window.web3gl.sendTransactionResponse = error.message;
    });
}
