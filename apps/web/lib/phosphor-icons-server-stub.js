// Server-side stub for @phosphor-icons/react
// Returns a lightweight <svg> placeholder that matches the client-rendered icon structure,
// preventing React hydration error #418 (server/client mismatch).
'use strict';

const React = require('react');

const handler = {
  get(_, name) {
    if (name === '__esModule') return true;
    if (name === 'default') return new Proxy({}, handler);
    // Return a component that renders an empty inline SVG matching Phosphor's output
    const component = React.forwardRef(function PhosphorIconStub(props, ref) {
      const { className, style, width, height, size, ...rest } = props || {};
      return React.createElement('svg', {
        ref,
        xmlns: 'http://www.w3.org/2000/svg',
        viewBox: '0 0 256 256',
        fill: 'currentColor',
        className,
        style,
        width: width || size || '1em',
        height: height || size || '1em',
        'aria-hidden': 'true',
        suppressHydrationWarning: true,
      });
    });
    component.displayName = String(name);
    return component;
  }
};

module.exports = new Proxy({}, handler);
