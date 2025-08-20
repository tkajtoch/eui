/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import React from 'react';
import { ReactWrapper } from 'enzyme';
import { fireEvent } from '@testing-library/react';
import { requiredProps } from '../../test';
import { render } from '../../test/rtl';
import { shouldRenderCustomStyles } from '../../test/internal';
import { renderCellValueRowAndColumnCount } from './data_grid_test_utils';
import { EuiDataGrid } from './data_grid';

// Mock the cell popover (TODO: Move failing tests to Cypress and remove need for mock?)
jest.mock('../popover', () => ({
  ...jest.requireActual('../popover'),
  EuiWrappingPopover: ({ children }: { children: React.ReactNode }) => (
    <div data-test-subj="euiDataGridExpansionPopover">{children}</div>
  ),
}));

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
