import { ButtonProps as MuButtonPros, ToggleButtonGroupProps as MuToggleButtonGroupProps } from "@material-ui/core";
import { XOR } from "../../../types/lib";

export type ButtonProps = MuButtonPros & {
    // bg:'',
    // color:'',
    // hBg:'',
    // hColor:'',
    loading?: 'true' | 'false'
}

export interface BtnPercentageProps {
    anchors?: number[], //0 --100    default 0,20,40,60,80,100
    selected: number,
    handleChanged: (item: any) => void
}

export interface TGItemJSXInterface {
    value: any,
    key?: string,
    JSX: React.ReactElement,
    tlabel?: string,  // after 18n
    disabled?: boolean
}

export interface TGItemData {
    value: string | number,
    key: string,
    label?: string,
    disabled?: boolean
}


export type ToggleButtonGroupProps =
    MuToggleButtonGroupProps
    & {
    value: Array<string | number> | string | number,
}
    // & { handleChange: (event: MouseEvent|InputEvent, newValue: string) => void }
    & XOR<{ tgItemJSXs: TGItemJSXInterface[] }, { data: TGItemData[] }>

