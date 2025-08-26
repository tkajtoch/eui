/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import React, { useState } from 'react';
import { render } from '../../test/rtl';
import type { RenderCellValue } from './data_grid_types';
import { extractGridDataRTL } from './data_grid_test_utils';
import { EuiDataGrid } from './data_grid';

describe('cell rendering', () => {
  it('supports hooks', () => {
    const RenderCellValueWithHooks: RenderCellValue = ({
      rowIndex,
      columnId,
    }) => {
      const [value] = useState(`Hello, Row ${rowIndex}-${columnId}!`);
      return <span>{value}</span>;
    };
    const { container } = render(
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

    expect(extractGridDataRTL(container)).toMatchInlineSnapshot(`
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
      <div data-test-subj="renderedCell">{someContext ? 'hello' : 'world'}</div>
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
