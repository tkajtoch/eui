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
import { keys } from '../../services';
import { getAllByTestSubject, render } from '../../test/rtl';
import { findTestSubject, requiredProps } from '../../test';
import { EuiDataGrid } from './data_grid';
import type { RenderCellValue } from './data_grid_types';

function getFocusableCell(component: ReactWrapper) {
  const headerCell = component.find('[role="columnheader"][tabIndex=0]');
  return headerCell.length
    ? headerCell
    : findTestSubject(component, 'dataGridRowCell').find('[tabIndex=0]');
}

function getFocusableCellRTL(element: HTMLElement) {
  const headerCell = element.querySelector(
    '[role="columnheader"][tabindex="0"]'
  );

  // console.log(element.querySelector('[data-test-subj="dataGridRowCell"]'));

  const rowCell = getAllByTestSubject(element, 'dataGridRowCell').find(
    (el) => el.getAttribute('tabindex') === '0'
  );

  return headerCell ?? rowCell;
}

const renderCellValueRowAndColumnCount: RenderCellValue = ({
  rowIndex,
  columnId,
}) => `${rowIndex}, ${columnId}`;

describe('keyboard controls', () => {
  it('supports simple arrow navigation', async () => {
    let pagination = {
      pageIndex: 0,
      pageSize: 3,
      pageSizeOptions: [3, 6, 10],
      onChangePage: (pageIndex: number) => {
        pagination = {
          ...pagination,
          pageIndex,
        };

        rerender(
          <EuiDataGrid
            {...requiredProps}
            columns={[
              { id: 'A', actions: false },
              { id: 'B', actions: false },
              { id: 'C', actions: false },
            ]}
            columnVisibility={{
              visibleColumns: ['A', 'B', 'C'],
              setVisibleColumns: () => {},
            }}
            rowCount={8}
            renderCellValue={renderCellValueRowAndColumnCount}
            pagination={pagination}
          />
        );
      },
      onChangeItemsPerPage: () => {},
    };

    const { container, rerender } = render(
      <EuiDataGrid
        {...requiredProps}
        columns={[
          { id: 'A', actions: false },
          { id: 'B', actions: false },
          { id: 'C', actions: false },
        ]}
        columnVisibility={{
          visibleColumns: ['A', 'B', 'C'],
          setVisibleColumns: () => {},
        }}
        rowCount={8}
        renderCellValue={renderCellValueRowAndColumnCount}
        pagination={pagination}
      />
    );

    // enable the grid to accept focus
    act(() => {
      // component.find('div [data-test-subj="euiDataGridBody"]').props()
      //   .onKeyUp!({ key: keys.TAB } as React.KeyboardEvent)

      fireEvent.keyUp(
        container.querySelector('div [data-test-subj="euiDataGridBody"]')!,
        { key: 'Tab' }
      );
    });
    // component.update();

    // focus should begin at the first header cell
    let focusableCell = getFocusableCellRTL(container)!;
    expect(focusableCell).toBeInTheDocument();
    expect(focusableCell).toHaveTextContent('A');

    // focus should not move when up against the left edge
    fireEvent.focus(focusableCell);
    fireEvent.keyDown(focusableCell, { key: keys.ARROW_LEFT });
    focusableCell = getFocusableCellRTL(container)!;
    expect(focusableCell).toHaveTextContent('A');

    // focus should not move when up against the top edge
    fireEvent.keyDown(focusableCell, { key: keys.ARROW_UP });
    focusableCell = getFocusableCellRTL(container)!;
    expect(focusableCell).toHaveTextContent('A');

    // move down
    fireEvent.keyDown(focusableCell, { key: keys.ARROW_DOWN });
    fireEvent.keyDown(focusableCell, { key: keys.ARROW_DOWN });
    focusableCell = getFocusableCellRTL(container)!;
    expect(focusableCell).toHaveTextContent('1, A');

    // move right
    fireEvent.keyDown(focusableCell, { key: keys.ARROW_RIGHT });
    focusableCell = getFocusableCellRTL(container)!;
    expect(focusableCell).toHaveTextContent('1, B');

    // move up
    fireEvent.keyDown(focusableCell, { key: keys.ARROW_UP });
    focusableCell = getFocusableCellRTL(container)!;
    expect(focusableCell).toHaveTextContent('0, B');

    // move left
    fireEvent.keyDown(focusableCell, { key: keys.ARROW_LEFT });
    focusableCell = getFocusableCellRTL(container)!;
    expect(focusableCell).toHaveTextContent('0, A');

    // move down and to the end of the row
    fireEvent.keyDown(focusableCell, { key: keys.ARROW_DOWN });
    fireEvent.keyDown(focusableCell, { key: keys.END });
    focusableCell = getFocusableCellRTL(container)!;
    expect(focusableCell).toHaveTextContent('1, C');

    // move up and to the beginning of the row
    fireEvent.keyDown(focusableCell, { key: keys.ARROW_UP });
    fireEvent.keyDown(focusableCell, { key: keys.HOME });
    focusableCell = getFocusableCellRTL(container)!;
    expect(focusableCell).toHaveTextContent('0, A');

    // jump to the last cell
    fireEvent.keyDown(focusableCell, { key: keys.END, ctrlKey: true });
    focusableCell = getFocusableCellRTL(container)!;
    expect(focusableCell).toHaveTextContent('2, C');

    // jump to the first cell
    fireEvent.keyDown(focusableCell, { key: keys.HOME, ctrlKey: true });
    focusableCell = getFocusableCellRTL(container)!;
    expect(focusableCell).toHaveTextContent('0, A');

    // page should not change when moving before the first entry
    // but the last row should remain focused
    fireEvent.keyDown(focusableCell, { key: keys.PAGE_UP });
    focusableCell = getFocusableCellRTL(container)!;
    expect(focusableCell).toHaveTextContent('2, A');

    // advance to the next page
    fireEvent.keyDown(focusableCell, { key: keys.PAGE_DOWN });
    focusableCell = getFocusableCellRTL(container)!;
    expect(focusableCell).toHaveTextContent('3, A');

    // move over one column and advance one more page
    fireEvent.keyDown(focusableCell, { key: keys.ARROW_RIGHT }); // 3, B
    fireEvent.keyDown(focusableCell, { key: keys.PAGE_DOWN }); // 6, B
    focusableCell = getFocusableCellRTL(container)!;
    expect(focusableCell).toHaveTextContent('6, B');

    // does not advance beyond the last page
    fireEvent.keyDown(focusableCell, { key: keys.PAGE_DOWN });
    focusableCell = getFocusableCellRTL(container)!;
    expect(focusableCell).toHaveTextContent('6, B');

    // move left one column, return to the previous page
    fireEvent.keyDown(focusableCell, { key: keys.ARROW_LEFT }); // 6, A
    fireEvent.keyDown(focusableCell, { key: keys.PAGE_UP }); // 5, A
    focusableCell = getFocusableCellRTL(container)!;
    expect(focusableCell).toHaveTextContent('5, A');

    // return to the previous (first) page
    fireEvent.keyDown(focusableCell, { key: keys.PAGE_UP });
    focusableCell = getFocusableCellRTL(container)!;
    expect(focusableCell).toHaveTextContent('2, A');

    // move to the last cell of the page then advance one page
    fireEvent.keyDown(focusableCell, { key: keys.END, ctrlKey: true }); // 2, C (last cell of the first page)
    fireEvent.keyDown(focusableCell, { key: keys.PAGE_DOWN }); // 3, C (first cell of the second page, same cell position as previous page)
    focusableCell = getFocusableCellRTL(container)!;
    expect(focusableCell).toHaveTextContent('3, C');

    // advance to the final page
    fireEvent.keyDown(focusableCell, { key: keys.PAGE_DOWN }); // 6, C
    focusableCell = getFocusableCellRTL(container)!;
    expect(focusableCell).toHaveTextContent('6, C');
  });

  // Maximum call stack reached
  it.skip('does not break arrow key focus control behavior when also using a mouse', async () => {
    const component = mount(
      <EuiDataGrid
        {...requiredProps}
        columns={[
          { id: 'A', actions: false },
          { id: 'B', actions: false },
        ]}
        columnVisibility={{
          visibleColumns: ['A', 'B'],
          setVisibleColumns: () => {},
        }}
        rowCount={3}
        renderCellValue={renderCellValueRowAndColumnCount}
      />
    );

    // enable the grid to accept focus
    act(() =>
      component.find('div [data-test-subj="euiDataGridBody"]').props().onKeyUp!(
        { key: keys.TAB } as React.KeyboardEvent
      )
    );
    component.update();

    let focusableCell = getFocusableCell(component);
    expect(
      focusableCell.find('[data-test-subj="cell-content"]').text()
    ).toEqual('0, A');

    findTestSubject(component, 'dataGridRowCell').at(3).simulate('focus');

    // wait for a tick to give focus logic time to run
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });
    component.update();

    focusableCell = getFocusableCell(component);
    expect(focusableCell.length).toEqual(1);
    expect(
      focusableCell.find('[data-test-subj="cell-content"]').text()
    ).toEqual('1, B');
  });
  it.skip('supports arrow navigation through grids with different interactive cells', () => {
    const renderCellValue: RenderCellValue = ({ rowIndex, columnId }) => {
      if (columnId === 'A') {
        return `${rowIndex}, A`;
      }

      if (columnId === 'B') {
        return <button>{rowIndex}, B</button>;
      }

      if (columnId === 'C') {
        return (
          <>
            <button>{rowIndex}</button>, <button>C</button>
          </>
        );
      }

      if (columnId === 'D') {
        return (
          <div>
            {rowIndex}, <button>D</button>
          </div>
        );
      }

      return 'error';
    };
    const component = mount(
      <EuiDataGrid
        {...requiredProps}
        columns={[{ id: 'A' }, { id: 'B' }, { id: 'C' }, { id: 'D' }]}
        columnVisibility={{
          visibleColumns: ['A', 'B', 'C', 'D'],
          setVisibleColumns: () => {},
        }}
        rowCount={2}
        renderCellValue={renderCellValue}
      />
    );

    /**
     * Make sure we start from a happy state
     */
    let focusableCell = getFocusableCell(component);
    expect(focusableCell.length).toEqual(1);
    expect(focusableCell.text()).toEqual('0, A');
    focusableCell
      .simulate('focus')
      .simulate('keydown', { key: keys.ARROW_DOWN });

    /**
     * On text only cells, the cell receives focus
     */
    focusableCell = getFocusableCell(component);
    expect(focusableCell.text()).toEqual('1, A'); // make sure we're on the right cell
    expect(focusableCell.getDOMNode()).toBe(document.activeElement);

    focusableCell.simulate('keydown', { key: keys.ARROW_RIGHT });

    /**
     * On cells with 1 interactive item, the interactive item receives focus
     */
    focusableCell = getFocusableCell(component);
    expect(focusableCell.text()).toEqual('1, B');
    expect(focusableCell.find('button').getDOMNode()).toBe(
      document.activeElement
    );

    focusableCell.simulate('keydown', { key: keys.ARROW_RIGHT });

    /**
     * On cells with multiple interactive items, the cell receives focus
     */
    focusableCell = getFocusableCell(component);
    expect(focusableCell.text()).toEqual('1, C');
    expect(focusableCell.getDOMNode()).toBe(document.activeElement);

    focusableCell.simulate('keydown', { key: keys.ARROW_RIGHT });

    /**
     * On cells with 1 interactive item and non-interactive item(s), the cell receives focus
     */
    focusableCell = getFocusableCell(component);
    expect(focusableCell.text()).toEqual('1, D');
    expect(focusableCell.getDOMNode()).toBe(document.activeElement);
  });
  it.skip('allows user to enter and exit grid navigation', async () => {
    const renderCellValue: RenderCellValue = ({ rowIndex, columnId }) => (
      <>
        <button>{rowIndex}</button>, <button>{columnId}</button>
      </>
    );
    const component = mount(
      <EuiDataGrid
        {...requiredProps}
        columns={[{ id: 'A' }, { id: 'B' }]}
        columnVisibility={{
          visibleColumns: ['A', 'B'],
          setVisibleColumns: () => {},
        }}
        rowCount={3}
        renderCellValue={renderCellValue}
      />
    );

    /**
     * Make sure we start from a happy state
     */
    let focusableCell = getFocusableCell(component);
    expect(focusableCell.length).toEqual(1);
    expect(focusableCell.text()).toEqual('0, A');
    focusableCell
      .simulate('focus')
      .simulate('keydown', { key: keys.ARROW_DOWN });
    focusableCell = getFocusableCell(component);

    /**
     * Confirm initial state is with grid navigation turn on
     */
    expect(focusableCell.text()).toEqual('1, A');
    expect(focusableCell.getDOMNode()).toBe(document.activeElement);
    expect(component.render()).toMatchSnapshot();

    /**
     * Disable grid navigation using ENTER
     */
    focusableCell
      .simulate('keydown', { key: keys.ENTER })
      .simulate('keydown', { key: keys.ARROW_DOWN });

    let buttons = focusableCell.find('button');

    // grid navigation is disabled, location should not move
    expect(buttons.at(0).text()).toEqual('1');
    expect(buttons.at(1).text()).toEqual('A');
    expect(buttons.at(0).getDOMNode()).toBe(document.activeElement); // focus should move to first button
    expect(component.render()).toMatchSnapshot(); // should prove focus lock is on

    /**
     * Enable grid navigation ESCAPE
     */
    focusableCell.simulate('keydown', { key: keys.ESCAPE });
    focusableCell = getFocusableCell(component);
    expect(focusableCell.getDOMNode()).toBe(document.activeElement); // focus should move back to cell

    focusableCell.simulate('keydown', { key: keys.ARROW_RIGHT });
    focusableCell = getFocusableCell(component);
    expect(focusableCell.text()).toEqual('1, B'); // grid navigation is enabled again, check that we can move
    expect(component.render()).toMatchSnapshot();

    /**
     * Disable grid navigation using F2
     */
    focusableCell = getFocusableCell(component);
    focusableCell
      .simulate('keydown', { key: keys.F2 })
      .simulate('keydown', { key: keys.ARROW_UP });
    buttons = focusableCell.find('button');

    // grid navigation is disabled, location should not move
    expect(buttons.at(0).text()).toEqual('1');
    expect(buttons.at(1).text()).toEqual('B');
    expect(buttons.at(0).getDOMNode()).toBe(document.activeElement); // focus should move to first button
    expect(component.render()).toMatchSnapshot(); // should prove focus lock is on

    /**
     * Enable grid navigation using F2
     */
    focusableCell.simulate('keydown', { key: keys.F2 });
    focusableCell = getFocusableCell(component);
    expect(focusableCell.getDOMNode()).toBe(document.activeElement); // focus should move back to cell

    focusableCell.simulate('keydown', { key: keys.ARROW_UP });
    focusableCell = getFocusableCell(component);
    expect(focusableCell.text()).toEqual('0, B'); // grid navigation is enabled again, check that we can move
    expect(component.render()).toMatchSnapshot();
  });
});
