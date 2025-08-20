/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import React from 'react';
import { mount } from 'enzyme';
import { findTestSubject } from '../../test';
import { renderCellValueRowAndColumnCount } from './data_grid_test_utils';
import { EuiDataGrid } from './data_grid';

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
