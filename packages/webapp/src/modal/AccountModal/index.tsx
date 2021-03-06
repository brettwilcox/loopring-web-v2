import { WithTranslation, withTranslation } from 'react-i18next';
import {
    AccountStep,
    ActiveAccountProcess,
    ApproveAccount,
    Button,
    DepositApproveProcess,
    Depositing,
    DepositingProcess,
    DepositPanel,
    FailedDeposit,
    FailedTokenAccess,
    FailedUnlock,
    HadAccount,
    ModalAccount,
    ModalQRCode,
    NoAccount,
    ProcessUnlock,
    QRAddressPanel,
    SuccessUnlock,
    Toast,
    TokenAccessProcess,
    useOpenModals,
} from '@loopring-web/component-lib';
import { walletServices } from '@loopring-web/web3-provider';
import { sleep } from 'loopring-sdk';

import React, { useState } from 'react';
import { copyToClipBoard } from 'utils/obj_tools';
import { useAccount } from 'stores/account';
import { ActionResult, ActionResultCode, REFRESH_RATE, TOAST_TIME } from 'defs/common_defs';
import { getShortAddr } from '@loopring-web/common-resources';
import { updateAccountFromServer } from 'services/account/activeAccount';
import { lockAccount } from 'services/account/lockAccount';
import { unlockAccount } from 'services/account/unlockAccount';
import { useTokenMap } from 'stores/token';
import { myLog } from 'utils/log_tools';
import { useDeposit } from 'hooks/useractions/useDeposit';

import { accountServices } from '../../services/account/accountServices'

import { LoopringAPI } from 'api_wrapper';

