import type { Column as RdgColumn } from 'react-data-grid';
import DataGrid, { SortColumn } from 'react-data-grid';
import styled from "@emotion/styled";
import { Trans, WithTranslation } from 'react-i18next';

import { WithT } from "i18next";
import React from "react";
import { Column, DataGridProps, SortableHeaderCell, SortableHeaderCellProps, TableProps } from './';
import { EmptyDefault } from '../empty';
// import loadingSvg from '@loopring-web/common-resources/assets/svg/loading.svg'
import { LoadingIcon } from '@loopring-web/common-resources'
import { Box, IconButton } from '@material-ui/core';

interface TableWrapperStyledProps {
  showloading: 'true' | 'false'
}

const TableWrapperStyled = styled(Box)<TableWrapperStyledProps>`
  display: flex;
  position: relative;
  flex: 1;

  &::after {
    visibility: ${({ showloading }) => showloading === 'true' ? 'visible' : 'hidden'};
    position: absolute;
    z-index: 20;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 100%;
    opacity: 0.2;
    background-color: var(--color-global-bg);
    content: '';
    pointer-events: auto;
  }
` as any

export const DataGridStyled = styled(DataGrid)`
  width: 100%;
  height: 100%;

  &.rdg {
    min-height: 350px;
    color: var(--color-text-primary);
    //color: inherit;
    box-sizing: border-box;
    border: rgba(0, 0, 0, 0) 0px solid;
    //background-color: inherit;
    font-family: Roboto;

    .rdg-header-row {
      color: var(--color-text-secondary);
      width: 100%;
      background-color: inherit;
      font-weight: normal;
    }

    &.scrollable .rdg-header-row {
      background: var(--color-box);
    }

    .rdg-header-sort-name {
      flex-grow: initial;
    }

    .rdg-header-sort-cell {
      .rdg-header-sort-name + span {
        display: none;
      }

      .rdg-header-sort-name {
        .sort-icon svg {
          display: inline-block;
          transform-origin: center;
        }

        .DESC svg {
          transform: rotate(0deg) translateX(-3px) scale(1.2);
        }

        .ASC svg {
          transform: rotate(180deg) translateX(-3px) scale(1.2);
        }

        .NONE svg {
          transform: rotate(90deg) translateX(-3px) scale(1.2);
        }

      }
    }

    .rdg-cell-selected {
      box-shadow: inherit;
    }

    .rdg-row {
      box-sizing: border-box;
      background-color: inherit;
      width: 100%;

      &:hover {
        background: var(--color-box-hover);

        .rdg-cell:first-of-type {
            // border-left: ${({theme}) => theme.border.borderConfig({d_W: 2, c_key: 'selected'})}
        }
      }
    }

    .rdg-cell {
      color: inherit;
      border-left: rgba(0, 0, 0, 0) 2px solid;
      border-right: rgba(0, 0, 0, 0) 2px solid;
      border-bottom: rgba(0, 0, 0, 0) 2px solid;
      box-sizing: border-box;
      height: 100%;
    }

    .rdg-cell[aria-selected=true] {
      box-shadow: none;
    }

    .rdg-cell.success {
      color: var(--color-success);
    }

    .rdg-cell.error {
      color: var(--color-error);
    }
  }

` as typeof DataGrid;

const LoadingStyled = styled(IconButton)`
  position: absolute;
  z-index: 21;
  top: 40%;
  left: 50%;
  transform: translate(-50%, -50%);
`

// interface Action {
//     type: 'toggleSubRow' | 'deleteSubRow' | 'refresh' | 'sort';
//     id: string;
//     uniqueKey: string;
// }
// function reducer<R extends { children: R[], [ key: string ]: any }, SR>(rows: R[], {type, id, uniqueKey}: Action): R[] {
//     switch (type) {
//         case 'toggleSubRow':
//             return toggleSubRow(rows, id, uniqueKey);
//         case 'deleteSubRow':
//             return deleteSubRow(rows, id);
//         default:
//             return rows;
//     }
// }


export const generateColumns = <Row, SR>({
                                             columnsRaw,
                                             t
                                         }: { columnsRaw: readonly Column<Row, SR>[], [ key: string ]: any } & WithT): RdgColumn<Row, SR>[] => {
    const columns: Column<Row, SR>[] = columnsRaw.reduce((prev: RdgColumn<Row, SR>[], column: Column<Row, SR>) => {
        const {name, isHidden} = column;
        if (typeof name === 'string' && !isHidden) {
            column.name = t(name);
            prev.push(column);
        }
        return prev;
    }, [])
    return columns as Column<Row, SR>[];
}
export const generateRows = <Row, SR>(rawData: [][], rest: TableProps<Row, SR>): Row[] => {
    const {columnMode} = rest;
    return rawData.map(row => row.reduce((prev: { [ key: string ]: any }, cell, index) => {
        if (columnMode[ index ]) {
            prev[ columnMode[ index ].key ] = cell;
        }
        return prev;
    }, {_rawData: row}) as Row)
};

