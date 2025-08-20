/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import React, { useEffect } from 'react';
import { mount, ReactWrapper } from 'enzyme';
import { act } from '@testing-library/react';
import { render } from '../../test/rtl';
import { findTestSubject } from '../../test';
import type { EuiDataGridProps, RenderCellValue } from './data_grid_types';
import { EuiDataGrid } from './data_grid';

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

function openColumnSelector(datagrid: ReactWrapper) {
  let popover = datagrid.find(
    'EuiPopover[data-test-subj="dataGridColumnSelectorPopover"]'
  );
  expect(popover).not.euiPopoverToBeOpen();

  act(() => {
    popover
      .find('button[data-test-subj="dataGridColumnSelectorButton"]')
      .simulate('click');
  });

  datagrid.update();

  popover = datagrid.find(
    'EuiPopover[data-test-subj="dataGridColumnSelectorPopover"]'
  );
  expect(popover).euiPopoverToBeOpen();

  return popover;
}

function closeColumnSelector(datagrid: ReactWrapper) {
  let popover = datagrid.find(
    'EuiPopover[data-test-subj="dataGridColumnSelectorPopover"]'
  );
  expect(popover).euiPopoverToBeOpen();

  act(() => {
    popover
      .find('button[data-test-subj="dataGridColumnSelectorButton"]')
      .simulate('click');
  });

  datagrid.update();

  popover = datagrid.find(
    'EuiPopover[data-test-subj="dataGridColumnSelectorPopover"]'
  );
  expect(popover).not.euiPopoverToBeOpen();

  return popover;
}

function setColumnVisibility(
  datagrid: ReactWrapper,
  columnId: string,
  isVisible: boolean
) {
  const popover = openColumnSelector(datagrid);

  // toggle column's visibility switch
  const portal = popover.find('EuiPortal');

  const columnSwitch = portal.find(`EuiSwitch[name="${columnId}"]`);
  const switchInput = columnSwitch.find('button');
  switchInput.getDOMNode().setAttribute('aria-checked', `${isVisible}`);
  switchInput.simulate('click');

  closeColumnSelector(datagrid);
}

function moveColumnToIndex(
  datagrid: ReactWrapper<EuiDataGridProps>,
  columnId: string,
  nextIndex: number
) {
  // open datagrid column options
  let popover = datagrid.find(
    'EuiPopover[data-test-subj="dataGridColumnSelectorPopover"]'
  );
  expect(popover).not.euiPopoverToBeOpen();

  act(() => {
    popover
      .find('button[data-test-subj="dataGridColumnSelectorButton"]')
      .simulate('click');
  });

  datagrid.update();

  popover = datagrid.find(
    'EuiPopover[data-test-subj="dataGridColumnSelectorPopover"]'
  );
  expect(popover).euiPopoverToBeOpen();

  const [initialColumnOrder] = extractGridData(datagrid);
  const initialColumnIndex = initialColumnOrder.indexOf(columnId);

  // "drag" column into new location
  const portal = popover.find('EuiPortal');
  act(() =>
    portal.find('EuiDragDropContext').props().onDragEnd!({
      // @ts-ignore - only `index` is used from `source`, don't need to mock rest of the event
      source: { index: initialColumnIndex },
      destination: { index: nextIndex },
    })
  );

  datagrid.update();

  // close popover
  popover = datagrid.find(
    'EuiPopover[data-test-subj="dataGridColumnSelectorPopover"]'
  );
  expect(popover).euiPopoverToBeOpen();

  act(() => {
    popover
      .find('button[data-test-subj="dataGridColumnSelectorButton"]')
      .simulate('click');
  });

  datagrid.update();

  popover = datagrid.find(
    'EuiPopover[data-test-subj="dataGridColumnSelectorPopover"]'
  );
  expect(popover).not.euiPopoverToBeOpen();
}

const renderCellValueRowAndColumnCount: RenderCellValue = ({
  rowIndex,
  columnId,
}) => `${rowIndex}, ${columnId}`;

