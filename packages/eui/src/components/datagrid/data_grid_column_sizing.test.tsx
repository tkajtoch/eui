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
import { EuiDataGridColumnResizer } from './body/header/column_resizer';
import { EuiDataGrid } from './data_grid';

function extractColumnWidths(datagrid: ReactWrapper) {
  return (
    findTestSubject(datagrid, 'dataGridHeaderCell', '|=') as ReactWrapper<any>
  ).reduce((widths: { [key: string]: number }, cell) => {
    const [, columnId] = cell
      .props()
      ['data-test-subj'].match(/dataGridHeaderCell-(.*)/);
    widths[columnId] = parseFloat(cell.props().style.width);
    return widths;
  }, {});
}

function resizeColumn(
  datagrid: ReactWrapper,
  columnId: string,
  columnWidth: number
) {
  const widths = extractColumnWidths(datagrid);
  const originalWidth = widths[columnId];

  const firstResizer = datagrid
    .find(`EuiDataGridColumnResizer[columnId="${columnId}"]`)
    .instance() as EuiDataGridColumnResizer;

  act(() => {
    firstResizer.onMouseDown({
      pageX: originalWidth,
      stopPropagation: () => {},
      preventDefault: () => {},
    } as React.MouseEvent<HTMLDivElement>);
  });
  act(() => firstResizer.onMouseMove({ pageX: columnWidth }));
  act(() => firstResizer.onMouseUp());

  datagrid.update();
}

describe('column sizing', () => {
  it('uses a columns initialWidth', () => {
    const component = mount(
      <EuiDataGrid
        aria-labelledby="#test"
        columns={[{ id: 'Column 1', initialWidth: 400 }, { id: 'Column 2' }]}
        columnVisibility={{
          visibleColumns: ['Column 1', 'Column 2'],
          setVisibleColumns: () => {},
        }}
        rowCount={3}
        renderCellValue={() => 'value'}
      />
    );

    const originalCellWidths = extractColumnWidths(component);
    expect(originalCellWidths).toEqual({
      'Column 1': 400,
      'Column 2': 100,
    });
  });

  describe('resizing', () => {
    it('resizes a column by grab handles', () => {
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
        />
      );

      act(() => {
        const originalCellWidths = extractColumnWidths(component);
        expect(originalCellWidths).toEqual({
          'Column 1': 100,
          'Column 2': 100,
        });
      });

      resizeColumn(component, 'Column 1', 150);

      act(() => {
        const updatedCellWidths = extractColumnWidths(component);
        expect(updatedCellWidths).toEqual({
          'Column 1': 150,
          'Column 2': 100,
        });
      });
    });

    it('should listen for column resize', () => {
      const onColumnResizeCallback = jest.fn();
      const component = mount(
        <EuiDataGrid
          aria-labelledby="#test"
          columns={[{ id: 'Column 1' }, { id: 'Column 2', initialWidth: 75 }]}
          columnVisibility={{
            visibleColumns: ['Column 1', 'Column 2'],
            setVisibleColumns: () => {},
          }}
          rowCount={3}
          renderCellValue={() => 'value'}
          onColumnResize={(args) => onColumnResizeCallback(args)}
        />
      );

      resizeColumn(component, 'Column 1', 150);
      resizeColumn(component, 'Column 2', 100);

      expect(onColumnResizeCallback.mock.calls.length).toBe(2);
      expect(onColumnResizeCallback.mock.calls[0][0]).toEqual({
        columnId: 'Column 1',
        width: 150,
      });
      expect(onColumnResizeCallback.mock.calls[1][0]).toEqual({
        columnId: 'Column 2',
        width: 100,
      });
    });

    it('is prevented by isResizable:false', () => {
      const component = mount(
        <EuiDataGrid
          aria-labelledby="#test"
          columns={[{ id: 'Column 1', isResizable: false }, { id: 'Column 2' }]}
          columnVisibility={{
            visibleColumns: ['Column 1', 'Column 2'],
            setVisibleColumns: () => {},
          }}
          rowCount={3}
          renderCellValue={() => 'value'}
        />
      );

      const originalCellWidths = extractColumnWidths(component);
      expect(originalCellWidths).toEqual({
        'Column 1': 100,
        'Column 2': 100,
      });

      // verify there is no resizer on Column 1 but that there is on Column 2
      expect(
        component.find('EuiDataGridColumnResizer[columnId="Column 1"]').length
      ).toBe(0);
      expect(
        component.find('EuiDataGridColumnResizer[columnId="Column 2"]').length
      ).toBe(1);
    });

    it('does not trigger value re-renders', () => {
      const renderCellValue = jest.fn(() => 'value');

      const component = mount(
        <EuiDataGrid
          aria-labelledby="#test"
          columns={[{ id: 'ColumnA' }]}
          columnVisibility={{
            visibleColumns: ['ColumnA'],
            setVisibleColumns: () => {},
          }}
          rowCount={3}
          renderCellValue={renderCellValue}
        />
      );

      expect(renderCellValue).toHaveBeenCalledTimes(3);
      renderCellValue.mockClear();

      resizeColumn(component, 'ColumnA', 200);

      expect(extractColumnWidths(component)).toEqual({ ColumnA: 200 });
      expect(renderCellValue).toHaveBeenCalledTimes(0);
    });
  });
});
