import React, { useEffect } from 'react'
import { WithTranslation, withTranslation } from 'react-i18next'
import { Tabs, Tab, Box } from '@material-ui/core'
import { TransactionTable, TradeTable, AmmTable } from '@loopring-web/component-lib'
import { StylePaper } from '../../styled'
import { useGetTxs, useGetTrades, useGetAmmRecord } from './hooks';

const TxPanel = withTranslation('common')((rest:WithTranslation<'common'>) => {
    const [pageSize, setPageSize] = React.useState(0);
    const [currentTab, setCurrentTab] = React.useState('transactions')

    const { txs: txTableData, txsTotal, showLoading: showTxsLoading, getUserTxnList } = useGetTxs()
    const { userTrades, showLoading: showTradesLoading} = useGetTrades()
    const { ammRecordList, showLoading: ammLoading } = useGetAmmRecord()

    const { t } = rest
    const container = React.useRef(null);

    React.useEffect(() => {
        // @ts-ignore
        let height = container?.current?.offsetHeight;
        if (height) {
            setPageSize(Math.floor((height - 120) / 44) - 2);
        }
    }, [container, pageSize]);

    useEffect(() => {
        if (pageSize) {
            getUserTxnList({
                limit: pageSize,
            })
        }
    }, [getUserTxnList, pageSize])

    return (
        <StylePaper ref={container}>
            <Box marginTop={2} marginLeft={2}>
                <Tabs value={currentTab} onChange={(_event, value) => setCurrentTab(value)} aria-label="l2-history-tabs">
                    <Tab label={t('labelLayer2HistoryTransactions')} value="transactions"></Tab>
                    <Tab label={t('labelLayer2HistoryTrades')} value="trades"></Tab>
                    <Tab label={t('labelLayer2HistoryAmmRecords')} value="ammRecords"></Tab>
                </Tabs>
            </Box>
            <div className="tableWrapper">
                {currentTab === 'transactions' ? (
                    <TransactionTable {...{
                        rawData: txTableData,
                        pagination: {
                            pageSize: pageSize,
                            total: txsTotal,
                        },
                        showFilter: true,
                        showLoading: showTxsLoading,
                        getTxnList: getUserTxnList,
                        ...rest
                    }} />
                ) : currentTab === 'trades' ? (
                    <TradeTable {...{
                        rawData: userTrades,
                        // pagination: {
                        //     pageSize: pageSize
                        // },
                        showFilter: true,
                        showLoading: showTradesLoading,
                        ...rest}}/>
                ) : (
                    // <AmmRecordTable rawData={myAmmMarketArray} handlePageChange={_handlePageChange} page={page}/>
                    <AmmTable {...{
                        rawData: ammRecordList,
                        pagination: {
                            pageSize: pageSize
                        },
                        showFilter: true,
                        showLoading: ammLoading,
                        ...rest}}/>
                ) }
            </div>
        </StylePaper>
    )
})

export default TxPanel
