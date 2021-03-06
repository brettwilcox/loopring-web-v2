import styled from '@emotion/styled'
import { Meta, Story } from '@storybook/react/types-6-0'
import { withTranslation } from 'react-i18next'
import { MemoryRouter } from 'react-router-dom'
import { AssetsTable, RawDataAssetsItem, TokenType } from './index'

const Style = styled.div`
	
	flex: 1;
	height: 100%;
	flex: 1;
`

const rawData: RawDataAssetsItem[] = [
    {
        token: {
            type: TokenType.single,
            value: 'LRC'
        },
        amount: '25987.09324',
        available: '25987.01234',
        locked: '5.9873',
        tradePairList: [
            {
                first: 'LRC',
                last: 'ETH'
            },
            {
                first: 'LRC',
                last: 'BTC'
            },
            {
                first: 'LRC',
                last: 'LTC'
            },
        ],
        smallBalance: false,
    },
    {
        token: {
            type: TokenType.lp,
            value: 'LP-LRC-USDT'
        },
        amount: '987.09324',
        available: '887.01234',
        locked: '115.9873',
        tradePairList: undefined,
        smallBalance: true
    },
    {
        token: {
            type: TokenType.lp,
            value: 'LP-ETH-USDT'
        },
        amount: '15987.09324',
        available: '15687.01234',
        locked: '312.9073',
        tradePairList: undefined,
        smallBalance: false
    },
    {
        token: {
            type: TokenType.single,
            value: 'LRC'
        },
        amount: '25987.09324',
        available: '25987.01234',
        locked: '5.9873',
        tradePairList: [
            {
                first: 'LRC',
                last: 'ETH'
            },
            {
                first: 'LRC',
                last: 'BTC'
            },
            {
                first: 'LRC',
                last: 'LTC'
            },
        ],
        smallBalance: false,
    },
    {
        token: {
            type: TokenType.lp,
            value: 'LP-LRC-USDT'
        },
        amount: '987.09324',
        available: '887.01234',
        locked: '115.9873',
        tradePairList: undefined,
        smallBalance: true
    },
    {
        token: {
            type: TokenType.lp,
            value: 'LP-ETH-USDT'
        },
        amount: '15987.09324',
        available: '15687.01234',
        locked: '312.9073',
        tradePairList: undefined,
        smallBalance: false
    },
    {
        token: {
            type: TokenType.single,
            value: 'LRC'
        },
        amount: '25987.09324',
        available: '25987.01234',
        locked: '5.9873',
        tradePairList: [
            {
                first: 'LRC',
                last: 'ETH'
            },
            {
                first: 'LRC',
                last: 'BTC'
            },
            {
                first: 'LRC',
                last: 'LTC'
            },
        ],
        smallBalance: false,
    },
    {
        token: {
            type: TokenType.lp,
            value: 'LP-LRC-USDT'
        },
        amount: '987.09324',
        available: '887.01234',
        locked: '115.9873',
        tradePairList: undefined,
        smallBalance: true
    },
    {
        token: {
            type: TokenType.lp,
            value: 'LP-ETH-USDT'
        },
        amount: '15987.09324',
        available: '15687.01234',
        locked: '312.9073',
        tradePairList: undefined,
        smallBalance: false
    },
    {
        token: {
            type: TokenType.single,
            value: 'LRC'
        },
        amount: '25987.09324',
        available: '25987.01234',
        locked: '5.9873',
        tradePairList: [
            {
                first: 'LRC',
                last: 'ETH'
            },
            {
                first: 'LRC',
                last: 'BTC'
            },
            {
                first: 'LRC',
                last: 'LTC'
            },
        ],
        smallBalance: false,
    },
    {
        token: {
            type: TokenType.lp,
            value: 'LP-LRC-USDT'
        },
        amount: '987.09324',
        available: '887.01234',
        locked: '115.9873',
        tradePairList: undefined,
        smallBalance: true
    },
    {
        token: {
            type: TokenType.lp,
            value: 'LP-ETH-USDT'
        },
        amount: '15987.09324',
        available: '15687.01234',
        locked: '312.9073',
        tradePairList: undefined,
        smallBalance: false
    },
]

const Template: Story<any> = withTranslation()((args: any) => {
    return (
        <>
            <Style>
                <MemoryRouter initialEntries={['/']}>
                    <AssetsTable {...args} />
                    <div style={{marginTop: 24}}>
                        <AssetsTable {...args} pagination={{
                            pageSize: 5
                        }} showFiliter/>
                    </div>
                </MemoryRouter>
            </Style>
        </>
    )
}) as Story<any>

export const Assets = Template.bind({})

Assets.args = {
    rawData: rawData,
    // pagination: {
    //     pageSize: 5
    // }
    onVisibleRowsChange: (data: any) => {
        console.log(data)
    }
}

export default {
    title: 'components/TableList/Assets',
    component: AssetsTable,
    argTypes: {},
} as Meta
