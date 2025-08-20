/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import React, { useEffect, useState } from 'react';
import { mount, ReactWrapper } from 'enzyme';
import { act, fireEvent } from '@testing-library/react';
import { findTestSubject, requiredProps } from '../../test';
import { render } from '../../test/rtl';
import { shouldRenderCustomStyles } from '../../test/internal';
import { keys } from '../../services';

import { EuiDataGridColumnResizer } from './body/header/column_resizer';
import type { EuiDataGridProps, RenderCellValue } from './data_grid_types';
import { EuiDataGrid } from './';

// Mock the cell popover (TODO: Move failing tests to Cypress and remove need for mock?)
jest.mock('../popover', () => ({
  ...jest.requireActual('../popover'),
  EuiWrappingPopover: ({ children }: { children: React.ReactNode }) => (
    <div data-test-subj="euiDataGridExpansionPopover">{children}</div>
  ),
}));

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

function extractRowHeights(datagrid: ReactWrapper) {
  return (
    findTestSubject(datagrid, 'dataGridRowCell') as ReactWrapper<any>
  ).reduce((heights: { [key: string]: number }, cell) => {
    const cellProps = cell.props();
    const cellContentProps = cell
      .find('[data-test-subj="cell-content"]')
      .props() as any;
    heights[cellContentProps.rowIndex] = parseFloat(cellProps.style.height);
    return heights;
  }, {});
}

function extractColumnWidths(datagrid: ReactWrapper) {
  return (
    findTestSubject(datagrid, 'dataGridHeaderCell', '|=') as ReactWrapper<any>
  ).reduce((widths: { [key: string]: number }, cell) => {
    const [, columnId] = cell
      .props()
      ['data-test-subj'].match(/dataGridHeaderCell-(.*)/);
    widths[columnId] = parseFloat(cell.props().style.width);
    return widths;
  }, {});
}

