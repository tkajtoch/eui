/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import React from 'react';
import { mount, ReactWrapper } from 'enzyme';
import type { EuiDataGridProps, RenderCellValue } from './data_grid_types';
import { EuiDataGrid } from './data_grid';
import { act } from '@testing-library/react';
import { findTestSubject } from '../../test';

function openColumnSorter(datagrid: ReactWrapper) {
  let popover = datagrid.find(
    'EuiPopover[data-test-subj="dataGridColumnSortingPopover"]'
  );
  expect(popover).not.euiPopoverToBeOpen();

  act(() => {
    popover
      .find('button[data-test-subj="dataGridColumnSortingButton"]')
      .simulate('click');
  });

  datagrid.update();

  popover = datagrid.find(
    'EuiPopover[data-test-subj="dataGridColumnSortingPopover"]'
  );
  expect(popover).euiPopoverToBeOpen();

  return popover;
}

function closeColumnSorter(datagrid: ReactWrapper) {
  let popover = datagrid.find(
    'EuiPopover[data-test-subj="dataGridColumnSortingPopover"]'
  );
  expect(popover).euiPopoverToBeOpen();

  act(() => {
    popover
      .find('button[data-test-subj="dataGridColumnSortingButton"]')
      .simulate('click');
  });

  datagrid.update();

  popover = datagrid.find(
    'EuiPopover[data-test-subj="dataGridColumnSortingPopover"]'
  );
  expect(popover).not.euiPopoverToBeOpen();

  return popover;
}

function openColumnSorterSelection(datagrid: ReactWrapper) {
  let columnSelectionPopover = datagrid.find(
    'EuiPopover[data-test-subj="dataGridColumnSortingPopoverColumnSelection"]'
  );
  expect(columnSelectionPopover).not.euiPopoverToBeOpen();
  act(() => {
    columnSelectionPopover
      .find('button[data-test-subj="dataGridColumnSortingSelectionButton"]')
      .simulate('click');
  });

  datagrid.update();

  columnSelectionPopover = datagrid.find(
    'EuiPopover[data-test-subj="dataGridColumnSortingPopoverColumnSelection"]'
  );
  expect(columnSelectionPopover).euiPopoverToBeOpen();

  return columnSelectionPopover;
}

function closeColumnSorterSelection(datagrid: ReactWrapper) {
  let columnSelectionPopover = datagrid.find(
    'EuiPopover[data-test-subj="dataGridColumnSortingPopoverColumnSelection"]'
  );
  // popover will go away if all of the columns are selected
  if (columnSelectionPopover.length > 0) {
    expect(columnSelectionPopover).euiPopoverToBeOpen();

    act(() => {
      columnSelectionPopover
        .find('button[data-test-subj="dataGridColumnSortingSelectionButton"]')
        .simulate('click');
    });

    datagrid.update();

    columnSelectionPopover = datagrid.find(
      'EuiPopover[data-test-subj="dataGridColumnSortingPopoverColumnSelection"]'
    );
    expect(columnSelectionPopover).not.euiPopoverToBeOpen();
  }

  return columnSelectionPopover;
}

function sortByColumn(
  datagrid: ReactWrapper,
  columnId: string,
  direction: 'asc' | 'desc' | 'off'
) {
  openColumnSorter(datagrid);

  let [columnSorter, currentSortDirection] = getColumnSortDirection(
    datagrid,
    columnId
  );

  // if this column isn't being sorted, enable it
  if (currentSortDirection === 'off') {
    act(() => {
      // @ts-ignore does not require an argument in this usage
      columnSorter.find('EuiSwitch').props().onChange!();
    });

    datagrid.update();

    // inspect the column's new sort details
    [columnSorter, currentSortDirection] = getColumnSortDirection(
      datagrid,
      columnId
    );
  }

  if (currentSortDirection !== direction) {
    const sortButton = columnSorter.find(
      `button[data-test-subj="euiDataGridColumnSorting-sortColumn-${columnId}-${direction}"]`
    );
    expect(sortButton.length).toBe(1);
    sortButton.simulate('click');
  }

  closeColumnSorter(datagrid);
}

const renderCellValueALowBHigh: RenderCellValue = ({ rowIndex, columnId }) =>
  // render A as 0, 1, 0, 1, 0 and B as 9->5
  columnId === 'A' ? rowIndex % 2 : 9 - rowIndex;

