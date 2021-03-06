import { WithTranslation, withTranslation } from 'react-i18next';
import { Modal } from '@material-ui/core';
import {
    ModalBackButton,
    ModalCloseButton,
    ModalWalletConnectProps, shake,
    SwipeableViewsStyled,
    SwitchPanelStyled
} from '../../../index';
import { useTheme } from '@emotion/react';
import { Box } from '@material-ui/core/';

export const ModalWalletConnect = withTranslation('common', {withRef: true})((
    {
        // t,
        open,
        onClose,
        step,
        onBack,
        panelList,
        style,
        ...rest
    }: ModalWalletConnectProps & WithTranslation) => {
    const theme = useTheme();
    const {w, h} = style ? style : {w: undefined, h: undefined};


    return <Modal
        open={open}
        onClose={onClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
    >
        <SwitchPanelStyled style={{boxShadow: '24'}} {...{
            _height: h ? h : 'var(--modal-height)',
            _width: w ? w : 'var(--modal-width)'
        }}>
            <Box display={'flex'} width={"100%"} flexDirection={'column'}>
                <ModalCloseButton onClose={onClose} {...rest} />
                {/*{panelList.map((panel) => {*/}
                {/*    return panel.onBack ? <ModalBackButton  onBack={panel.onBack}  {...rest}/> : <></>*/}
                {/*})}*/}
                {onBack ? <ModalBackButton onBack={onBack}  {...rest}/> :<></>}
            </Box>
            <SwipeableViewsStyled animateTransitions={false} axis={theme.direction === 'rtl' ? 'x-reverse' : 'x'}
                                  index={step}
                                  {...{_height: h ? h : 'var(--modal-height)', _width: w ? w : 'var(--modal-width)'}}>
                {panelList.map((panel, index) => {
                    return <Box flexDirection={'column'} flex={1} display={'flex'} key={index} justifyContent={'center'} alignItems={'stretch'}>
                        {panel.view}
                    </Box>
                })}
            </SwipeableViewsStyled>
        </SwitchPanelStyled>
    </Modal>;
})
