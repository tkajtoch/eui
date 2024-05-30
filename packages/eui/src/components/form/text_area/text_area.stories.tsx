/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import type { Meta, StoryObj } from '@storybook/react';

import {
  disableStorybookControls,
  enableFunctionToggleControls,
} from '../../../../.storybook/utils';
import { EuiTextArea, EuiTextAreaProps } from './text_area';

const meta: Meta<EuiTextAreaProps> = {
  title: 'Forms/EuiTextArea',
  component: EuiTextArea,
  args: {
    fullWidth: false,
    resize: 'vertical',
    // set up for easier testing/QA
    isLoading: false,
    isInvalid: false,
    isClearable: false,
    compressed: false,
    icon: '',
    id: '',
    name: '',
    placeholder: '',
  },
};
// adding onChange for visibility
enableFunctionToggleControls(meta, ['onChange']);
disableStorybookControls(meta, ['inputRef']);

export default meta;
type Story = StoryObj<EuiTextAreaProps>;

export const Playground: Story = {};

export const IconShape: Story = {
  parameters: {
    controls: {
      include: ['icon'],
    },
  },
  args: {
    icon: {
      type: 'faceHappy',
      side: 'right',
      color: 'success',
    },
  },
};
