import { Trans, WithTranslation } from "react-i18next"
import { UpdateAccountBase, IconType, PanelProps } from "./BasicPanel"
import { Box, Typography } from '@material-ui/core/';
import { AnimationArrow, Button } from '../../../index';
import { AccountBasePanel,AccountBaseProps, } from './index';

export const UpdateAccount = ({
    t,
    goUpdateAccount,
    ...props
}: WithTranslation &AccountBaseProps & { goUpdateAccount?: () => void }) => {
    return <Box flex={1} display={'flex'} flexDirection={'column'} justifyContent={'space-between'}
        alignItems={'center'}>
        <AccountBasePanel {...props} t={t} />
        <Box display={'flex'} marginTop={2} alignSelf={'stretch'} paddingX={5} flexDirection={'column'} alignItems={'center'}>
            <Typography variant={'body2'} >
                {t('labelActivatedAccountDeposit')}
            </Typography>
            <AnimationArrow className={'arrowCta'} />
            <Button variant={'contained'} fullWidth size={'medium'} onClick={() => {
                if (goUpdateAccount) {
                    goUpdateAccount()
                }
            }}>{t('labelActivateAccount')} </Button>
        </Box>
    </Box>
}

// symbol
export const UpdateAccount_Approve_WaitForAuth = (props: PanelProps & WithTranslation) => {
    const propsPatch = {
        iconType: IconType.LoadingIcon,
        describe1: <Trans i18nKey={'label_UpdateAccount_Approve_WaitForAuth'}>
            Waiting for {props.symbol} Auth.
        </Trans>
    }
    return <UpdateAccountBase {...props} {...propsPatch} />
}

export const UpdateAccount_First_Method_Denied = (props: PanelProps & WithTranslation) => {
    const propsPatch = {
        iconType: IconType.RefuseIcon,
        describe1: <Trans i18nKey={'label_First_Method_Denied'}>
        </Trans>
    }
    return <UpdateAccountBase {...propsPatch} {...props} />
}

export const UpdateAccount_User_Denied = (props: PanelProps & WithTranslation) => {
    const propsPatch = {
        iconType: IconType.RefuseIcon,
        describe1: <Trans i18nKey={'label_Denied'}>
        </Trans>
    }
    return <UpdateAccountBase {...propsPatch} {...props} />
}

// symbol
export const UpdateAccount_Success = (props: PanelProps & WithTranslation) => {
    const propsPatch = {
        iconType: IconType.DoneIcon,
        describe1: <Trans i18nKey={'label_UpdateAccount_Success'}>
        </Trans>,
        describe2: <Trans i18nKey={'label_UpdateAccount_Success2'}>
        </Trans>
    }
    return <UpdateAccountBase {...propsPatch} {...props} />
}

// value symbol
export const UpdateAccount_Submited = (props: PanelProps & WithTranslation) => {
    const propsPatch = {
        iconType: IconType.SubmitIcon,
        describe1: <Trans i18nKey={'label_UpdateAccount_Submited'}>
        </Trans>
    }
    return <UpdateAccountBase {...propsPatch} {...props} />
}

// value symbol
export const UpdateAccount_Failed = (props: PanelProps & WithTranslation) => {
    const propsPatch = {
        iconType: IconType.FailedIcon,
        describe1: <Trans i18nKey={'label_UpdateAccount_Failed'}>
            {props.value} {props.symbol} Update Account Failed.
        </Trans>
    }
    return <UpdateAccountBase {...propsPatch} {...props} />
}