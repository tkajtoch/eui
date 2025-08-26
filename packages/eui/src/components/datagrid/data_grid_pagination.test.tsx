/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import React, { useState } from 'react';
import { fireEvent } from '@testing-library/react';
import { render, within } from '../../test/rtl';
import { EuiDataGrid } from './data_grid';
import {
  extractGridDataRTL,
  renderCellRowAsValue,
} from './data_grid_test_utils';

describe('pagination', () => {
  it('renders', () => {
    const { container } = render(
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

    const paginationWrapper = container.querySelector(
      '.euiDataGrid__pagination'
    );

    expect(paginationWrapper).toMatchSnapshot();
  });

  describe('page navigation', () => {
    it('next button pages through content', () => {
      const onChangePage = jest.fn();

      const Component = () => {
        const [pageIndex, setPageIndex] = React.useState(0);

        return (
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
              pageIndex,
              pageSize: 3,
              pageSizeOptions: [3, 6, 10],
              onChangePage: (newPageIndex) => {
                // pass the call to the mock function to test newPageIndex
                // value changes
                onChangePage(newPageIndex);

                setPageIndex(newPageIndex);
              },
              onChangeItemsPerPage: jest.fn(),
            }}
          />
        );
      };

      const { container, getByTestSubject } = render(<Component />);

      expect(extractGridDataRTL(container)).toEqual([
        ['Column'],
        ['0'],
        ['1'],
        ['2'],
      ]);

      fireEvent.click(getByTestSubject('pagination-button-next'));

      expect(onChangePage).toHaveBeenCalledTimes(1);
      expect(onChangePage).toHaveBeenCalledWith(1);

      expect(extractGridDataRTL(container)).toEqual([
        ['Column'],
        ['3'],
        ['4'],
        ['5'],
      ]);

      fireEvent.click(getByTestSubject('pagination-button-next'));

      expect(onChangePage).toHaveBeenCalledTimes(2);
      expect(onChangePage).toHaveBeenCalledWith(2);

      expect(extractGridDataRTL(container)).toEqual([['Column'], ['6'], ['7']]);
    });

    it('pages are navigable through page links', () => {
      const onChangePage = jest.fn();

      const Component = () => {
        const [pageIndex, setPageIndex] = React.useState(0);

        return (
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
              pageIndex,
              pageSize: 3,
              pageSizeOptions: [3, 6, 10],
              onChangePage: (newPageIndex) => {
                // pass the call to the mock function to test newPageIndex
                // value changes
                onChangePage(newPageIndex);

                setPageIndex(newPageIndex);
              },
              onChangeItemsPerPage: jest.fn(),
            }}
          />
        );
      };

      const { container, getByTestSubject } = render(<Component />);

      expect(extractGridDataRTL(container)).toEqual([
        ['Column'],
        ['0'],
        ['1'],
        ['2'],
      ]);

      // goto page 3
      fireEvent.click(getByTestSubject('pagination-button-2'));

      expect(onChangePage).toHaveBeenCalledTimes(1);
      expect(onChangePage).toHaveBeenCalledWith(2);

      expect(extractGridDataRTL(container)).toEqual([['Column'], ['6'], ['7']]);

      // goto page 2
      fireEvent.click(getByTestSubject('pagination-button-1'));

      expect(onChangePage).toHaveBeenCalledTimes(2);
      expect(onChangePage).toHaveBeenCalledWith(1);

      expect(extractGridDataRTL(container)).toEqual([
        ['Column'],
        ['3'],
        ['4'],
        ['5'],
      ]);
    });
  });

  it('changes the page size', () => {
    const onChangeItemsPerPage = jest.fn();

    const Component = () => {
      const [pageSize, setPageSize] = useState(3);

      return (
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
            pageSize,
            pageSizeOptions: [3, 6, 10],
            onChangePage: jest.fn(),
            onChangeItemsPerPage: (newPageSize) => {
              // pass the call to the mock function to test newPageSize
              // value changes
              onChangeItemsPerPage(newPageSize);

              setPageSize(newPageSize);
            },
          }}
        />
      );
    };

    const { container, getByTestSubject } = render(<Component />);

    expect(extractGridDataRTL(container)).toEqual([
      ['Column'],
      ['0'],
      ['1'],
      ['2'],
    ]);

    fireEvent.click(getByTestSubject('tablePaginationPopoverButton'));

    const rowOptions = getByTestSubject('tablePaginationRowOptions');
    const withinRowOptions = within(rowOptions);

    expect(withinRowOptions.getAllByRole('button')).toHaveLength(3);
    expect(withinRowOptions.getByText('3 rows')).toBeInTheDocument();
    const sixRows = withinRowOptions.getByText('6 rows');
    expect(sixRows).toBeInTheDocument();
    expect(withinRowOptions.getByText('10 rows')).toBeInTheDocument();

    fireEvent.click(sixRows);

    expect(onChangeItemsPerPage).toHaveBeenCalledTimes(1);
    expect(onChangeItemsPerPage).toHaveBeenCalledWith(6);

    expect(extractGridDataRTL(container)).toEqual([
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
