import React, { Component, Fragment } from 'react'
import { connect } from 'react-redux'
import { withRouter } from 'react-router'
import { fetchProfile } from 'actions/Profile'
import { getBalance } from 'actions/Wallet'

import QRCode from 'qrcode.react'
import Modal from './modal'
import detectMobile from 'utils/detectMobile'
import clipboard from 'clipboard-polyfill'

import origin from '../services/origin'
import Store from '../Store'
import { storeWeb3Account, storeWeb3Intent } from '../actions/App'

const web3 = origin.contractService.web3
const productionHostname = process.env.PRODUCTION_DOMAIN || 'demo.originprotocol.com'

const networkNames = {
  1: 'Main Ethereum Network',
  2: 'Morden Test Network',
  3: 'Ropsten Test Network',
  4: 'Rinkeby Test Network',
  42: 'Kovan Test Network',
  999: 'Localhost',
}
const supportedNetworkIds = [3, 4]
const ONE_SECOND = 1000
const ONE_MINUTE = ONE_SECOND * 60

// TODO (micah): potentially add a loading indicator
const Loading = () => null

const NotWeb3EnabledDesktop = props => (
  <Modal backdrop="static" className="not-web3-enabled" isOpen={true}>
    <div className="image-container">
      <img src="images/metamask.png" role="presentation" />
    </div>
    <a
      className="close"
      aria-label="Close"
      onClick={() => props.storeWeb3Intent(null)}
    >
      <span aria-hidden="true">&times;</span>
    </a>
    <div>In order to {props.web3Intent}, you must install MetaMask.</div>
    <div className="button-container d-flex">
      <a href="https://metamask.io/"
        target="_blank"
        className="btn btn-clear">
        Get MetaMask
      </a>
      <a href="https://medium.com/originprotocol/origin-demo-dapp-is-now-live-on-testnet-835ae201c58"
        target="_blank"
        className="btn btn-clear">
        Full Instructions
      </a>
    </div>
  </Modal>
)

const LinkerPopUp = props => (
  <Modal backdrop="static" className="not-web3-enabled linker-popup" isOpen={true}>
   <a
      className="close"
      aria-label="Close"
      onClick={() => props.cancel()}
    >
      <span aria-hidden="true">&times;</span>
    </a>
    <div>
      To {props.web3Intent}, you can link with your Origin Mobile Wallet with this code: {props.linkerCode} <br />
      {detectMobile() && <button className="btn btn-primary" style={{width:"200px"}} onClick={() => 
        clipboard.writeText("orgw:"+ props.linkerCode).then( function(){
          let url = "https://www.originprotocol.com/mobile"
          console.log("Code copied to clipboard successfully... opening url", url)
          window.open(url)
        }, function(err){
          console.log("Error opening url")
        })                   
      }>
        Copy & Open App 
        </button>
      }
      <div style={{padding:'50px', backgroundColor:'white'}}>
      <QRCode value={"https://www.originprotocol.com/mobile/" + props.linkerCode}/>
      </div>
    </div>
  </Modal>
)

const NotWeb3EnabledMobile = props => (
  <Modal backdrop="static" className="not-web3-enabled" isOpen={true}>
    <div className="ethereum image-container">
      <img src="images/ethereum.png" role="presentation" />
    </div>
    <a
      className="close"
      aria-label="Close"
      onClick={() => props.storeWeb3Intent(null)}
    >
      <span aria-hidden="true">&times;</span>
    </a>
    <div>In order to {props.web3Intent}, you must use an Ethereum wallet-enabled browser.</div>
    <br />
    <div><strong>Popular Ethereum Wallets</strong></div>
    <div className="button-container">
      <a href="https://trustwalletapp.com/"
        target="_blank"
        className="btn btn-clear">
        Trust
      </a>
    </div>
    <div className="button-container">
      <a href="https://www.cipherbrowser.com/"
        target="_blank"
        className="btn btn-clear">
        Cipher
      </a>
    </div>
    <div className="button-container">
      <a href="https://www.toshi.org/"
        target="_blank"
        className="btn btn-clear">
        Toshi
      </a>
    </div>
  </Modal>
)

const NoWeb3Account = props => (
  <Modal backdrop="static" data-modal="account-unavailable" isOpen={true}>
    <div className="image-container">
      <img src="images/metamask.png" role="presentation" />
    </div>
    <a
      className="close"
      aria-label="Close"
      onClick={() => props.storeWeb3Intent(null)}
    >
      <span aria-hidden="true">&times;</span>
    </a>
    <div>In order to {props.web3Intent}, you must sign in to MetaMask.</div>
    <div className="button-container">
      <button
        className="btn btn-clear"
        onClick={() => props.storeWeb3Intent(null)}
      >
        OK
      </button>
    </div>
  </Modal>
)

