import React from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { useCustomDCEffect } from 'hooks/common/useCustomDCEffect'

import { useGetTradingInfo } from 'stores/trading/hook'
import { useActiveWeb3React, } from 'hooks/web3/useWeb3'

import { Lv2Account, } from 'defs/account_defs'

import { AccountStatus, StatusChangeEvent } from 'state_machine/account_machine_spec'

import * as sign_tools from 'loopring-sdk'

import { connectorsByName } from 'defs/web3_defs'

import { ConnectorNames, dumpError400, ExchangeAPI, sleep, UpdateAccountRequestV3, UserAPI, VALID_UNTIL, } from 'loopring-sdk'

import { toHex, toBig, } from 'loopring-sdk'

import { RootState } from 'stores'

import {
    reset, setAccountStatus, setConnectName,
    setConnectNameTemp, setAccountInfo, setEddsaKey, setApikey, setAccAddr,
} from 'stores/account/reducer'

import { AccountMachineSpec, } from 'state_machine/account_machine_spec'

import { buildMachine } from 'state_machine/machine_builder'

import voca from 'voca'
import { usePrevious } from 'react-use'

import Web3 from 'web3'

import { useExchangeAPI, useUserAPI } from 'hooks/exchange/useApi'

import { UserStorage } from 'storage'

import store from 'stores'
import { useWalletLayer1 } from '../walletLayer1';
import { useWalletLayer2 } from '../walletLayer2';
import { useTokenMap } from '../token';
import _ from 'lodash'

export function useWeb3Account() {

    const {
        connector,
        library,
        account,
        chainId,
        active,
        error,
    } = useActiveWeb3React()

    const isConnected: boolean = active && !voca.isBlank(account as string)

    return {
        account,
        connector,
        library,
        chainId,
        active,
        isConnected,
        error,
    }

}

export function useAccount() {

    const account: Lv2Account = useSelector((state: RootState) => state.account)

    const isNoAccount = () => {
        return account.status === AccountStatus.NOACCOUNT
    }

    const isActivated = () => {
        return account.status === AccountStatus.ACTIVATED
    }

    return {
        account,
        isNoAccount,
        isActivated,
        apiKey: account.apiKey,
        eddsaKey: account.eddsaKey,
        accountId: account.accountId,
    }
}

export function useStateMachine() {
    const dispatch = useDispatch()

    const machine = buildMachine(AccountMachineSpec())

    const sendEvent = React.useCallback((account: Lv2Account, event: StatusChangeEvent) => {
        const nextState = machine(account.status, event)
        if (nextState) {
            dispatch(setAccountStatus(nextState))
        }
    }, [machine, dispatch])

    return {
        sendEvent,
    }
}

export function useConnect() {

    const {
        activate,
    } = useActiveWeb3React()

    const { sendEvent } = useStateMachine()

    const dispatch = useDispatch()

    const [activatingConnector, setActivatingConnector] = React.useState<any>()

    const connect = React.useCallback((item_name: ConnectorNames, isSwitch: boolean = false) => {
        const newConnector: any = connectorsByName[item_name]
        setActivatingConnector(newConnector)
        activate(newConnector)
        dispatch(setConnectNameTemp(item_name))

        if (isSwitch) {
            //  console.log('try Connecting... isSwitch Reset')
            sendEvent(store.getState().account, StatusChangeEvent.Reset)
        }

        sendEvent(store.getState().account, StatusChangeEvent.Connecting)

    }, [activate, dispatch, sendEvent])

    return {
        connect,
        activatingConnector,
    }

}

export function useDisconnect() {

    const {
        deactivate,
    } = useActiveWeb3React()

    const dispatch = useDispatch()

    const disconnect = React.useCallback(() => {
        deactivate()
        dispatch(reset(undefined))
        //TODO dispatch wallet info 
    }, [deactivate, dispatch])

    return {
        disconnect,
    }

}

