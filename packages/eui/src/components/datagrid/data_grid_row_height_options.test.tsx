/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import React, { useState } from 'react';
import { fireEvent } from '@testing-library/react';
import { render } from '../../test/rtl';
import {
  extractRowHeightsRTL,
  renderCellRowAsValue,
} from './data_grid_test_utils';
import { EuiDataGrid } from './data_grid';

describe('rowHeightsOptions', () => {
  it('all row heights options applied correctly', async () => {
    const { container } = render(
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

    const cellHeights = extractRowHeightsRTL(container);
    expect(cellHeights).toEqual({
      0: '70px',
      1: '34px',
      2: '50px',
    });
  });

  it('render cells with correct height during pagination', () => {
    const Component = () => {
      const [pageIndex, setPageIndex] = useState(0);

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
            pageIndex,
            pageSize: 3,
            pageSizeOptions: [3, 6, 10],
            onChangePage: (newIndex) => {
              setPageIndex(newIndex);
            },
            onChangeItemsPerPage: jest.fn(),
          }}
        />
      );
    };

    const { container, getByTestSubject } = render(<Component />);

    expect(extractRowHeightsRTL(container)).toEqual({
      0: '70px',
      1: '34px',
      2: '50px',
    });

    fireEvent.click(getByTestSubject('pagination-button-next'));

    expect(extractRowHeightsRTL(container)).toEqual({
      3: '50px',
      4: '50px',
      5: '50px',
    });

    fireEvent.click(getByTestSubject('pagination-button-previous'));

    expect(extractRowHeightsRTL(container)).toEqual({
      0: '70px',
      1: '34px',
      2: '50px',
    });
  });
});
