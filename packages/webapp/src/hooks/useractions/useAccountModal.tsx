import { useAccount } from '../../stores/account';
import { AccountStep, useOpenModals } from '@loopring-web/component-lib';
import React from 'react';
import { sleep } from 'loopring-sdk';
import { useAccountHook } from '../../services/account/useAccountHook';

export  function useAccountModal() {
    const { shouldShow, setShouldShow, statusUnset: statusAccountUnset} = useAccount();
    const { setShowAccount } = useOpenModals();
    const handleErrorAccount = React.useCallback(()=>{
        // updateAccount({readyState:'NO_ACCOUNT'});
        statusAccountUnset();
    },[shouldShow])
    const handleLockAccount = React.useCallback(()=>{
        // updateAccount({readyState:'NO_ACCOUNT'});
        statusAccountUnset();
        setShowAccount({isShow: shouldShow ?? false,step:AccountStep.HadAccount});
    },[shouldShow])
    const handleNoAccount = React.useCallback((data: any)=>{
        // updateAccount({readyState:'NO_ACCOUNT'});
        statusAccountUnset();
        setShowAccount({isShow: shouldShow ?? false,step:AccountStep.NoAccount});
    },[shouldShow])
    const handleDepositingAccount = React.useCallback(async ()=>{
        // updateAccount({readyState:'DEPOSITING'});
        setShowAccount({isShow: shouldShow ?? false,step:AccountStep.Depositing});
        await sleep(5000)
        setShouldShow(false)
        setShowAccount({isShow: false});
        statusAccountUnset();
    },[shouldShow])
    const handleErrorApproveToken = React.useCallback(()=>{
        // updateAccount({readyState:'DEPOSITING'});
        setShowAccount({isShow: shouldShow ?? false,step:AccountStep.Depositing});
    },[shouldShow])
    const handleErrorDepositSign = React.useCallback(()=>{
        // updateAccount({readyState:'DEPOSITING'});
        setShowAccount({isShow: shouldShow ?? false,step:AccountStep.DepositFailed});
    },[shouldShow])
    const handleProcessDeposit = React.useCallback(()=>{
        // updateAccount({readyState:'DEPOSITING'});
        setShowAccount({isShow: shouldShow ?? false,step:AccountStep.DepositApproveProcess});
    },[shouldShow])
    const handleSignAccount = React.useCallback(()=>{
        // updateAccount({readyState:'DEPOSITING'});
        statusAccountUnset();
        setShowAccount({isShow: shouldShow ?? false,step:AccountStep.UpdateAccount});
    },[shouldShow])
    const handleSignError = React.useCallback(()=>{
        setShowAccount({isShow: shouldShow ?? false,step:AccountStep.FailedUnlock});
    },[shouldShow])
    const handleProcessSign = React.useCallback(()=>{
        setShowAccount({isShow: shouldShow ?? false,step:AccountStep.ProcessUnlock});
    },[shouldShow])
    const handleAccountActive  = React.useCallback(async ()=>{

        //updateAccount({readyState:'ACTIVATED'});
        setShowAccount({isShow: shouldShow ?? false,step:AccountStep.SuccessUnlock});
        await sleep(1000)
        setShouldShow(false)
        setShowAccount({isShow: false});
        statusAccountUnset();
    },[shouldShow])
    useAccountHook({
        handleErrorAccount,
        handleLockAccount,// clear private data
        handleNoAccount,//
        // TODO
        //  step1 Approve account;  click allow from provider
        //  step2 send to ETH;  click allow from provider
        handleDepositingAccount,
        handleErrorApproveToken,
        handleErrorDepositSign,
        handleProcessDeposit,// two or one step
        handleSignAccount, //unlock or update account  sgin
        handleProcessSign,
        handleSignError,
        // handleProcessAccountCheck,
        handleAccountActive: handleAccountActive,
    })
}