export const ModalAccountInfo = withTranslation('common')(({
                                                               onClose,
                                                               etherscanUrl,
                                                               open,
                                                               t,
                                                               ...rest
                                                           }: {
    open: boolean,
    onClose?: (e: MouseEvent) => void,
    etherscanUrl: string
} & WithTranslation) => {
    const {
        account,
        shouldShow,
        updateAccount,
        setShouldShow,
        resetAccount,
    } = useAccount();

    const {depositProps} = useDeposit()
    const {modals: {isShowAccount}, setShowConnect, setShowAccount,} = useOpenModals()
    const [openQRCode, setOpenQRCode] = useState(false)
    const addressShort = getShortAddr(account.accAddress)

    const {coinMap} = useTokenMap()

    const [copyToastOpen, setCopyToastOpen] = useState(false);

    const onSwitch = React.useCallback(() => {
        setShowAccount({isShow: false})
        setShouldShow(true);
        setShowConnect({isShow: shouldShow ?? false})
    }, [setShowConnect, setShowAccount, shouldShow])

    const onCopy = React.useCallback(() => {
        copyToClipBoard(account.accAddress);
        setCopyToastOpen(true)
    }, [account])
    const onViewQRCode = React.useCallback(() => {
        setOpenQRCode(true)
    }, [])
    const onDisconnect = React.useCallback(async () => {
        walletServices.sendDisconnect('', 'customer click disconnect');
        setShowAccount({isShow: false})
    }, [resetAccount, setShowAccount])

    const goDeposit = React.useCallback(() => {

        setShowAccount({isShow: true, step: AccountStep.Deposit});

    }, [setShowAccount])

    const goUpdateAccount = React.useCallback(async () => {

        if (!account.accAddress) {
            myLog('account.accAddress is nil')
            return
        }

        myLog('goUpdateAccount....')
        setShowAccount({isShow: true, step: AccountStep.UpdateAccountInProcess});

        const result: ActionResult = await updateAccountFromServer()

        switch (result.code) {
            case ActionResultCode.NoError:

                const eddsaKey = result.data.eddsaKey
                myLog(' after NoError:', eddsaKey)
                await sleep(REFRESH_RATE)

                if (LoopringAPI.userAPI && LoopringAPI.exchangeAPI && eddsaKey) {

                    const {accInfo, error} = await LoopringAPI.exchangeAPI.getAccount({owner: account.accAddress})

                    if (!error && accInfo) {

                        const {apiKey} = (await LoopringAPI.userAPI.getUserApiKey({
                            accountId: accInfo.accountId
                        }, eddsaKey.sk))

                        myLog('After connect >>, get apiKey', apiKey)

                        accountServices.sendAccountSigned(accInfo.accountId, apiKey, eddsaKey)

                    }

                }

                setShowAccount({isShow: false})
                break
            case ActionResultCode.GetAccError:
            case ActionResultCode.GenEddsaKeyError:
            case ActionResultCode.UpdateAccoutError:
                myLog('try to sendCheckAccount...')
                accountServices.sendCheckAccount(account.accAddress)
                break
            default:
                break
        }

    }, [account, setShowAccount])
    const onQRClick = React.useCallback(() => {
        setShowAccount({isShow: true, step: AccountStep.QRCode})
    }, [])
    const unlockBtn = React.useMemo(() => {
        return <Button variant={'contained'} fullWidth size={'medium'} onClick={() => {
            setShouldShow(true);
            unlockAccount();
        }}>{t('labelUnLockLayer2')} </Button>
    }, [updateAccount, t]);
    const lockBtn = React.useMemo(() => {
        return <Button variant={'contained'} fullWidth size={'medium'} onClick={() => {
            lockAccount();
        }}>{t('labelLockLayer2')} </Button>
    }, [lockAccount, t]);
    const _onClose = React.useCallback((e: any) => {
        setShouldShow(false);
        setShowAccount({isShow: false})
        if (onClose) {
            onClose(e);
        }
    }, [])
    const onBack = React.useCallback(() => {
        switch (account.readyState) {
            case 'NO_ACCOUNT':
            case 'DEPOSITING':
                setShowAccount({isShow: true, step: AccountStep.NoAccount});
                break;
            case  'LOCKED':
            case  'ACTIVATED':
                setShowAccount({isShow: true, step: AccountStep.HadAccount});
                break;
            default:
                setShowAccount({isShow: false});

        }
    }, [account])
    const title = t("labelCreateLayer2Title")

    const accountList = React.useMemo(() => {
        return Object.values({
            [ AccountStep.NoAccount ]: {
                view: <NoAccount {...{
                    goDeposit,
                    ...account,
                    etherscanUrl,
                    onSwitch, onCopy,
                    onViewQRCode, onDisconnect, addressShort,
                }} />, onQRClick
            },
            [ AccountStep.QRCode ]: {
                view: <QRAddressPanel  {...{
                    ...rest,
                    ...account,
                    etherscanUrl,
                    t
                }} />, onBack, noClose: true
            },
            [ AccountStep.Deposit ]: {
                view: <DepositPanel title={title} {...{
                    ...rest,
                    _height: 'var(--modal-height)',
                    _width: 'var(--modal-width)',
                    ...depositProps,
                    t
                }} />
            },
            [ AccountStep.Depositing ]: {
                view: <Depositing label={title}
                                  onClose={_onClose}
                                  etherscanLink={etherscanUrl + account.accAddress} {...{
                    ...rest,
                    t
                }} />,
            },
            [ AccountStep.DepositFailed ]: {
                view: <FailedDeposit label={title}
                                     etherscanLink={etherscanUrl + account.accAddress}
                                     onRetry={() => goDeposit()} {...{...rest, t}} />, onBack: () => {
                    setShowAccount({isShow: true, step: AccountStep.Deposit});
                }
            },
            [ AccountStep.UpdateAccount ]: {
                view: <ApproveAccount {...{
                    ...account,
                    etherscanUrl,
                    onSwitch, onCopy,
                    onViewQRCode, onDisconnect, addressShort,
                }} goUpdateAccount={() => {
                    goUpdateAccount()
                }}  {...{...rest, t}} />, onQRClick
            },
            [ AccountStep.ProcessUnlock ]: {
                view: <ProcessUnlock providerName={account.connectName} {...{
                    ...rest,
                    t
                }} />,
            },
            [ AccountStep.SuccessUnlock ]: {
                view: <SuccessUnlock providerName={account.connectName} onClose={_onClose} {...{...rest, t}} />,
            },
            [ AccountStep.FailedUnlock ]: {
                view: <FailedUnlock onRetry={() => {
                    unlockAccount()
                }} {...{...rest, t}} />,
            },
            [ AccountStep.HadAccount ]: {
                view: <HadAccount {...{
                    ...account,
                    onSwitch, onCopy,
                    etherscanUrl,

                    // address: account.accAddress,
                    // connectBy: account.connectName,
                    onViewQRCode, onDisconnect, addressShort,
                    etherscanLink: etherscanUrl + account.accAddress,
                    mainBtn: account.readyState === 'ACTIVATED' ? lockBtn : unlockBtn
                }} />, onQRClick
            },
            [ AccountStep.TokenApproveInProcess ]: {
                view: <TokenAccessProcess label={title}
                                          providerName={account.connectName} {...{
                    ...rest,
                    t
                }} />, onBack: () => {
                    setShowAccount({isShow: true, step: AccountStep.Deposit});
                }
            },
            [ AccountStep.DepositApproveProcess ]: {
                view: <DepositApproveProcess label={title}
                                             etherscanLink={etherscanUrl + account.accAddress}
                                             providerName={account.connectName} {...{
                    ...rest,
                    t
                }} />,
            },
            [ AccountStep.DepositInProcess ]: {
                view: <DepositingProcess label={title}
                                         etherscanLink={etherscanUrl + account.accAddress}
                                         providerName={account.connectName} {...{
                    ...rest,
                    t
                }} />,
            },
            [ AccountStep.UpdateAccountInProcess ]: {
                view: <ActiveAccountProcess label={title} providerName={account.connectName} {...{
                    ...rest,
                    t
                }} />,
            },
            [ AccountStep.UpdateAccountFailed ]: {
                view: <FailedUnlock label={title} onRetry={() => {
                    goUpdateAccount()
                }} {...{...rest, t}} />, onBack: () => {
                    setShowAccount({isShow: true, step: AccountStep.UpdateAccount});
                }
            },
            [ AccountStep.TokenApproveFailed ]: {
                view: <FailedTokenAccess label={title} onRetry={() => {
                    goDeposit()
                }} {...{
                    t, ...rest,
                    coinInfo: coinMap ? coinMap[ 'USTD' ] : undefined
                }} />,
            },

        })
    }, [addressShort, account, depositProps, etherscanUrl, onCopy, onSwitch, onDisconnect, onViewQRCode, t, rest])

    return <>
        <Toast alertText={t('Address Copied to Clipboard!')} open={copyToastOpen}
               autoHideDuration={TOAST_TIME} onClose={() => {
            setCopyToastOpen(false)
        }} severity={"success"}/>

        <ModalQRCode open={openQRCode} onClose={() => setOpenQRCode(false)} title={'ETH Address'}
                     description={account?.accAddress} url={account?.accAddress}/>

        <ModalAccount open={isShowAccount.isShow} onClose={_onClose} panelList={accountList}
                      onBack={accountList[ isShowAccount.step ].onBack}
                      onQRClick={accountList[ isShowAccount.step ].onQRClick}
                      step={isShowAccount.step}/>
    </>
})
