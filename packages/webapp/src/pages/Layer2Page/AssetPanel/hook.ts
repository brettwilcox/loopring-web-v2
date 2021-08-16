import React from 'react'
import store from 'stores'
import { TokenType } from '@loopring-web/component-lib'
import { EmptyValueTag } from '@loopring-web/common-resources'
import { useWalletLayer2 } from 'stores/walletLayer2'
import { useAccount } from 'stores/account';
import { LoopringAPI } from 'api_wrapper'
import { makeWalletLayer2 } from 'hooks/help'
import { AssetType } from 'loopring-sdk'
import { volumeToCount } from 'hooks/help'

export type TrendDataItem = {
    timeStamp: number;
    close: number;
}

export type ITokenInfoItem = {
    token: string,
    detail: {
        price: string,
        symbol: string,
        updatedAt: number
    }
}

export const useGetAssets = () => {
    const [chartData, setChartData] = React.useState<TrendDataItem[]>([])
    const [assetsList, setAssetsList] = React.useState<any[]>([])
    
    const { account: { accAddress } } = useAccount()
    const { walletLayer2 } = store.getState().walletLayer2;
    const { ammMap } = store.getState().amm.ammMap
    const { status: walletLayer2Status } = useWalletLayer2();

    const getUserTotalAssets = React.useCallback(async (limit: number = 7) => {
        const userAssets = await LoopringAPI.walletAPI?.getUserAssets({
            wallet: accAddress,
            assetType: AssetType.DEX,
            limit: limit // TODO: minium unit is day, discuss with pm later
        })
        if (userAssets && userAssets.userAssets.length && !!userAssets.userAssets.length) {
            // console.log(userAssets.userAssets)
            setChartData(userAssets.userAssets.map(o => ({
                timeStamp: Number(o.createdAt),
                // close: o.amount && o.amount !== NaN ? Number(o.amount) : 0
                close: Number(o.amount)
            })))
        }
    }, [accAddress])

    React.useEffect(() => {
        if (walletLayer2Status === 'UNSET') {
            const walletMap = makeWalletLayer2()
            const assetsKeyList = walletMap && walletMap.walletMap ? Object.keys(walletMap.walletMap) : []
            const assetsDetailList = walletMap && walletMap.walletMap ? Object.values(walletMap.walletMap) : []
            const list = assetsKeyList.map((key, index) => ({
                token: key,
                detail: assetsDetailList[index]
            }))
            setAssetsList(list)
        }
    }, [walletLayer2Status])

    React.useEffect(() => {
        if (LoopringAPI && LoopringAPI.walletAPI && walletLayer2) {
            getUserTotalAssets()
        }
    }, [walletLayer2, getUserTotalAssets])

    const { faitPrices } = store.getState().system

    const tokenPriceList = faitPrices ? Object.entries(faitPrices).map(o => ({
        token: o[ 0 ],
        detail: o[ 1 ]
    })) as ITokenInfoItem[] : []

    const formattedData = assetsList.map(item => {
        const isLpToken = item.token.split('-')[0] === 'LP'
        if (!isLpToken) {
            const tokenPriceUSDT = item.token === 'DAI'
                ? 1
                : Number(tokenPriceList.find(o => o.token === item.token) ? tokenPriceList.find(o => o.token === item.token)?.detail.price : 0) / Number(tokenPriceList.find(o => o.token === 'USDT')?.detail.price)
            return ({
                name: item.token,
                value: Number(volumeToCount(item.token, item.detail?.detail?.total as string)) * tokenPriceUSDT
            })
        }
        const result = item.token.split('-')
        result.splice(0, 1, 'AMM')
        const ammToken = result.join('-')
        // const ammTokenList = Object.keys(ammMap)
        // const ammTokenPrice = ammTokenList.includes(ammToken) && ammMap[ammToken] && ammMap[ammToken].amountDollar ? (ammMap[ammToken].totalLPToken || 0) / ammMap[ammToken].amountDollar : 0
        // const tokenValue =  ammTokenPrice * (item.detail?.count || 0)
        const tokenValue = ammMap[ammToken].totalLPToken || 0
        return ({
            name: item.token,
            value: tokenValue
        })
    })

    const lpTotalData = formattedData
        .filter(o => o.name.split('-')[0] === 'LP')
        .reduce((prev, next) => ({
            name: 'LP-Token',
            value: prev.value + next.value
        }), {
            name: 'LP-Token',
            value: 0
        })
    
    const formattedDoughnutData = formattedData.filter(o => o.name.split('-')[0] === 'LP').length > 0
        ? [...formattedData.filter(o => o.name.split('-')[0] !== 'LP'), lpTotalData]
        : formattedData

    const assetsRawData = assetsList.map((tokenInfo) => {
        const tokenPriceUSDT = Number(tokenPriceList.find(o => o.token === tokenInfo.token)?.detail.price) / Number(tokenPriceList.find(o => o.token === 'USDT')?.detail.price)
        return ({
            token: {
                type: tokenInfo.token.split('-')[0] === 'LP' ? TokenType.lp : TokenType.single,
                value: tokenInfo.token
            },
            amount: String(Number(volumeToCount(tokenInfo.token, tokenInfo.detail?.detail.total as string)).toFixed(6)) || EmptyValueTag,
            available: String(tokenInfo.detail?.count) || EmptyValueTag,
            locked: String(tokenInfo.detail?.detail.locked) || EmptyValueTag,
            smallBalance: tokenPriceUSDT * Number(volumeToCount(tokenInfo.token, tokenInfo.detail?.detail.total as string)) < 1,
        })
    })

    return {
        chartData,
        // assetsList,
        formattedData,
        formattedDoughnutData,
        assetsRawData,
    }
}