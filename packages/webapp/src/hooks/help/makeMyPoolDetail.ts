import { AmmDetailStore } from '../../stores/Amm/AmmMap';
import { AmmPoolSnapshot } from 'loopring-sdk';
import { makeMyAmmWithSnapshot, makeMyAmmWithStat } from './makeUIAmmActivityMap';
import { AmmUserRewardMap } from 'loopring-sdk/dist/defs/loopring_defs';
import { WalletMapExtend } from './makeWallet';

export const makeMyPoolRowWithSnapShot = <T extends { [ key: string ]: any }>({market,ammSnapShot,walletMap,ammUserRewardMap}: {
    market:string
    ammSnapShot: AmmPoolSnapshot,
    walletMap: WalletMapExtend<T>
    ammUserRewardMap:AmmUserRewardMap|undefined
}) => {

    return makeMyAmmWithSnapshot(market,walletMap, ammUserRewardMap, {
        ammPoolsBalance: ammSnapShot
    })
}

                                                                        
export const makeMyPoolRowWithPoolState = <T extends { [ key: string ]: any }>({market,ammDetail,walletMap,ammUserRewardMap}: {
    market:string
    ammDetail: AmmDetailStore<T>,
    walletMap: WalletMapExtend<T>
    ammUserRewardMap:AmmUserRewardMap|undefined
}) => {
    if(walletMap && ammDetail){
        return makeMyAmmWithStat (market,walletMap, ammUserRewardMap, ammDetail)
    }
    return undefined
}