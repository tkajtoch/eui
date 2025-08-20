/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import React from 'react';
import { mount } from 'enzyme';
import { act } from '@testing-library/react';
import { findTestSubject } from '../../test';
import { keys } from '../../services';
import { renderCellValueRowAndColumnCount } from './data_grid_test_utils';
import { EuiDataGrid } from './data_grid';

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
      findTestSubject(component, 'dataGridRowCell').at(1).prop('onMouseEnter')!(
        {} as React.MouseEvent
      );
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
