import { StateBase } from '@loopring-web/common-resources';
import * as loopring_defs from 'loopring-sdk/dist/defs/loopring_defs';

export type WalletLayer2Map<R extends { [ key: string ]: any }> = {
    [key in keyof R]: loopring_defs.UserBalanceInfo;
}
export type WalletLayer2States = {
    walletLayer2?: WalletLayer2Map<any> | undefined,
} & StateBase