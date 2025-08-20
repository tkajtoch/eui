/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import React from 'react';
import { mount, ReactWrapper } from 'enzyme';
import { act, fireEvent } from '@testing-library/react';
import { findTestSubject, requiredProps } from '../../test';
import { render } from '../../test/rtl';
import { shouldRenderCustomStyles } from '../../test/internal';
import { keys } from '../../services';
import {
  renderCellValueRowAndColumnCount,
  renderCellRowAsValue,
} from './data_grid_test_utils';
import { EuiDataGrid } from './data_grid';

// Mock the cell popover (TODO: Move failing tests to Cypress and remove need for mock?)
jest.mock('../popover', () => ({
  ...jest.requireActual('../popover'),
  EuiWrappingPopover: ({ children }: { children: React.ReactNode }) => (
    <div data-test-subj="euiDataGridExpansionPopover">{children}</div>
  ),
}));

function extractRowHeights(datagrid: ReactWrapper) {
  return (
    findTestSubject(datagrid, 'dataGridRowCell') as ReactWrapper<any>
  ).reduce((heights: { [key: string]: number }, cell) => {
    const cellProps = cell.props();
    const cellContentProps = cell
      .find('[data-test-subj="cell-content"]')
      .props() as any;
    heights[cellContentProps.rowIndex] = parseFloat(cellProps.style.height);
    return heights;
  }, {});
}

expect.extend({
  toBeEuiPopover(received: ReactWrapper) {
    const pass = received.name() === 'EuiPopover';
    if (pass) {
      return {
        pass: true,
        message: () =>
          `expected component "${received.name}" to not be EuiPopover`,
      };
    } else {
      return {
        pass: false,
        message: () => `expected component "${received.name}" to be EuiPopover`,
      };
    }
  },
  euiPopoverToBeOpen(received) {
    expect(received).toBeEuiPopover();
    const { isOpen } = received.props();
    const pass = isOpen === true;
    if (pass) {
      return {
        pass: true,
        message: () => 'expected EuiPopover to be closed',
      };
    } else {
      return {
        pass: false,
        message: () => 'expected EuiPopover to be open',
      };
    }
  },
});
declare global {
  /* eslint-disable-next-line @typescript-eslint/no-namespace,no-redeclare */
  namespace jest {
    interface Matchers<R> {
      toBeEuiPopover(): R;
      euiPopoverToBeOpen(): R;
    }
  }
}

describe('EuiDataGrid', () => {
  // Mock requestAnimationFrame to run immediately
  jest
    .spyOn(window, 'requestAnimationFrame')
    .mockImplementation((cb: any) => cb());

  shouldRenderCustomStyles(
    <EuiDataGrid
      aria-label=""
      columns={[]}
      columnVisibility={{ visibleColumns: [], setVisibleColumns: () => {} }}
      rowCount={0}
      renderCellValue={() => null}
    />
  );

  describe('render column actions', () => {
    it('renders various column actions configurations', () => {
      const component = mount(
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

      const buttonA = findTestSubject(
        component,
        'dataGridHeaderCellActionButton-A'
      );
      expect(buttonA.length).toBe(0);

      for (const col of ['B', 'C', 'D', 'E']) {
        const button = findTestSubject(
          component,
          `dataGridHeaderCellActionButton-${col}`
        );
        button.simulate('click');
        component.update();
        const actionGroup = findTestSubject(
          component,
          `dataGridHeaderCellActionGroup-${col}`
        );
        expect(actionGroup.render()).toMatchSnapshot();
      }
    });
  });

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

  describe('render column cell actions', () => {
    it('renders various column cell actions configurations after cell gets hovered', async () => {
      const alertFn = jest.fn();
      const happyFn = jest.fn();
      const component = mount(
        <EuiDataGrid
          aria-labelledby="#test"
          sorting={{
            columns: [{ id: 'A', direction: 'asc' }],
            onSort: () => {},
          }}
          columns={[
            {
              id: 'A',
              isSortable: true,
              cellActions: [
                ({ rowIndex, columnId, Component, isExpanded }) => {
                  return (
                    <Component
                      onClick={() => alertFn(rowIndex, columnId)}
                      iconType="warning"
                      aria-label="test1 aria label"
                      data-test-subj={
                        isExpanded ? 'alertActionPopover' : 'alertAction'
                      }
                    >
                      test1
                    </Component>
                  );
                },
                ({ rowIndex, columnId, Component, isExpanded }) => {
                  return (
                    <Component
                      onClick={() => happyFn(rowIndex, columnId)}
                      iconType="faceHappy"
                      aria-label="test2 aria label"
                      data-test-subj={
                        isExpanded ? 'happyActionPopover' : 'happyAction'
                      }
                    >
                      test2
                    </Component>
                  );
                },
              ],
            },
          ]}
          columnVisibility={{
            visibleColumns: ['A'],
            setVisibleColumns: () => {},
          }}
          rowCount={2}
          renderCellValue={renderCellValueRowAndColumnCount}
        />
      );

      // cell buttons should not get rendered for unfocused, unhovered cell
      expect(findTestSubject(component, 'alertAction').exists()).toBe(false);
      expect(findTestSubject(component, 'happyAction').exists()).toBe(false);

      act(() => {
        findTestSubject(component, 'dataGridRowCell')
          .at(1)
          .prop('onMouseEnter')!({} as React.MouseEvent);
      });

      component.update();

      findTestSubject(component, 'alertAction').at(0).simulate('click');
      expect(alertFn).toHaveBeenCalledWith(1, 'A');
      findTestSubject(component, 'happyAction').at(0).simulate('click');
      expect(happyFn).toHaveBeenCalledWith(1, 'A');
      alertFn.mockReset();
      happyFn.mockReset();

      findTestSubject(component, 'dataGridRowCell')
        .at(1)
        .simulate('keydown', { key: keys.ENTER });
      component.update();

      findTestSubject(component, 'alertActionPopover').simulate('click');
      expect(alertFn).toHaveBeenCalledWith(1, 'A');
      findTestSubject(component, 'happyActionPopover').simulate('click');
      expect(happyFn).toHaveBeenCalledWith(1, 'A');
    });
  });

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

      findTestSubject(component, 'pagination-button-previous').simulate(
        'click'
      );

      expect(extractRowHeights(component)).toEqual({
        0: 70,
        1: 34,
        2: 50,
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
