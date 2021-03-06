import React, { useEffect } from "react";
import { AmmActivity, CoinInfo, MyAmmLP, SagaStatus, TradeFloat } from "@loopring-web/common-resources";
import { useTokenMap } from "stores/token";
import { useRouteMatch } from 'react-router';
import moment from 'moment'
import { AmmDetailStore, useAmmMap } from '../../../stores/Amm/AmmMap';
import { useWalletLayer2 } from '../../../stores/walletLayer2';
import { makeTickView, makeWalletLayer2, pairDetailBlock, volumeToCount, WalletMapExtend } from '../../../hooks/help';
import { AmmPoolSnapshot, AmmUserRewardMap, getExistedMarket, TickerData, TradingInterval } from 'loopring-sdk';
import { deepClone } from '../../../utils/obj_tools';
import { getUserAmmTransaction, makeMyAmmMarketArray } from '../../../hooks/help/marketTable';
import { AmmRecordRow } from '@loopring-web/component-lib';
import { AmmPoolActivityRule, LoopringMap } from 'loopring-sdk/dist/defs/loopring_defs';
import { useSystem } from '../../../stores/system';
import { makeMyAmmWithSnapshot } from '../../../hooks/help/makeUIAmmActivityMap';
import { useUserRewards } from '../../../stores/userRewards';
import { LoopringAPI } from 'api_wrapper';
import { myLog } from '../../../utils/log_tools';
import { useWalletHook } from '../../../services/wallet/useWalletHook';
import store from 'stores'
import { volumeToCountAsBigNumber } from 'hooks/help'

const makeAmmDetailExtendsActivityMap = ({ammMap, coinMap, ammActivityMap, ammKey}: any) => {

    if (ammMap && coinMap) {
        let ammDetail = deepClone(ammMap[ ammKey as string ]);
        const ammActivity = ammActivityMap [ ammKey as string ];

        if (ammDetail && ammDetail.coinA) {
            ammDetail.myCoinA = coinMap[ ammDetail.coinA ];
            ammDetail.myCoinB = coinMap[ ammDetail.coinB ];
            ammDetail[ 'activity' ] = ammActivity ? ammActivity : {};
        }
        return ammDetail;
    }
}
type PgAmmDetail<C extends { [ key: string ]: any }> = AmmDetailStore<C> & {
    myCoinA: CoinInfo<C>,
    myCoinB: CoinInfo<C>,
    activity: AmmActivity<C> | undefined
}

export type ammHistoryItem = {
    close: number;
    timeStamp: number;
}

export type AwardItme = {
    start: string,
    end: string,
    market: string,
    accountId: number,
    awardList: {
        token?: string,
        volume?: number,
    }[]
}

