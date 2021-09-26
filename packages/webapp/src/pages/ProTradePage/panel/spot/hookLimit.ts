import React from 'react';
import { useToast } from 'hooks/common/useToast';
import { IBData, MarketType, myLog, } from '@loopring-web/common-resources';
import { LimitTradeData, TradeBaseType, TradeBtnStatus, TradeProType } from '@loopring-web/component-lib';
import { usePageTradePro } from 'stores/router';
import { walletLayer2Service } from 'services/socket';
import { useSubmitBtn } from './hookBtn';
import { getPriceImpactInfo, PriceLevel, usePlaceOrder } from 'hooks/common/useTrade';
import { useTokenMap } from 'stores/token';
import { useTranslation } from 'react-i18next';
import store from 'stores';
import * as sdk from 'loopring-sdk';
import { LoopringAPI } from 'api_wrapper';
import * as _ from 'lodash'
import { BIGO } from 'defs/common_defs';

export const useLimit = <C extends { [key: string]: any }>(market: MarketType): {
    [key: string]: any;
    // market: MarketType|undefined;
    // marketTicker: MarketBlockProps<C> |undefined,
} => {
    const {
        pageTradePro,
        updatePageTradePro,
        // __DAYS__,
        __SUBMIT_LOCK_TIMER__,
        // __TOAST_AUTO_CLOSE_TIMER__
    } = usePageTradePro();
    const { marketMap } = useTokenMap();
    const { t } = useTranslation('common');
    const [alertOpen, setAlertOpen] = React.useState<boolean>(false);
    // @ts-ignore
    const [, baseSymbol, quoteSymbol] = market.match(/(\w+)-(\w+)/i);
    const walletMap = pageTradePro.tradeCalcProData.walletMap ?? {};
    const marketPrecision = marketMap[market].precisionForPrice;
    const [limitTradeData, setLimitTradeData] = React.useState<LimitTradeData<IBData<any>>>(
        {
            base: {
                belong: baseSymbol,
                balance: walletMap ? walletMap[baseSymbol as string]?.count : 0,
            } as IBData<any>,
            quote: {
                belong: quoteSymbol,
                balance: walletMap ? walletMap[quoteSymbol as string]?.count : 0,
            } as IBData<any>,
            price: {
                belong: pageTradePro.tradeCalcProData.coinQuote,
                tradeValue: (pageTradePro.market === market && pageTradePro.ticker) ? pageTradePro.ticker.close ? pageTradePro.ticker.close.toFixed(marketPrecision) : pageTradePro?.depth?.mid_price.toFixed(marketPrecision) : 0
            } as IBData<any>,
            type: pageTradePro.tradeType ?? TradeProType.buy
        }
    )
    const [isLimitLoading, setIsLimitLoading] = React.useState(false)

    const { toastOpen, setToastOpen, closeToast } = useToast();

    React.useEffect(() => {
        resetTradeData(pageTradePro.tradeType)
    }, [pageTradePro.market,
    pageTradePro.tradeCalcProData.walletMap])

    React.useEffect(() => {
        // resetTradeData(limitTradeData.type)
        if (pageTradePro.defaultPrice) {
            setLimitTradeData((state) => {
                return {
                    ...state,
                    price: {
                        ...state.price,
                        tradeValue: pageTradePro.defaultPrice ? pageTradePro.defaultPrice : (pageTradePro.market === market && pageTradePro.ticker) ? pageTradePro.ticker.close ? pageTradePro.ticker.close.toFixed(marketPrecision) : pageTradePro?.depth?.mid_price.toFixed(marketPrecision) : 0
                    } as IBData<any>,
                }
            })
        }

    }, [pageTradePro.defaultPrice])

    const resetTradeData = React.useCallback((type?: TradeProType) => {
        const pageTradePro = store.getState()._router_pageTradePro.pageTradePro;
        const walletMap = pageTradePro.tradeCalcProData.walletMap ?? {};
        // const marketPrecision =  marketMap[market].precisionForPrice;
        // @ts-ignore
        const [, baseSymbol, quoteSymbol] = market.match(/(\w+)-(\w+)/i);
        setLimitTradeData((state) => {
            return {
                ...state,
                type: type ?? state.type,
                base: {
                    belong: baseSymbol,
                    balance: walletMap ? walletMap[baseSymbol as string]?.count : 0,
                } as IBData<any>,
                quote: {
                    belong: quoteSymbol,
                    balance: walletMap ? walletMap[quoteSymbol as string]?.count : 0,
                } as IBData<any>,
                price: {
                    belong: quoteSymbol,
                    tradeValue: (pageTradePro.market === market && pageTradePro.ticker) ?
                        pageTradePro.ticker.close ? pageTradePro.ticker.close.toFixed(marketPrecision) : pageTradePro?.depth?.mid_price.toFixed(marketPrecision) : 0
                } as IBData<any>,
            }
        });

        updatePageTradePro({
            market, defaultPrice: undefined, tradeCalcProData: {
                ...pageTradePro.tradeCalcProData,
                fee: undefined,
                minimumReceived: undefined,
                priceImpact: undefined,
                priceImpactColor: 'inherit',

            }
        })
    }, [pageTradePro, marketPrecision, market])

    const limitSubmit = React.useCallback(async (event: MouseEvent, isAgree?: boolean) => {
        myLog('limitSubmit:', event, isAgree)
        isAgree = true
        const pageTradePro = store.getState()._router_pageTradePro.pageTradePro;
        const { limitCalcTradeParams, request, tradeCalcProData } = pageTradePro;
        setAlertOpen(false)
        if (isAgree && LoopringAPI.userAPI && request) {
            setIsLimitLoading(true)
            try {

                //TODO maker order
                myLog('try to submit order', limitCalcTradeParams, tradeCalcProData)

                const account = store.getState().account

                const req: sdk.GetNextStorageIdRequest = {
                    accountId: account.accountId,
                    sellTokenId: request.sellToken.tokenId as number
                }

                const storageId = await LoopringAPI.userAPI.getNextStorageId(req, account.apiKey)

                const requestClone = _.cloneDeep(request)
                requestClone.storageId = storageId.orderId

                myLog(requestClone)

                const response = await LoopringAPI.userAPI.submitOrder(requestClone, account.eddsaKey.sk, account.apiKey)

                myLog(response)

                if (!response?.hash) {
                    setToastOpen({ open: true, type: 'error', content: t('labelSwapFailed') })
                    myLog(response?.resultInfo)
                } else {
                    await sdk.sleep(__SUBMIT_LOCK_TIMER__)

                    const resp = await LoopringAPI.userAPI.getOrderDetails({
                        accountId: account.accountId,
                        orderHash: response.hash
                    }, account.apiKey)

                    myLog('-----> resp:', resp)

                    if (resp.orderDetail?.status !== undefined) {
                        myLog('resp.orderDetail:', resp.orderDetail)
                        switch (resp.orderDetail?.status) {
                            case sdk.OrderStatus.cancelled:
                                const baseAmount = sdk.toBig(resp.orderDetail.volumes.baseAmount)
                                const baseFilled = sdk.toBig(resp.orderDetail.volumes.baseFilled)
                                const quoteAmount = sdk.toBig(resp.orderDetail.volumes.quoteAmount)
                                const quoteFilled = sdk.toBig(resp.orderDetail.volumes.quoteFilled)
                                const percentage1 = baseAmount.eq(BIGO) ? 0 : baseFilled.div(baseAmount).toNumber()
                                const percentage2 = quoteAmount.eq(BIGO) ? 0 : quoteFilled.div(quoteAmount).toNumber()
                                myLog('percentage1:', percentage1, ' percentage2:', percentage2)
                                if (percentage1 === 0 || percentage2 === 0) {
                                    setToastOpen({ open: true, type: 'warning', content: t('labelSwapCancelled') })
                                } else {
                                    setToastOpen({ open: true, type: 'success', content: t('labelSwapSuccess') })
                                }
                                break
                            case sdk.OrderStatus.processed:
                                setToastOpen({ open: true, type: 'success', content: t('labelSwapSuccess') })
                                break
                            default:
                                setToastOpen({ open: true, type: 'error', content: t('labelSwapFailed') })
                        }
                    }

                    walletLayer2Service.sendUserUpdate()
                }


                setIsLimitLoading(false)
            } catch (reason) {
                sdk.dumpError400(reason)
                setToastOpen({ open: true, type: 'error', content: t('labelSwapFailed') })

            }
            setIsLimitLoading(false)
        }
    }, [])

    const { makeLimitReqInHook } = usePlaceOrder()
    const onChangeLimitEvent = React.useCallback((tradeData: LimitTradeData<IBData<any>>, formType: TradeBaseType) => {
        // myLog(`onChangeLimitEvent tradeData:`, tradeData, 'formType', formType)

        const pageTradePro = store.getState()._router_pageTradePro.pageTradePro

        if (formType === TradeBaseType.tab) {
            resetTradeData(tradeData.type)
            updatePageTradePro({ market, tradeType: tradeData.type })
        } else {

            // {isBuy, price, amountB or amountS, (base, quote / market), feeBips, takerRate, }

            let amountBase = formType === TradeBaseType.base ? tradeData.base.tradeValue : undefined
            let amountQuote = formType === TradeBaseType.quote ? tradeData.quote.tradeValue : undefined

            if (formType === TradeBaseType.price) {
                amountBase = tradeData.base.tradeValue !== undefined ? tradeData.base.tradeValue : undefined
                amountQuote = amountBase !== undefined ? undefined : tradeData.quote.tradeValue !== undefined ? tradeData.quote.tradeValue : undefined
            }

            // myLog(`tradeData price:${tradeData.price.tradeValue}`, tradeData.type, amountBase, amountQuote)

            const { limitRequest, calcTradeParams } = makeLimitReqInHook({
                isBuy: tradeData.type === 'buy',
                base: tradeData.base.belong,
                quote: tradeData.quote.belong,
                price: tradeData.price.tradeValue as number,
                depth: pageTradePro.depth,
                amountBase,
                amountQuote,
            })

            // myLog('limitRequest:', request)
            //TODO: fee update
            updatePageTradePro({
                market,
                request: limitRequest as sdk.SubmitOrderRequestV3,
                limitCalcTradeParams: calcTradeParams,
                tradeCalcProData: {
                    ...pageTradePro.tradeCalcProData,
                    fee: 'TODO'
                }
            })
            setLimitTradeData((state) => {
                return {
                    ...state,
                    price: {
                        ...state.price,
                        tradeValue: tradeData.price.tradeValue
                    },
                    base: {
                        ...state.base,
                        tradeValue: calcTradeParams?.baseVolShow as number
                    },
                    quote: {
                        ...state.quote,
                        tradeValue: calcTradeParams?.quoteVolShow as number
                    }

                }
            })
        }
        // if (formType === TradeBaseType.slippage) {
        //     return
        // }


    }, [setLimitTradeData])
    const handlePriceError = React.useCallback((data: IBData<any>): { error: boolean, message?: string | React.ElementType<HTMLElement> } | undefined => {

        const tradeValue = data.tradeValue
        if (tradeValue) {
            const [, precision] = tradeValue.toString().split('.');
            if (precision && precision.length > marketMap[market].precisionForPrice) {
                return {
                    error: true,
                    message: t('labelErrorPricePrecisionLimit', {
                        symbol: data.belong,
                        decimal: marketMap[market].precisionForPrice
                    })
                    //labelErrorPricePrecisionLimit:'{{symbol}} price only {{decimal}} decimals allowed',
                    //labelErrorPricePrecisionLimit:'限价 {{symbol}}，最多可保留小数点后 {{decimal} 位'

                }
            }
            return undefined
        } else {
            return undefined
        }


    }, [])
    const {
        btnStatus: tradeLimitBtnStatus,
        onBtnClick: limitBtnClick,
        btnLabel: tradeLimitI18nKey,
        btnStyle: tradeLimitBtnStyle
    } = useSubmitBtn({
        availableTradeCheck: () => {
            return { label: '', tradeBtnStatus: TradeBtnStatus.AVAILABLE }
        },
        isLoading: isLimitLoading,
        submitCallback: limitSubmit
    })
    const onSubmitBtnClick = React.useCallback(() => {
        const { priceLevel } = getPriceImpactInfo(pageTradePro.calcTradeParams)

        switch (priceLevel) {
            case PriceLevel.Lv1:
                setAlertOpen(true)
                break
            case PriceLevel.Lv2:
                // setConfirmOpen(true)
                break
            default:
                limitSubmit(undefined as any, true);
                break
        }

    }, [])
    return {
        // alertOpen,
        // confirmOpen,
        toastOpen,
        closeToast,
        limitSubmit: onSubmitBtnClick,
        limitAlertOpen: alertOpen,
        resetLimitData: resetTradeData,
        isLimitLoading: false,
        limitTradeData,
        onChangeLimitEvent,
        tradeLimitI18nKey,
        tradeLimitBtnStatus,
        limitBtnClick,
        handlePriceError,
        tradeLimitBtnStyle,
        // marketTicker,
    }
}