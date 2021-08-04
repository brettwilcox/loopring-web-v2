import { Box, Button, Typography } from '@material-ui/core/';
import { CopyIcon, getShortAddr, LinkIcon, ReverseIcon, } from '@loopring-web/common-resources';
import { Trans, WithTranslation } from 'react-i18next';
import styled from '@emotion/styled';
import { AccountBaseProps } from './Interface';
import { VipStyled } from '../../../';


const BoxStyled = styled(Box)`
  // .MuiLink-root {
  //   height: 2rem;
  //   line-height: 2rem;
    //   color: ${({theme}) => theme.colorBase.textSecondary};
  //
  //  
  // }                                                               
  // &  .MuiButton-root{
  //       width: var(--account-button-fixed-width);
  //       height: var(--account-button-fixed-height);
  //       text-overflow: ellipsis;
  //       align-items: flex-end;
  //       position: relative;
  //       svg{
  //         position: absolute;
    //         top: ${({theme}) => theme.unit}px;
  //         left: 50%;
  //         margin-left: calc(var(--svg-size-large) / -2) ;
  //       }
  // }
  & .active {

  }

  & .unlock {
    svg {
      color: ${({theme}) => theme.colorBase.error};;
    }
  }

  & .lock {
    svg {
      color: ${({theme}) => theme.colorBase.success};;
    }
  }
` as typeof Box

export const AccountBase = ({

                                onSwitch,
                                accAddress,
                                level,
                                connectName,
                                etherscanUrl,
                                onCopy,
                                // onViewQRCode,
                                t
                            }: AccountBaseProps & WithTranslation) => {
    const addressShort = getShortAddr(accAddress)
    const etherscanLink = etherscanUrl + accAddress;
     console.log(connectName)
    return <Box display={'flex'} flexDirection={'column'} justifyContent={'flex-start'} alignItems={'center'}>
        <Typography component={'h6'} variant={'body2'} color={'textSecondary'} marginTop={1}>
            <Trans i18nKey="labelConnectBy"  >
                Connected with <Typography component={'span'}>{{connectBy:connectName === 'UnKnown' ?  t('labelWrongNetwork'): connectName }}</Typography>.
            </Trans>
        </Typography>
        <Typography marginTop={1} component={'p'} display={'flex'} alignItems={'center'} justifyContent={'flex-start'}>
            <Typography component={'span'} variant={'h4'}>{addressShort}</Typography>
            {level ? <VipStyled component={'span'} variant={'body2'}
                                alignSelf={'flex-start'}>{level}</VipStyled> : undefined}
        </Typography>
        <BoxStyled component={'div'} display={'flex'} alignItems={'center'} justifyContent={'space-between'}
                   marginTop={1} alignSelf={'stretch'}>
            <Button formTarget={'_blank'} href={etherscanLink} startIcon={<LinkIcon fontSize={'small'}/>}>
                <Typography variant={'body2'} marginTop={1 / 2}> {'Etherscan'} </Typography>
            </Button>
            <Button startIcon={<CopyIcon fontSize={'small'}/>} onClick={() => {
                if (onCopy) onCopy()
            }}>
                <Typography variant={'body2'} marginTop={1 / 2}> {t('labelCopy')} </Typography>
            </Button>
            <Button startIcon={<ReverseIcon fontSize={'small'}/>} onClick={() => {
                if (onSwitch) onSwitch()
            }}>
                <Typography variant={'body2'} marginTop={1 / 2}>  {t('labelSwitchAccount')} </Typography>
            </Button>
        </BoxStyled>
    </Box>
}