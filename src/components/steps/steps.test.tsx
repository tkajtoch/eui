/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import React from 'react';
import { render } from 'enzyme';
import { requiredProps } from '../../test/required_props';
import { shouldRenderCustomStyles } from '../../test/internal';

import { EuiContainedStepProps, EuiSteps } from './steps';

const steps: EuiContainedStepProps[] = [
  {
    title: 'first title',
    children: <p>Do this first</p>,
  },
  {
    title: 'second title',
    children: <p>Then this</p>,
  },
  {
    title: 'third title',
    children: <p>And finally, do this</p>,
    status: 'incomplete',
  },
];

describe('EuiSteps', () => {
  shouldRenderCustomStyles(<EuiSteps {...requiredProps} steps={steps} />);

  test('renders steps', () => {
    const component = render(<EuiSteps {...requiredProps} steps={steps} />);

    expect(component).toMatchSnapshot();
  });

  test('renders steps with firstStepNumber', () => {
    const component = render(
      <EuiSteps {...requiredProps} steps={steps} firstStepNumber={10} />
    );

    expect(component).toMatchSnapshot();
  });

  test('renders steps with titleSize', () => {
    const component = render(
      <EuiSteps {...requiredProps} steps={steps} titleSize="xs" />
    );

    expect(component).toMatchSnapshot();
  });

  test('renders step title inside "headingElement" element', () => {
    const component = render(
      <EuiSteps {...requiredProps} steps={steps} headingElement="h2" />
    );

    expect(component).toMatchSnapshot();
  });
});