export function useUnlock() {

    const dispatch = useDispatch()

    const { chainId } = useWeb3Account()

    const exchangeApi: ExchangeAPI = useExchangeAPI()

    const userApi: UserAPI = useUserAPI()

    const { tradingInfo } = useGetTradingInfo()

    const { connector, } = useWeb3Account()

    const { sendEvent } = useStateMachine()

    const { resetLayer2 } = useWalletLayer2()

    const lock = React.useCallback(async (account: Lv2Account) => {
        resetLayer2()
        sendEvent(account, StatusChangeEvent.Lock)
    }, [sendEvent])

    const unlock = React.useCallback(async (account: Lv2Account) => {

        const exchangeInfo = store.getState().system.exchangeInfo?.exchangeAddress

        if (!userApi || !exchangeApi || !connector
            || !account.accountId || !exchangeInfo
            || !chainId
            || account.status !== AccountStatus.LOCKED) {
            return
        }

        if (account.status !== AccountStatus.LOCKED) {
            throw Error('unexpected status:' + account.status)
        }

        let event = undefined
        let sk = undefined
        let apikey: any = undefined

        const provider = await connector.getProvider()
        const web3 = new Web3(provider as any)

        try {

            const nonce = account.nonce - 1 < 0 ? 0 : account.nonce - 1

            if (!account.eddsaKey) {
                const eddsaKey = await sign_tools
                    .generateKeyPair(
                        web3,
                        account.accAddr,
                        exchangeInfo,
                        nonce,
                        account.connectName,
                    )
                sk = eddsaKey.sk

            } else {
                sk = account.eddsaKey
            }

            // console.log('useUnlock account:', account, ' sk:', sk)

            apikey = await userApi.getUserApiKey({
                accountId: account.accountId
            }, sk)

            event = StatusChangeEvent.Unlock

        } catch (reason) {
            dumpError400(reason)
            if (reason?.response?.data?.resultInfo?.code === 100001) {

                try {

                    // const req: GetOffchainFeeAmtRequest = {
                    //     accountId: account.accountId,
                    //     requestType: OffchainFeeReqType.UPDATE_ACCOUNT,
                    // }
    
                    // const response = await userApi.getOffchainFeeAmt(req, account.apiKey)

                    const feeMap = {
                        'ETH': '529000000000000',
                        'LRC': '34000000000000000000',
                        'USDT': '7850000',
                        'DAI': '98100000000000000000',
                    }
                    
                    const eddsaKey = await sign_tools
                        .generateKeyPair(
                            web3,
                            account.accAddr,
                            tradingInfo.exchangeInfo?.exchangeAddress as string,
                            account.nonce,
                            account.connectName,
                        )
                    
                    const request: UpdateAccountRequestV3 = {
                        exchange: tradingInfo.exchangeInfo?.exchangeAddress,
                        owner: account.accAddr,
                        accountId: account.accountId,
                        publicKey: { x: eddsaKey.formatedPx, y: eddsaKey.formatedPy },
                        maxFee: { tokenId: 0, volume: feeMap['ETH'] },
                        validUntil: VALID_UNTIL,
                        nonce: account.nonce,
                    }

                    const updateAccountResponse = await userApi.updateAccount(request, web3,
                        chainId, account.connectName, false)

                    console.log('updateAccountResponse:', updateAccountResponse)

                    await sleep(1000)

                } catch (reason2) {
                    dumpError400(reason2)
                }
            }
            event = StatusChangeEvent.Reset
        }

        if (sk) {
            dispatch(setEddsaKey(sk))
        }

        if (apikey?.apiKey) {
            dispatch(setApikey(apikey.apiKey))
        }

        if (event) {
            sendEvent(account, event)
        }

    }
        , [dispatch, sendEvent, exchangeApi, userApi, connector, chainId, tradingInfo.exchangeInfo])

    return {
        lock,
        unlock,
    }
}

