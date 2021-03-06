import styled from '@emotion/styled'
import { Box, Button } from '@material-ui/core'
import { withTranslation, WithTranslation } from 'react-i18next'
import { RouteComponentProps, withRouter } from 'react-router-dom'
import {
    EmptyValueTag,
    FloatTag,
    getThousandFormattedNumbers,
    StarHollowIcon,
    StarSolidIcon
} from '@loopring-web/common-resources'
import { Column, Table } from '../../basic-lib/tables/index'
import { TablePaddingX } from '../../styled'
import { IconButton, Typography } from '@material-ui/core/';
import { useSettings } from '@loopring-web/component-lib/src/stores'
import { useDispatch } from 'react-redux'

const TableWrapperStyled = styled(Box)`
    display: flex;
    flex-direction: column;
    flex: 1;

    ${({theme}) => TablePaddingX({pLeft: theme.unit * 3, pRight: theme.unit * 3})}
`

const TableStyled = styled(Table)`
    &.rdg{
        height: ${(props: any) => props.currentHeight}px;
        // height: 100%;
        --template-columns: 240px auto auto auto auto auto 92px !important;
        .rdg-cell.action{
            display: flex;
            justify-content: center;
            align-items: center;
        }
    }
    .textAlignRight{
        text-align: right;
    }
`

// export type QuoteTableRawDataItem = (string | number | string[] | number[])[]
export type QuoteTableRawDataItem = {
    pair: {
        coinA: string;
        coinB: string;
    }
    close: number;
    change: number;
    high: number;
    low: number;
    floatTag: keyof typeof FloatTag
    volume: number;
}

const QuoteTableChangedCell: any = styled.span`
	color: ${(props: any) => {
    const {theme: {colorBase}, upColor} = props
    const isUpColorGreen = upColor === 'green'
    return props.value > 0
        ? isUpColorGreen
            ? colorBase.success
            : colorBase.error
        : props.value < 0
            ? isUpColorGreen
                ? colorBase.error
                : colorBase.success
            : colorBase.textSecondary
}
}
`

// const StarIconWrapperStyled = styled(Box)`
//     color: var(--color-star);
//     margin: ${({theme}) => theme.unit}px ${({theme}) => theme.unit}px 0 0;
// ` as typeof Box

type IGetColumnModePros = {
    t: any,
    history: any,
    upColor: 'green' | 'red',
    handleStartClick: (event: React.MouseEvent<HTMLDivElement, MouseEvent>, isFavourite: boolean, pair: string) => void,
    favoriteMarket: string[]
}

