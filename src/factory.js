const { ethers } = require('ethers')
const BazaFactoryAbi = require('@baza/protocol/abis/baza/BazaFactory.json')
const contracts = require('@baza/protocol/contracts.json')

class Factory {
    constructor(contract, provider, signer = null) {
        if (!signer) {
            signer = provider.getSigner()
        }
        this.factory = new ethers.Contract(contract.BazaFactory, BazaFactoryAbi, signer)
    }

    static async setProvider(provider) {
        let { chainId } = await provider.getNetwork()
        let contract = contracts.find(c => (c.ChainId === chainId))

        let signer = provider.getSigner()
        if (provider.connection.url !== 'metamask') {
            let randomWallet = ethers.Wallet.createRandom()
            signer = new ethers.Wallet(randomWallet.privateKey, provider)
        }

        return signer.getAddress().then(() => {
            return new Factory(contract, provider, signer)
        }).catch(() => {
            let randomWallet = ethers.Wallet.createRandom()
            signer = new ethers.Wallet(randomWallet.privateKey, provider)
            return new Factory(contract, provider, signer)
        })
    }

    async createMarket(ft, nft) {
        return this.factory.createMarket(ft, nft)
    }

    async createMarketWait(ft, nft) {
        return (await this.factory.createMarket(ft, nft)).wait()
    }

    async getMarket(ft, nft) {
        return this.factory.getMarket(ft, nft)
    }

    async getMarketByNFT(nft) {
        return this.factory.getMarketByNFT(nft)
    }

    async fees(nft) {
        return this.factory.fees(nft)
    }

    async allMarketsLength() {
        return this.factory.allMarketsLength()
    }

    async allMarkets(i) {
        return this.factory.allMarkets(i)
    }

    async getAllMarkets() {
        return this.factory.getAllMarkets()
    }

    async feeSetter() {
        return this.factory.feeSetter()
    }
}

module.exports = Factory
