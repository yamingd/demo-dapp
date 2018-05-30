import Origin from 'origin'
import Web3 from 'web3'
import detectMobile from 'utils/detectMobile'

const mobilize = (str) => {
  if (detectMobile() && process.env.MOBILE_LOCALHOST_IP)
  {
    return str.replace("localhost", process.env.MOBILE_LOCALHOST_IP)
  }
  else
  {
    return str
  }
}

/*
 * It may be preferential to use websocket provider 
 * WebsocketProvider("wss://rinkeby.infura.io/ws")
 * But Micah couldn't get it to connect ¯\_(ツ)_/¯
 */
const defaultProviderUrl = mobilize(process.env.PROVIDER_URL)
const defaultBridgeUrl = "https://bridge.originprotocol.com"
const bridgeProtocol = process.env.BRIDGE_SERVER_PROTOCOL
const bridgeDomain = mobilize(process.env.BRIDGE_SERVER_DOMAIN)
const customBridgeUrl = `${bridgeProtocol}://${bridgeDomain}`
const hasCustomBridge = bridgeProtocol && bridgeDomain
const bridgeUrl = hasCustomBridge ? customBridgeUrl : defaultBridgeUrl
const attestationServerUrl = `${bridgeUrl}/api/attestations`
const walletLinkerUrl = `${bridgeUrl}/api/wallet-linker`
const web3 = new Web3(
  // Detect MetaMask using global window object
  window.web3 ?
  // Use MetaMask provider
  window.web3.currentProvider :
  // Use wallet-enabled browser provider
  Web3.givenProvider ||
  // Create a provider with Infura node
  new Web3.providers.HttpProvider(defaultProviderUrl)
)

const config = {
  ipfsDomain: mobilize(process.env.IPFS_DOMAIN),
  ipfsApiPort: process.env.IPFS_API_PORT,
  ipfsGatewayPort: process.env.IPFS_GATEWAY_PORT,
  ipfsGatewayProtocol: process.env.IPFS_GATEWAY_PROTOCOL,
  attestationServerUrl,
  walletLinkerUrl:walletLinkerUrl,
  web3,
}

try {
  config.contractAddresses = JSON.parse(process.env.CONTRACT_ADDRESSES)
} catch (e) {
  /* Ignore */
}

const origin = new Origin(config)
// Replace global web3 with Origin.js-constructed instance
window.web3 = origin.contractService.web3

export default origin
