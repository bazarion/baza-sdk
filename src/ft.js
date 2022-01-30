const { ethers } = require('ethers')
const BazaAbi = require('@baza/protocol/abis/baza/Baza.json')

class FT {
    constructor(ft, provider) {
        let signer = provider.getSigner()
        if (provider.connection.url !== 'metamask') {
            let randomWallet = ethers.Wallet.createRandom()
            signer = new ethers.Wallet(randomWallet.privateKey, provider)
        }
        this.ft = new ethers.Contract(ft, BazaAbi, signer)
        this.address = this.ft.address
    }

    symbol() {
        return this.ft.symbol()
    }

    decimals() {
        return this.ft.decimals()
    }

    name() {
        return this.ft.name()
    }

    balanceOf(addr) {
        return this.ft.balanceOf(addr)
    }

}

module.exports = FT
