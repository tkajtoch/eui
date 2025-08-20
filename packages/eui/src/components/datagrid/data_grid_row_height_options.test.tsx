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
import {
  extractRowHeights,
  renderCellRowAsValue,
} from './data_grid_test_utils';
import { EuiDataGrid } from './data_grid';

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

    findTestSubject(component, 'pagination-button-previous').simulate('click');

    expect(extractRowHeights(component)).toEqual({
      0: 70,
      1: 34,
      2: 50,
    });
  });
});