// const getColumnModelQuoteTable = (t: TFunction, history: any): Column<Row, unknown>[] => [
const getColumnMode = (props: IGetColumnModePros): Column<QuoteTableRawDataItem, unknown>[] => {
    const {t: {t}, history, upColor, handleStartClick, favoriteMarket} = props
    return (
        [
            {
                key: 'pair',
                name: t('labelQuotaPair'),
                // sortable: true,
                // resizable: true,
                sortable: true,
                formatter: ({row}) => {
                    const {coinA, coinB} = row[ 'pair' ]
                    const pair = `${coinA}-${coinB}`
                    const isFavourite = favoriteMarket?.includes(pair)
                    return (
                        <Box className="rdg-cell-value"
                            display={'flex'}
                            alignItems={'center'}
                            >
                            <Typography  marginRight={1}>
                                <IconButton style={{color:'var(--color-star)'}} size={'medium'} onClick={(e:any) => handleStartClick(e, isFavourite, pair)}>
                                    {isFavourite ? (
                                        <StarSolidIcon  cursor={'pointer'}/>
                                    ) : (
                                        <StarHollowIcon cursor={'pointer'}/>
                                    )}
                                </IconButton>
                            </Typography>
                            <Typography component={'span'}>
                                {coinA}
                                <Typography
                                    component={'span'}
                                    color={'textSecondary'}
                                >
                                    / {coinB}
                                </Typography>
                            </Typography>
                        </Box>
                    )
                },
            },
            {
                key: 'close',
                name: t('labelQuotaLastPrice'),
                sortable: true,
                // resizable: true,
                formatter: ({row}) => {
                    const value = row[ 'close' ]
                    // const [valueFirst, valueLast] = value
                    // const getRenderValue = (value: number) => {
                    //     return Number.isFinite(value) ? value.toFixed(2) : EmptyValueTag;
                    // }
                    // const RenderValue = styled.span`
                    // 	color: var(--color-text-secondary)
                    // `
                    return (
                        <div className="rdg-cell-value">
                            <span>{typeof value !== 'undefined' ? getThousandFormattedNumbers(value) : EmptyValueTag}</span>
                        </div>
                    )
                },
            },
            {
                key: 'change',
                name: t('labelQuota24hChange'),
                // resizable: true,
                sortable: true,
                formatter: ({row}) => {
                    const value = row.change

                    // const hasValue = Number.isFinite(value)
                    // const isPositive = value > 0
                    // const sign = isPositive ? '+' : ''
                    // const renderValue = hasValue ? `${sign}${value.toFixed(2)}%` : 'N/A%'
                    return (
                        <div className="rdg-cell-value">
                            <QuoteTableChangedCell value={value} upColor={upColor}>
                                {typeof value !== 'undefined' ? (
                                    (row.floatTag === FloatTag.increase ? '+' : '') + Number(getThousandFormattedNumbers(value)).toFixed(2) + '%') : EmptyValueTag}
                            </QuoteTableChangedCell>
                        </div>
                    )
                },
            },
            {
                key: 'high',
                name: t('labelQuota24hHigh'),
                // resizable: true,
                sortable: true,
                formatter: ({row, column}) => {
                    const value = row[ column.key ]
                    // const hasValue = Number.isFinite(value)
                    // const renderValue = hasValue ? value.toFixed(2) : EmptyValueTag
                    return (
                        <div className="rdg-cell-value">
                            <span>{typeof value !== 'undefined' ? getThousandFormattedNumbers(value) : EmptyValueTag}</span>
                        </div>
                    )
                },
            },
            {
                key: 'low',
                name: t('labelQuota24hLow'),
                // resizable: true,
                sortable: true,
                formatter: ({row, column}) => {
                    const value = row[ column.key ]
                    // const hasValue = Number.isFinite(value)
                    // const renderValue = hasValue ? value.toFixed(2) : EmptyValueTag
                    return (
                        <div className="rdg-cell-value">
                            <span>{typeof value !== 'undefined' ? getThousandFormattedNumbers(value) : EmptyValueTag}</span>
                        </div>
                    )
                },
            },
            {
                key: 'volume',
                name: t('labelQuota24Volume'),
                // resizable: true,
                sortable: true,
                formatter: ({row}) => {
                    const value = row[ 'volume' ]
                    return (
                        <div className="rdg-cell-value">
                            <span>{typeof value !== 'undefined' ? getThousandFormattedNumbers(value) : EmptyValueTag}</span>
                        </div>
                    )
                },
            },
            {
                key: 'actions',
                // resizable: true,
                headerCellClass: 'textAlignRight',
                name: t('labelQuoteAction'),
                formatter: ({row}) => {
                    const {coinA, coinB} = row[ 'pair' ]
                    const tradePair = `${coinA}-${coinB}`
                    return (
                        <div className="rdg-cell-value">
                            <Button variant="outlined" onClick={() => history.push({
                                pathname: `/trading/lite/${tradePair}`
                            })}>Trade</Button>
                        </div>
                    )
                }
            }
        ]
    )
}

export interface QuoteTableProps {
    rawData: QuoteTableRawDataItem[];
    rowHeight?: number;
    onVisibleRowsChange?: (startIndex: number) => void;
    onRowClick?: (rowIdx: number, row: QuoteTableRawDataItem, column: any) => void;
    favoriteMarket: string[];
    addFavoriteMarket: (pair: string) => void;
    removeFavoriteMarket: (pair: string) => void;
    currentHeight?: number;
    // generateColumns: ({
    //                       columnsRaw,
    //                       t,
    //                       ...rest
    //                   }: { columnsRaw: readonly Column<R,unknown>[], [ key: string ]: any } & WithT) => Array<RdgColumns<R>>;
}

export type VisibleDataItem = {
    coinA: string;
    coinB: string;
}

