/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import React from 'react';
import { mount, ReactWrapper } from 'enzyme';
import { act } from '@testing-library/react';
import { findTestSubject } from '../../test';
import type { EuiDataGridProps, RenderCellValue } from './data_grid_types';
import { EuiDataGrid } from './data_grid';

const renderCellRowAsValue: RenderCellValue = ({ rowIndex }) => rowIndex;

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
