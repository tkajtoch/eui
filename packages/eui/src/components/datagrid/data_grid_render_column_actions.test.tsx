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
import { fireEvent } from '@testing-library/react';

describe('render column actions', () => {
  it('renders various column actions configurations', () => {
    const { getByTestSubject, queryByTestSubject } = render(
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

    expect(
      queryByTestSubject('dataGridHeaderCellActionButton-A')
    ).not.toBeInTheDocument();

    for (const col of ['B', 'C', 'D', 'E']) {
      fireEvent.click(
        getByTestSubject(`dataGridHeaderCellActionButton-${col}`)
      );

      expect(
        getByTestSubject(`dataGridHeaderCellActionGroup-${col}`)
      ).toMatchSnapshot();
    }
  });
});
