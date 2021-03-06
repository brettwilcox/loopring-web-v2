import { useCallback, useEffect, useState } from 'react'
import { Box, Grid, MenuItem, ListItemText, Avatar, Typography } from '@material-ui/core'
import styled from '@emotion/styled'
import { TFunction, withTranslation, WithTranslation } from 'react-i18next'
import { useHistory } from 'react-router-dom'
// import PopupState, { bindMenu, bindTrigger } from 'material-ui-popup-state'
import { Button, Popover, PopoverType } from '../../basic-lib'
import { Column, Table } from '../../basic-lib/tables'
import { TablePagination } from '../../basic-lib'
import { Filter } from './components/Filter'
import { TableFilterStyled, TablePaddingX } from '../../styled'
import { TableType, MoreIcon, AvatarCoinStyled } from '@loopring-web/common-resources';
import { useSettings } from '../../../stores'

const TableStyled = styled(Box)`
  display: flex;
  flex-direction: column;
  flex: 1;

  .rdg {
    flex: 1;
    --template-columns: 200px auto auto 150px ${(props: any) => props.lan === 'en_US' ? '275px' : '240px'} !important;

    .rdg-cell:first-of-type {
        display: flex;
        align-items: center;
        margin-top: ${({theme}) => theme.unit / 8}px;
    }

    .rdg-cell.action {
      display: flex;
      justify-content: center;
      align-items: center;
    }
  }
  .textAlignRight{
    text-align: right;
    }

  ${({theme}) => TablePaddingX({pLeft: theme.unit * 3, pRight: theme.unit * 3})}
` as any

const IconWrapperStyled = styled(Box)`
    margin-top: ${({theme}) => theme.unit * 1.1}px;
    svg {
        width: ${({theme}) => theme.unit * 2}px;
        height: ${({theme}) => theme.unit * 2}px;
    }
`

const GridStyled = styled(Grid)`
    .MuiGrid-item {
        padding: 0;
        padding-top: ${({theme}) => theme.unit / 4}px;
    }
`

interface Row {
    token: {
        type: TokenType;
        value: string;
    };
    amount: string;
    available: string;
    locked: string;
    filterColumn?: string
    tradePairList?: {
        first: string;
        last: string;
    }[]
    cellExpend?: {
        value: string
        children: []
        isExpanded: boolean
    }
    children?: Row[]
    isExpanded?: boolean
    format?: any
}

export enum TokenType {
    single = 'single',
    lp = 'lp'
}

export type TradePairItem = {
    first: string;
    last: string;
}

export enum LpTokenAction {
    add = 'add',
    remove = 'remove'
}

export type RawDataAssetsItem = {
    token: {
        type: TokenType,
        value: string
    }
    amount: string;
    available: string;
    locked: string;
    tradePairList?: TradePairItem[];
    smallBalance: boolean;
}

export interface AssetsTableProps {
    rawData: RawDataAssetsItem[];
    pagination?: {
        pageSize: number
    }
    onVisibleRowsChange?: (props: any) => void
    showFiliter?: boolean
    onShowDeposit: (token: string) => void,
    onShowTransfer: (token: string) => void,
    onShowWithdraw: (token: string) => void,
    onLpDeposit: (token: string, type: LpTokenAction ) => void,
    onLpWithdraw: (token: string, type: LpTokenAction) => void,
    getMakretArrayListCallback: (token: string) => string[]
}

