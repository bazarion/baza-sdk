const { ethers } = require('ethers')
const BazaMarketAbi = require('@bazarion/protocol/abis/baza/BazaMarket.json')
const BazaFactoryAbi = require('@bazarion/protocol/abis/baza/BazaFactory.json')
const BazaNFTAbi = require('@bazarion/protocol/abis/baza/BazaNFT.json')
const BazaAbi = require('@bazarion/protocol/abis/baza/Baza.json')
const contracts = require('@bazarion/protocol/contracts.json')
const { NETWORKS } = require('./constants')

class Market {
    constructor(market, ft, nft, isNative, provider, network, address, signer = null) {
        if (!signer) {
            signer = provider.getSigner()
        }
        this.market = market
        this.ft = ft
        this.nft = nft
        this.isNative = isNative
        this.provider = provider
        this.network = network
        this.address = address
        this.nftContract = new ethers.Contract(this.nft, BazaNFTAbi, signer)
        this.ftContract = new ethers.Contract(this.ft, BazaAbi, signer)
        this.marketContract = new ethers.Contract(this.market, BazaMarketAbi, signer)
    }

    static setMarket(ft, nft, provider) {
        return provider.getNetwork().then(net => {
            const network = NETWORKS.find(n => (n.chainId === '0x' + net.chainId.toString(16))) || []
            const contract = contracts.find(c => (c.ChainId === net.chainId))

            let signer = provider.getSigner()
            if (provider.connection.url !== 'metamask') {
                let randomWallet = ethers.Wallet.createRandom()
                signer = new ethers.Wallet(randomWallet.privateKey, provider)
            }
            return signer.getAddress().then((address) => {
                return { signer: signer, address: address }
            }).catch(() => {
                let randomWallet = ethers.Wallet.createRandom()
                signer = new ethers.Wallet(randomWallet.privateKey, provider)
                return { signer: signer, address: randomWallet.address }
            }).then(({ signer, address }) => {
                let bazaFactory = new ethers.Contract(contract.BazaFactory, BazaFactoryAbi, signer)
                let isNative = false

                if (ft.toUpperCase() === network.nativeCurrency.symbol) {
                    isNative = true
                    ft = network.nativeCurrency.wrappedToken 
                }

                return bazaFactory.getMarket(ft, nft).then((market) => {
                    return new Market(market, ft, nft, isNative, provider, network, address, signer)
                })
            })
        })
    }

    static setMarketWithAddress(market, provider) {
        return provider.getNetwork().then(net => {
            const network = NETWORKS.find(n => (n.chainId === '0x' + net.chainId.toString(16))) || []
            const contract = contracts.find(c => c.ChainId = net.chainId)

            let signer = provider.getSigner()
            if (provider.connection.url !== 'metamask') {
                let randomWallet = ethers.Wallet.createRandom()
                signer = new ethers.Wallet(randomWallet.privateKey, provider)
            }
            return signer.getAddress().then((address) => {
                return { signer: signer, address: address }
            }).catch(() => {
                let randomWallet = ethers.Wallet.createRandom()
                signer = new ethers.Wallet(randomWallet.privateKey, provider)
                return { signer: signer, address: randomWallet.address }
            }).then(({ signer, address }) => {
                let marketContract = new ethers.Contract(market, BazaMarketAbi, signer)
                let isNative = false
                return marketContract.ft().then(ft => {
                    return marketContract.nft().then(nft => {
                        if (ft.toUpperCase() === network.nativeCurrency.symbol) {
                            isNative = true
                            ft = network.nativeCurrency.wrappedToken 
                        }
                        return new Market(market, ft, nft, isNative, provider, network, address, signer)
                    })
                })

            })
        })
    }


    async ftApprove() {
        return this.ftContract.approve(this.market, ethers.constants.MaxInt256)
    }

    async buy(tokenId) {
        if (this.isNative) {
            let price = await this.marketContract.getAskPrice(tokenId)
            return this.marketContract.buyETH(tokenId, { value: price })
        }
        else {
            return this.marketContract.buy(tokenId)
        }
    }

    async sell(tokenId, bidder) {
        if (this.isNative) {
            return this.marketContract.sellETH(tokenId, bidder)
        }
        else {
            return this.marketContract.sell(tokenId, bidder)
        }
    }

    async sellMarket(tokenId, bidder) {
        if (this.isNative) {
            return this.marketContract.sellMarketETH(tokenId, bidder)
        }
        else {
            return this.marketContract.sellMarket(tokenId, bidder)
        }
    }

    async ask(tokenId, price) {
        if (this.isNative) {
            let stakeRate = await this.stakeRate()
            return this.marketContract.askETH(tokenId, price, { value: price.mul(stakeRate).div(1000) })
        } else {
            return this.marketContract.ask(tokenId, price)
        }
    }

    async removeBid(tokenId) {
        if (this.isNative) {
            return this.marketContract.removeBidETH(tokenId)
        } else {
            return this.marketContract.removeBid(tokenId)
        }
    }

    async removeAsk(tokenId) {
        if (this.isNative) {
            return this.marketContract.removeAskETH(tokenId)
        } else {
            return this.marketContract.removeAsk(tokenId)
        }
    }

