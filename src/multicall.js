const { ethers } = require('ethers')
const BazaMarketAbi = require('@bazarion/protocol/abis/baza/BazaMarket.json')
const BazaFactoryAbi = require('@bazarion/protocol/abis/baza/BazaFactory.json')
const BazaNFTAbi = require('@bazarion/protocol/abis/baza/BazaNFT.json')
const BazaAbi = require('@bazarion/protocol/abis/baza/Baza.json')
const { Contract, Provider } = require('ethcall')
const contracts = require('@bazarion/protocol/contracts.json')
const { NETWORKS, MULTICALLS } = require('./constants')

class Multicall {
    constructor(ft, nft, market, chainId, provider) {
        this.nftContract = new Contract(nft, BazaNFTAbi)
        this.ftContract = new Contract(ft, BazaAbi)
        this.marketContract = new Contract(market, BazaMarketAbi)
        this.provider = provider
        this.chainId = chainId
    }

    static setMulticall(ft, nft, provider) {
        const ethcallProvider = new Provider()
        return ethcallProvider.init(provider).then(() => {
            return provider.getNetwork().then(net => {
                const multi = MULTICALLS.find(n => (n.chainId === '0x' + net.chainId.toString(16)))
                const contract = contracts.find(c => (c.ChainId === net.chainId))
                ethcallProvider.multicall = { address: multi.address, block: 0 }

                let signer = provider.getSigner()
                if (provider.connection.url !== 'metamask') {
                    let randomWallet = ethers.Wallet.createRandom()
                    signer = new ethers.Wallet(randomWallet.privateKey, provider)
                }

                return signer.getAddress().then(() => {
                    let bazaFactory = new ethers.Contract(contract.BazaFactory, BazaFactoryAbi, signer)
                    return bazaFactory.getMarket(ft, nft).then((market) => {
                        return new Multicall(ft, nft, market, net.chainId, ethcallProvider)
                    })
                }).catch(() => {
                    let randomWallet = ethers.Wallet.createRandom()
                    signer = new ethers.Wallet(randomWallet.privateKey, provider)
                    let bazaFactory = new ethers.Contract(contract.BazaFactory, BazaFactoryAbi, signer)
                    return bazaFactory.getMarket(ft, nft).then((market) => {
                        return new Multicall(ft, nft, market, net.chainId, ethcallProvider)
                    })
                })
            })
        })
    }

    static getTokensInMarkets(markets, provider) {
        const ethcallProvider = new Provider()
        return ethcallProvider.init(provider).then(() => {
            return provider.getNetwork().then(net => {
                const multi = MULTICALLS.find(n => (n.chainId === '0x' + net.chainId.toString(16)))
                const contract = contracts.find(c => (c.ChainId === net.chainId))
                ethcallProvider.multicall = { address: multi.address, block: 0 }

                let calls = []
                markets.forEach(m => {
                    let contract = new Contract(m, BazaMarketAbi)
                    calls.push(contract.ft())
                    calls.push(contract.nft())
                })
                return ethcallProvider.all(calls)
            })
        })
    }

    static getTokenURIs(list, provider) {
        const ethcallProvider = new Provider()
        return ethcallProvider.init(provider).then(() => {
            return provider.getNetwork().then(net => {
                const multi = MULTICALLS.find(n => (n.chainId === '0x' + net.chainId.toString(16)))
                const contract = contracts.find(c => (c.ChainId === net.chainId))
                ethcallProvider.multicall = { address: multi.address, block: 0 }

                let calls = []
                list.forEach(l => {
                    let contract = new Contract(l[1], BazaNFTAbi)
                    calls.push(contract.tokenURI(l[2]))
                })
                return ethcallProvider.all(calls)
            })
        })
    }

