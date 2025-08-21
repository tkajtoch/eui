/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import React from 'react';
import { fireEvent } from '@testing-library/react';
import { render } from '../../test/rtl';
import { keys } from '../../services';
import { renderCellValueRowAndColumnCount } from './data_grid_test_utils';
import { EuiDataGrid } from './data_grid';

describe('render column cell actions', () => {
  it('renders various column cell actions configurations after cell gets hovered', async () => {
    const alertFn = jest.fn();
    const happyFn = jest.fn();
    const { getByTestSubject, getAllByTestSubject, queryByTestSubject } =
      render(
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
    expect(queryByTestSubject('alertAction')).not.toBeInTheDocument();
    expect(queryByTestSubject('happyAction')).not.toBeInTheDocument();

    fireEvent.mouseEnter(getAllByTestSubject('dataGridRowCell')[1]);

    fireEvent.click(getAllByTestSubject('alertAction')[0]);
    expect(alertFn).toHaveBeenCalledWith(1, 'A');

    fireEvent.click(getAllByTestSubject('happyAction')[0]);
    expect(happyFn).toHaveBeenCalledWith(1, 'A');

    alertFn.mockReset();
    happyFn.mockReset();

    fireEvent.keyDown(getAllByTestSubject('dataGridRowCell')[1], {
      key: keys.ENTER,
    });

    fireEvent.click(getByTestSubject('alertActionPopover'));
    expect(alertFn).toHaveBeenCalledWith(1, 'A');

    fireEvent.click(getByTestSubject('happyActionPopover'));
    expect(happyFn).toHaveBeenCalledWith(1, 'A');
  });
});