const UnconnectedNetwork = () => (
  <Modal backdrop="static" data-modal="web3-unavailable" isOpen={true}>
    <div className="image-container">
      <img src="images/flat_cross_icon.svg" role="presentation" />
    </div>
    Connecting to network...
  </Modal>
)

const UnsupportedNetwork = props => (
  <Modal backdrop="static" data-modal="web3-unavailable" isOpen={true}>
    <div className="image-container">
      <img src="images/flat_cross_icon.svg" role="presentation" />
    </div>
    <p>
      <span className="line">{ (props.onMobile) ? "Your wallet-enabled browser" : "MetaMask" } should be on&nbsp;</span>
      <span className="line"><strong>Rinkeby Test Network</strong></span>
    </p>
    Currently on {props.currentNetworkName}.
  </Modal>
)

const Web3Unavailable = props => (
  <Modal backdrop="static" data-modal="web3-unavailable" isOpen={true}>
    <div className="image-container">
      <img src="images/flat_cross_icon.svg" role="presentation" />
    </div>
    {(!props.onMobile || (props.onMobile === "Android")) &&
      <div>Please install the MetaMask extension<br />to access this site.<br />
        <a target="_blank" href="https://metamask.io/">Get MetaMask</a><br />
        <a target="_blank" href="https://medium.com/originprotocol/origin-demo-dapp-is-now-live-on-testnet-835ae201c58">
          Full Instructions for Demo
        </a>
      </div>
    }
    {(props.onMobile && (props.onMobile !== "Android")) &&
      <div>Please access this site through <br />a wallet-enabled browser:<br />
        <a target="_blank" href="https://itunes.apple.com/us/app/toshi-ethereum/id1278383455">Toshi</a>&nbsp;&nbsp;|&nbsp;
        <a target="_blank" href="https://itunes.apple.com/us/app/cipher-browser-ethereum/id1294572970">Cipher</a>&nbsp;&nbsp;|&nbsp;
        <a target="_blank" href="https://itunes.apple.com/ae/app/trust-ethereum-wallet/id1288339409">Trust Wallet</a>
      </div>
    }
  </Modal>
)

class Web3Provider extends Component {
  constructor(props) {
    super(props)

    this.accountsInterval = null
    this.networkInterval = null
    this.fetchAccounts = this.fetchAccounts.bind(this)
    this.fetchNetwork = this.fetchNetwork.bind(this)
    this.state = {
      networkConnected: null,
      networkId: null,
      networkError: null,
      provider: null,
      linkerCode:"",
      linkerPopUp:false
    }
  }

  async componentWillMount() {
    this.setState({ provider: web3.currentProvider })

  }

  /**
   * Start polling accounts and network. We poll indefinitely so that we can
   * react to the user changing accounts or networks.
   */
  componentDidMount() {
    this.fetchAccounts()
    this.fetchNetwork()
    this.initAccountsPoll()
    this.initNetworkPoll()
    if (origin.contractService.walletLinker)
    {
        origin.contractService.walletLinker.showPopUp = this.showLinkerPopUp.bind(this);
        origin.contractService.walletLinker.setLinkCode = this.setLinkerCode.bind(this);
        origin.contractService.walletLinker.showNextPage = this.showNextPage.bind(this);
    }
  }

  showLinkerPopUp(linkerPopUp){
    this.setState({linkerPopUp})
  }

  setLinkerCode(linkerCode) {
    this.setState({linkerCode})
  }

  showNextPage() {
    let now = this.props.location.pathname
    if (now.startsWith("/listing/"))
    {
      this.props.history.push("/my-purchases")
    }
    else if (now.startsWith("/create"))
    {
      this.props.history.push("/my-listings")
    }
  }

  /**
   * Init web3/account polling, and prevent duplicate interval.
   * @return {void}
   */
  initAccountsPoll() {
    if (!this.accountsInterval) {
      this.accountsInterval = setInterval(this.fetchAccounts, ONE_SECOND)
    }
  }

  /**
   * Init network polling, and prevent duplicate intervals.
   * @return {void}
   */
  initNetworkPoll() {
    if (!this.networkInterval) {
      this.networkInterval = setInterval(this.fetchNetwork.bind(this), ONE_MINUTE)
    }
  }