describe('column options', () => {
  it('column visibility can be toggled', () => {
    const columnVisibility = {
      visibleColumns: ['ColumnA', 'ColumnB'],
      setVisibleColumns: (visibleColumns: string[]) => {
        columnVisibility.visibleColumns = visibleColumns;
        component.setProps({ columnVisibility });
      },
    };

    const component = mount(
      <EuiDataGrid
        aria-labelledby="#test"
        columns={[{ id: 'ColumnA' }, { id: 'ColumnB' }]}
        columnVisibility={columnVisibility}
        rowCount={2}
        renderCellValue={renderCellValueRowAndColumnCount}
      />
    );

    expect(extractGridData(component)).toEqual([
      ['ColumnA', 'ColumnB'],
      ['0, ColumnA', '0, ColumnB'],
      ['1, ColumnA', '1, ColumnB'],
    ]);

    setColumnVisibility(component, 'ColumnA', false);
    expect(extractGridData(component)).toEqual([
      ['ColumnB'],
      ['0, ColumnB'],
      ['1, ColumnB'],
    ]);

    setColumnVisibility(component, 'ColumnA', true);
    expect(extractGridData(component)).toEqual([
      ['ColumnA', 'ColumnB'],
      ['0, ColumnA', '0, ColumnB'],
      ['1, ColumnA', '1, ColumnB'],
    ]);
  });

  it('column order can be changed', () => {
    const columnVisibility = {
      visibleColumns: ['ColumnA', 'ColumnB'],
      setVisibleColumns: (visibleColumns: string[]) => {
        columnVisibility.visibleColumns = visibleColumns;
        component.setProps({ columnVisibility });
      },
    };

    const component = mount(
      <EuiDataGrid
        aria-labelledby="#test"
        columns={[{ id: 'ColumnA' }, { id: 'ColumnB' }]}
        columnVisibility={columnVisibility}
        rowCount={2}
        renderCellValue={renderCellValueRowAndColumnCount}
      />
    );

    expect(extractGridData(component)).toEqual([
      ['ColumnA', 'ColumnB'],
      ['0, ColumnA', '0, ColumnB'],
      ['1, ColumnA', '1, ColumnB'],
    ]);

    moveColumnToIndex(component, 'ColumnB', 0);

    expect(extractGridData(component)).toEqual([
      ['ColumnB', 'ColumnA'],
      ['0, ColumnB', '0, ColumnA'],
      ['1, ColumnB', '1, ColumnA'],
    ]);
  });

  it('resets cell props on column reorder', () => {
    const columnVisibility = {
      visibleColumns: ['ColumnA', 'ColumnB'],
      setVisibleColumns: (visibleColumns: string[]) => {
        columnVisibility.visibleColumns = visibleColumns;
        component.setProps({ columnVisibility });
      },
    };

    const RenderCellValue: RenderCellValue = ({
      rowIndex,
      columnId,
      setCellProps,
    }) => {
      useEffect(() => {
        if (columnId === 'ColumnB') {
          setCellProps({ style: { color: 'blue' } });
        }
      }, [columnId, rowIndex, setCellProps]);

      return `${rowIndex}-${columnId}`;
    };

    const component = mount(
      <EuiDataGrid
        aria-labelledby="#test"
        columns={[{ id: 'ColumnA' }, { id: 'ColumnB' }]}
        columnVisibility={columnVisibility}
        rowCount={1}
        renderCellValue={RenderCellValue}
      />
    );

    const getCellColorAt = (index: number) =>
      component
        .find('div[data-test-subj="dataGridRowCell"]')
        .at(index)
        .prop('style')?.color;

    expect(getCellColorAt(0)).toEqual(undefined);
    expect(getCellColorAt(1)).toEqual('blue');

    moveColumnToIndex(component, 'B', 0);

    expect(getCellColorAt(0)).toEqual('blue');
    expect(getCellColorAt(1)).toEqual(undefined);
  });

  test('column display, displayAsText, and displayHeaderCellProps', () => {
    const { container, getByTitle, getByTestSubject } = render(
      <EuiDataGrid
        aria-labelledby="#test"
        columnVisibility={{
          visibleColumns: ['ColumnA'],
          setVisibleColumns: () => {},
        }}
        columns={[
          {
            id: 'ColumnA',
            display: <span data-test-subj="display">Hello world</span>,
            displayAsText: 'displayAsText',
            displayHeaderCellProps: { className: 'displayHeaderCellProps' },
          },
        ]}
        rowCount={1}
        renderCellValue={renderCellValueRowAndColumnCount}
      />
    );

    expect(
      container.querySelector('.euiDataGridHeaderCell.displayHeaderCellProps')
    ).toBeDefined();
    expect(getByTestSubject('display')).toBeInTheDocument();
    expect(getByTitle('displayAsText')).toBeInTheDocument();
  });

  describe('canDragAndDropColumns', () => {
    it('should render draggable header columns cells', () => {
      const columnVisibility = {
        visibleColumns: ['ColumnA', 'ColumnB'],
        setVisibleColumns: () => {},
        canDragAndDropColumns: true,
      };

      const { getByTestSubject } = render(
        <EuiDataGrid
          aria-labelledby="#test"
          columns={[{ id: 'ColumnA' }, { id: 'ColumnB' }]}
          columnVisibility={columnVisibility}
          rowCount={2}
          renderCellValue={renderCellValueRowAndColumnCount}
        />
      );

      expect(
        getByTestSubject('euiDataGridHeaderDroppable')
      ).toBeInTheDocument();
      expect(
        getByTestSubject('dataGridHeaderCell-ColumnA').parentElement
      ).toHaveClass('euiDraggable');
    });
  });
});
