import { Typography } from '@material-ui/core';
import { WithTranslation } from 'react-i18next';
import React from 'react';
import { InProgressBasic } from '../ModalPanelBase';
import {  ConnectProviders } from '@loopring-web/common-resources';



export const WalletConnectProcess = ({t,...rest}:WithTranslation)=>{



    const describe = React.useMemo(()=>{
        return <>
            <Typography component={'span'} variant={'body1'} paddingY={1}>{t('labelProcessing')}</Typography>
            {/*<Typography variant={'body2'} color={'textSecondary'} component={'p'} marginTop={3} alignSelf={'flex-start'} paddingX={6} >*/}
            {/*    <Trans i18nKey={'labelWalletConnectProcessDescribe'}>*/}
            {/*        Please wait WalletConnect Provider working processing*/}
            {/*    </Trans>*/}
            {/*</Typography>*/}
        </>

    },[])
    return <InProgressBasic providerName={ConnectProviders.WalletConnect} describe={describe} label={t('labelWalletConnectProcessing')} {...{...rest,t}}/>
}

export const MetaMaskProcess =  ({t,...rest}:WithTranslation)=>{
    const describe = React.useMemo(()=>{
        return    <>
            <Typography component={'span'} paddingY={1}>{t('labelProcessing')}</Typography>
            {/*<Typography variant={'body2'} color={'textSecondary'} component={'p'} marginTop={3} alignSelf={'flex-start'} paddingX={6} >*/}
            {/*    <Trans i18nKey={'labelMetaMaskProcessDescribe'}>*/}
            {/*        /!*Please adding MetaMask to your browser,*!/*/}
            {/*        Please click approve button on MetaMask popup window.*/}
            {/*        When MetaMask dialog is dismiss,*/}
            {/*        please manually click <img style={{verticalAlign:'middle'}} src={'static/images/MetaMaskPlugIn.png'}/> on your browser toolbar.*/}
            {/*    </Trans>*/}

            {/*</Typography>*/}
        </>

    },[])
    return <InProgressBasic providerName={ConnectProviders.MetaMask} describe={describe} label={t('labelMetaMaskProcessing')} {...{...rest,t}}/>
}