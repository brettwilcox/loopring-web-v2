import { StateBase, TradeFloat } from '@loopring-web/common-resources';
import { TickerData } from 'loopring-sdk/dist/defs/loopring_defs';

export type Ticker = TradeFloat & {
    open: number,
    high: number,
    low: number,
    close: number,
    change: number,
    volume: number,
    __rawTicker__: TickerData
};
export type TickerMap<R extends { [ key: string ]: any }> = {
    [key in keyof R]: Ticker
}
export type TickerStates<C = { [ key: string ]: any }> = {
    tickerMap?: TickerMap<C>
} & StateBase


