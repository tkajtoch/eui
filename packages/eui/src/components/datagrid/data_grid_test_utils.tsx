/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import { ReactWrapper } from 'enzyme';
import type { EuiDataGridProps, RenderCellValue } from './data_grid_types';
import { findTestSubject } from '../../test';
import { within } from '../../test/rtl';
import { act } from '@testing-library/react';

export function extractGridDataRTL(container: HTMLElement) {
  const withinContainer = within(container);
  const rows: string[][] = [];

  const headerRow: string[] = [];
  withinContainer
    .getAllByTestSubject(/^dataGridHeaderCell-/)
    .forEach((cell) => {
      const content = cell.querySelector('.euiDataGridHeaderCell__content');
      headerRow.push(content?.textContent || '');
    });
  rows.push(headerRow);

  // reduce the virtualized grid of cells into rows
  const gridCells = withinContainer.getAllByTestSubject(/^dataGridRowCell/);
  const numberOfRows = gridCells.length / headerRow.length;

  // sanity check to confirm the total number of body cells is correct
  expect(Number.isInteger(numberOfRows)).toBe(true);

  for (let rowIndex = 0; rowIndex < numberOfRows; rowIndex++) {
    const row: string[] = [];
    for (let colindex = 0; colindex < headerRow.length; colindex++) {
      const cellElement = gridCells[rowIndex * headerRow.length + colindex];
      const contentElement = cellElement.querySelector(
        '.euiDataGridRowCell__content'
      );
      row.push(contentElement?.textContent || '');
    }
    rows.push(row);
  }

  return rows;
}

export function extractGridData(datagrid: ReactWrapper<EuiDataGridProps>) {
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

export function openColumnSorterSelection(datagrid: ReactWrapper) {
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

export function closeColumnSorterSelection(datagrid: ReactWrapper) {
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

export function openColumnSorter(datagrid: ReactWrapper) {
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

export function closeColumnSorter(datagrid: ReactWrapper) {
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

export function openColumnSelector(datagrid: ReactWrapper) {
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

export function closeColumnSelector(datagrid: ReactWrapper) {
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

export const renderCellValueRowAndColumnCount: RenderCellValue = ({
  rowIndex,
  columnId,
}) => `${rowIndex}, ${columnId}`;

export const renderCellRowAsValue: RenderCellValue = ({ rowIndex }) => rowIndex;

export function extractRowHeights(datagrid: ReactWrapper) {
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