  /**
   * Update state regarding the availability of web3 and an ETH account.
   * @return {void}
   */
  fetchAccounts() {
    web3.eth.getAccounts((err, accounts) => {
      if (err) {
        console.error(err)
      } else {
        this.handleAccounts(accounts)
      }
    })

    if (web3.currentProvider != this.state.provider)
    {
      //got a real provider now
      this.setState({ provider: web3.currentProvider })
    }

    let code = origin.contractService.getMobileWalletLink()
    if (this.state.linkerCode != code)
    {
      //let's set the linker code
      this.setState({ linkerCode: code })
    }
  }

  /**
   * Get the network and update state accordingly.
   * @return {void}
   */
  fetchNetwork() {
    let called = false

    web3.currentProvider &&
      web3.version &&
      web3.eth.net.getId((err, netId) => {
        called = true

        const networkId = parseInt(netId, 10)

        if (err) {
          this.setState({
            networkError: err
          })
        } else {
          if (networkId !== this.state.networkId) {
            this.setState({
              networkError: null,
              networkId
            })
          }
        }

        if (!this.state.networkConnected) {
          this.setState({
            networkConnected: true
          })
        }
      })

    // Delay and condition the use of the network value.
    // https://github.com/MetaMask/metamask-extension/issues/1380#issuecomment-375980850
    if (this.state.networkConnected === null) {
      if (!origin.contractService.walletLinker)
      {
        setTimeout(() => {
          !called &&
            web3 &&
            web3.version &&
            (web3.version.network === 'loading' || !web3.version.network) &&
            this.setState({
              networkConnected: false
            })
        }, 4000)
      }
    }
  }

  handleAccounts(accounts) {
    let curr = accounts[0]
    let prev = this.props.web3Account

    if (curr !== prev) {
      this.props.storeWeb3Account(curr)

      // TODO: fix this with some route magic!
      if(["/my-listings", "/my-purchases","/my-sales"].includes(this.props.location.pathname))
      {
        if (prev !== null && (!curr) )
        {
          setTimeout(() =>{ window.location.reload()}, 1000)
        }
        else
        {
          if (prev !== null)
          {
            setTimeout(() =>{ window.location.reload()}, 1000)
          }
        }
      }
      else
      {
        // force reload on account change
        this.props.fetchProfile()
        this.props.getBalance()
      }
        
    }
  }

  render() {
    const { onMobile, web3Account, web3Intent, storeWeb3Intent } = this.props
    const { networkConnected, networkId, provider, linkerCode, linkerPopUp } = this.state
    const currentNetworkName = networkNames[networkId]
      ? networkNames[networkId]
      : networkId
    const inProductionEnv = window.location.hostname === productionHostname
    const networkNotSupported = supportedNetworkIds.indexOf(networkId) < 0

    return (
      <Fragment>
        { /* provider should always be present */
          !provider &&
          <Web3Unavailable onMobile={onMobile} />
        }

        { /* networkConnected initial state is null */
          provider &&
          networkConnected === false &&
          <UnconnectedNetwork />
        }

        { /* production  */
          provider &&
          networkId &&
          inProductionEnv &&
          networkNotSupported &&
          <UnsupportedNetwork currentNetworkName={currentNetworkName} onMobile={onMobile} />
        }
        { /* attempting to use web3 in unsupported mobile browser */
          /*
          web3Intent &&
          !web3.givenProvider &&
          onMobile &&
          <NotWeb3EnabledMobile web3Intent={web3Intent} storeWeb3Intent={storeWeb3Intent} />
          */
        }
        

        { /* attempting to use web3 in unsupported desktop browser */
          web3Intent &&
          !web3.givenProvider &&
          linkerCode &&
          linkerPopUp &&
          <LinkerPopUp web3Intent={web3Intent} cancel={() => { storeWeb3Intent(null); origin.contractService.walletLinker.cancelLink() }} linkerCode={linkerCode} />
        }

        { /* attempting to use web3 without being signed in */
          web3Intent &&
          web3.givenProvider &&
          !web3Account &&
          <NoWeb3Account web3Intent={web3Intent} storeWeb3Intent={storeWeb3Intent} />
        }

        {this.props.children}

      </Fragment>
    )
  }
}

const mapStateToProps = state => {
  return {
    web3Account: state.app.web3.account,
    web3Intent: state.app.web3.intent,
    onMobile: state.app.onMobile,
  }
}

const mapDispatchToProps = dispatch => ({
  fetchProfile: () => dispatch(fetchProfile()),
  getBalance: () => dispatch(getBalance()),
  storeWeb3Account: addr => dispatch(storeWeb3Account(addr)),
  storeWeb3Intent: intent => dispatch(storeWeb3Intent(intent)),
})

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(Web3Provider))
