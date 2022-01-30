const { ethers } = require('ethers')
const BazaNFTAbi = require('@baza/protocol/abis/baza/BazaNFT.json')

class NFT {
    constructor(nft, provider) {
        let signer = provider.getSigner()
        if (provider.connection.url !== 'metamask') {
            let randomWallet = ethers.Wallet.createRandom()
            signer = new ethers.Wallet(randomWallet.privateKey, provider)
        }
        this.nft = new ethers.Contract(nft, BazaNFTAbi, signer)
        this.address = this.nft.address
    }

    symbol() {
        return this.nft.symbol()
    }

    name() {
        return this.nft.name()
    }

    balanceOf(addr) {
        return this.nft.balanceOf(addr)
    }

    tokenOfOwnerByIndex(addr, idx) {
        return this.nft.tokenOfOwnerByIndex(addr, idx)
    }

    totalSupply() {
        return this.nft.totalSupply()
    }

}

module.exports = NFT