export const AssetsTable = withTranslation('tables')((props: WithTranslation & AssetsTableProps) => {
    const {
        t,
        pagination,
        rawData,
        onVisibleRowsChange,
        showFiliter,
        onShowDeposit,
        onShowTransfer,
        onShowWithdraw,
        getMakretArrayListCallback,
        // onLpWithdraw,
    } = props
    const [searchValue, setSearchValue] = useState('')
    const [hideSmallBalance, setHideSmallBalance] = useState(false)
    const [hideLPToken, setHideLPToken] = useState(false)
    const [totalData, setTotalData] = useState<RawDataAssetsItem[]>([])
    const [page, setPage] = useState(1)
    const pageSize = pagination ? pagination.pageSize : 10;

    const {language} = useSettings()
    let history = useHistory()
    const {coinJson} = useSettings();
    // const rightState = usePopupState({variant: 'popover', popupId: `action-popover`});

    useEffect(() => {
        setTotalData(rawData && Array.isArray(rawData) ? rawData : [])
    }, [rawData])

    const jumpToAmm = useCallback((type: LpTokenAction, market: string) => {
        const pathname = `/liquidity/pools/coinPair/${market}`
            
        history && history.push({
            pathname,
            search: `type=${type}`
        })
    }, [history])

    const jumpToSwapPanel = useCallback((pair: string) => {
        history && history.push({
            pathname: `/trading/lite/${pair}`
        })
    }, [history])

    const getPopoverTrigger = useCallback(() => (
        <MoreIcon cursor={'pointer'} />
    ), [])

    const getPopoverPopper = useCallback((market: string, isLp: boolean) => {
        const marketList = isLp ? [] : getMakretArrayListCallback(market).filter(pair => {
            const [first, last] = pair.split('-')
            if (first === 'USDT' || last === 'USDT') {
                return true
            }
            return first === market
        })
        
        return (
            <Box borderRadius={'inherit'} minWidth={110}>
                {isLp ? (
                    <>
                    <MenuItem onClick={() => jumpToAmm(LpTokenAction.add, market)}>
                        <ListItemText>{t('labelPoolTableAddLiqudity')}</ListItemText>
                    </MenuItem>
                    <MenuItem onClick={() => jumpToAmm(LpTokenAction.remove, market)}>
                        <ListItemText>{t('labelPoolTableRemoveLiqudity')}</ListItemText>
                    </MenuItem>
                </>
                ) : (
                    marketList.map(pair => {
                        const formattedPair = pair.replace('-', ' / ')
                        return (
                            <MenuItem key={pair} onClick={() => jumpToSwapPanel(pair)}>
                                <ListItemText>{formattedPair}</ListItemText>
                            </MenuItem>
                        )
                    })
                )}
            </Box>
    )} , [t, jumpToAmm, jumpToSwapPanel, getMakretArrayListCallback])

    const getPopoverProps: any = useCallback((market: string, isLp: boolean) => (
        {
            type: PopoverType.click,
            popupId: 'testPopup',
            className: 'arrow-right',
            children: getPopoverTrigger(),
            popoverContent: getPopoverPopper(market, isLp),
            anchorOrigin: {
                vertical: 'bottom',
                horizontal: 'right',
            },
            transformOrigin: {
                vertical: 'top',
                horizontal: 'right',
            },
        }), [getPopoverTrigger, getPopoverPopper])

    const getColumnModeAssets = (t: TFunction): Column<Row, unknown>[] => [
        {
            key: 'token',
            name: t('labelToken'),
            formatter: ({row, column}) => {
                const token = row[ column.key ]
                // const StyledToken = styled(Box)`
                //     font-size: 13px;
                // `
                const tokenIcon: any = token.value ? coinJson[token.value] : undefined
                console.log(coinJson, token.value)
                return <>
                    <Box display={'flex'} alignItems={'center'}>
                        <Box component={'span'} className={'logo-icon'} height={'var(--list-menu-coin-size)'}
                                                    width={'var(--list-menu-coin-size)'} alignItems={'center'}
                                                    justifyContent={'center'} marginRight={2}>
                                                {tokenIcon ?
                            <AvatarCoinStyled imgx={tokenIcon.x} imgy={tokenIcon.y}
                                            imgheight={tokenIcon.height}
                                            imgwidth={tokenIcon.width} size={24}
                                            variant="circular"
                                            alt={token.value as string}
                                            src={'data:image/svg+xml;utf8,' + '<svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M0 0H36V36H0V0Z"/></svg>'}/>
                            : <Avatar variant="circular" alt={token.value as string}
                                    style={{
                                        width: 'var(--list-menu-coin-size)',
                                        height: 'var(--list-menu-coin-size)',
                                    }}
                                // src={sellData?.icon}
                                    src={'static/images/icon-default.png'}/>
                        }    
                        </Box> 
                        <Typography variant={'h6'}>{token.value}</Typography>
                    </Box>
                </>
            }
        },
        {
            key: 'amount',
            name: t('labelAmount'),
            // minWidth: 120,
        },
        {
            key: 'available',
            name: t('labelAvailable'),
        },
        {
            key: 'locked',
            name: t('labelLocked'),
            // minWidth: 120,
        },
        {
            key: 'actions',
            name: t('labelActions'),
            headerCellClass: 'textAlignRight',
            // minWidth: 280,
            formatter: ({row}) => {
                const token = row[ 'token' ]
                const isLp = token.type === TokenType.lp
                const lpPairList = token.value.split('-')
                lpPairList.splice(0, 1)
                const lpPair = lpPairList.join('-')
                const tokenValue = token.value
                const renderMarket = isLp ? lpPair : tokenValue

                return (
                    <GridStyled container spacing={1} justifyContent={'flex-start'} alignItems={'center'}>
                            <Grid item>
                                <Button variant={'text'} size={'medium'} color={'primary'}
                                        onClick={() => onShowDeposit(tokenValue)}>{t('labelDeposit')}</Button>
                            </Grid>
                            <Grid item>
                                <Button variant={'text'} size={'medium'} color={'primary'}
                                        onClick={() => onShowTransfer(tokenValue)}>{t('labelTransfer')}</Button>
                            </Grid>
                            <Grid item>
                                <Button variant={'text'} size={'medium'} color={'primary'}
                                        onClick={() => onShowWithdraw(tokenValue)}>{t('labelWithdraw')}</Button>
                            </Grid>
                            <Grid item marginTop={1}>
                                <Popover {...getPopoverProps(renderMarket, isLp)}></Popover>
                            </Grid>
                    </GridStyled>
                )
            }
        },
    ]

    const defaultArgs: any = {
        // rawData: [],
        columnMode: getColumnModeAssets(t).filter(o => !o.hidden),
        generateRows: (rawData: any) => rawData,
        generateColumns: ({columnsRaw}: any) => columnsRaw as Column<any, unknown>[],
    }

    const getRenderData = useCallback(() => pagination
        ? totalData.slice((page - 1) * pageSize, page * pageSize)
        : totalData
        , [page, pageSize, pagination, totalData])

    const updateData = useCallback(({
                                        TableType,
                                        currHideSmallBalance,
                                        currHideLPToken,
                                        currSearchValue,
                                    }) => {
        let resultData = (rawData && !!rawData.length) ? rawData : []
        if (currHideSmallBalance) {
            resultData = resultData.filter(o => !o.smallBalance)
        }
        if (currHideLPToken) {
            resultData = resultData.filter(o => o.token.type === TokenType.single)
        }
        if (TableType === 'filter') {
            setPage(1)
        }
        if (currSearchValue) {
            resultData = resultData.filter(o => o.token.value.toLowerCase().includes(currSearchValue.toLowerCase()))
        }
        setTotalData(resultData)
    }, [rawData])

    const handleFilterChange = useCallback(({currHideSmallBalance = hideSmallBalance, currHideLPToken = hideLPToken, currSearchValue = searchValue}) => {
        setHideSmallBalance(currHideSmallBalance)
        setHideLPToken(currHideLPToken)
        setSearchValue(currSearchValue)
        updateData({TableType: TableType.filter, currHideSmallBalance, currHideLPToken, currSearchValue})
    }, [updateData, hideSmallBalance, hideLPToken, searchValue])

    const handlePageChange = useCallback((page: number) => {
        setPage(page)
        updateData({TableType: TableType.page})
    }, [updateData])

    const getScrollIndex = useCallback((e) => {
        const startIndex = parseInt(String(e.target.scrollTop / 44))
        const viewportRows = rawData && Array.isArray(rawData) ? rawData.slice(startIndex, startIndex + 10).map(o => o.token.value) : []
        if (onVisibleRowsChange) {
            onVisibleRowsChange(viewportRows)
        }
    }, [onVisibleRowsChange, rawData])

    return <TableStyled lan={language}>
        {showFiliter && (
            <TableFilterStyled>
                <Filter 
                    originalData={rawData} 
                    handleFilterChange={handleFilterChange}
                    searchValue={searchValue}
                    hideSmallBalance={hideSmallBalance}
                    hideLpToken={hideLPToken}
                />
            </TableFilterStyled>
        )}
        <Table {...{...defaultArgs, ...props, rawData: getRenderData()}} onScroll={getScrollIndex}/>
        {pagination && (
            <TablePagination page={page} pageSize={pageSize} total={totalData.length} onPageChange={handlePageChange}/>
        )}
    </TableStyled>
})
