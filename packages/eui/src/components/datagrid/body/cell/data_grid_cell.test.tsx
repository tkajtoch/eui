/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import React, { ComponentPropsWithRef, useEffect } from 'react';
import { fireEvent } from '@testing-library/react';
import { render } from '../../../../test/rtl';
import { RowHeightUtils } from '../../utils/__mocks__/row_heights';
import { mockFocusContext } from '../../utils/__mocks__/focus_context';
import { DataGridFocusContext } from '../../utils/focus';
import type { EuiDataGridProps } from '../../data_grid_types';

import { EuiDataGridCell } from './data_grid_cell';

// These tests are 4+ years old and aren't a good example of what we should
// be testing. They're checking internals instead of focusing on inputs
// and outputs. Consider them left as-is for compatibility reasons and in need
// to be replaced.
// TODO: Refactor tests to follow best practices and RTL guidelines

describe('EuiDataGridCell', () => {
  const mockRowHeightUtils = new RowHeightUtils();

  const mockPopoverContext = {
    popoverIsOpen: false,
    cellLocation: { rowIndex: 0, colIndex: 0 },
    closeCellPopover: jest.fn(),
    openCellPopover: jest.fn(),
    setPopoverAnchor: jest.fn(),
    setPopoverAnchorPosition: jest.fn(),
    setPopoverContent: jest.fn(),
    setCellPopoverProps: () => {},
  };
  const requiredProps = {
    rowIndex: 0,
    visibleRowIndex: 0,
    colIndex: 0,
    columnId: 'someColumn',
    interactiveCellId: 'someId',
    isExpandable: true,
    renderCellValue: () => (
      <div>
        <button data-datagrid-interactable="true">hello</button>
        <button data-datagrid-interactable="true">world</button>
      </div>
    ),
    popoverContext: mockPopoverContext,
    rowHeightUtils: mockRowHeightUtils,
    gridStyles: {},
  };

  beforeEach(() => jest.clearAllMocks());

  it('renders', () => {
    const { container } = render(<EuiDataGridCell {...requiredProps} />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("renders the cell's `aria-rowindex` correctly when paginated on a different page", () => {
    const { getByTestSubject } = render(
      <EuiDataGridCell
        {...requiredProps}
        pagination={{
          pageIndex: 3,
          pageSize: 20,
          pageSizeOptions: [20],
          onChangePage: () => {},
          onChangeItemsPerPage: () => {},
        }}
      />
    );

    expect(getByTestSubject('dataGridRowCell')).toHaveAttribute(
      'aria-rowindex',
      '61'
    );
  });

  it('renders cell actions', () => {
    const { container, getByRole, getByTestSubject, debug, rerender } = render(
      <EuiDataGridCell
        {...requiredProps}
        isExpandable={false}
        column={{
          id: 'someColumn',
          cellActions: [() => <button />],
        }}
      />
    );

    expect(
      container.querySelector('.euiDataGridRowCell__actionsWrapper')
    ).not.toBeInTheDocument();

    fireEvent.mouseEnter(getByRole('gridcell'));

    expect(
      container.querySelector('.euiDataGridRowCell__actionsWrapper')
    ).toBeInTheDocument();

    debug();

    getByTestSubject('euiDataGridCellExpandButton').click();

    expect(mockPopoverContext.openCellPopover).toHaveBeenCalled();

    rerender(
      <EuiDataGridCell
        {...requiredProps}
        isExpandable={true}
        popoverContext={{ ...mockPopoverContext, popoverIsOpen: true }}
      />
    );

    getByTestSubject('euiDataGridCellExpandButton').click();

    expect(mockPopoverContext.closeCellPopover).toHaveBeenCalled();
  });

  describe('setCellProps', () => {
    it('correctly merges props that also have EUI values', () => {
      const RenderCellValue: EuiDataGridProps['renderCellValue'] = ({
        setCellProps,
      }) => {
        useEffect(() => {
          setCellProps({
            style: { backgroundColor: 'black' },
            css: { color: 'white' },
            'data-test-subj': 'test',
            className: 'helloWorld',
          });
        }, [setCellProps]);
        return 'cell render';
      };

      const { getByTestSubject } = render(
        <EuiDataGridCell {...requiredProps} renderCellValue={RenderCellValue} />
      );

      const cell = getByTestSubject('dataGridRowCell test'); // should have merged `data-test-subj` correctly
      expect(cell).toHaveClass('euiDataGridRowCell helloWorld'); // should have merged `className` correctly
      expect(cell).toHaveStyle('background-color: rgb(0, 0, 0)'); // should have merged `style` correctly
      expect(cell).toHaveStyle('color: rgb(255, 255, 255)'); // should have applied consumer `css`
      expect(cell.className).toMatch(/css-[\w\d]+-euiDataGridRowCell/); // should not have overridden EUI `css`
    });

    it('does not allow overriding certain EUI props/values', () => {
      const RenderCellValue: EuiDataGridProps['renderCellValue'] = ({
        setCellProps,
      }) => {
        useEffect(() => {
          setCellProps({
            // @ts-expect-error - deliberately passing omitted props
            role: 'ignored',
            tabIndex: 2,
            'aria-rowindex': 99,
            'data-gridcell-visible-row-index': -200,
          });
        }, [setCellProps]);
        return 'cell render';
      };

      const { container } = render(
        <EuiDataGridCell {...requiredProps} renderCellValue={RenderCellValue} />
      );

      const cell = container.firstElementChild;
      expect(cell).toHaveAttribute('role', 'gridcell');
      expect(cell).toHaveAttribute('tabIndex', '-1');
      expect(cell).toHaveAttribute('aria-rowindex', '1');
      expect(cell).toHaveAttribute('data-gridcell-visible-row-index', '0');
    });
  });

  describe('shouldComponentUpdate', () => {
    let shouldComponentUpdate: jest.SpyInstance;
    let result: ReturnType<typeof render>;

    beforeEach(() => {
      shouldComponentUpdate = jest.spyOn(
        EuiDataGridCell.prototype,
        'shouldComponentUpdate'
      );
      result = render(<EuiDataGridCell {...requiredProps} />);
    });
    afterEach(() => {
      shouldComponentUpdate.mockRestore();
    });

    describe('should return true', () => {
      afterEach(() => {
        expect(shouldComponentUpdate).toHaveReturnedWith(true);
      });

      describe('when props change:', () => {
        it('rowIndex', () => {
          result.rerender(<EuiDataGridCell {...requiredProps} rowIndex={1} />);
        });
        it('visibleRowIndex', () => {
          result.rerender(
            <EuiDataGridCell {...requiredProps} visibleRowIndex={1} />
          );
        });
        it('colIndex', () => {
          result.rerender(<EuiDataGridCell {...requiredProps} colIndex={1} />);
        });
        it('columnId', () => {
          result.rerender(
            <EuiDataGridCell {...requiredProps} columnId="test" />
          );
        });
        it('columnType', () => {
          result.rerender(
            <EuiDataGridCell {...requiredProps} columnType="string" />
          );
        });
        it('width', () => {
          result.rerender(<EuiDataGridCell {...requiredProps} width={30} />);
        });
        it('rowHeightsOptions', () => {
          result.rerender(
            <EuiDataGridCell
              {...requiredProps}
              rowHeightsOptions={{ defaultHeight: 'auto' }}
            />
          );
        });
        it('gridStyles.fontSize', () => {
          result.rerender(
            <EuiDataGridCell
              {...requiredProps}
              gridStyles={{ fontSize: 's' }}
            />
          );
        });
        it('gridStyles.cellPadding', () => {
          result.rerender(
            <EuiDataGridCell
              {...requiredProps}
              gridStyles={{ cellPadding: 'l' }}
            />
          );
        });
        it('renderCellValue', () => {
          result.rerender(
            <EuiDataGridCell
              {...requiredProps}
              renderCellValue={() => <div>test</div>}
            />
          );
        });
        it('renderCellPopover', () => {
          result.rerender(
            <EuiDataGridCell
              {...requiredProps}
              renderCellPopover={() => <div>test</div>}
            />
          );
        });
        it('interactiveCellId', () => {
          result.rerender(
            <EuiDataGridCell {...requiredProps} interactiveCellId="test" />
          );
        });
        it('popoverContext.popoverIsOpen', () => {
          result.rerender(
            <EuiDataGridCell
              {...requiredProps}
              popoverContext={{
                ...mockPopoverContext,
                popoverIsOpen: true,
              }}
            />
          );
        });
        it('popoverContext.cellLocation', () => {
          result.rerender(
            <EuiDataGridCell
              {...requiredProps}
              popoverContext={{
                ...mockPopoverContext,
                cellLocation: {
                  rowIndex: 5,
                  colIndex: 5,
                },
              }}
            />
          );
        });
        it('style', () => {
          result.rerender(<EuiDataGridCell {...requiredProps} style={{}} />);
          result.rerender(
            <EuiDataGridCell {...requiredProps} style={{ top: 0 }} />
          );
          result.rerender(
            <EuiDataGridCell {...requiredProps} style={{ top: 0, left: 0 }} />
          );
          result.rerender(
            <EuiDataGridCell
              {...requiredProps}
              style={{ top: 0, left: 0, width: 50 }}
            />
          );
          result.rerender(
            <EuiDataGridCell
              {...requiredProps}
              style={{ top: 0, left: 0, width: 50, height: 10 }}
            />
          );
        });
        it('cellContext', () => {
          result.rerender(
            <EuiDataGridCell
              {...requiredProps}
              cellContext={{ someData: true }}
            />
          );
          result.rerender(
            <EuiDataGridCell
              {...requiredProps}
              cellContext={{ someData: false }}
            />
          );
        });
      });
    });

    it('should not update for prop/state changes not specified above', () => {
      result.rerender(
        <EuiDataGridCell
          {...requiredProps}
          className="test"
          gridStyles={{ header: 'underline' }}
        />
      );
      expect(shouldComponentUpdate).toHaveReturnedWith(false);
    });
  });

  describe('componentDidUpdate', () => {
    it('resets cell props when the cell is moved (columnId) or sorted (rowIndex)', () => {
      const setState = jest.spyOn(EuiDataGridCell.prototype, 'setState');
      const { rerender } = render(<EuiDataGridCell {...requiredProps} />);
      setState.mockClear();

      rerender(<EuiDataGridCell {...requiredProps} columnId="newColumnId" />);
      expect(setState).toHaveBeenCalledWith({ cellProps: {} });
      expect(setState).toHaveBeenCalledTimes(1);

      rerender(<EuiDataGridCell {...requiredProps} rowIndex={1} />);
      expect(setState).toHaveBeenCalledWith({ cellProps: {} });
      expect(setState).toHaveBeenCalledTimes(2);
    });

    it("handles the cell popover by forwarding the cell's DOM node and contents to the parent popover context", () => {
      const { rerender } = render(
        <EuiDataGridCell
          {...requiredProps}
          column={{ id: 'someColumn', cellActions: [() => <button />] }}
        />
      );
      expect(mockPopoverContext.setPopoverAnchor).not.toHaveBeenCalled();
      expect(mockPopoverContext.setPopoverContent).not.toHaveBeenCalled();

      rerender(
        <EuiDataGridCell
          {...requiredProps}
          column={{ id: 'someColumn', cellActions: [() => <button />] }}
          popoverContext={{
            ...mockPopoverContext,
            popoverIsOpen: true,
          }}
        />
      );
      expect(mockPopoverContext.setPopoverAnchor).toHaveBeenCalled();
      expect(mockPopoverContext.setPopoverContent).toHaveBeenCalled();

      // Examine popover content which should contain popoverContent, renderCellValue, and cellActions
      const { container } = render(
        <>{mockPopoverContext.setPopoverContent.mock.calls[0][0]}</>
      );
      expect(container).toMatchSnapshot();
    });

    describe('rowHeightsOptions.scrollAnchorRow', () => {
      let result: ReturnType<typeof render>;

      beforeEach(() => {
        result = render(
          <EuiDataGridCell
            {...requiredProps}
            rowHeightsOptions={{
              defaultHeight: 'auto',
              scrollAnchorRow: 'start',
            }}
            style={{ top: '30px' }}
          />
        );
      });

      it('compensates for layout shifts', () => {
        result.rerender(
          <EuiDataGridCell
            {...requiredProps}
            rowHeightsOptions={{
              defaultHeight: 'auto',
              scrollAnchorRow: 'start',
            }}
            style={{ top: '60px' }}
          />
        );
        expect(
          mockRowHeightUtils.compensateForLayoutShift
        ).toHaveBeenCalledWith(0, 30, 'start');
      });

      describe('does not compensate for layout shifts when', () => {
        afterEach(() => {
          expect(
            mockRowHeightUtils.compensateForLayoutShift
          ).not.toHaveBeenCalled();
        });

        test('the rowIndex is changing', () => {
          result.rerender(
            <EuiDataGridCell
              {...requiredProps}
              rowHeightsOptions={{
                defaultHeight: 'auto',
                scrollAnchorRow: 'start',
              }}
              style={{ top: '60px' }}
              rowIndex={3}
            />
          );
        });

        test('the columnId is changing', () => {
          result.rerender(
            <EuiDataGridCell
              {...requiredProps}
              rowHeightsOptions={{
                defaultHeight: 'auto',
                scrollAnchorRow: 'start',
              }}
              style={{ top: '60px' }}
              columnId="someOtherColumn"
            />
          );
        });

        test('scrollAnchorRow is undefined', () => {
          result.rerender(
            <EuiDataGridCell
              {...requiredProps}
              rowHeightsOptions={{
                defaultHeight: 20,
              }}
              style={{ top: '30px' }}
            />
          );
        });

        test('the cell is not the first cell in the row', () => {
          result.rerender(
            <EuiDataGridCell
              {...requiredProps}
              rowHeightsOptions={{
                defaultHeight: 'auto',
                scrollAnchorRow: 'start',
              }}
              style={{ top: '30px' }}
              colIndex={1}
            />
          );
        });

        test('the cell top position is not changing', () => {
          result.rerender(
            <EuiDataGridCell
              {...requiredProps}
              rowHeightsOptions={{
                defaultHeight: 'auto',
                scrollAnchorRow: 'start',
              }}
              style={{ top: '30px' }}
            />
          );
        });
      });
    });
  });

  describe('componentDidMount', () => {
    it('creates an onFocusUpdate subscription', () => {
      render(
        <DataGridFocusContext.Provider value={mockFocusContext}>
          <EuiDataGridCell {...requiredProps} />
        </DataGridFocusContext.Provider>
      );

      expect(mockFocusContext.onFocusUpdate).toHaveBeenCalled();
    });

    it('mounts the cell with focus state if the current cell should be focused', () => {
      const focusSpy = jest.spyOn(HTMLElement.prototype, 'focus');
      const { getByRole } = render(
        <DataGridFocusContext.Provider
          value={{ ...mockFocusContext, focusedCell: [3, 3] }}
        >
          <EuiDataGridCell
            {...requiredProps}
            colIndex={3}
            visibleRowIndex={3}
          />
        </DataGridFocusContext.Provider>
      );

      // tabindex directly corresponds to the focus state
      expect(getByRole('gridcell')).toHaveAttribute('tabindex', '0');

      expect(focusSpy).toHaveBeenCalledWith({ preventScroll: true });
      expect(mockFocusContext.setIsFocusedCellInView).toHaveBeenCalledWith(
        true
      );
    });

    it('handles the cell popover if the current cell should have an open popover', () => {
      render(
        <EuiDataGridCell
          {...requiredProps}
          popoverContext={{ ...mockPopoverContext, popoverIsOpen: true }}
        />
      );

      expect(mockPopoverContext.setPopoverAnchor).toHaveBeenCalled();
      expect(mockPopoverContext.setPopoverContent).toHaveBeenCalled();
    });
  });

  describe('componentWillUnmount', () => {
    it('unsubscribes from the onFocusUpdate subscription', () => {
      const unsubscribeCellMock = jest.fn();
      mockFocusContext.onFocusUpdate.mockReturnValueOnce(unsubscribeCellMock);

      const { unmount } = render(
        <DataGridFocusContext.Provider value={mockFocusContext}>
          <EuiDataGridCell {...requiredProps} />
        </DataGridFocusContext.Provider>
      );
      unmount();

      expect(unsubscribeCellMock).toHaveBeenCalled();
    });

    it('sets isFocusedCellInView to false if the current cell is focused and unmounting due to being scrolled out of view', () => {
      const { unmount } = render(
        <DataGridFocusContext.Provider
          value={{ ...mockFocusContext, focusedCell: [3, 3] }}
        >
          <EuiDataGridCell
            {...requiredProps}
            colIndex={3}
            visibleRowIndex={3}
          />
        </DataGridFocusContext.Provider>
      );
      unmount();

      expect(mockFocusContext.setIsFocusedCellInView).toHaveBeenCalledWith(
        false
      );
    });

    it('closes the popover if open and the user scrolls out of view', () => {
      const { unmount } = render(
        <EuiDataGridCell
          {...requiredProps}
          popoverContext={{
            ...mockPopoverContext,
            popoverIsOpen: true,
          }}
        />
      );
      unmount();

      expect(mockPopoverContext.closeCellPopover).toHaveBeenCalled();
    });
  });

  describe('imperative ref methods', () => {
    let cellRef: EuiDataGridCell | null;

    afterEach(() => {
      cellRef = null;
    });

    describe('isFocusedCell', () => {
      it("returns true if the current focusedCell[x,y] matches the cell's colIndex and visibleRowIndex", () => {
        render(
          <DataGridFocusContext.Provider
            value={{ ...mockFocusContext, focusedCell: [5, 10] }}
          >
            <EuiDataGridCell
              {...requiredProps}
              colIndex={5}
              visibleRowIndex={10}
              ref={(ref) => {
                cellRef = ref;
              }}
            />
          </DataGridFocusContext.Provider>
        );

        expect(cellRef!.isFocusedCell()).toBe(true);
      });

      it("returns false if the current focusedCell[x,y] does not match the cell's colIndex and visibleRowIndex", () => {
        let cellRef: EuiDataGridCell | null;

        render(
          <DataGridFocusContext.Provider
            value={{ ...mockFocusContext, focusedCell: [1, 2] }}
          >
            <EuiDataGridCell
              {...requiredProps}
              colIndex={3}
              visibleRowIndex={4}
              ref={(ref) => {
                cellRef = ref;
              }}
            />
          </DataGridFocusContext.Provider>
        );

        expect(cellRef!.isFocusedCell()).toBe(false);
      });
    });

    describe('isPopoverOpen', () => {
      const props = {
        ...requiredProps,
        popoverContext: {
          ...mockPopoverContext,
          popoverIsOpen: true,
          cellLocation: { colIndex: 1, rowIndex: 2 },
        },
        colIndex: 1,
        visibleRowIndex: 2,
        isExpandable: true,
        ref: (ref: EuiDataGridCell | null) => {
          cellRef = ref;
        },
      };

      it('returns true if the cell is expandable, the popover is open, and the cell location matches', () => {
        render(<EuiDataGridCell {...props} />);

        expect(cellRef!.isPopoverOpen()).toBe(true);
      });

      it('returns false if popoverContext.popoverIsOpen is false', () => {
        render(
          <EuiDataGridCell
            {...props}
            popoverContext={{ ...props.popoverContext, popoverIsOpen: false }}
          />
        );

        expect(cellRef!.isPopoverOpen()).toBe(false);
      });

      it("returns false if popoverContext.cellLocation does not match the cell's colIndex and visibleRowIndex", () => {
        render(<EuiDataGridCell {...props} colIndex={3} visibleRowIndex={4} />);

        expect(cellRef!.isPopoverOpen()).toBe(false);
      });

      it('returns false if the cell is not expandable', () => {
        render(<EuiDataGridCell {...props} isExpandable={false} />);

        expect(cellRef!.isPopoverOpen()).toBe(false);
      });
    });

    describe('isExpandable', () => {
      let renderCellValueMock: any;
      let props: any;

      beforeEach(() => {
        renderCellValueMock = jest.fn(requiredProps.renderCellValue);
        props = {
          ...requiredProps,
          renderCellValue: renderCellValueMock,
          ref: (ref: EuiDataGridCell | null) => {
            cellRef = ref;
          },
        };
      });

      it('always returns true if column.cellActions exists', () => {
        render(
          <EuiDataGridCell
            {...props}
            column={{ id: 'someId', cellActions: [() => <button />] }}
            isExpandable={false}
          />
        );

        expect(renderCellValueMock).toHaveBeenCalledWith(
          expect.objectContaining({
            isExpandable: true,
          }),
          expect.any(Object)
        );
      });

      it('falls back to props.isExpandable which is derived from the column config', () => {
        render(<EuiDataGridCell {...props} isExpandable />);

        expect(renderCellValueMock).toHaveBeenCalledWith(
          expect.objectContaining({
            isExpandable: true,
          }),
          expect.any(Object)
        );
      });

      it('allows overriding column.isExpandable with setCellProps({ isExpandable })', () => {
        const RenderCellValue: EuiDataGridProps['renderCellValue'] = jest.fn(
          ({ setCellProps }) => {
            useEffect(() => {
              setCellProps({ isExpandable: false });
            }, [setCellProps]);
            return 'cell render';
          }
        );

        render(
          <EuiDataGridCell
            {...props}
            isExpandable
            renderCellValue={RenderCellValue}
          />
        );

        expect(RenderCellValue).toHaveBeenCalledWith(
          expect.objectContaining({
            isExpandable: false,
          }),
          expect.any(Object)
        );
      });
    });
  });

  // TODO: Test ResizeObserver logic in Cypress alongside Jest
  describe('row height logic & resize observers', () => {
    describe('recalculateAutoHeight', () => {
      afterEach(() => {
        (mockRowHeightUtils.isAutoHeight as jest.Mock).mockRestore();
      });

      it('sets the row height cache with cell heights on update', () => {
        (mockRowHeightUtils.isAutoHeight as jest.Mock).mockReturnValue(true);

        const { rerender } = render(
          <EuiDataGridCell
            {...requiredProps}
            rowHeightsOptions={{ defaultHeight: 'auto' }}
          />
        );

        rerender(
          <EuiDataGridCell
            {...requiredProps}
            rowHeightsOptions={{ defaultHeight: 'auto' }}
            rowIndex={2}
          />
        );

        expect(mockRowHeightUtils.setRowHeight).toHaveBeenCalled();
      });

      it('does not update the cache if cell height is not auto', () => {
        (mockRowHeightUtils.isAutoHeight as jest.Mock).mockReturnValue(false);

        const { rerender } = render(
          <EuiDataGridCell
            {...requiredProps}
            rowHeightsOptions={{ defaultHeight: 34 }}
          />
        );

        rerender(
          <EuiDataGridCell
            {...requiredProps}
            rowHeightsOptions={{ defaultHeight: 34 }}
            rowIndex={2}
          />
        );

        expect(mockRowHeightUtils.setRowHeight).not.toHaveBeenCalled();
      });
    });

    describe('recalculateLineHeight', () => {
      const setRowHeight = jest.fn();
      let cellRef: EuiDataGridCell | null = null;
      let props: ComponentPropsWithRef<typeof EuiDataGridCell>;

      beforeEach(() => {
        props = {
          ...requiredProps,
          ref: (ref) => {
            cellRef = ref;
          },
        };
      });

      describe('default height', () => {
        it('observes the first cell for size changes and calls this.props.setRowHeight on change', () => {
          render(
            <EuiDataGridCell
              {...props}
              rowHeightsOptions={{ defaultHeight: { lineCount: 3 } }}
              setRowHeight={setRowHeight}
            />
          );

          cellRef!.recalculateLineHeight();

          expect(
            mockRowHeightUtils.calculateHeightForLineCount
          ).toHaveBeenCalledWith(expect.any(HTMLElement), 3);
          expect(setRowHeight).toHaveBeenCalled();
        });
      });

      describe('row height overrides', () => {
        it('uses the rowHeightUtils.setRowHeight cache instead of this.props.setRowHeight', () => {
          render(
            <EuiDataGridCell
              {...props}
              rowHeightsOptions={{
                defaultHeight: { lineCount: 3 },
                rowHeights: { 10: { lineCount: 10 } },
              }}
              rowIndex={10}
              setRowHeight={setRowHeight}
            />
          );

          cellRef!.recalculateLineHeight();

          expect(
            mockRowHeightUtils.calculateHeightForLineCount
          ).toHaveBeenCalledWith(expect.any(HTMLElement), 10);
          expect(mockRowHeightUtils.setRowHeight).toHaveBeenCalled();
          expect(setRowHeight).not.toHaveBeenCalled();
        });

        it('recalculates when the override for the row changes', () => {
          const { rerender } = render(
            <EuiDataGridCell {...props} setRowHeight={setRowHeight} />
          );

          rerender(
            <EuiDataGridCell
              {...props}
              setRowHeight={setRowHeight}
              rowHeightsOptions={{
                rowHeights: {
                  0: { lineCount: 2 },
                },
              }}
            />
          );

          expect(mockRowHeightUtils.setRowHeight).toHaveBeenCalledTimes(1);

          // Handle row index changes as well
          rerender(
            <EuiDataGridCell
              {...props}
              setRowHeight={setRowHeight}
              rowIndex={2}
              rowHeightsOptions={{
                rowHeights: {
                  0: { lineCount: 2 },
                  2: { lineCount: 4 },
                },
              }}
            />
          );

          expect(mockRowHeightUtils.setRowHeight).toHaveBeenCalledTimes(2);
          expect(setRowHeight).not.toHaveBeenCalled();
        });
      });

      it('recalculates when props that affect row/line height change', () => {
        const { rerender } = render(
          <EuiDataGridCell
            {...props}
            rowHeightsOptions={{ defaultHeight: { lineCount: 4 } }}
            setRowHeight={setRowHeight}
          />
        );

        rerender(
          <EuiDataGridCell
            {...props}
            rowHeightsOptions={{ defaultHeight: { lineCount: 2 } }}
            setRowHeight={setRowHeight}
          />
        );
        expect(setRowHeight).toHaveBeenCalledTimes(1);

        // Other props that can affect row heights

        const rowHeightsOptionsWithLineHeight = {
          defaultHeight: { lineCount: 2 },
          lineHeight: '3',
        };

        rerender(
          <EuiDataGridCell
            {...props}
            rowHeightsOptions={rowHeightsOptionsWithLineHeight}
            setRowHeight={setRowHeight}
          />
        );
        expect(setRowHeight).toHaveBeenCalledTimes(2);

        rerender(
          <EuiDataGridCell
            {...props}
            rowHeightsOptions={rowHeightsOptionsWithLineHeight}
            setRowHeight={setRowHeight}
            gridStyles={{
              cellPadding: 'l',
            }}
          />
        );
        expect(setRowHeight).toHaveBeenCalledTimes(3);

        rerender(
          <EuiDataGridCell
            {...props}
            rowHeightsOptions={rowHeightsOptionsWithLineHeight}
            setRowHeight={setRowHeight}
            gridStyles={{
              cellPadding: 'l',
              fontSize: 'l',
            }}
          />
        );
        expect(setRowHeight).toHaveBeenCalledTimes(4);
      });

      it('calculates undefined heights as single rows with a lineCount of 1', () => {
        render(
          <EuiDataGridCell
            {...props}
            rowHeightsOptions={{ defaultHeight: undefined }}
            setRowHeight={setRowHeight}
          />
        );

        cellRef!.recalculateLineHeight();
        expect(
          mockRowHeightUtils.calculateHeightForLineCount
        ).toHaveBeenCalledWith(expect.any(HTMLElement), 1);
        expect(setRowHeight).toHaveBeenCalled();
      });

      it('does nothing if cell height is not lineCount or undefined', () => {
        render(
          <EuiDataGridCell
            {...props}
            rowHeightsOptions={{ defaultHeight: 34 }}
            setRowHeight={setRowHeight}
          />
        );

        cellRef!.recalculateLineHeight();
        expect(setRowHeight).not.toHaveBeenCalled();
      });

      it('does nothing if cell height is auto or autoBelowLineCount', () => {
        mockRowHeightUtils.isAutoBelowLineCount.mockReturnValue(true);

        render(
          <EuiDataGridCell
            {...props}
            rowHeightsOptions={{
              autoBelowLineCount: true,
              defaultHeight: { lineCount: 3 },
            }}
            setRowHeight={setRowHeight}
          />
        );

        cellRef!.recalculateLineHeight();
        expect(setRowHeight).not.toHaveBeenCalled();

        mockRowHeightUtils.isAutoBelowLineCount.mockRestore();
      });
    });
  });

  describe('renders certain classes/styles based on rowHeightOptions', () => {
    const props = { ...requiredProps, renderCellValue: () => null };

    test('default', () => {
      const { container } = render(
        <EuiDataGridCell {...props} rowHeightsOptions={undefined} />
      );

      const cellContent = container.querySelector(
        '.euiDataGridRowCell__content--defaultHeight'
      );

      expect(cellContent).toBeInTheDocument();
      expect(container.querySelector('.eui-textTruncate')).toBeInTheDocument();
    });

    test('auto', () => {
      const { container } = render(
        <EuiDataGridCell
          {...props}
          rowHeightsOptions={{ defaultHeight: 'auto' }}
        />
      );

      const cellContent = container.querySelector(
        '.euiDataGridRowCell__content--autoHeight'
      );
      expect(cellContent).toBeInTheDocument();
      expect(container.querySelector('.eui-textBreakWord')).toBeInTheDocument();
    });

    test('numerical', () => {
      const { container } = render(
        <EuiDataGridCell
          {...props}
          rowHeightsOptions={{ defaultHeight: { height: 3 } }}
        />
      );

      expect(
        container.querySelector('.euiDataGridRowCell__content--numericalHeight')
      ).toBeInTheDocument();
      expect(container.querySelector('.eui-textBreakWord')).toBeInTheDocument();
    });

    test('lineCount', () => {
      const { container } = render(
        <EuiDataGridCell
          {...props}
          rowHeightsOptions={{ defaultHeight: { lineCount: 3 } }}
        />
      );

      const cellContent = container.querySelector(
        '.euiDataGridRowCell__content--lineCountHeight'
      );

      expect(cellContent).toHaveStyle({
        '-webkit-line-clamp': '3',
      });

      expect(container.querySelector('.eui-textBreakWord')).toBeInTheDocument();
      expect(
        container.querySelector('.euiTextBlockTruncate')
      ).toBeInTheDocument();
    });

    test('autoBelowLineCount', () => {
      mockRowHeightUtils.isAutoBelowLineCount.mockReturnValue(true);

      const { container } = render(
        <EuiDataGridCell
          {...props}
          rowHeightsOptions={{
            autoBelowLineCount: true,
            defaultHeight: { lineCount: 3 },
          }}
        />
      );

      const cellContent = container.querySelector(
        '.euiDataGridRowCell__content--autoBelowLineCountHeight'
      );

      expect(cellContent).toHaveStyleRule('block-size', 'auto');
      expect(cellContent).toHaveStyle({
        '-webkit-line-clamp': '3',
      });

      expect(container.querySelector('.eui-textBreakWord')).toBeInTheDocument();
      expect(
        container.querySelector('.euiTextBlockTruncate')
      ).toBeInTheDocument();

      mockRowHeightUtils.isAutoBelowLineCount.mockRestore();
    });
  });

  // Note: Tests for cell interactivity (focus, tabbing, etc) are in `focus_utils.spec.tsx`
});