    async getMarketInfo() {

        let data = await this.provider.all([
            this.nftContract.totalSupply(),
            this.marketContract.EXCHANGE_FEE(),
            this.marketContract.WITHDRAW_FEE(),
            this.marketContract.TREASURY_FEE(),
            this.marketContract.STAKE_RATE(),
            this.ftContract.balanceOf(this.marketContract.address),
            this.ftContract.decimals(),
            this.ftContract.symbol(),
            this.ftContract.name(),
            this.nftContract.symbol(),
            this.nftContract.name(),
            this.marketContract.totalSupply(),
            this.marketContract.getBestBidMarket(),
            this.marketContract.getSizeOfListMarket()
        ])
        let totalSupply = data[0]
        let exchangeFee = data[1]
        let withdrawFee = data[2]
        let treasuryFee = data[3]
        let stakeRate = data[4]
        let tvl = data[5]
        let ftDecimals = data[6]
        let ftSymbol = data[7]
        let ftName = data[8]
        let nftSymbol = data[9]
        let nftName = data[10]
        let marketTotalSupply = data[11]
        let bestBidMarketOwner = data[12][0]
        let bestBidMarketPrice = data[12][1]
        let sizeOfListMarket = data[13]
        const network = NETWORKS.find(n => (n.chainId === '0x' + this.chainId.toString(16)))
        if (this.ftContract.address === network.nativeCurrency.wrappedToken) {
            ftSymbol =  network.nativeCurrency.symbol
        }
        return { totalSupply, exchangeFee, withdrawFee, treasuryFee, stakeRate,
            tvl, ftDecimals, ftSymbol, ftName, nftSymbol, nftName, marketTotalSupply, bestBidMarketOwner, bestBidMarketPrice, sizeOfListMarket }
    }

    async getNftInfo(tokenId) {
        let data = await this.provider.all([
            this.nftContract.ownerOf(tokenId),
            this.marketContract.getAskPrice(tokenId),
            this.marketContract.getSizeOfList(tokenId),
            this.marketContract.getBestBid(tokenId),
            this.marketContract.getAskShare(tokenId),
        ])
        let owner = data[0]
        let askPrice = data[1]
        let bidSize = data[2]
        let bestBid = data[3]
        let askShare = data[4]
        return { owner, askPrice, bidSize, bestBid, askShare }
    }

    async getBidMarketInfo(bidder) {
        let data = await this.provider.all([
            this.marketContract.getBidMarketPrice(bidder),
            this.marketContract.getBidMarketShare(bidder),
            this.marketContract.getBidMarketAuto(bidder),
            this.marketContract.getBidMarketROI(bidder),
            this.marketContract.getBestBidMarket()
        ])
        let price = data[0]
        let share = data[1]
        let isAuto = data[2]
        let ROI = data[3]
        return { price, share, isAuto, ROI }
    }

    async askOfOwnerByIndex(asker, from, to) {
        let calls = []
        for (let i = from; i < to; i++) {
            calls.push(this.marketContract.askOfOwnerByIndex(asker, i))
        }
        let data = await this.provider.all(calls)
        return data
    }

    async bidOfOwnerByIndex(bidder, from, to) {
        let calls = []
        for (let i = from; i < to; i++) {
            calls.push(this.marketContract.bidOfOwnerByIndex(bidder, i))
        }
        let data = await this.provider.all(calls)
        return data
    }

    async nftOfOwnerByIndex(owner, from, to) {
        let calls = []
        for (let i = from; i < to; i++) {
            calls.push(this.nftContract.tokenOfOwnerByIndex(owner, i))
        }
        let data = await this.provider.all(calls)
        return data
    }

    async getBasicTokenInfo() {
        let data = await this.provider.all([
            this.nftContract.name(),
            this.nftContract.symbol(),
            this.ftContract.name(),
            this.ftContract.symbol(),
            this.ftContract.decimals()
        ])
        let nftName = data[0]
        let nftSymbol = data[1]
        let ftName = data[2]
        let ftSymbol = data[3]
        let ftDecimals = data[4]
        return { nftName, nftSymbol, ftName, ftSymbol, ftDecimals }
    }

}

module.exports = Multicall