function getColumnSortDirection(
  datagrid: ReactWrapper,
  columnId: string
): [ReactWrapper, string] {
  // get the button that sorts by this column
  let columnSorter = datagrid.find(
    `div[data-test-subj="euiDataGridColumnSorting-sortColumn-${columnId}"]`
  );
  if (columnSorter.length === 0) {
    // need to enable this column
    openColumnSorterSelection(datagrid);

    // find button to enable this column and click it
    const selectColumnButton = datagrid.find(
      `button[data-test-subj="dataGridColumnSortingPopoverColumnSelection-${columnId}"]`
    );
    expect(selectColumnButton.length).toBe(1);
    // @ts-ignore onClick is known to exist, and does not require an argument in this usage
    act(() => selectColumnButton.props().onClick());

    // close column selection popover
    closeColumnSorterSelection(datagrid);

    // find the column sorter
    const columnSelectionPopover = datagrid.find(
      'EuiPopover[data-test-subj="dataGridColumnSortingPopover"]'
    );
    columnSorter = columnSelectionPopover.find(
      `div[data-test-subj="euiDataGridColumnSorting-sortColumn-${columnId}"]`
    );
  }

  expect(columnSorter.length).toBe(1);
  const activeSort = columnSorter.find(
    'button[className*="euiButtonGroupButton-isSelected"]'
  );

  const sortDirection = (
    activeSort.props() as {
      'data-test-subj': string;
    }
  )['data-test-subj'].match(/(?<direction>[^-]+)$/)!.groups!.direction;

  return [columnSorter, sortDirection];
}

function extractGridData(datagrid: ReactWrapper<EuiDataGridProps>) {
  const rows: string[][] = [];

  const headerCells = findTestSubject(datagrid, 'dataGridHeaderCell', '|=');
  const headerRow: string[] = [];
  headerCells.forEach((cell: any) =>
    headerRow.push(cell.find('div.euiDataGridHeaderCell__content').text())
  );
  rows.push(headerRow);

  // reduce the virtualized grid of cells into rows
  const columnCount = datagrid.prop('columnVisibility').visibleColumns.length;
  const gridCells = findTestSubject(datagrid, 'dataGridRowCell');
  const visibleRowsCount = gridCells.length / columnCount;
  for (let i = 0; i < visibleRowsCount; i++) {
    const rowContent: string[] = [];
    for (let j = i * columnCount; j < (i + 1) * columnCount; j++) {
      const cell = gridCells.at(j);
      rowContent.push(cell.find('[data-test-subj="cell-content"]').text());
    }
    rows.push(rowContent);
  }

  return rows;
}

expect.extend({
  toBeEuiPopover(received: ReactWrapper) {
    const pass = received.name() === 'EuiPopover';
    if (pass) {
      return {
        pass: true,
        message: () =>
          `expected component "${received.name}" to not be EuiPopover`,
      };
    } else {
      return {
        pass: false,
        message: () => `expected component "${received.name}" to be EuiPopover`,
      };
    }
  },
  euiPopoverToBeOpen(received) {
    expect(received).toBeEuiPopover();
    const { isOpen } = received.props();
    const pass = isOpen === true;
    if (pass) {
      return {
        pass: true,
        message: () => 'expected EuiPopover to be closed',
      };
    } else {
      return {
        pass: false,
        message: () => 'expected EuiPopover to be open',
      };
    }
  },
});
declare global {
  /* eslint-disable-next-line @typescript-eslint/no-namespace,no-redeclare */
  namespace jest {
    interface Matchers<R> {
      toBeEuiPopover(): R;

      euiPopoverToBeOpen(): R;
    }
  }
}

