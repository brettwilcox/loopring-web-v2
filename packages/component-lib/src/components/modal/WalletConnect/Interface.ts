import { GatewayItem } from '@loopring-web/common-resources';

/**
 * @param handleSelect default hanldeSelect, if item have no private handleSelect function
 */
export interface ProviderMenuProps {
    termUrl: string,
    gatewayList: GatewayItem[]
    handleSelect?: (event: React.MouseEvent, key: string) => void,
    providerName?: string
}

export type  ModalWalletConnectProps = {
    open: boolean,
    onClose: { bivarianceHack(event: {}, reason: 'backdropClick' | 'escapeKeyDown'): void; }['bivarianceHack'];
    onBack?: ()=>void;
    step: number,
    noClose?:boolean,
    style?: any, //{w,h}
    onQRClick ?: ()=>void;
    panelList: Array<{view:JSX.Element,onBack?: undefined|(()=>void) }>
}
export type ModalAccountProps = ModalWalletConnectProps;

export enum WalletConnectStep {
    Provider,
    MetaMaskProcessing,
    WalletConnectProcessing,
    WalletConnectQRCode,
    SuccessConnect,
    FailedConnect,
}