    async bid (tokenId, price) {
        if (this.isNative) {
            return this.marketContract.bidETH(tokenId, price, {
                value: price
            })
        } else {
            return this.marketContract.bid(tokenId, price)
        }
    }

    async bidMarket (amount, price, isAuto, ROI) {
        if (this.isNative) {
            return this.marketContract.bidMarketETH(amount, price, isAuto, ROI, {
                value: amount
            })
        } else {
            return this.marketContract.bidMarket(amount, price, isAuto, ROI)
        }
    }

    async withdraw (share) {
        if (this.isNative) {
            return this.marketContract.withdrawETH(share, {
                value: 0
            })
        } else {
            return this.marketContract.withdraw(share)
        }
    }

    async updateBid (tokenId, price) {
        if (this.isNative) {
            let bidPrice = await this.getBidPrice(tokenId, this.address)
            let delta = ethers.BigNumber.from(0)
            if (price.gt(bidPrice)) {
                delta = price.sub(bidPrice)
            }
            return this.marketContract.updateBidETH(tokenId, price, {
                value: delta
            })
        } else {
            return this.marketContract.updateBid(tokenId, price)
        }
    }

    async updateAsk (tokenId, price) {
        if (this.isNative) {
            let stakeRate = await this.stakeRate()
            return this.marketContract.updateAskETH(tokenId, price, {
                value: price.mul(stakeRate).div(1000)
            })
        } else {
            return this.marketContract.updateAsk(tokenId, price)
        }
    }

    async getFTInfo() {
        let ftDecimals = await this.ftContract.decimals()
        let ftName = await this.ftContract.name()
        let ftSymbol = (this.isNative)
            ? this.network.nativeCurrency.symbol
            : await this.ftContract.symbol()
        let balance = (!this.isNative)
            ? (await this.ftContract.balanceOf(this.address))
            : (await this.provider.getSigner().getBalance())
        return { ftDecimals, ftName, ftSymbol, balance }
    }

    async getNFTInfo() {
        let nftDecimals = await this.nftContract.decimals()
        let nftName = await this.nftContract.name()
        let nftSymbol = await this.nftContract.symbol()
        return { nftDecimals, nftName, nftSymbol }
    }

    async getBidShare(tokenId, addr) {
        return this.marketContract.getBidShare(tokenId, addr)
    }

    async getBestBid(tokenId) {
        return this.marketContract.getBestBid(tokenId)
    }

    async getAskShare(tokenId) {
        return this.marketContract.getAskShare(tokenId)
    }

    async getAskPrice(tokenId) {
        return this.marketContract.getAskPrice(tokenId)
    }

    async getBidPrice(tokenId, addr){
        return this.marketContract.getBidPrice(tokenId, addr)
    }

    async getSizeOfList(tokenId) {
        return this.marketContract.getSizeOfList(tokenId)
    }

    async ftAllowance(owner, addr) {
        return this.ftContract.allowance(owner, addr)
    }

    async isApprovedForAll(owner, addr) {
        return this.nftContract.isApprovedForAll(owner, addr)
    }

    async setApprovalForAll(addr, b) {
        return this.nftContract.setApprovalForAll(addr, b)
    }

    async totalSupply() {
        return this.marketContract.totalSupply()
    }

    async nftTotalSupply() {
        return this.nftContract.totalSupply()
    }

    async ftTotalSupply() {
        return this.ftContract.totalSupply()
    }

    async ftBalanceOf(addr) {
        return this.ftContract.balanceOf(addr)
    }

    async getOwnerByTokenId(tokenId) {
        return this.marketContract.getOwnerByTokenId(tokenId)
    }

    async balanceOf(owner) {
        return this.marketContract.balanceOf(owner)
    }

    askBalanceOf(owner) {
        return this.marketContract.askBalanceOf(owner)
    }

    bidBalanceOf(owner) {
        return this.marketContract.bidBalanceOf(owner)
    }

    bidOfOwnerByIndex(owner, idx) {
        return this.marketContract.bidOfOwnerByIndex(owner, idx)
    }

    askOfOwnerByIndex(owner, idx) {
        return this.marketContract.askOfOwnerByIndex(owner, idx)
    }

    async tokenURI(tokenId) {
        return this.nftContract.tokenURI(tokenId)
    }

    async nftOwnerOf(tokenId) {
        return this.nftContract.ownerOf(tokenId)
    }

    async nftSymbol() {
        return this.nftContract.symbol()
    }

    async ftName() {
        return (this.isNative) ? this.ftContract.name() : this.network.nativeCurrency.name
    }

    async ftSymbol() {
        return (this.isNative)
            ? this.network.nativeCurrency.symbol
            : await this.ftContract.symbol()
    }

    async ftDecimals() {
        return this.ftContract.decimals()
    }

    async nftName() {
        return this.nftContract.name()
    }

    exchangeFee() {
        return this.marketContract.EXCHANGE_FEE()
    }

    withdrawFee() {
        return this.marketContract.WITHDRAW_FEE()
    }

    treasuryFee() {
        return this.marketContract.TREASURY_FEE()
    }

    stakeRate() {
        return this.marketContract.STAKE_RATE()
    }

    tokenByIndex(idx) {
        return this.nftContract.tokenByIndex(idx)
    } 

}

module.exports = Market
