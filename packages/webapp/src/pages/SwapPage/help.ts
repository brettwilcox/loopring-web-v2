import store from '../../stores';
import { AmmPoolSnapshot, DepthData, LoopringMap, TickerData, TokenVolumeV3 } from 'loopring-sdk';
import { LoopringAPI } from '../../api_wrapper';
import { CustomError, ErrorMap } from '@loopring-web/common-resources';
import { volumeToCountAsBigNumber } from '../../hooks/help';
import { myLog } from '../../utils/log_tools';
import { PairFormat } from '../../stores/router';
import BigNumber from 'bignumber.js';

export const swapDependAsync = (market: PairFormat): Promise<{
    ammPoolsBalance: AmmPoolSnapshot | undefined,
    tickMap: LoopringMap<TickerData>,
    depth: DepthData
}> => {
    const {ammMap} = store.getState().amm

    return new Promise((resolve, reject) => {
        if (LoopringAPI.ammpoolAPI && LoopringAPI.exchangeAPI) {
            Promise.all([
                LoopringAPI.exchangeAPI.getMixDepth({market}),
                LoopringAPI.ammpoolAPI.getAmmPoolSnapshot({poolAddress: ammMap[ 'AMM-' + market ]?.address}),
                LoopringAPI.exchangeAPI.getMixTicker({market: market})])
                .then(([{depth}, {ammPoolSnapshot}, {tickMap}]) => {
                    resolve({
                        ammPoolsBalance: ammPoolSnapshot,
                        tickMap,
                        depth,
                    })
                })

        } else {
            reject(new CustomError(ErrorMap.NO_SDK))
        }

    })
}

export const calcPriceByAmmTickMapDepth = <C>(
    {
        market,
        tradePair,
        dependencyData: {tickMap, ammPoolsBalance, depth}
    }: {
        market: PairFormat,
        tradePair: PairFormat
        dependencyData: { tickMap: any, ammPoolsBalance: any, depth: any },
    }): { stob: number | undefined, close: number | undefined } => {
    const {tokenMap, idIndex} = store.getState().tokenMap
    // const  = store.getState().pageTradeLite.pageTradeLite;
    // @ts-ignore
    const [, coinSell, coinBuy] = tradePair.match(/(\w+)-(\w+)/i)
    // @ts-ignore
    const [, coinA, coinB] = market.match(/(\w+)-(\w+)/i)
    let stob: number | undefined | BigNumber = undefined,
        close: number | undefined  = undefined;
    if (coinA && coinB && tokenMap && idIndex) {
        //first getValue from  ammPoolsBalance
        if (ammPoolsBalance) {
            const poolATokenVol: TokenVolumeV3 = ammPoolsBalance.pooled[ 0 ];
            const poolBTokenVol: TokenVolumeV3 = ammPoolsBalance.pooled[ 1 ];
            stob = volumeToCountAsBigNumber(idIndex[ poolBTokenVol.tokenId ], poolBTokenVol.volume)?.div(
                volumeToCountAsBigNumber(idIndex[ poolATokenVol.tokenId ], poolATokenVol.volume) || 1
            )//.toFixed(tokenMap[])
            stob = Number(stob?.toFixed(tokenMap[ idIndex[ poolBTokenVol.tokenId ] ].precision))
            close = stob;
            if (coinSell !== coinA) {
                stob = Number((1 / (stob || 1)).toFixed(tokenMap[ idIndex[ poolATokenVol.tokenId ] ].precision))
            }
            // stob = parseFloat(volumeToCountAsBigNumber(quoteVol[ 0 ], quoteVol[ 1 ])?.div(
            //     volumeToCountAsBigNumber(baseVol[ 0 ], baseVol[ 1 ]) || 1).toFixed(7, 0) as string)

            myLog('pairDetailDone stob from amm:', stob)
            // let poolVolume: [baseVol: any, quoteVol: any];
            // if ( tokenMap[ coinA ].tokenId === poolBaseTokenVol.tokenId) {
            //     poolVolume = [[coinA, poolBaseTokenVol.volume], [quote, quoteBaseTokenVol.volume]]
            // } else if (base && quote && tokenMap[ base ].tokenId === quoteBaseTokenVol.tokenId) {
            //     poolVolume = [[base, quoteBaseTokenVol.volume], [quote, poolBaseTokenVol.volume]]
            // } else {
            //     throw new CustomError(ErrorMap.NO_SUPPORT_PAIR)
            // }
            // let [baseVol, quoteVol] = poolVolume
            // if (baseVol && quoteVol) {

            // }

        }

        //second getValue from tickerData
        if (!stob && tickMap) {
            const tickerData = tickMap[ market ]
            close = Number(tickerData.close);
            if (tickerData.base === coinSell) {
                stob = Number(tickerData.close)
            } else {
                stob = Number(tickerData.close) !== 0 ? 1 / Number(tickerData.close) : 0
            }
        }

        //last check from depth
        if (!stob && depth) {
            close = depth.mid_price;
            stob = tradePair === depth.symbol ? depth.mid_price : 1 / depth.mid_price
        }
        // const isValidS2B = (stob !== 0 && stob !== undefined && !isNaN(stob))
        return {
            stob: !stob || isNaN(stob as any) ? undefined : stob as number,
            close
        }
    }
    return {
        stob: undefined,
        close: undefined
    }
}

export const marketInitCheck = (market: string, type?: 'sell' | 'buy'): { tradePair: PairFormat } => {
    const {coinMap, tokenMap, marketMap, marketArray} = store.getState().tokenMap
    const {ammMap} = store.getState().amm
    if (coinMap && tokenMap && marketMap && marketArray && ammMap) {
        let coinA: string = '#null',
            coinB: string = '#null';
        const result = market.match(/([\w,#]+)-([\w,#]+)/i);
        if (market && result) {
            [, coinA, coinB] = result
        }
        let whichCoinIndex = [coinA, coinB].findIndex(item => item !== '#null');
        if (whichCoinIndex !== -1 && coinMap[ [coinA, coinB][ whichCoinIndex ] ] === undefined) {
            whichCoinIndex === 0 ? coinA = 'LRC' : coinB = 'LRC';
        }
        if (whichCoinIndex === -1) {
            whichCoinIndex = 0;
            coinA = 'LRC';
        }
        if (type === 'sell' && coinB !== '#null') {
            if (!tokenMap[ coinA ].tradePairs.includes(coinB as never)) {
                coinB = tokenMap[ coinA ].tradePairs[ 0 ]
            }
        } else if (coinB === '#null' || coinA === '#null') {
            if (!tokenMap[ [coinA, coinB][ whichCoinIndex ] ].tradePairs.includes([coinA, coinB][ whichCoinIndex ^ 1 ] as never)) {
                whichCoinIndex == 0 ? coinB = tokenMap[ [coinA, coinB][ whichCoinIndex ] ].tradePairs[ 0 ]
                    : coinA = tokenMap[ [coinA, coinB][ whichCoinIndex ] ].tradePairs[ 0 ];
            }
        }
        return {tradePair: `${coinA}-${coinB}`}
    }

    return {tradePair: 'LRC-ETH'};
}