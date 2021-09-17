import { AccountStatus, CoinMap, IBData, MarketType, myLog, TradeCalcData } from '@loopring-web/common-resources';
import React from 'react';
import { useToast } from 'hooks/common/useToast';
import { LoopringAPI } from 'api_wrapper';
import * as sdk from 'loopring-sdk';
import { getTimestampDaysLater } from 'utils/dt_tools';
import { OrderStatus, sleep } from 'loopring-sdk';
import { walletLayer2Service } from 'services/socket';
import {
    LimitTradeData,
    MarketTradeData,
    SwapData,
    SwapTradeData,
    TradeBaseType,
    TradeProType, useSettings
} from '@loopring-web/component-lib';
import { usePageTradePro } from 'stores/router';
import { useAccount } from 'stores/account';
import { useTokenMap } from 'stores/token';
import { useSystem } from 'stores/system';
import { useTranslation } from 'react-i18next';

export const useMarket = <C extends { [ key: string ]: any }>(market:MarketType):{
    [key: string]: any;
    // market: MarketType|undefined;
    // marketTicker: MarketBlockProps<C> |undefined,
} =>{
    const {t} = useTranslation();
    const {tokenMap,marketCoins,coinMap} = useTokenMap();
    const [alertOpen, setAlertOpen] = React.useState<boolean>(false);
    const [confirmOpen, setConfirmOpen] = React.useState<boolean>(false);
    const {toastOpen, setToastOpen, closeToast} = useToast();
    const {account, status: accountStatus} = useAccount();
    const {slippage} =useSettings()
    // const [marketTradeData, setMarketTradeData] = React.useState<MarketTradeData<IBData<C>> | undefined>(undefined);
    const {
        pageTradePro,
        updatePageTradePro,
        __DAYS__,
        __SUBMIT_LOCK_TIMER__,
        __TOAST_AUTO_CLOSE_TIMER__
    } = usePageTradePro();    // @ts-ignore
    const [, baseSymbol, quoteSymbol] = market.match(/(\w+)-(\w+)/i);
    const walletMap = pageTradePro.tradeCalcProData?.walletMap ?? {}

    const [marketTradeData, setMarketTradeData] = React.useState<MarketTradeData<IBData<any>>>(
        pageTradePro.market === market ? {
            base: {
                belong: baseSymbol,
                balance: walletMap ? walletMap[ baseSymbol as string ]?.count : 0,
            } as IBData<any>,
            quote: {
                belong: quoteSymbol,
                balance: walletMap ? walletMap[ quoteSymbol as string ]?.count : 0,
            } as IBData<any>,
            slippage: slippage&&slippage!=='N'?slippage:0.5,
            type: TradeProType.sell
        } : {
            base: {belong: baseSymbol} as IBData<any>,
            quote: {belong: quoteSymbol} as IBData<any>,
            slippage: slippage&&slippage!=='N'?slippage:0.5,
            type: TradeProType.sell
        }
    )
    const {exchangeInfo} = useSystem();


    const [isMarketLoading, setIsMarketLoading] = React.useState(false)


    const onChangeMarketEvent = async (tradeData: MarketTradeData<IBData<any>>, formType: TradeBaseType): Promise<void> => {
        myLog(`onChangeMarketEvent tradeData:`, tradeData, 'formType',formType)

        myLog('handleSwapPanelEvent...', tradeData)

        // const {tradeData} = swapData
        // resetSwap(swapType, tradeData)

    }

    const marketSubmit = React.useCallback(async (event: MouseEvent, isAgree?: boolean) => {
        let {calcTradeParams, tradeChannel, orderType,tradeCalcProData, totalFee} = pageTradePro;
        setAlertOpen(false)
        setConfirmOpen(false)

        if (isAgree) {

            setIsMarketLoading(true);
            if (!LoopringAPI.userAPI || !tokenMap || !exchangeInfo || !calcTradeParams
                || account.readyState !== AccountStatus.ACTIVATED) {

                setToastOpen({open: true, type: 'error', content: t('labelSwapFailed')})
                setIsMarketLoading(false)

                return
            }

            const baseToken = tokenMap[ marketTradeData?.base.belong as string ]
            const quoteToken = tokenMap[ marketTradeData?.quote.belong as string ]

            const request: sdk.GetNextStorageIdRequest = {
                accountId: account.accountId,
                sellTokenId: baseToken.tokenId
            }

            const storageId = await LoopringAPI.userAPI.getNextStorageId(request, account.apiKey)

            try {


                const request: sdk.SubmitOrderRequestV3 = {
                    exchange: exchangeInfo.exchangeAddress,
                    accountId: account.accountId,
                    storageId: storageId.orderId,
                    sellToken: {
                        tokenId: baseToken.tokenId,
                        volume: calcTradeParams.amountS as string
                    },
                    buyToken: {
                        tokenId: quoteToken.tokenId,
                        volume: calcTradeParams.amountBOutSlip.minReceived as string
                    },
                    allOrNone: false,
                    validUntil: getTimestampDaysLater(__DAYS__),
                    maxFeeBips: parseInt(totalFee as string),
                    fillAmountBOrS: false, // amm only false
                    orderType,
                    tradeChannel,
                    eddsaSignature: '',
                }

                myLog(request)

                const response = await LoopringAPI.userAPI.submitOrder(request, account.eddsaKey.sk, account.apiKey)

                myLog(response)

                if (!response?.hash) {
                    setToastOpen({open: true, type: 'error', content: t('labelSwapFailed')})
                    myLog(response?.resultInfo)
                } else {
                    await sleep(__TOAST_AUTO_CLOSE_TIMER__)

                    const resp = await LoopringAPI.userAPI.getOrderDetails({
                        accountId: account.accountId,
                        orderHash: response.hash
                    }, account.apiKey)

                    myLog('-----> resp:', resp)

                    if (resp.orderDetail?.status !== undefined) {
                        switch (resp.orderDetail?.status) {
                            case OrderStatus.cancelled:
                                setToastOpen({open: true, type: 'warning', content: t('labelSwapCancelled')})
                                break
                            case OrderStatus.processed:
                                setToastOpen({open: true, type: 'success', content: t('labelSwapSuccess')})
                                break
                            default:
                                setToastOpen({open: true, type: 'error', content: t('labelSwapFailed')})
                        }
                    }
                    walletLayer2Service.sendUserUpdate()
                    setMarketTradeData((state) => {
                        return {
                            ...state,
                            sell: {...state?.base, tradeValue: 0},
                            buy: {...state?.quote, tradeValue: 0},
                        } as MarketTradeData<IBData<C>>
                    });
                    updatePageTradePro({
                        market: market as MarketType,
                        tradeCalcProData:{
                            ...tradeCalcProData,
                            minimumReceived: undefined,
                            priceImpact: undefined,
                            fee: undefined
                        }
                    })
                    // setTradeCalcData((state) => {
                    //     return {
                    //         ...state,
                    //         minimumReceived: undefined,
                    //         priceImpact: undefined,
                    //         fee: undefined
                    //     }
                    // })
                }
            } catch (reason) {
                sdk.dumpError400(reason)
                setToastOpen({open: true, type: 'error', content: t('labelSwapFailed')})

            }

            // setOutput(undefined)

            await sleep(__SUBMIT_LOCK_TIMER__)

            setIsMarketLoading(false)

        }

    }, [account.readyState, pageTradePro, tokenMap, marketTradeData, setIsMarketLoading, setToastOpen, setMarketTradeData])

    return {
        alertOpen,
        confirmOpen,
        toastOpen,
        closeToast,
        // marketLastCall,
       marketSubmit,
       marketTradeData,
       onChangeMarketEvent
        // marketTicker,
    }
}