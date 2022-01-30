const constants = require('./constants')
const Market = require('./market')
const Multicall = require('./multicall')
const Factory = require('./factory')
const FT = require('./ft')
const NFT = require('./nft')
const contracts = require('./contracts')
const { ethers } = require('ethers')

const NETWORKS = constants.NETWORKS

function getProvider (chainId) {
    const network = NETWORKS.find(n => (n.chainId === '0x' + chainId.toString(16)))
    return new ethers.providers.JsonRpcProvider(network.rpcUrls[0])
}

module.exports = {
    Market,
    Factory,
    FT,
    NFT,
    constants,
    contracts,
    getProvider,
    Multicall
}
