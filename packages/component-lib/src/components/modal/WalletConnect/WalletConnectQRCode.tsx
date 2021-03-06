import QRCode from 'qrcode.react';
import { Box, Typography } from '@material-ui/core';
import { WithTranslation } from 'react-i18next';
import { Link } from '@material-ui/core/';

export const WalletConnectQRCode = ({url,onCopy, t}: { url: string,onCopy:()=>void } & WithTranslation)=>{
    return   <Box flex={1} display={'flex'} alignItems={'center'} justifyContent={'space-between'} flexDirection={'column'}>

        <Typography component={'h3'} variant={'h3'} marginBottom={3}>
            <img style={{verticalAlign:'middle'}}  src={'static/svg/wallet-connect.svg'} alt={'walletConnect'} height={18}/> WalletConnect
        </Typography>
        <QRCode value={url} size={240} style={{padding: 5, backgroundColor: '#fff'}} aria-label={`link:${url}`}/>

        <Box display={'flex'} alignItems={'center'} justifyContent={'center'} flexDirection={'column'}>
            <Typography variant={'body2'} color={'textSecondary'} marginTop={2}>
                {t('labelWalletConnectQRCode')}
            </Typography>
            <Typography variant={'body2'} component={'p'} marginTop={2} >
                <Link onClick={onCopy}>{t('labelCopyClipBoard')}</Link>
            </Typography>
        </Box>

    </Box>
}