export const QuoteTable = withTranslation('tables')(withRouter(({
                                                                    t,
                                                                    currentHeight = 350,
                                                                    rowHeight = 44,
                                                                    onVisibleRowsChange,
                                                                    rawData,
                                                                    history,
                                                                    onRowClick,
                                                                    favoriteMarket,
                                                                    addFavoriteMarket,
                                                                    removeFavoriteMarket,
                                                                    ...rest
                                                                }: QuoteTableProps & WithTranslation & RouteComponentProps) => {
    //const formattedRawData = rawData && Array.isArray(rawData) ? rawData : []

    // const getScrollIndex = useCallback((e) => {
    //     const startIndex = parseInt(String(e.target.scrollTop / rowHeight))
    //     // const data = rawData && Array.isArray(rawData) ? rawData : []
    //     // const viewportRows = data.slice(startIndex, startIndex + 10).map(o => ({
    //     //     coinA: o.pair.coinA,
    //     //     coinB: o.pair.coinB
    //     // }))
    //     if (onVisibleRowsChange) {
    //         onVisibleRowsChange(startIndex)
    //     }
    // }, [onVisibleRowsChange, rawData])

    let userSettings = useSettings()
    const upColor = userSettings?.upColor

    const dispatch = useDispatch()

    const handleStartClick = (event: React.MouseEvent<HTMLDivElement, MouseEvent>, isFavourite: boolean, pair: string) => {
        // console.log(isFavoourite, pair)
        event.stopPropagation()
        if (isFavourite) {
            dispatch(removeFavoriteMarket(pair))
            return
        }
        dispatch(addFavoriteMarket(pair))
    }

    // const finalData = formattedRawData.map(o => Object.values(o))
    const defaultArgs: any = {
        rawData: [],
        columnMode: getColumnMode({
            t: {t},
            history,
            upColor,
            handleStartClick,
            favoriteMarket,
        }),//getColumnModelQuoteTable(t, history),
        generateRows: (rawData: any) => rawData,
        onRowClick: onRowClick,
        generateColumns: ({columnsRaw}: any) => columnsRaw as Column<QuoteTableRawDataItem, unknown>[],
        sortMethod: (sortedRows: QuoteTableRawDataItem[], sortColumn: string) => {
            switch (sortColumn) {
                case 'pair':
                    sortedRows = sortedRows.sort((a, b) => {
                        const valueA = a.pair.coinA
                        const valueB = b.pair.coinA
                        return valueA.localeCompare(valueB)
                    })
                    break;
                case 'close':
                    sortedRows = sortedRows.sort((a, b) => {
                        const valueA = a[ 'close' ]
                        const valueB = b[ 'close' ]
                        if (valueA && valueB) {
                            return valueB - valueA
                        }
                        if (valueA && !valueB) {
                            return -1
                        }
                        if (!valueA && valueB) {
                            return 1
                        }
                        return 0
                    })
                    break;
                case 'change':
                    sortedRows = sortedRows.sort((a, b) => {
                        const valueA = a[ 'change' ]
                        const valueB = b[ 'change' ]
                        if (valueA && valueB) {
                            return valueB - valueA
                        }
                        if (valueA && !valueB) {
                            return -1
                        }
                        if (!valueA && valueB) {
                            return 1
                        }
                        return 0
                    })
                    break;
                case 'high':
                    sortedRows = sortedRows.sort((a, b) => {
                        const valueA = a[ 'high' ]
                        const valueB = b[ 'high' ]
                        if (valueA && valueB) {
                            return valueB - valueA
                        }
                        if (valueA && !valueB) {
                            return -1
                        }
                        if (!valueA && valueB) {
                            return 1
                        }
                        return 0
                    })
                    break;
                case 'low':
                    sortedRows = sortedRows.sort((a, b) => {
                        const valueA = a[ 'low' ]
                        const valueB = b[ 'low' ]
                        if (valueA && valueB) {
                            return valueB - valueA
                        }
                        if (valueA && !valueB) {
                            return -1
                        }
                        if (!valueA && valueB) {
                            return 1
                        }
                        return 0
                    })
                    break;
                case 'volume':
                    sortedRows = sortedRows.sort((a, b) => {
                        const valueA = a[ 'volume' ]
                        const valueB = b[ 'volume' ]
                        if (valueA && valueB) {
                            return valueB - valueA
                        }
                        if (valueA && !valueB) {
                            return -1
                        }
                        if (!valueA && valueB) {
                            return 1
                        }
                        return 0
                    })
                    break;
                default:
                    return sortedRows
            }
            return sortedRows;
        },
        sortDefaultKey: 'change'
    }

    return (
        <TableWrapperStyled>
            <TableStyled currentHeight={currentHeight} className={'scrollable'} {...{
                ...defaultArgs, ...rest,
                onVisibleRowsChange,
                rawData,
                rowHeight
            }}
                /* onScroll={getScrollIndex} */ />
        </TableWrapperStyled>
    )
}))