export type ExtraTableProps = {
    showLoading?: boolean
}

//TODO:
// {isLoading && <div className={loadMoreRowsClassname}>Loading more rows...</div>
export const Table = <R, SR>(props: DataGridProps<R, SR> & WithTranslation & ExtraTableProps) => {
    const {
        EmptyRowsRenderer,
        generateRows,
        generateColumns,
        sortInitDirection,
        sortDefaultKey,
        sortMethod,
        rawData,
        style,
        frozeSort,
        rowRenderer,
        rowClassFn,
        rowKeyGetter,
        columnMode,
        onScroll,
        onRowClick,
        rowHeight,
        showLoading,
        t,
        ...rest
    } = props;

    const columns = generateColumns({columnsRaw: columnMode, t});
    const [rows, setRows] = React.useState(generateRows(rawData, props));

    React.useEffect(() => {
        setRows(generateRows(rawData, props));
    }, [rawData])
    /*** sort handle start ***/
    const [sortColumns, setSortColumns] = React.useState<readonly Readonly<SortColumn>[]>([{
        columnKey: sortDefaultKey as any,
        direction: sortInitDirection ? sortInitDirection : undefined as any
    }]);

    // const [[sortColumn, sortDirection], setSort] = React.useState<[string | undefined, SortDirection]>([sortDefaultKey, sortInitDirection ? sortInitDirection : undefined]);

    const sortedRows: readonly R[] = React.useMemo(() => {
        if (sortColumns.length === 0) return rows;
        const {columnKey, direction} = sortColumns[ 0 ];
        let sortedRows: R[] = [...rows];
        sortedRows = sortMethod ? sortMethod(sortedRows, columnKey, direction) : rows;
        return direction === 'DESC' ? sortedRows.reverse() : sortedRows;

    }, [rows, sortColumns, sortMethod]);
    // const [sortColumns, setSortColumns] = React.useState<readonly Readonly<SortColumn>[]>([]);
    const onSortColumnsChange = React.useCallback((sortColumns: SortColumn[]) => {
        setSortColumns(sortColumns.slice(-1));
    }, []);

    const loopringColumns = React.useMemo(() => {
        return columns.map(c => {
            if (c.headerRenderer) {
                return {...c} as Column<R, unknown>;
            } else {
                return {
                    ...c, headerRenderer: (props: SortableHeaderCellProps<R>) => <SortableHeaderCell {...props} />
                } as Column<R, unknown>;
            }
        }) as Column<R, unknown>[];
    }, [columns]);
    const RenderEmptyMsg = styled.span`
      display: flex;

      .link {
        margin: 0 5px;
      }
    `

    /*** sort handle end ***/
    return <TableWrapperStyled showloading={!!showLoading ? 'true' : 'false'}>
        <DataGridStyled
            {...rest}
            onScroll={onScroll}
            columns={loopringColumns as any}
            style={style}
            rows={(sortDefaultKey && sortedRows) ? sortedRows : rows}
            rowKeyGetter={rowKeyGetter}
            rowClass={row => rowClassFn ? rowClassFn(row, props) : ''}
            rowHeight={rowHeight ? rowHeight : 44}
            onRowsChange={setRows}
            onSortColumnsChange={onSortColumnsChange}
            // sortDirection={sortDirection}
            rowRenderer={rowRenderer as any}
            sortColumns={sortColumns}
            onRowClick={onRowClick}
            emptyRowsRenderer={!showLoading ? (() => EmptyRowsRenderer ? EmptyRowsRenderer :
                <EmptyDefault height={`calc(100% - var(--header-row-height))`} message={() => {
                    return <RenderEmptyMsg>
                        <Trans i18nKey="labelEmptyDefault">
                            Content is Empty
                        </Trans>
                    </RenderEmptyMsg>
                }}/>) : null}
        />
        {showLoading && (
            <LoadingStyled color={'inherit'}>
              <LoadingIcon />
            </LoadingStyled>
        )}
    </TableWrapperStyled>
        ;
    //  <EmptyDefault height={"calc(100% - 35px)"} url={'/path'} message={()=>{
    //  return <>Go to <Link to={'./path'}> link or event</Link> at here</>} } />   }
}
