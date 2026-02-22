// Server-side stub for @phosphor-icons/react
// Icons render as null on server, hydrate properly on client via 'use client' boundary
// This prevents createContext from being called in react-server context
'use strict';

const handler = {
  get(_, name) {
    if (name === '__esModule') return true;
    if (name === 'default') return new Proxy({}, handler);
    // Return a component that renders null on the server
    const component = function PhosphorIconStub() { return null; };
    component.displayName = String(name);
    return component;
  }
};

module.exports = new Proxy({}, handler);
