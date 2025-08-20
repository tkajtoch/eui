/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import React, { useState } from 'react';
import { mount, ReactWrapper } from 'enzyme';
import { render } from '../../test/rtl';
import type { EuiDataGridProps, RenderCellValue } from './data_grid_types';
import { EuiDataGrid } from './data_grid';
import { findTestSubject } from '../../test';

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