async function checkAccountAvailableAsync(exchangeApi: ExchangeAPI, userApi: UserAPI, account: Lv2Account, dispatch: any, sendEvent: any, connector: any, exchangeAddress: string) {

    let accInfo = undefined
    let event = undefined
    let sk = undefined
    let code = undefined
    let apikey: any = undefined

    try {
        accInfo = (await exchangeApi.getAccount({
            owner: account.accAddr
        })).accInfo
        if (accInfo.publicKey && accInfo.publicKey.x && accInfo.publicKey.y) {
            if (account.accountId !== accInfo.accountId) {
                const provider = await connector.getProvider()
                const web3 = new Web3(provider as any)
                try {
                    code = await web3.eth.getCode(account.accAddr)
                    try {
                        const eddsakey = await sign_tools
                            .generateKeyPair(
                                web3,
                                account.accAddr,
                                exchangeAddress,
                                accInfo.nonce - 1,
                                account.connectName,
                            )
                        sk = toHex(toBig(eddsakey.keyPair.secretKey))
                        const px = toHex(toBig(eddsakey.keyPair.publicKeyX))
                        const py = toHex(toBig(eddsakey.keyPair.publicKeyY))

                        try {
                            apikey = await userApi.getUserApiKey({
                                accountId: accInfo.accountId
                            }, sk)
                            event = (StatusChangeEvent.HasPubkey)
                        } catch (reason) {
                            dumpError400(reason)
                            event = (StatusChangeEvent.ErrorResponse)
                        }
                    } catch (reason) {
                        dumpError400(reason)
                        event = (StatusChangeEvent.ErrorResponse)
                    }

                } catch (reason) {
                    dumpError400(reason)
                    event = (StatusChangeEvent.ErrorResponse)
                }

            } else {
                console.log('already has accountId!')
            }
        } else {
            event = (StatusChangeEvent.HasNoPubkey)
        }
    } catch (reason) {
        // 3 has none of above
        dumpError400(reason)
        // check deposit tx (local and ethereum)
        event = (StatusChangeEvent.ErrorResponse)
    }

    if (accInfo && accInfo.owner !== account.accAddr) {
        dispatch(setAccountInfo(accInfo))
    }

    if (sk) {
        dispatch(setEddsaKey(sk))
    }

    if (apikey) {
        dispatch(setApikey(apikey.apiKey))
    }

    if (event) {
        sendEvent(event)
    }

}

