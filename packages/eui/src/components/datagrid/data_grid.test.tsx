/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import React, { useEffect } from 'react';
import { fireEvent } from '@testing-library/react';
import { requiredProps } from '../../test';
import { render } from '../../test/rtl';
import { shouldRenderCustomStyles } from '../../test/internal';
import {
  renderCellRowAsValue,
  renderCellValueRowAndColumnCount,
} from './data_grid_test_utils';
import { EuiDataGrid } from './data_grid';
import type { RenderCellValue } from './data_grid_types';

const renderCellBasedOnColumnId: RenderCellValue = ({ columnId }) => {
  if (columnId === 'A') {
    return 5.5;
  } else if (columnId === 'B') {
    return 'true';
  } else {
    return 'asdf';
  }
};

describe('EuiDataGrid', () => {
  shouldRenderCustomStyles(
    <EuiDataGrid
      aria-label=""
      columns={[]}
      columnVisibility={{ visibleColumns: [], setVisibleColumns: () => {} }}
      rowCount={0}
      renderCellValue={() => null}
    />
  );

  describe('rendering', () => {
    const getBoundingClientRect =
      window.Element.prototype.getBoundingClientRect;
    beforeAll(() => {
      window.Element.prototype.getBoundingClientRect = () =>
        ({ width: 100, height: 100 } as DOMRect);
    });
    afterAll(() => {
      window.Element.prototype.getBoundingClientRect = getBoundingClientRect;
    });

    it('renders with common and div attributes', () => {
      const { container } = render(
        <EuiDataGrid
          {...requiredProps}
          columns={[{ id: 'A' }, { id: 'B' }]}
          columnVisibility={{
            visibleColumns: ['A', 'B'],
            setVisibleColumns: () => {},
          }}
          rowCount={3}
          renderCellValue={renderCellValueRowAndColumnCount}
        />
      );

      expect(container).toMatchSnapshot();
    });

    it('renders custom column headers', () => {
      const { container } = render(
        <EuiDataGrid
          {...requiredProps}
          columns={[
            { id: 'A', display: 'Column A' },
            { id: 'B', display: <div>More Elements</div> },
          ]}
          columnVisibility={{
            visibleColumns: ['A', 'B'],
            setVisibleColumns: () => {},
          }}
          rowCount={3}
          renderCellValue={renderCellValueRowAndColumnCount}
        />
      );

      expect(container).toMatchSnapshot();
    });

    it('renders and applies custom props', () => {
      const RenderCellValueSetCellProps: RenderCellValue = ({
        rowIndex,
        columnId,
        setCellProps,
      }) => {
        useEffect(() => {
          setCellProps({
            className: 'customClass',
            'data-test-subj': `cell-${rowIndex}-${columnId}`,
            style: { color: columnId === 'A' ? 'red' : 'blue' },
          });
        }, [columnId, rowIndex, setCellProps]);

        return `${rowIndex}, ${columnId}`;
      };

      const { container, getByTestSubject } = render(
        <EuiDataGrid
          {...requiredProps}
          columns={[{ id: 'A' }, { id: 'B' }]}
          columnVisibility={{
            visibleColumns: ['A', 'B'],
            setVisibleColumns: () => {},
          }}
          rowCount={2}
          renderCellValue={RenderCellValueSetCellProps}
        />
      );

      expect(container.querySelectorAll('.customClass')).toHaveLength(4);
      expect(getByTestSubject('dataGridRowCell cell-0-A')).toHaveStyle(
        'color: rgb(255, 0, 0)'
      );
      expect(getByTestSubject('dataGridRowCell cell-1-B')).toHaveStyle(
        'color: rgb(0, 0, 255)'
      );
    });

    it('renders additional toolbar controls', () => {
      const { container } = render(
        <EuiDataGrid
          {...requiredProps}
          columns={[{ id: 'A' }, { id: 'B' }]}
          columnVisibility={{
            visibleColumns: ['A', 'B'],
            setVisibleColumns: () => {},
          }}
          rowCount={3}
          renderCellValue={renderCellValueRowAndColumnCount}
          toolbarVisibility={{ additionalControls: <button>Button</button> }}
        />
      );

      expect(container).toMatchSnapshot();
    });

    it('renders control columns', () => {
      const { container } = render(
        <EuiDataGrid
          {...requiredProps}
          columns={[{ id: 'A' }, { id: 'B' }]}
          columnVisibility={{
            visibleColumns: ['A', 'B'],
            setVisibleColumns: () => {},
          }}
          leadingControlColumns={[
            {
              id: 'leading',
              width: 50,
              headerCellRender: () => <span>leading heading</span>,
              headerCellProps: { className: 'leadingControlCol' },
              rowCellRender: renderCellRowAsValue,
            },
          ]}
          trailingControlColumns={[
            {
              id: 'trailing',
              width: 50,
              headerCellRender: () => <span>trailing heading</span>,
              headerCellProps: { className: 'trailingControlCol' },
              rowCellRender: renderCellRowAsValue,
            },
          ]}
          rowCount={3}
          renderCellValue={renderCellValueRowAndColumnCount}
          toolbarVisibility={{ additionalControls: <button>Button</button> }}
        />
      );

      expect(container).toMatchSnapshot();
      expect(container.querySelector('.leadingControlCol')).toBeDefined();
      expect(container.querySelector('.trailingControlCol')).toBeDefined();
    });

    it('can hide the toolbar', () => {
      const { rerender, queryByTestSubject } = render(
        <EuiDataGrid
          {...requiredProps}
          columns={[{ id: 'A' }, { id: 'B' }]}
          columnVisibility={{
            visibleColumns: ['A', 'B'],
            setVisibleColumns: () => {},
          }}
          toolbarVisibility={false}
          rowCount={1}
          renderCellValue={() => 'value'}
        />
      );

      // The toolbar should not show
      expect(queryByTestSubject('dataGridControls')).not.toBeInTheDocument();

      // Check for false / true and unset values
      rerender(
        <EuiDataGrid
          {...requiredProps}
          columns={[{ id: 'A' }, { id: 'B' }]}
          columnVisibility={{
            visibleColumns: ['A', 'B'],
            setVisibleColumns: () => {},
          }}
          toolbarVisibility={{
            showFullScreenSelector: false,
            showSortSelector: false,
            showDisplaySelector: true,
          }}
          rowCount={1}
          renderCellValue={() => 'value'}
        />
      );

      // fullscreen selector
      expect(
        queryByTestSubject('dataGridFullScreenButton')
      ).not.toBeInTheDocument();

      // sort selector
      expect(
        queryByTestSubject('dataGridColumnSortingButton')
      ).not.toBeInTheDocument();

      // style selector
      expect(
        queryByTestSubject('dataGridDisplaySelectorButton')
      ).toBeInTheDocument();

      // column selector
      expect(
        queryByTestSubject('dataGridColumnSelectorButton')
      ).toBeInTheDocument();
    });

    describe('schema classnames', () => {
      const getCell = (id: string) =>
        document.querySelector(
          `.euiDataGridRowCell[data-gridcell-column-id="${id}"]`
        );

      it('applies classnames from explicit schemas', () => {
        render(
          <EuiDataGrid
            {...requiredProps}
            columns={[
              { id: 'A', schema: 'numeric' },
              { id: 'B', schema: 'customFormatName' },
            ]}
            columnVisibility={{
              visibleColumns: ['A', 'B'],
              setVisibleColumns: () => {},
            }}
            rowCount={1}
            renderCellValue={renderCellValueRowAndColumnCount}
          />
        );

        expect(getCell('A')).toHaveClass('euiDataGridRowCell--numeric');
        expect(getCell('B')).toHaveClass(
          'euiDataGridRowCell--customFormatName'
        );
      });

      it('automatically detects column types and applies classnames', () => {
        render(
          <EuiDataGrid
            {...requiredProps}
            columns={[{ id: 'A' }, { id: 'B' }, { id: 'C' }]}
            columnVisibility={{
              visibleColumns: ['A', 'B', 'C'],
              setVisibleColumns: () => {},
            }}
            inMemory={{ level: 'pagination' }}
            rowCount={2}
            renderCellValue={renderCellBasedOnColumnId}
          />
        );
        expect(getCell('A')).toHaveClass('euiDataGridRowCell--numeric');
        expect(getCell('B')).toHaveClass('euiDataGridRowCell--boolean');
        expect(getCell('C')).not.toHaveClass(
          'euiDataGridRowCell--numeric euiDataGridRowCell--boolean'
        );
      });

      it('overrides automatically detected column types with supplied schema', () => {
        render(
          <EuiDataGrid
            {...requiredProps}
            columns={[{ id: 'A' }, { id: 'B', schema: 'alphanumeric' }]}
            columnVisibility={{
              visibleColumns: ['A', 'B'],
              setVisibleColumns: () => {},
            }}
            inMemory={{ level: 'pagination' }}
            rowCount={2}
            renderCellValue={renderCellBasedOnColumnId}
          />
        );
        expect(getCell('A')).toHaveClass('euiDataGridRowCell--numeric');
        expect(getCell('B')).toHaveClass('euiDataGridRowCell--alphanumeric');
      });

      it('detects all of the supported types', () => {
        const values: { [key: string]: string } = {
          A: '-5.80',
          B: 'false',
          C: '$-5.80',
          D: '2019-09-18T12:31:28',
          E: '2019-09-18T12:31:28Z',
          F: '2019-09-18T12:31:28.234',
          G: '2019-09-18T12:31:28.234+0300',
        };
        const renderCellValue: RenderCellValue = ({ columnId }) =>
          values[columnId];
        render(
          <EuiDataGrid
            {...requiredProps}
            columns={Object.keys(values).map((id) => ({ id }))}
            columnVisibility={{
              visibleColumns: Object.keys(values),
              setVisibleColumns: () => {},
            }}
            inMemory={{ level: 'pagination' }}
            rowCount={1}
            renderCellValue={renderCellValue}
          />
        );

        expect(getCell('A')).toHaveClass('euiDataGridRowCell--numeric');
        expect(getCell('B')).toHaveClass('euiDataGridRowCell--boolean');
        expect(getCell('C')).toHaveClass('euiDataGridRowCell--currency');
        expect(getCell('D')).toHaveClass('euiDataGridRowCell--datetime');
        expect(getCell('E')).toHaveClass('euiDataGridRowCell--datetime');
        expect(getCell('F')).toHaveClass('euiDataGridRowCell--datetime');
        expect(getCell('G')).toHaveClass('euiDataGridRowCell--datetime');
      });

      it('accepts extra detectors', () => {
        const values: { [key: string]: string } = {
          A: '-5.80',
          B: '127.0.0.1',
        };
        const renderCellValue: RenderCellValue = ({ columnId }) =>
          values[columnId];
        render(
          <EuiDataGrid
            {...requiredProps}
            columns={Object.keys(values).map((id) => ({ id }))}
            columnVisibility={{
              visibleColumns: Object.keys(values),
              setVisibleColumns: () => {},
            }}
            schemaDetectors={[
              {
                type: 'ipaddress',
                detector(value: string) {
                  return value.match(/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/)
                    ? 1
                    : 0;
                },
                icon: 'warning',
                color: 'primary',
                sortTextAsc: 'a-z',
                sortTextDesc: 'z-a',
              },
            ]}
            inMemory={{ level: 'pagination' }}
            rowCount={1}
            renderCellValue={renderCellValue}
          />
        );

        expect(getCell('A')).toHaveClass('euiDataGridRowCell--numeric');
        expect(getCell('B')).toHaveClass('euiDataGridRowCell--ipaddress');
      });
    });
  });

  it('calls onFullScreenChange when fullscreen button is clicked', () => {
    const onFullScreenChange = jest.fn();
    const { getByTestSubject } = render(
      <EuiDataGrid
        {...requiredProps}
        columns={[{ id: 'A' }, { id: 'B' }]}
        columnVisibility={{
          visibleColumns: ['A', 'B'],
          setVisibleColumns: () => {},
        }}
        rowCount={3}
        renderCellValue={renderCellValueRowAndColumnCount}
        toolbarVisibility={{ showFullScreenSelector: true }}
        onFullScreenChange={onFullScreenChange}
      />
    );

    const button = getByTestSubject('dataGridFullScreenButton');
    expect(button).toBeInTheDocument();

    fireEvent.click(button);
    expect(onFullScreenChange).toHaveBeenCalledWith(true);

    fireEvent.click(button);
    expect(onFullScreenChange).toHaveBeenCalledWith(false);
  });
});
