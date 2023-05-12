import { format } from 'util'

// Fail if a test ends up `console.error`-ing, e.g. if React logs because of a
// failed prop types check.
console.error = (message, ...rest) => {
  // @see https://github.com/emotion-js/emotion/issues/1105
  // This error that Emotion throws doesn't apply to Jest, so
  // we're just going to straight up ignore the first/nth-child warning
  if (
    typeof message === 'string' &&
    message.includes('The pseudo class') &&
    message.includes(
      'is potentially unsafe when doing server-side rendering. Try changing it to'
    )
  ) {
    return;
  }

  // TODO: fix me
  if (
    typeof message === 'string' &&
    (
      message.startsWith('Warning: ReactDOM.render is no longer supported in React 18') ||
      message.startsWith('Warning: The current testing environment is not configured to support act')
    )
  ) {
    return;
  }

  throw new Error(format(message, ...rest));
};
