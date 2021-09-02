import { LoopringAPI } from 'api_wrapper'
import BigNumber from 'bignumber.js'
import React from 'react'
import { useTokenMap } from 'stores/token/hook'
import * as sdk from 'loopring-sdk'
import { TokenInfo } from 'loopring-sdk'

export function useAllowances({ owner, symbol }: {owner: string, symbol: string}) {

    const { tokenMap, } = useTokenMap()

    const [allowanceInfo, setAllowanceInfo] = React.useState<{ allowance: BigNumber, needCheck: boolean, tokenInfo: TokenInfo }>()

    const updateAllowance = React.useCallback(async (symbol: string) => {
        if (owner && tokenMap && LoopringAPI.exchangeAPI && symbol) {
            const tokenInfo = tokenMap[symbol]

            if (tokenInfo) {
                let allowance = sdk.toBig(0)
                let needCheck = false

                if (tokenInfo?.symbol.toUpperCase() !== 'ETH') {
                    const req: sdk.GetAllowancesRequest = { owner, token: tokenInfo.symbol }
                    const { tokenAllowances } = await LoopringAPI.exchangeAPI.getAllowances(req, tokenMap)
                    allowance = sdk.toBig(tokenAllowances[tokenInfo.symbol])
                    needCheck = true
                }
                
                setAllowanceInfo({
                    allowance,
                    needCheck,
                    tokenInfo,
                })
            } else {
                setAllowanceInfo(undefined)
            }
        }

    }, [tokenMap, owner, ])

    React.useEffect(() => {
        updateAllowance(symbol)
    }, [owner, symbol])

    return {
        allowanceInfo,
    }

}