export const useCoinPair = <C extends { [ key: string ]: any }>(ammActivityMap: LoopringMap<LoopringMap<AmmPoolActivityRule[]>>) => {
    const match: any = useRouteMatch("/liquidity/pools/coinPair/:symbol")
    const {coinMap, tokenMap, marketArray} = useTokenMap();
    const {faitPrices} = useSystem();
    const {ammMap, getAmmMap, status: ammMapStatus} = useAmmMap();
    const {userRewardsMap, status: useUserRewardsStatus} = useUserRewards()
    const {accountId} = store.getState().account
    const tokenMapList = tokenMap ? Object.entries(tokenMap) : []

    // const {account} = useAccount();


    // const {ammMap, getAmmMap} = ammMapState;

    // const {ammMap,updateAmmMap} = useAmmMap();
    // const walletLayer2State = useWalletLayer2();
    const {walletLayer2} = useWalletLayer2();
    const [walletMap, setWalletMap] = React.useState<WalletMapExtend<C> | undefined>(undefined);
    // const [ammRecordArray, setAmmRecordArray] = React.useState<AmmRecordRow<C>[]>([]);
    const [ammMarketArray, setAmmMarketArray] = React.useState<AmmRecordRow<C>[]>([]);


    const [myAmmMarketArray, setMyAmmMarketArray] = React.useState<AmmRecordRow<C>[]>([]);
    const [ammUserRewardMap, setAmmUserRewardMap] = React.useState<AmmUserRewardMap | undefined>(undefined);
    const [snapShotData, setSnapShotData] = React.useState<{
        tickerData: TickerData | undefined
        ammPoolsBalance: AmmPoolSnapshot | undefined
    } | undefined>(undefined);

    const [myAmm, setMyAmm] = React.useState<MyAmmLP<C>>(
        {
            feeA: 0,
            feeB: 0,
            feeDollar: 0,
            feeYuan: 0,
            reward: 0,
            rewardToken: undefined as any,
            balanceA: 0,
            balanceB: 0,
            balanceYuan: 0,
            balanceDollar: 0,
        })
    // const [ammPoolsBalance, setAmmpoolsbalance] = React.useState<AmmPoolSnapshot|undefined>(undefined);
    const [coinPairInfo, setCoinPairInfo] = React.useState<PgAmmDetail<C>>({
        myCoinA: undefined,
        myCoinB: undefined,
        activity: undefined,
        totalRewards: undefined,
        amountDollar: undefined,
        amountYuan: undefined,
        totalLPToken: undefined,
        totalA: undefined,
        totalB: undefined,
        rewardToken: undefined,
        rewardValue: undefined,
        feeA: undefined,
        feeB: undefined,
        isNew: undefined,
        isActivity: undefined,
        APY: undefined
    } as unknown as PgAmmDetail<C>);
    const [tradeFloat, setTradeFloat] = React.useState<TradeFloat | undefined>(undefined);
    const [pair, setPair] = React.useState<{ coinAInfo: CoinInfo<C> | undefined, coinBInfo: CoinInfo<C> | undefined }>({
        coinAInfo: undefined,
        coinBInfo: undefined,
    });
    const [pairHistory, setPairHistory] = React.useState<ammHistoryItem[]>([])
    const [awardList, setAwardLsit] = React.useState<AwardItme[]>([])

    const getAwardList = React.useCallback(async () => {
        if (LoopringAPI.ammpoolAPI) {
            const result = await LoopringAPI.ammpoolAPI.getLiquidityMiningUserHistory({
                accountId,
                start: 0,
                end: Number(moment()),
            })
            if (result && result.userMiningInfos) {
                const formattedList = result.userMiningInfos.map(o => ({
                    start: moment(o.start).format('YYYY/MM/DD'),
                    end: moment(o.end).format('YYYY/MM/DD'),
                    market: o.market,
                    accountId: o.account_id,
                    awardList: o.awards.map(item => {
                        const market = tokenMapList.find(o => o[1].tokenId === item.tokenId)?.[0];
                        return ({
                            token: market,
                            volume: volumeToCount(market as string, item.volume)
                        })
                    })
                }))
                setAwardLsit(formattedList)
            }
        }
    }, [accountId])

    useEffect(() => {
        getAwardList()
    }, [getAwardList])

    const walletLayer2DoIt = React.useCallback((market) => {
        const {walletMap: _walletMap} = makeWalletLayer2();

        setWalletMap(_walletMap as WalletMapExtend<any>)
        if (_walletMap) {
            getUserAmmTransaction()?.then((marketTrades) => {
                let _myTradeArray = makeMyAmmMarketArray(market, marketTrades)
                setMyAmmMarketArray(_myTradeArray ? _myTradeArray : [])
            })
        }
        return _walletMap
    }, [makeWalletLayer2, getUserAmmTransaction, makeMyAmmMarketArray, marketArray, pair])

    const getPairList = React.useCallback(async () => {
        if (LoopringAPI.exchangeAPI && coinPairInfo.coinA && coinPairInfo.coinB) {
            const {myCoinA, myCoinB} = coinPairInfo
            const market = `${myCoinA?.name}-${myCoinB?.name}`
            const ammList = await LoopringAPI.exchangeAPI.getMixCandlestick({
                market: market,
                interval: TradingInterval.d1,
                limit: 30
            })
            const formattedPairHistory = ammList.candlesticks.map(o => ({
                ...o,
                timeStamp: o.timestamp,
                date: moment(o.timestamp).format('MMM DD')
            })).sort((a, b) => a.timeStamp - b.timeStamp)
            setPairHistory(formattedPairHistory)
        }
    }, [coinPairInfo])

    React.useEffect(() => {
        getPairList()
    }, [getPairList])

    React.useEffect(() => {
        const coinKey = match?.params.symbol ?? undefined;
        let _tradeFloat: Partial<TradeFloat> = {}
        const [, coinA, coinB] = coinKey.match(/(\w+)-(\w+)/i)
        let {
            amm,
            market
        } = getExistedMarket(marketArray, coinA, coinB);

        const _coinPairInfo = makeAmmDetailExtendsActivityMap({ammMap, coinMap, ammActivityMap, ammKey: amm})
        setCoinPairInfo(_coinPairInfo ? _coinPairInfo : {})

        if (coinMap) {
            setPair({
                coinAInfo: coinMap[ coinA ],
                coinBInfo: coinMap[ coinB ]
            })
        }

        // let _walletMap: WalletMapExtend<C>|undefined = undefined
        if (walletLayer2) {
            walletLayer2DoIt(market);
        }

        if (amm && market && ammMap) {
            //TODO should add it into websocket
            getAmmMap();
            let apiList = [
                pairDetailBlock({coinKey: market, ammKey: amm, ammMap}),
                // LoopringAPI.ammpoolAPI.getAmmPoolSnapshot({poolAddress: ammMap[ ammKey ].address}),
                // LoopringAPI.exchangeAPI.getMixTicker({market: coinKey})])
            ];
            // @ts-ignore
            Promise.all([...apiList]).then(
                ([{ammPoolsBalance, tickMap}
                     //  ,ammUserRewardMap
                 ]: any[]) => {
                    if (tokenMap) {
                        const _snapShotData = {
                            tickerData: tickMap[ market ],
                            ammPoolsBalance: ammPoolsBalance,
                        }
                        _tradeFloat = makeTickView(tickMap[ market ] ? tickMap[ market ] : {})
                        setTradeFloat(_tradeFloat as TradeFloat);
                        setCoinPairInfo({..._coinPairInfo})
                        setSnapShotData(_snapShotData)

                    }
                }).catch((error) => {
                console.log(error);
                throw  Error
            })
        }

    }, []);

    // React.useEffect(() => {
    //     const {market} = getExistedMarket(marketArray, pair.coinAInfo?.simpleName as string, pair.coinBInfo?.simpleName as string);
    //     if (market && snapShotData && snapShotData.ammPoolsBalance && walletLayer2Status === SagaStatus.UNSET) {
    //         const _walletMap = walletLayer2DoIt(market);
    //         const _myAmm: MyAmmLP<C> = makeMyAmmWithSnapshot(market, _walletMap, ammUserRewardMap, snapShotData);
    //         setMyAmm(_myAmm)
    //         // case "DONE":
    //         //             walletLayer2State.statusUnset();
    //
    //         //         break;
    //         //     default:
    //         //         break;
    //         //
    //         // }
    //     }
    // }, [walletLayer2Status])
    const  walletLayer2Callback= React.useCallback(()=>{
        const {market} = getExistedMarket(marketArray, pair.coinAInfo?.simpleName as string, pair.coinBInfo?.simpleName as string);
        if (market && snapShotData && snapShotData.ammPoolsBalance ) {
            const _walletMap = walletLayer2DoIt(market);
            const _myAmm: MyAmmLP<C> = makeMyAmmWithSnapshot(market, _walletMap, ammUserRewardMap, snapShotData);
            setMyAmm(_myAmm);
        }
    },[])
    useWalletHook({walletLayer2Callback})


    React.useEffect(() => {
        const {market} = getExistedMarket(marketArray, pair.coinAInfo?.simpleName as string, pair.coinBInfo?.simpleName as string);
        if (useUserRewardsStatus === SagaStatus.UNSET && market) {
            // const {userRewardsMap} = store.getState().userRewardsMap
            setAmmUserRewardMap(userRewardsMap)
            const _myAmm: MyAmmLP<C> = makeMyAmmWithSnapshot(market, walletMap, ammUserRewardMap, snapShotData);
            setMyAmm(_myAmm);
        }

    }, [useUserRewardsStatus])

    React.useEffect(() => {
        if (ammMapStatus === SagaStatus.UNSET && ammMap && pair.coinAInfo?.simpleName && pair.coinBInfo?.simpleName) {
            const _coinPairInfo = makeAmmDetailExtendsActivityMap(
                {
                    ammMap,
                    coinMap,
                    ammActivityMap,
                    ammKey: 'AMM-' + pair.coinAInfo.simpleName + pair.coinBInfo.simpleName
                })
            setCoinPairInfo({
                ...coinPairInfo, ..._coinPairInfo,
                tradeFloat: coinPairInfo.tradeFloat
            })

        }
    }, [ammMapStatus])


    return {
        walletMap,
        myAmm,
        // tickerData,
        coinPairInfo,
        snapShotData,
        // ammPoolsBalance,
        pair,
        tradeFloat,
        ammMarketArray,
        myAmmMarketArray,
        pairHistory,
        awardList,
    }
}