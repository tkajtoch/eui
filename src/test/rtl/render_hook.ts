/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

let renderHook: any;
let renderHookAct: any;
if (process.env.REACT_VERSION === '18') {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  renderHook = require('@testing-library/react').renderHook;
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  renderHookAct = require('@testing-library/react').act;
} else {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  renderHook = require('@testing-library/react-hooks').renderHook;
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  renderHookAct = require('@testing-library/react-hooks').act;
}

export { renderHook, renderHookAct };