function resizeColumn(
  datagrid: ReactWrapper,
  columnId: string,
  columnWidth: number
) {
  const widths = extractColumnWidths(datagrid);
  const originalWidth = widths[columnId];

  const firstResizer = datagrid
    .find(`EuiDataGridColumnResizer[columnId="${columnId}"]`)
    .instance() as EuiDataGridColumnResizer;

  act(() => {
    firstResizer.onMouseDown({
      pageX: originalWidth,
      stopPropagation: () => {},
      preventDefault: () => {},
    } as React.MouseEvent<HTMLDivElement>);
  });
  act(() => firstResizer.onMouseMove({ pageX: columnWidth }));
  act(() => firstResizer.onMouseUp());

  datagrid.update();
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

const renderCellValueRowAndColumnCount: RenderCellValue = ({
  rowIndex,
  columnId,
}) => `${rowIndex}, ${columnId}`;

const renderCellRowAsValue: RenderCellValue = ({ rowIndex }) => rowIndex;

const renderCellValueALowBHigh: RenderCellValue = ({ rowIndex, columnId }) =>
  // render A as 0, 1, 0, 1, 0 and B as 9->5
  columnId === 'A' ? rowIndex % 2 : 9 - rowIndex;

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

describe('EuiDataGrid', () => {
  // Mock requestAnimationFrame to run immediately
  jest
    .spyOn(window, 'requestAnimationFrame')
    .mockImplementation((cb: any) => cb());

  shouldRenderCustomStyles(
    <EuiDataGrid
      aria-label=""
      columns={[]}
      columnVisibility={{ visibleColumns: [], setVisibleColumns: () => {} }}
      rowCount={0}
      renderCellValue={() => null}
    />
  );

  describe('cell rendering', () => {
    it('supports hooks', () => {
      const RenderCellValueWithHooks: RenderCellValue = ({
        rowIndex,
        columnId,
      }) => {
        const [value] = useState(`Hello, Row ${rowIndex}-${columnId}!`);
        return <span>{value}</span>;
      };
      const component = mount(
        <EuiDataGrid
          aria-label="test"
          columns={[{ id: 'Column 1' }, { id: 'Column 2' }]}
          columnVisibility={{
            visibleColumns: ['Column 1', 'Column 2'],
            setVisibleColumns: () => {},
          }}
          rowCount={2}
          renderCellValue={RenderCellValueWithHooks}
        />
      );
      expect(extractGridData(component)).toMatchInlineSnapshot(`
        [
          [
            "Column 1",
            "Column 2",
          ],
          [
            "Hello, Row 0-Column 1!",
            "Hello, Row 0-Column 2!",
          ],
          [
            "Hello, Row 1-Column 1!",
            "Hello, Row 1-Column 2!",
          ],
        ]
      `);
    });

    it('passes `cellContext` as props to the renderCellValue component', () => {
      const dataGridProps = {
        'aria-label': 'test',
        columns: [{ id: 'Column' }],
        columnVisibility: {
          visibleColumns: ['Column'],
          setVisibleColumns: () => {},
        },
        rowCount: 1,
      };

      const RenderCellValueWithContext: RenderCellValue = ({ someContext }) => (
        <div data-test-subj="renderedCell">
          {someContext ? 'hello' : 'world'}
        </div>
      );

      const { getByTestSubject, rerender } = render(
        <EuiDataGrid
          {...dataGridProps}
          renderCellValue={RenderCellValueWithContext}
          cellContext={{ someContext: true }}
        />
      );
      expect(getByTestSubject('renderedCell')).toHaveTextContent('hello');

      rerender(
        <EuiDataGrid
          {...dataGridProps}
          renderCellValue={RenderCellValueWithContext}
          cellContext={{ someContext: false }}
        />
      );
      expect(getByTestSubject('renderedCell')).toHaveTextContent('world');
    });
  });

  describe('pagination', () => {
    it('renders', () => {
      const component = mount(
        <EuiDataGrid
          aria-label="test grid"
          columns={[{ id: 'Column' }]}
          columnVisibility={{
            visibleColumns: ['Column'],
            setVisibleColumns: () => {},
          }}
          rowCount={10}
          renderCellValue={renderCellRowAsValue}
          pagination={{
            pageIndex: 1,
            pageSize: 6,
            pageSizeOptions: [3, 6, 10],
            onChangePage: () => {},
            onChangeItemsPerPage: () => {},
          }}
        />
      );

      expect(component.find('EuiTablePagination').render()).toMatchSnapshot();
    });

    describe('page navigation', () => {
      it('next button pages through content', () => {
        const component = mount(
          <EuiDataGrid
            aria-label="test grid"
            columns={[{ id: 'Column' }]}
            columnVisibility={{
              visibleColumns: ['Column'],
              setVisibleColumns: () => {},
            }}
            rowCount={8}
            renderCellValue={renderCellRowAsValue}
            pagination={{
              pageIndex: 0,
              pageSize: 3,
              pageSizeOptions: [3, 6, 10],
              onChangePage: jest.fn((pageIndex) => {
                const pagination = component.props().pagination;
                component.setProps({
                  pagination: { ...pagination, pageIndex },
                });
              }),
              onChangeItemsPerPage: jest.fn(),
            }}
          />
        );

        expect(extractGridData(component)).toEqual([
          ['Column'],
          ['0'],
          ['1'],
          ['2'],
        ]);

        findTestSubject(component, 'pagination-button-next').simulate('click');

        expect(component.props().pagination.onChangePage).toHaveBeenCalledTimes(
          1
        );
        const firstCallPageIndex =
          component.props().pagination.onChangePage.mock.calls[0][0];
        expect(firstCallPageIndex).toBe(1);

        expect(extractGridData(component)).toEqual([
          ['Column'],
          ['3'],
          ['4'],
          ['5'],
        ]);

        findTestSubject(component, 'pagination-button-next').simulate('click');

        expect(component.props().pagination.onChangePage).toHaveBeenCalledTimes(
          2
        );
        const secondCallPageIndex =
          component.props().pagination.onChangePage.mock.calls[1][0];
        expect(secondCallPageIndex).toBe(2);

        expect(extractGridData(component)).toEqual([['Column'], ['6'], ['7']]);
      });

      it('pages are navigable through page links', () => {
        const component = mount(
          <EuiDataGrid
            aria-label="test grid"
            columns={[{ id: 'Column' }]}
            columnVisibility={{
              visibleColumns: ['Column'],
              setVisibleColumns: () => {},
            }}
            rowCount={8}
            renderCellValue={renderCellRowAsValue}
            pagination={{
              pageIndex: 0,
              pageSize: 3,
              pageSizeOptions: [3, 6, 10],
              onChangePage: jest.fn((pageIndex) => {
                const pagination = component.props().pagination;
                component.setProps({
                  pagination: { ...pagination, pageIndex },
                });
              }),
              onChangeItemsPerPage: jest.fn(),
            }}
          />
        );

        expect(extractGridData(component)).toEqual([
          ['Column'],
          ['0'],
          ['1'],
          ['2'],
        ]);

        // goto page 3
        findTestSubject(component, 'pagination-button-2').simulate('click');

        expect(component.props().pagination.onChangePage).toHaveBeenCalledTimes(
          1
        );
        const firstCallPageIndex =
          component.props().pagination.onChangePage.mock.calls[0][0];
        expect(firstCallPageIndex).toBe(2);

        expect(extractGridData(component)).toEqual([['Column'], ['6'], ['7']]);

        // goto page 2
        findTestSubject(component, 'pagination-button-1').simulate('click');

        expect(component.props().pagination.onChangePage).toHaveBeenCalledTimes(
          2
        );
        const secondCallPageIndex =
          component.props().pagination.onChangePage.mock.calls[1][0];
        expect(secondCallPageIndex).toBe(1);

        expect(extractGridData(component)).toEqual([
          ['Column'],
          ['3'],
          ['4'],
          ['5'],
        ]);
      });
    });

    it('changes the page size', () => {
      const component = mount(
        <EuiDataGrid
          aria-label="test grid"
          columns={[{ id: 'Column' }]}
          columnVisibility={{
            visibleColumns: ['Column'],
            setVisibleColumns: () => {},
          }}
          rowCount={8}
          renderCellValue={renderCellRowAsValue}
          pagination={{
            pageIndex: 0,
            pageSize: 3,
            pageSizeOptions: [3, 6, 10],
            onChangePage: jest.fn(),
            onChangeItemsPerPage: jest.fn((pageSize) => {
              const pagination = component.props().pagination;
              component.setProps({
                pagination: { ...pagination, pageSize },
              });
            }),
          }}
        />
      );

      expect(extractGridData(component)).toEqual([
        ['Column'],
        ['0'],
        ['1'],
        ['2'],
      ]);

      act(() => {
        findTestSubject(component, 'tablePaginationPopoverButton').simulate(
          'click'
        );
      });

      const rowButtons: NodeListOf<HTMLButtonElement> =
        document.body.querySelectorAll('.euiContextMenuItem');
      expect(
        Array.prototype.map.call(
          rowButtons,
          (button: HTMLDivElement) => button.textContent || ''
        )
      ).toEqual(['3 rows', '6 rows', '10 rows']);

      act(() => {
        rowButtons[1].click();
      });

      expect(
        component.props().pagination.onChangeItemsPerPage
      ).toHaveBeenCalledTimes(1);
      const firstCallPageIndex =
        component.props().pagination.onChangeItemsPerPage.mock.calls[0][0];
      expect(firstCallPageIndex).toBe(6);

      expect(extractGridData(component)).toEqual([
        ['Column'],
        ['0'],
        ['1'],
        ['2'],
        ['3'],
        ['4'],
        ['5'],
      ]);
    });
  });

  describe('column sizing', () => {
    it('uses a columns initialWidth', () => {
      const component = mount(
        <EuiDataGrid
          aria-labelledby="#test"
          columns={[{ id: 'Column 1', initialWidth: 400 }, { id: 'Column 2' }]}
          columnVisibility={{
            visibleColumns: ['Column 1', 'Column 2'],
            setVisibleColumns: () => {},
          }}
          rowCount={3}
          renderCellValue={() => 'value'}
        />
      );

      const originalCellWidths = extractColumnWidths(component);
      expect(originalCellWidths).toEqual({
        'Column 1': 400,
        'Column 2': 100,
      });
    });

    describe('resizing', () => {
      it('resizes a column by grab handles', () => {
        const component = mount(
          <EuiDataGrid
            aria-labelledby="#test"
            columns={[{ id: 'Column 1' }, { id: 'Column 2' }]}
            columnVisibility={{
              visibleColumns: ['Column 1', 'Column 2'],
              setVisibleColumns: () => {},
            }}
            rowCount={3}
            renderCellValue={() => 'value'}
          />
        );

        act(() => {
          const originalCellWidths = extractColumnWidths(component);
          expect(originalCellWidths).toEqual({
            'Column 1': 100,
            'Column 2': 100,
          });
        });

        resizeColumn(component, 'Column 1', 150);

        act(() => {
          const updatedCellWidths = extractColumnWidths(component);
          expect(updatedCellWidths).toEqual({
            'Column 1': 150,
            'Column 2': 100,
          });
        });
      });

      it('should listen for column resize', () => {
        const onColumnResizeCallback = jest.fn();
        const component = mount(
          <EuiDataGrid
            aria-labelledby="#test"
            columns={[{ id: 'Column 1' }, { id: 'Column 2', initialWidth: 75 }]}
            columnVisibility={{
              visibleColumns: ['Column 1', 'Column 2'],
              setVisibleColumns: () => {},
            }}
            rowCount={3}
            renderCellValue={() => 'value'}
            onColumnResize={(args) => onColumnResizeCallback(args)}
          />
        );

        resizeColumn(component, 'Column 1', 150);
        resizeColumn(component, 'Column 2', 100);

        expect(onColumnResizeCallback.mock.calls.length).toBe(2);
        expect(onColumnResizeCallback.mock.calls[0][0]).toEqual({
          columnId: 'Column 1',
          width: 150,
        });
        expect(onColumnResizeCallback.mock.calls[1][0]).toEqual({
          columnId: 'Column 2',
          width: 100,
        });
      });

      it('is prevented by isResizable:false', () => {
        const component = mount(
          <EuiDataGrid
            aria-labelledby="#test"
            columns={[
              { id: 'Column 1', isResizable: false },
              { id: 'Column 2' },
            ]}
            columnVisibility={{
              visibleColumns: ['Column 1', 'Column 2'],
              setVisibleColumns: () => {},
            }}
            rowCount={3}
            renderCellValue={() => 'value'}
          />
        );

        const originalCellWidths = extractColumnWidths(component);
        expect(originalCellWidths).toEqual({
          'Column 1': 100,
          'Column 2': 100,
        });

        // verify there is no resizer on Column 1 but that there is on Column 2
        expect(
          component.find('EuiDataGridColumnResizer[columnId="Column 1"]').length
        ).toBe(0);
        expect(
          component.find('EuiDataGridColumnResizer[columnId="Column 2"]').length
        ).toBe(1);
      });

      it('does not trigger value re-renders', () => {
        const renderCellValue = jest.fn(() => 'value');

        const component = mount(
          <EuiDataGrid
            aria-labelledby="#test"
            columns={[{ id: 'ColumnA' }]}
            columnVisibility={{
              visibleColumns: ['ColumnA'],
              setVisibleColumns: () => {},
            }}
            rowCount={3}
            renderCellValue={renderCellValue}
          />
        );

        expect(renderCellValue).toHaveBeenCalledTimes(3);
        renderCellValue.mockClear();

        resizeColumn(component, 'ColumnA', 200);

        expect(extractColumnWidths(component)).toEqual({ ColumnA: 200 });
        expect(renderCellValue).toHaveBeenCalledTimes(0);
      });
    });
  });

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
      expect(onSort).toHaveBeenCalledWith([
        { id: 'ColumnA', direction: 'asc' },
      ]);
      expect(onSort).toHaveBeenCalledWith([
        { id: 'ColumnA', direction: 'desc' },
      ]);

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

  describe('render column actions', () => {
    it('renders various column actions configurations', () => {
      const component = mount(
        <EuiDataGrid
          aria-labelledby="#test"
          sorting={{
            columns: [{ id: 'A', direction: 'asc' }],
            onSort: () => {},
          }}
          columns={[
            { id: 'A', actions: false },
            { id: 'B', isSortable: true },
            {
              id: 'C',
              isSortable: true,
              actions: {
                showHide: false,
                showMoveRight: false,
                showMoveLeft: false,
                showSortAsc: false,
                showSortDesc: false,
                additional: [{ label: 'test' }],
              },
            },
            {
              id: 'D',
              isSortable: true,
              actions: {
                showHide: false,
                showMoveRight: false,
                showMoveLeft: false,
                additional: [{ label: 'test' }],
              },
            },
            {
              id: 'E',
              isSortable: true,
              actions: {
                showHide: { label: '1' },
                showSortAsc: { label: '2' },
                showSortDesc: { label: '3' },
                showMoveLeft: { label: '4' },
                showMoveRight: { label: '5' },
                additional: [{ label: 'test' }],
              },
            },
          ]}
          columnVisibility={{
            visibleColumns: ['A', 'B', 'C', 'D', 'E'],
            setVisibleColumns: () => {},
          }}
          rowCount={2}
          renderCellValue={renderCellValueRowAndColumnCount}
        />
      );

      const buttonA = findTestSubject(
        component,
        'dataGridHeaderCellActionButton-A'
      );
      expect(buttonA.length).toBe(0);

      for (const col of ['B', 'C', 'D', 'E']) {
        const button = findTestSubject(
          component,
          `dataGridHeaderCellActionButton-${col}`
        );
        button.simulate('click');
        component.update();
        const actionGroup = findTestSubject(
          component,
          `dataGridHeaderCellActionGroup-${col}`
        );
        expect(actionGroup.render()).toMatchSnapshot();
      }
    });
  });

  describe('render sorting arrows', () => {
    it('renders sorting arrows when direction is given', () => {
      const component = mount(
        <EuiDataGrid
          aria-labelledby="#test"
          sorting={{
            columns: [
              { id: 'A', direction: 'asc' },
              { id: 'B', direction: 'desc' },
            ],
            onSort: () => {},
          }}
          columns={[
            { id: 'A', isSortable: true },
            { id: 'B', isSortable: true },
          ]}
          columnVisibility={{
            visibleColumns: ['A', 'B'],
            setVisibleColumns: () => {},
          }}
          rowCount={2}
          renderCellValue={renderCellValueRowAndColumnCount}
        />
      );
      const arrowA = findTestSubject(
        component,
        'dataGridHeaderCellSortingIcon-A'
      );
      expect(arrowA.length).toBe(1);

      const arrowB = findTestSubject(
        component,
        'dataGridHeaderCellSortingIcon-B'
      );
      expect(arrowB.length).toBe(1);
    });

    it('does not render the arrows if the column is not sorted', () => {
      const component = mount(
        <EuiDataGrid
          aria-labelledby="#test"
          sorting={{
            columns: [],
            onSort: () => {},
          }}
          columns={[
            {
              id: 'C',
              isSortable: true,
              actions: {
                showHide: false,
                showMoveRight: false,
                showMoveLeft: false,
                showSortAsc: false,
                showSortDesc: false,
                additional: [{ label: 'test' }],
              },
            },
          ]}
          columnVisibility={{
            visibleColumns: ['C'],
            setVisibleColumns: () => {},
          }}
          rowCount={2}
          renderCellValue={renderCellValueRowAndColumnCount}
        />
      );
      const arrowC = findTestSubject(
        component,
        'dataGridHeaderCellSortingIcon-C'
      );
      expect(arrowC.length).toBe(0);
    });

    it('renders the icons if they are sorted but user is not allowed to perform any action', () => {
      const component = mount(
        <EuiDataGrid
          aria-labelledby="#test"
          sorting={{
            columns: [{ id: 'D', direction: 'asc' }],
            onSort: () => {},
          }}
          columns={[{ id: 'D', actions: false }]}
          columnVisibility={{
            visibleColumns: ['D'],
            setVisibleColumns: () => {},
          }}
          rowCount={2}
          renderCellValue={renderCellValueRowAndColumnCount}
        />
      );
      const arrowD = findTestSubject(
        component,
        'dataGridHeaderCellSortingIcon-D'
      );
      expect(arrowD.length).toBe(1);
    });
  });

  describe('render column cell actions', () => {
    it('renders various column cell actions configurations after cell gets hovered', async () => {
      const alertFn = jest.fn();
      const happyFn = jest.fn();
      const component = mount(
        <EuiDataGrid
          aria-labelledby="#test"
          sorting={{
            columns: [{ id: 'A', direction: 'asc' }],
            onSort: () => {},
          }}
          columns={[
            {
              id: 'A',
              isSortable: true,
              cellActions: [
                ({ rowIndex, columnId, Component, isExpanded }) => {
                  return (
                    <Component
                      onClick={() => alertFn(rowIndex, columnId)}
                      iconType="warning"
                      aria-label="test1 aria label"
                      data-test-subj={
                        isExpanded ? 'alertActionPopover' : 'alertAction'
                      }
                    >
                      test1
                    </Component>
                  );
                },
                ({ rowIndex, columnId, Component, isExpanded }) => {
                  return (
                    <Component
                      onClick={() => happyFn(rowIndex, columnId)}
                      iconType="faceHappy"
                      aria-label="test2 aria label"
                      data-test-subj={
                        isExpanded ? 'happyActionPopover' : 'happyAction'
                      }
                    >
                      test2
                    </Component>
                  );
                },
              ],
            },
          ]}
          columnVisibility={{
            visibleColumns: ['A'],
            setVisibleColumns: () => {},
          }}
          rowCount={2}
          renderCellValue={renderCellValueRowAndColumnCount}
        />
      );

      // cell buttons should not get rendered for unfocused, unhovered cell
      expect(findTestSubject(component, 'alertAction').exists()).toBe(false);
      expect(findTestSubject(component, 'happyAction').exists()).toBe(false);

      act(() => {
        findTestSubject(component, 'dataGridRowCell')
          .at(1)
          .prop('onMouseEnter')!({} as React.MouseEvent);
      });

      component.update();

      findTestSubject(component, 'alertAction').at(0).simulate('click');
      expect(alertFn).toHaveBeenCalledWith(1, 'A');
      findTestSubject(component, 'happyAction').at(0).simulate('click');
      expect(happyFn).toHaveBeenCalledWith(1, 'A');
      alertFn.mockReset();
      happyFn.mockReset();

      findTestSubject(component, 'dataGridRowCell')
        .at(1)
        .simulate('keydown', { key: keys.ENTER });
      component.update();

      findTestSubject(component, 'alertActionPopover').simulate('click');
      expect(alertFn).toHaveBeenCalledWith(1, 'A');
      findTestSubject(component, 'happyActionPopover').simulate('click');
      expect(happyFn).toHaveBeenCalledWith(1, 'A');
    });
  });

  describe('rowHeightsOptions', () => {
    it('all row heights options applied correctly', async () => {
      const component = mount(
        <EuiDataGrid
          aria-labelledby="#test"
          columns={[{ id: 'Column 1' }, { id: 'Column 2' }]}
          columnVisibility={{
            visibleColumns: ['Column 1', 'Column 2'],
            setVisibleColumns: () => {},
          }}
          rowCount={3}
          renderCellValue={() => 'value'}
          rowHeightsOptions={{
            defaultHeight: 50,
            rowHeights: {
              0: 70,
              1: {
                lineCount: 3,
              },
            },
          }}
        />
      );

      const cellHeights = extractRowHeights(component);
      expect(cellHeights).toEqual({
        0: 70,
        1: 34,
        2: 50,
      });
    });

    it('render cells with correct height during pagination', () => {
      const component = mount(
        <EuiDataGrid
          aria-label="test grid"
          columns={[{ id: 'Column' }]}
          columnVisibility={{
            visibleColumns: ['Column'],
            setVisibleColumns: () => {},
          }}
          rowCount={8}
          renderCellValue={renderCellRowAsValue}
          rowHeightsOptions={{
            defaultHeight: 50,
            rowHeights: {
              0: 70,
              1: {
                lineCount: 3,
              },
            },
          }}
          pagination={{
            pageIndex: 0,
            pageSize: 3,
            pageSizeOptions: [3, 6, 10],
            onChangePage: jest.fn((pageIndex) => {
              const pagination = component.props().pagination;
              component.setProps({
                pagination: { ...pagination, pageIndex },
              });
            }),
            onChangeItemsPerPage: jest.fn(),
          }}
        />
      );

      expect(extractRowHeights(component)).toEqual({
        0: 70,
        1: 34,
        2: 50,
      });

      findTestSubject(component, 'pagination-button-next').simulate('click');

      expect(extractRowHeights(component)).toEqual({
        3: 50,
        4: 50,
        5: 50,
      });

      findTestSubject(component, 'pagination-button-previous').simulate(
        'click'
      );

      expect(extractRowHeights(component)).toEqual({
        0: 70,
        1: 34,
        2: 50,
      });
    });
  });

  it('calls onFullScreenChange when fullscreen button is clicked', () => {
    const onFullScreenChange = jest.fn();
    const { getByTestSubject } = render(
      <EuiDataGrid
        {...requiredProps}
        columns={[{ id: 'A' }, { id: 'B' }]}
        columnVisibility={{
          visibleColumns: ['A', 'B'],
          setVisibleColumns: () => {},
        }}
        rowCount={3}
        renderCellValue={renderCellValueRowAndColumnCount}
        toolbarVisibility={{ showFullScreenSelector: true }}
        onFullScreenChange={onFullScreenChange}
      />
    );

    const button = getByTestSubject('dataGridFullScreenButton');
    expect(button).toBeInTheDocument();

    fireEvent.click(button);
    expect(onFullScreenChange).toHaveBeenCalledWith(true);

    fireEvent.click(button);
    expect(onFullScreenChange).toHaveBeenCalledWith(false);
  });
});
