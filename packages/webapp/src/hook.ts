import React from 'react';
import { useCustomDCEffect } from 'hooks/common/useCustomDCEffect';
import { useSystem } from './stores/system';
import { ChainId, sleep } from 'loopring-sdk';
import { useAmmMap } from './stores/Amm/AmmMap';
import { SagaStatus } from '@loopring-web/common-resources';
import { useTokenMap } from './stores/token';
import { useAccount } from './stores/account/hook';
import { connectProvides, walletServices } from '@loopring-web/web3-provider';
import { useAccountInit } from './hookAccountInit';
import { useAmmActivityMap } from './stores/Amm/AmmActivityMap';
import { useTicker } from './stores/ticker';
import { checkAccount } from './services/account/checkAccount';
import { useUserRewards } from './stores/userRewards';
// import { statusUnset as accountStatusUnset } from './stores/account';

/**
 * @description
 * @step1 subscribe Connect hook
 * @step2 check the session storage ? choose the provider : none provider
 * @step3 decide china Id by step2
 * @step4 prepare the static date (tokenMap, ammMap, faitPrice, gasPrice, forex, Activities ...)
 * @step5 launch the page
 * @todo each step has error show the ErrorPage , next version for service maintain page.
 */

export function useInit() {
    const [state, setState] = React.useState<keyof typeof SagaStatus>('PENDING')
    // const {updateWalletLayer1, resetLayer1, status:walletLayer1Status,statusUnset:wallet1statusUnset} = useWalletLayer1()
    // const {updateWalletLayer2, resetLayer2, status:walletLayer2Status,statusUnset:wallet2statusUnset } = useWalletLayer2();
    const {account, updateAccount, resetAccount, status:accountStatus,statusUnset:accountStatusUnset} = useAccount();
    const {status: tokenMapStatus, statusUnset: tokenMapStatusUnset}  = useTokenMap();
    const {status: ammMapStatus, statusUnset: ammMapStatusUnset}  = useAmmMap();
    const {updateSystem, status: systemStatus, statusUnset: systemStatusUnset} = useSystem();
    const {status:ammActivityMapStatus,statusUnset:ammActivityMapStatusUnset}  = useAmmActivityMap();
    const {status: userRewardsStatus, statusUnset: userRewardsUnset}  = useUserRewards();
    const {status: tickerStatus,statusUnset: tickerStatusUnset} = useTicker();

    useCustomDCEffect(async () => {
        // TODO getSessionAccount infor

        if (account.accAddress !== '' && account.connectName && account.connectName !== 'unknown') {
            try {
                await connectProvides[ account.connectName ](account.accAddress);
                updateAccount({})
                if (connectProvides.usedProvide && connectProvides.usedWeb3) {

                    // @ts-ignore
                    let chainId = Number(connectProvides.usedProvide?.connector?.chainId) ??  Number(await connectProvides.usedWeb3.eth.getChainId())
                    if( ChainId[chainId] === undefined) {
                        chainId = account._chainId && account._chainId !=='unknown'? account._chainId  :ChainId.MAINNET
                    }

                    updateSystem({chainId:chainId as any})
                    return
                }
            } catch (error) {
                //await resetAccount({shouldUpdateProvider:true});
                walletServices.sendDisconnect('',`error at init loading  ${error}, disconnect`)
                const chainId = account._chainId && account._chainId !=='unknown'? account._chainId  :ChainId.MAINNET
                updateSystem({chainId})
            }
        } else  {
            if(account.accAddress === '' ||  account.connectName === 'unknown' ){
                resetAccount() 
            }
            const chainId = account._chainId && account._chainId !=='unknown'? account._chainId  :ChainId.MAINNET
            updateSystem({chainId})
        }

    }, [])
    React.useEffect(() => {
        switch (systemStatus) {
            case SagaStatus.PENDING:
                if(state!==SagaStatus.PENDING){
                    setState(SagaStatus.PENDING)
                }
                break
            case SagaStatus.ERROR:
                systemStatusUnset();
                setState('ERROR')
                //TODO show error at button page show error  some retry dispat again
                break;
            case SagaStatus.DONE:
                systemStatusUnset();
                break;
            default:
                break;
        }
    }, [systemStatus]);
    React.useEffect(() => {
        switch (tokenMapStatus) {
            case SagaStatus.ERROR:
                tokenMapStatusUnset();
                setState('ERROR')
                break;
            case SagaStatus.DONE:
                tokenMapStatusUnset();
                break;
            default:
                break;
        }
        switch (ammMapStatus) {
            case SagaStatus.ERROR:
                ammMapStatusUnset();
                setState('ERROR')
                break;
            case SagaStatus.DONE:
                ammMapStatusUnset();
                break;
            default:
                break;
        }
        if(tokenMapStatus === SagaStatus.UNSET && ammMapStatus ===  SagaStatus.UNSET ){
            setState('DONE')
        }
    }, [tokenMapStatus,ammMapStatus])
    React.useEffect(() => {
        switch (ammActivityMapStatus) {
            case SagaStatus.ERROR:
                ammActivityMapStatusUnset();
                // setState('ERROR')
                //TODO: show error at button page show error  some retry dispath again
                break;
            case SagaStatus.DONE:
                ammActivityMapStatusUnset();
                break;
            default:
                break;
        }
    }, [ammActivityMapStatus])
    React.useEffect(() => {
        switch (tickerStatus) {
            case SagaStatus.ERROR:
                console.log("ERROR", 'get ticker error,ui');
                tickerStatusUnset()
                break;
            case SagaStatus.PENDING:
                break;
            case SagaStatus.DONE:
                tickerStatusUnset();
                break;
            default:
                break;
        }
    }, [tickerStatus])
    React.useEffect(() => {
        switch (userRewardsStatus) {
            case SagaStatus.ERROR:
                console.log("ERROR", 'get userRewards');
                userRewardsUnset()
                break;
            case SagaStatus.PENDING:
                break;
            case SagaStatus.DONE:
                userRewardsUnset();
                break;
            default:
                break;
        }
    }, [userRewardsStatus])

    useAccountInit({state})
    // React.useEffect(() => {
    //     if (tokenMapStatus === SagaStatus.ERROR|| tokenState.status === "ERROR") {
    //         //TODO: solve errorx
    //         ammMapState.statusUnset();
    //
    //         setState('ERROR');
    //     } else if(){
    //         ammMapState.statusUnset();
    //         tokenState.statusUnset();
    //     }
    //     if (ammMapState.status === "DONE" && tokenState.status === "DONE") {
    //
    //         setState('DONE');
    //     }
    // }, [ammMapStatus])


    return {
        state,
    }
}