export function useCheckAccStatus() {

    const dispatch = useDispatch()

    // const { account } = useAccount()

    const { sendEvent } = useStateMachine()

    const exchangeApi: ExchangeAPI = useExchangeAPI()

    const userApi: UserAPI = useUserAPI()

    const { account: web3Account, active, isConnected, chainId, connector, } = useWeb3Account()
    const { marketArray } = useTokenMap()

    const lv1Acc = web3Account as string

    const prevChainId = usePrevious(chainId)
    const prevWeb3Account = usePrevious(web3Account)

    const {updateWalletLayer1, resetLayer1,} = useWalletLayer1()
    const {updateWalletLayer2, resetLayer2, } = useWalletLayer2();

    // const { updateWalletLayer1,resetLayer1} = useWalletLayer1();
    // const { updateWalletLayer2, resetLayer2} = useWalletLayer2()
    // console.log('prevChainId:', prevChainId, ' chainId:', chainId)
    // console.log('prevWeb3Account:', prevWeb3Account, ' web3Account:', web3Account)
    // console.log(exchangeApi, userApi, account, 'prevChainId:', prevChainId, 'chainId:', chainId, 'web3Account:', web3Account)

    const { tradingInfo } = useGetTradingInfo()

    useCustomDCEffect(async() => {

        const account = store.getState().account

        const cleanUp = () => {
            let handler = UserStorage.getHandler()
            if (account.status !== AccountStatus.ACTIVATED && handler) {
                clearInterval(handler)
            }
        }

        async function checkStatus() {

            if (!account || !lv1Acc || !exchangeApi || !userApi || !chainId
                || !connector || !tradingInfo.exchangeInfo?.exchangeAddress) {
                return
            }

            if (((prevChainId && chainId && prevChainId !== chainId)
                || (prevWeb3Account && web3Account && prevWeb3Account !== web3Account))
                && account.status !== AccountStatus.UNCONNNECTED) {
                dispatch(reset(undefined))
                sendEvent(account, StatusChangeEvent.Reset)
                return
            }

            cleanUp()

            switch (account.status) {
                case AccountStatus.UNCONNNECTED:
                    // console.log('---> render UNCONNNECTED active:', active, ' isConnected:', isConnected)

                    if (isConnected) {
                        dispatch(setConnectNameTemp(ConnectorNames.Injected))
                        sendEvent(account, StatusChangeEvent.Connecting)
                    }

                    //HIGH:
                    resetLayer1()
                    resetLayer2()
                    break

                case AccountStatus.CONNECTED:
                    //check session or local storage

                    //  console.log('---> render CONNECTED account:', account)

                    try {

                        const { accInfo } = (await exchangeApi.getAccount({ owner: lv1Acc }))

                        // current acc is local acc info
                        if (account.accAddr && account.eddsaKey && accInfo.owner === account.accAddr) {
                            // console.log('cur Eddsakey:', account.eddsaKey)
                        } else {
                            // console.log('got a new address:', acc)
                            // got a new address
                            dispatch(setAccountInfo(accInfo))
                            // dispatch(setEddsaKey(''))

                            //updateWalletLayer1();
                            if (marketArray?.length) {
                                updateWalletLayer1()
                            }
                        }

                        if (account?.connectName !== account?.connectNameTemp) {
                            dispatch(setConnectName(account.connectNameTemp))
                        }

                        sendEvent(account, StatusChangeEvent.HasPubkey)

                    } catch (reason) {
                        dumpError400(reason)

                        if (lv1Acc) {
                            dispatch(setAccAddr(lv1Acc))
                        }

                        if (reason.response && reason.response.data && reason.response.data.resultInfo
                            && reason.response.data.resultInfo.code === 101002) {
                            sendEvent(account, StatusChangeEvent.ErrorResponse)
                        }
                    }

                    break

                case AccountStatus.NOACCOUNT:

                    console.log('NOACCOUNT before wait 15s!')

                    _.delay(() => {
                        sendEvent(account, StatusChangeEvent.Reconnect)
                        console.log('NOACCOUNT wait 15s to reconnect again!')
                    }, 15000)
                    

                    // const noAccHandler = setInterval(async() => {

                    //     try {
                    //         const { accInfo } = (await exchangeApi.getAccount({ owner: lv1Acc }))
                    //         clearInterval(noAccHandler)
                    //         sendEvent(account, StatusChangeEvent.Lock)
                    //     } catch (reason) {
                    //     }

                    // }, 15000)

                    break

                case AccountStatus.DEPOSITING:
                    // TODO sub contract event, check deposit.
                    const depositFinished = true // TODO
                    if (depositFinished) {
                        //   console.log('depositFinished currStatus:', account.status)
                        sendEvent(account, StatusChangeEvent.FinishDeposit)
                    }
                    break

                case AccountStatus.DEPOSIT_TO_CONFIREM:
                    // getAccount every 10s to check
                    break

                case AccountStatus.UNACTIVATED:
                    const isSmartWallet = false // TODO
                    if (isSmartWallet) {
                        // TODO approve hash,
                        //  console.log('approve hash, currStatus:', account.status)
                        sendEvent(account, StatusChangeEvent.IsSmartWallet)
                    } else {
                        // console.log('approve hash no smartwallet, account.status:', account.status)
                    }
                    break

                case AccountStatus.ARPROVING:
                    // TODO sub contract event, check approving.
                    const approved = false // TODO
                    if (approved) {
                        //  console.log('sub contract event, check approving. approved! status:', account.status)
                        sendEvent(account, StatusChangeEvent.ApproveSubmit)
                    }
                    break

                case AccountStatus.APPROV_TO_CONFIRM:
                    const approveConfirmed = false // TODO
                    if (approveConfirmed) {
                        //   console.log('approveConfirmed status:', account.status)
                        sendEvent(account, StatusChangeEvent.ApproveConfirmed)
                    }
                    break

                case AccountStatus.LOCKED:
                    //HIGH:
                    resetLayer1()
                    break

                case AccountStatus.ACTIVATED:
                    UserStorage.checkTimeout(true)
                    const handler = setInterval(() => {
                        const isTimeOut = UserStorage.checkTimeout()
                        if (account.status === AccountStatus.ACTIVATED && isTimeOut) {
                            clearInterval(handler)
                            sendEvent(account, StatusChangeEvent.Lock)
                        }
                    }, 1000)
                    UserStorage.setHandler(handler)
                    updateWalletLayer2()
                    break

                default:
                    break
            }



        }

        checkStatus()

        return () => {
            cleanUp()
        }

    }, [updateWalletLayer1, updateWalletLayer2, resetLayer1, resetLayer2,
        exchangeApi, userApi, store.getState().account.status, prevChainId, chainId, lv1Acc, 
        dispatch, connector, tradingInfo.exchangeInfo?.exchangeAddress,])

}

