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
    value: string
  ) => void;
  sendContractResponse: string;
  signMessage: (message: string) => void;
  signMessageResponse: string;
  network: number;
}

// global variables
window.web3gl = {
  connect,
  connectAccount: "",
  sendContract,
  sendContractResponse: "",
  signMessage,
  signMessageResponse: "",
  network: 0,
};

// https://docs.blocknative.com/onboard
const onboard = Onboard({
  dappId: "abfa7356-64c3-4047-a6e1-cdb39a0c691e",
  networkName: window.web3NetworkName, // from network.js
  networkId: window.web3NetworkId, // from network.js
  subscriptions: {
    wallet: (wallet) => {
      web3 = new Web3(wallet.provider);
      console.log(`${wallet.name} is now connected`);
    },
    network: (network) => {
      window.web3gl.network = network;
    },
  },
  walletSelect: {
    wallets: [
      { walletName: "metamask", preferred: true },
      {
        walletName: "walletConnect",
        infuraKey: "6429a308b4d646399b1ea170bb406c61",
        preferred: true,
      },
      { walletName: "torus", preferred: true },
    ],
  },
});

// call window.web3gl.connect() to display onboardjs modal
async function connect() {
  try {
    await onboard.walletSelect();
    await onboard.walletCheck();
    window.web3gl.connectAccount = (await web3.eth.getAccounts())[0];
  } catch (error) {
    console.log(error);
  }
}

/*
sign message to verify user address.
web3gl.signMessage("hello")
*/
async function signMessage(message: string) {
  try {
    const from: string = (await web3.eth.getAccounts())[0];
    const signature: string = await web3.eth.personal.sign(message, from, "");
    window.web3gl.signMessageResponse = signature;
    console.log(window.web3gl.signMessageResponse);
  } catch (error: any) {
    window.web3gl.signMessageResponse = error.message;
  }
}

/*
send eth and call any contract
const method = "increment"
const abi = [ { "inputs": [], "name": "increment", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "name": "x", "outputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ], "stateMutability": "view", "type": "function" } ]
const contract = "0xB6B8bB1e16A6F73f7078108538979336B9B7341C"
const args = []
const value = "0"
window.web3gl.callContract(abi, contract, args)
*/
async function sendContract(
  method: string,
  abi: string,
  contract: string,
  args: string,
  value: string
) {
  console.log({ method, abi, contract, args, value });
  const from = (await web3.eth.getAccounts())[0];
  new web3.eth.Contract(JSON.parse(abi), contract).methods[method](
    ...JSON.parse(args)
  )
    .send({ from, value })
    .on("transactionHash", (transactionHash: any) => {
      window.web3gl.sendContractResponse = transactionHash;
    })
    .on("error", (error: any) => {
      window.web3gl.sendContractResponse = error.message;
    });
}
