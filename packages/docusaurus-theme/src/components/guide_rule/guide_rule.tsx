import { PropsWithChildren, ReactNode, useMemo } from 'react';
import { UseEuiTheme, EuiFlexItem, EuiSplitPanel, useEuiMemoizedStyles, EuiText } from '@elastic/eui';
import { css } from '@emotion/react';
import { EuiPanelProps } from '@elastic/eui/src/components/panel/panel';
import { EuiTextColorProps } from '@elastic/eui/src/components/text/text_color';

const getGuideRuleStyles = ({ euiTheme }: UseEuiTheme) => ({
  guideRule: css`
    margin-block: 2rem;
  `,
  childrenPanel: css`
    border-bottom: 2px solid transparent;

    pre {
      margin: 0;
    }
  `,
  childrenPanelFlex: css`
    display: flex;
    align-items: center;
    justify-content: space-around;
  `,
  childrenPanelDo: css`
    border-color: ${euiTheme.colors.success};
  `,
  childrenPanelDont: css`
    border-color: ${euiTheme.colors.danger};
  `,
  figure: css`
    margin: 0;
  `,
  textPanel: css`
    padding-inline: 0;
  `,
});

interface GuideRuleProps extends PropsWithChildren {
  type: 'do' | 'dont' | 'default';
  minHeight?: number;
  text?: ReactNode;
  panelDisplay?: 'flex' | 'block';
  panelColor?: EuiPanelProps['color'];
  panelPadding?: EuiPanelProps['paddingSize'];
}

export const GuideRule = ({
  children,
  type = 'default',
  text,
  minHeight,
  panelColor: _panelColor,
  panelDisplay,
  panelPadding = 'm',
}: GuideRuleProps) => {
  const styles = useEuiMemoizedStyles(getGuideRuleStyles);

  const panelColor = useMemo<EuiPanelProps['color']>(() => {
    if (_panelColor) {
      return _panelColor;
    }

    if (type === 'default') {
      return 'subdued';
    }

    if (type === 'do') {
      return 'success';
    }

    return 'danger';
  }, [_panelColor, type]);

  const textColor = useMemo<EuiTextColorProps['color']>(() => {
    return type === 'do' ? 'success' : 'danger';
  }, [type]);

  return (
    <EuiFlexItem css={styles.guideRule} style={{ flexBasis: 300 }}>
      <EuiSplitPanel.Outer
        hasShadow={false}
        hasBorder={false}
        borderRadius="none"
        color="transparent"
      >
        <figure css={styles.figure}>
          <EuiSplitPanel.Inner
            color={panelColor}
            paddingSize={panelPadding}
            css={[
              styles.childrenPanel,
              panelDisplay === 'flex' && styles.childrenPanelFlex,
              type === 'do' ? styles.childrenPanelDo : styles.childrenPanelDont,
            ]}
            style={{ minHeight }}
          >
            {children}
          </EuiSplitPanel.Inner>
          <EuiSplitPanel.Inner paddingSize="s" css={styles.textPanel}>
            <EuiText size="s" color={textColor}>
              <p>
                <strong>{type === 'do' ? 'Do' : 'Don\'t'}.</strong> {text}
              </p>
            </EuiText>
          </EuiSplitPanel.Inner>
        </figure>
      </EuiSplitPanel.Outer>
    </EuiFlexItem>
  );
};
