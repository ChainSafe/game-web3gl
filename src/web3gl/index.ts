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
  login: () => void;
  loginMessage: string;
  callContract: (
    method: string,
    abi: string,
    contract: string,
    args: string
  ) => void;
  callResponse: string;
  sendContract: (
    method: string,
    abi: string,
    contract: string,
    args: string,
    value: string
  ) => void;
}

// global variables
window.web3gl = {
  login,
  loginMessage: "",
  callContract,
  callResponse: "",
  sendContract,
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


// call window.web3gl.login() to display onboardjs modal
async function login() {
  try {
    await onboard.walletSelect();
    await onboard.walletCheck();
    // save login message for unity to access
    window.web3gl.loginMessage = await signMessage();
    console.log(window.web3gl.loginMessage);
  } catch (error) {
    console.log(error);
  }
}

// sign message to verify user address.
async function signMessage() {
  const from: string = (await web3.eth.getAccounts())[0];
  const expiration: string = Math.round(Date.now() / 1000 + 300).toString();
  const message: string = `${from}-${expiration}`;
  const signature: string = await web3.eth.personal.sign(message, from, "");
  return `${signature}-${message}`;
}

/*
calls any contract method
const method = "balanceOf"
const abi = [ { inputs: [ { internalType: "address", name: "account", type: "address" }, { internalType: "uint256", name: "id", type: "uint256" }, ], name: "balanceOf", outputs: [{ internalType: "uint256", name: "", type: "uint256" }], stateMutability: "view", type: "function", }, ];
const contract = "0x2ebecabbbe8a8c629b99ab23ed154d74cd5d4342"
const args = ["0x72b8Df71072E38E8548F9565A322B04b9C752932", 17]
window.web3gl.callContract(abi, contract, args)
*/
async function callContract(
  method: string,
  abi: string,
  contract: string,
  args: string
) {
  const response = await new web3.eth.Contract(
    JSON.parse(abi),
    contract
  ).methods[method](...JSON.parse(args)).call();
  console.log(response);
  window.web3gl.callResponse = response.toString();
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
  const response = await new web3.eth.Contract(
    JSON.parse(abi),
    contract
  ).methods[method](...JSON.parse(args)).send({ from, value });
  console.log(response);
}
