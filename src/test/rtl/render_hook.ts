/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import type { renderHook as renderHookType } from '@testing-library/react';

// Pick renderHook implementation based on which React version is currently
// being tested. It has to be directly compared against
// process.env.REACT_VERSION for tree-shaking to work.
let renderHook: typeof renderHookType;
if (process.env.REACT_VERSION === '18') {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  renderHook = require('@testing-library/react').renderHook;
} else {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  renderHook = require('@testing-library/react-hooks').renderHook;
}

export { renderHook };
