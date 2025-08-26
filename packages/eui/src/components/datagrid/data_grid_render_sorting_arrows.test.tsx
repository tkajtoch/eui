/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import React from 'react';
import { render } from '../../test/rtl';
import { renderCellValueRowAndColumnCount } from './data_grid_test_utils';
import { EuiDataGrid } from './data_grid';

describe('render sorting arrows', () => {
  it('renders sorting arrows when direction is given', () => {
    const { getByTestSubject } = render(
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

    expect(
      getByTestSubject('dataGridHeaderCellSortingIcon-A')
    ).toBeInTheDocument();
    expect(
      getByTestSubject('dataGridHeaderCellSortingIcon-B')
    ).toBeInTheDocument();
  });

  it('does not render the arrows if the column is not sorted', () => {
    const { queryByTestSubject } = render(
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

    expect(
      queryByTestSubject('dataGridHeaderCellSortingIcon-C')
    ).not.toBeInTheDocument();
  });

  it('renders the icons if they are sorted but user is not allowed to perform any action', () => {
    const { getByTestSubject } = render(
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

    expect(
      getByTestSubject('dataGridHeaderCellSortingIcon-D')
    ).toBeInTheDocument();
  });
});
