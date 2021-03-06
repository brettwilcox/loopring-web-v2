import { TickerData, toBig } from 'loopring-sdk';
import store from '../../stores';
import { FloatTag,TradeFloat } from '@loopring-web/common-resources';
import { volumeToCountAsBigNumber } from './volumeToCount';
import { Ticker, TickerMap } from '../../stores/ticker';
import { LoopringMap } from 'loopring-sdk/dist/defs/loopring_defs';
import { VolToNumberWithPrecision } from '../../utils/formatter_tool';

export const makeTickView = (tick: TickerData) => {
    // const {forex} = store.getState().system;

    const {faitPrices, forex} = store.getState().system;
    const floatTag = (isNaN(tick.close) || isNaN(tick.open))  || tick.open === tick.close ? FloatTag.none :
        tick.close > tick.open ? FloatTag.increase : FloatTag.decrease
    let _tradeFloat: Partial<TradeFloat> = {
        change: (tick.close - tick.open) / tick.open,
        timeUnit: '24h',
        priceYuan:  0,
        priceDollar: 0,
        floatTag,
        reward: 0,
        close: isNaN(tick.close) ? undefined : tick.close,
        high: tick.high === 0 ? undefined : tick.high,
        low: tick.low === 0 ? undefined : tick.low,

        // APY: 0,
    }
    if (faitPrices && forex && tick.close) {
        const volume = VolToNumberWithPrecision(tick.base_token_volume, tick.base as string)
        // const priceDollar = toBig(tiem).times(faitPrices[ tick.base as string ] ? faitPrices[ tick.base as string ].price : 0);
        // const priceYuan = priceDollar.times(forex);
        const closeDollar = toBig(tick.close).times(faitPrices[ tick.quote as string ] ? faitPrices[ tick.quote as string ].price : 0);
        const closeYuan = closeDollar.times(forex);
        const qPrice = faitPrices[tick.quote as string].price?    faitPrices[tick.quote as string].price:0;
        _tradeFloat = {
            ..._tradeFloat,
            changeDollar: toBig(tick.close - tick.open).times( qPrice ).toNumber(),
            changeYuan: toBig(tick.close - tick.open).times( qPrice ).times(forex).toNumber(),
            volume: volume?Number(volume):undefined,
            closeDollar:closeDollar.toNumber(),
            closeYuan:closeYuan.toNumber(),
        }
    }
    return _tradeFloat;
}
export  const makeTickerMap =  <R extends {[key:string]:any}>({tickerMap}:{tickerMap:LoopringMap<TickerData>}):TickerMap<{[key:string]:any}>=>{
    const {faitPrices, forex} = store.getState().system;
    return Reflect.ownKeys(tickerMap).reduce((prev, key) => {
        const item: TickerData = tickerMap[ key as any ];
        if (item && item.base && forex && faitPrices && (faitPrices[ item.base ] || faitPrices[ 'USDT' ])) {
            const volume = VolToNumberWithPrecision(item.base_token_volume, item.base as string)
            //FIX: DIE is not in faitPrices
            const priceDollar = toBig(volume?volume:0).times(faitPrices[ item.base ] ? faitPrices[ item.base ].price : faitPrices[ 'USDT' ].price);
            const priceYuan = priceDollar?.times(forex);
            const change = item.change && item.change !== 0 ? item.change * 100 : undefined;

            prev[ key as keyof R] = {
                // ...item,
                timeUnit: '24h',
                priceDollar: priceDollar?.toNumber() === 0 ? undefined : priceDollar?.toNumber(),
                priceYuan: priceYuan?.toNumber() === 0 ? undefined : priceYuan?.toNumber(),
                volume: volume?Number(volume):undefined,
                floatTag: item.close > item.open ? 'increase' : 'decrease',
                change: change,
                close: isNaN(item.close) ? undefined : item.close,
                high: item.high === 0 ? undefined : item.high,
                low: item.low === 0 ? undefined : item.low,
                // APY: 0,
                reward: 0,
                rewardToken: '',
                __rawTicker__: item,
            } as Ticker;
        }
        return prev
    }, {} as TickerMap<R>)
}
