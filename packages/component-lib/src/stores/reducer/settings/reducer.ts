import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { PlatFormType, SettingsState } from "./interface";
import { Currency, i18n, LanguageKeys, ThemeKeys, ThemeType, UpColor } from '@loopring-web/common-resources';
import moment from 'moment';
import * as imgConfig  from '@loopring-web/common-resources/assets/images/coin/loopring.json'
import { Slice } from '@reduxjs/toolkit/src/createSlice';
// import { localStore } from '@loopring-web/common-resources/src/storage';

const initialState: SettingsState = {
    themeMode: ThemeType.dark, //localStore.getItem('ThemeType')?localStore.getItem('ThemeType') as ThemeKeys :ThemeType.dark,
    language: i18n.language as LanguageKeys, //localStore.getItem('LanguageKey')?localStore.getItem('LanguageKey') as LanguageKeys: i18n.language as LanguageKeys,
    platform: PlatFormType.desktop,
    currency: Currency.dollar,//localStore.getItem('Currency')?localStore.getItem('Currency') as keyof typeof Currency: Currency.dollar,
    upColor: UpColor.green,//localStore.getItem('UpColor')?localStore.getItem('UpColor') as keyof typeof UpColor: UpColor.green,
    coinJson: imgConfig.frames,
    slippage: 'N',
}

export const settingsSlice:Slice<SettingsState> = createSlice({
    name: 'settings',
    initialState,
    reducers: {
        setTheme(state, action: PayloadAction<ThemeKeys>) {
            // localStore.setItem('ThemeType',action.payload)
            state.themeMode = action.payload
            
        },
        setLanguage(state, action: PayloadAction<LanguageKeys>) {
            i18n.changeLanguage(action.payload);
            if (action.payload) {
                // action.payload === 'en_US' ? moment.locale('en') : moment.locale(action.payload.toLocaleLowerCase());
                action.payload === 'en_US' 
                    ? moment.updateLocale('en', {
                            relativeTime : {
                                future: "in %s",
                                past:   "%s ago",
                                s  : 'a few seconds',
                                ss : '%d seconds',
                                m:  "a minute",
                                mm: "%d minutes",
                                h:  "an hour",
                                hh: "%d hours",
                                d:  "a day",
                                dd: "%d days",
                                w:  "a week",
                                ww: "%d weeks",
                                M:  "a month",
                                MM: "%d months",
                                y:  "a year",
                                yy: "%d years",
                            }
                        })
                    : moment.updateLocale('zh-cn', {
                        relativeTime : {
                            future: "%s???",
                            past:   "%s???",
                            s  : '??????',
                            ss : '%d ???',
                            m:  "1 ??????",
                            mm: "%d ??????",
                            h:  "1 ??????",
                            hh: "%d ??????",
                            d:  "1 ???",
                            dd: "%d ???",
                            w:  "1 ???",
                            ww: "%d ???",
                            M:  "1 ??????",
                            MM: "%d ??????",
                            y:  "1 ???",
                            yy: "%d ???",
                        }
                    });
                state.language = action.payload
            }
        },
        setPlatform(state, action: PayloadAction<keyof typeof PlatFormType>) {
            state.platform = action.payload
        },
        setCurrency(state, action: PayloadAction<'USD' | 'CYN'>) {
            // localStore.setItem('Currency',action.payload)
            state.currency = action.payload
        },
        setUpColor(state, action: PayloadAction<keyof typeof UpColor>) {
            // localStore.setItem('UpColor',action.payload)
            state.upColor = action.payload
        },
        setSlippage(state, action: PayloadAction<'N' | number>) {
            // localStore.setItem('UpColor',action.payload)
            state.slippage = action.payload
        },
        setCoinJson(state, action: PayloadAction<any>) {
            // localStore.setItem('UpColor',action.payload)
            state.coinJson = action.payload
        },
    },
})
export const {setTheme, setLanguage, setPlatform, setCurrency, setUpColor, setSlippage, setCoinJson} = settingsSlice.actions
// export const { setTheme,setPlatform,setLanguage } = settingsSlice.actions