describe('column sorting', () => {
  it('calls the onSort callback', () => {
    const onSort = jest.fn((columns) => {
      component.setProps({ sorting: { columns, onSort } });
      component.update();
    });

    const component = mount(
      <EuiDataGrid
        aria-labelledby="#test"
        columns={[{ id: 'ColumnA' }]}
        columnVisibility={{
          visibleColumns: ['ColumnA'],
          setVisibleColumns: () => {},
        }}
        rowCount={1}
        sorting={{
          columns: [],
          onSort,
        }}
        renderCellValue={() => 'hello'}
      />
    );

    sortByColumn(component, 'ColumnA', 'desc');

    expect(onSort).toHaveBeenCalledTimes(2);
    expect(onSort).toHaveBeenCalledWith([{ id: 'ColumnA', direction: 'asc' }]);
    expect(onSort).toHaveBeenCalledWith([{ id: 'ColumnA', direction: 'desc' }]);

    const [, sortDirection] = getColumnSortDirection(component, 'ColumnA');
    expect(sortDirection).toBe('desc');
  });

  describe('in-memory sorting', () => {
    it('sorts on initial render', () => {
      const renderCellValue: RenderCellValue = ({ rowIndex, columnId }) =>
        // render A 0->4 and B 9->5
        columnId === 'A' ? rowIndex : 9 - rowIndex;
      const component = mount(
        <EuiDataGrid
          aria-label="test"
          columns={[{ id: 'A' }, { id: 'B' }]}
          columnVisibility={{
            visibleColumns: ['A', 'B'],
            setVisibleColumns: () => {},
          }}
          rowCount={5}
          renderCellValue={renderCellValue}
          inMemory={{ level: 'sorting' }}
          sorting={{
            columns: [{ id: 'A', direction: 'desc' }],
            onSort: () => {},
          }}
        />
      );

      expect(extractGridData(component)).toEqual([
        ['A', 'B'],
        ['4', '5'],
        ['3', '6'],
        ['2', '7'],
        ['1', '8'],
        ['0', '9'],
      ]);
    });

    it('sorts on multiple columns', () => {
      const component = mount(
        <EuiDataGrid
          aria-label="test"
          columns={[{ id: 'A' }, { id: 'B' }]}
          columnVisibility={{
            visibleColumns: ['A', 'B'],
            setVisibleColumns: () => {},
          }}
          rowCount={5}
          renderCellValue={renderCellValueALowBHigh}
          inMemory={{ level: 'sorting' }}
          sorting={{
            columns: [
              { id: 'A', direction: 'desc' },
              { id: 'B', direction: 'asc' },
            ],
            onSort: () => {},
          }}
        />
      );

      expect(extractGridData(component)).toEqual([
        ['A', 'B'],
        ['1', '6'],
        ['1', '8'],
        ['0', '5'],
        ['0', '7'],
        ['0', '9'],
      ]);
    });

    it('sorts in response to user interaction', () => {
      const onSort = jest.fn((columns) => {
        component.setProps({ sorting: { columns, onSort } });
        component.update();
      });

      const component = mount(
        <EuiDataGrid
          aria-labelledby="#test"
          columns={[{ id: 'A' }, { id: 'B' }]}
          columnVisibility={{
            visibleColumns: ['A', 'B'],
            setVisibleColumns: () => {},
          }}
          rowCount={5}
          renderCellValue={renderCellValueALowBHigh}
          inMemory={{ level: 'sorting' }}
          sorting={{
            columns: [],
            onSort,
          }}
        />
      );

      expect(extractGridData(component)).toEqual([
        ['A', 'B'],
        ['0', '9'],
        ['1', '8'],
        ['0', '7'],
        ['1', '6'],
        ['0', '5'],
      ]);

      sortByColumn(component, 'A', 'desc');
      expect(extractGridData(component)).toEqual([
        ['A', 'B'],
        ['1', '8'],
        ['1', '6'],
        ['0', '9'],
        ['0', '7'],
        ['0', '5'],
      ]);

      sortByColumn(component, 'B', 'asc');
      expect(extractGridData(component)).toEqual([
        ['A', 'B'],
        ['1', '6'],
        ['1', '8'],
        ['0', '5'],
        ['0', '7'],
        ['0', '9'],
      ]);
    });

    it('sorts with all digit groups in numerical-like', () => {
      const onSort = jest.fn((columns) => {
        component.setProps({ sorting: { columns, onSort } });
        component.update();
      });
      const renderCellValue: RenderCellValue = ({ rowIndex }) =>
        `1.0.${(rowIndex % 3) + rowIndex}`; // computes as 0,2,4,3,5

      const component = mount(
        <EuiDataGrid
          aria-label="test"
          columns={[{ id: 'version' }]}
          columnVisibility={{
            visibleColumns: ['version'],
            setVisibleColumns: () => {},
          }}
          rowCount={5}
          renderCellValue={renderCellValue}
          inMemory={{ level: 'sorting' }}
          sorting={{
            columns: [],
            onSort,
          }}
        />
      );

      // verify rows are unordered
      expect(extractGridData(component)).toEqual([
        ['version'],
        ['1.0.0'],
        ['1.0.2'],
        ['1.0.4'],
        ['1.0.3'],
        ['1.0.5'],
      ]);

      sortByColumn(component, 'version', 'asc');

      expect(extractGridData(component)).toEqual([
        ['version'],
        ['1.0.0'],
        ['1.0.2'],
        ['1.0.3'],
        ['1.0.4'],
        ['1.0.5'],
      ]);
    });
  });

  it('uses schema information to sort', () => {
    const renderCellValue: RenderCellValue = ({ rowIndex, columnId }) =>
      // render A 0->4 and B 12->8
      columnId === 'A' ? rowIndex : 12 - rowIndex;
    const component = mount(
      <EuiDataGrid
        aria-label="test"
        columns={[{ id: 'A' }, { id: 'B' }]}
        columnVisibility={{
          visibleColumns: ['A', 'B'],
          setVisibleColumns: () => {},
        }}
        rowCount={5}
        renderCellValue={renderCellValue}
        inMemory={{ level: 'sorting' }}
        sorting={{
          columns: [{ id: 'B', direction: 'asc' }],
          onSort: () => {},
        }}
      />
    );

    expect(extractGridData(component)).toEqual([
      ['A', 'B'],
      ['4', '8'],
      ['3', '9'],
      ['2', '10'],
      ['1', '11'],
      ['0', '12'],
    ]);
  });
});
