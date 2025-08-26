/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import React from 'react';
import { mount, ReactWrapper } from 'enzyme';
import { EuiDataGrid } from './data_grid';
import {
  renderCellValueRowAndColumnCount,
  extractGridData,
  openColumnSelector,
  closeColumnSelector,
  openColumnSorter,
  closeColumnSorter,
  closeColumnSorterSelection,
  openColumnSorterSelection,
} from './data_grid_test_utils';

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

describe('updating column definitions', () => {
  it('renders the new set', () => {
    const component = mount(
      <EuiDataGrid
        aria-labelledby="#test"
        columns={[{ id: 'A' }, { id: 'B' }]}
        columnVisibility={{
          visibleColumns: ['A', 'B'],
          setVisibleColumns: () => {},
        }}
        rowCount={2}
        renderCellValue={renderCellValueRowAndColumnCount}
      />
    );

    expect(extractGridData(component)).toEqual([
      ['A', 'B'],
      ['0, A', '0, B'],
      ['1, A', '1, B'],
    ]);

    component.setProps({
      columns: [{ id: 'A' }, { id: 'C' }],
      columnVisibility: {
        visibleColumns: ['A', 'C'],
        setVisibleColumns: () => {},
      },
    });

    expect(extractGridData(component)).toEqual([
      ['A', 'C'],
      ['0, A', '0, C'],
      ['1, A', '1, C'],
    ]);
  });

  it('"Hide fields" updates', () => {
    const component = mount(
      <EuiDataGrid
        aria-labelledby="#test"
        columns={[{ id: 'A' }, { id: 'B' }]}
        columnVisibility={{
          visibleColumns: ['A', 'B'],
          setVisibleColumns: () => {},
        }}
        rowCount={2}
        renderCellValue={renderCellValueRowAndColumnCount}
      />
    );

    // verify original column list is A, B
    let popover = openColumnSelector(component);
    expect(
      popover
        .find('div.euiDataGridColumnSelector__item')
        .map((item) => item.text())
    ).toEqual(['A', 'B']);
    closeColumnSelector(component);

    // update columns
    component.setProps({
      columns: [{ id: 'A' }, { id: 'C' }],
      columnVisibility: {
        visibleColumns: ['A', 'C'],
        setVisibleColumns: () => {},
      },
    });

    // test that the column list updated to A,C
    popover = openColumnSelector(component);
    expect(
      popover
        .find('div.euiDataGridColumnSelector__item')
        .map((item) => item.text())
    ).toEqual(['A', 'C']);
    closeColumnSelector(component);
  });

  it('"Sort fields" updates', () => {
    const component = mount(
      <EuiDataGrid
        aria-labelledby="#test"
        columns={[{ id: 'A' }, { id: 'B' }]}
        columnVisibility={{
          visibleColumns: ['A', 'B'],
          setVisibleColumns: () => {},
        }}
        sorting={{
          onSort: () => {},
          columns: [],
        }}
        rowCount={2}
        renderCellValue={renderCellValueRowAndColumnCount}
      />
    );

    // verify original column list is A, B
    openColumnSorter(component);
    let popover = openColumnSorterSelection(component);
    expect(
      popover
        .find('button.euiDataGridColumnSorting__field')
        .map((item) => item.text())
    ).toEqual(['A', 'B']);
    closeColumnSorterSelection(component);
    closeColumnSorter(component);

    // update columns
    component.setProps({
      columns: [{ id: 'A' }, { id: 'C' }],
      columnVisibility: {
        visibleColumns: ['A', 'C'],
        setVisibleColumns: () => {},
      },
    });

    // test that the column list updated to A,C
    openColumnSorter(component);
    popover = openColumnSorterSelection(component);
    expect(
      popover
        .find('button.euiDataGridColumnSorting__field')
        .map((item) => item.text())
    ).toEqual(['A', 'C']);
    closeColumnSorterSelection(component);
    closeColumnSorter(component);
  });

  it('"Sort fields" button text updates', () => {
    const component = mount(
      <EuiDataGrid
        aria-labelledby="#test"
        columns={[{ id: 'A' }, { id: 'B' }]}
        columnVisibility={{
          visibleColumns: ['A', 'B'],
          setVisibleColumns: () => {},
        }}
        sorting={{
          onSort: () => {},
          columns: [],
        }}
        rowCount={2}
        renderCellValue={renderCellValueRowAndColumnCount}
      />
    );

    // Get column sort count
    const getBadgeText = () => {
      const button = component.find(
        'EuiButtonEmpty[data-test-subj="dataGridColumnSortingButton"]'
      );
      const badge = button.find('span.euiDataGridToolbarControl__badge');
      return badge.length ? badge.text() : false;
    };
    expect(getBadgeText()).toBeFalsy();

    // Update sorted columns
    component.setProps({
      sorting: {
        columns: [{ id: 'A', direction: 'asc' }],
        onSort: () => {},
      },
    });
    expect(getBadgeText()).toEqual('1');

    // Update sorted columns again
    component.setProps({
      sorting: {
        columns: [
          { id: 'A', direction: 'asc' },
          { id: 'B', direction: 'asc' },
        ],
        onSort: () => {},
      },
    });
    expect(getBadgeText()).toEqual('2');
  });
});
