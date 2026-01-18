import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, vi, beforeAll } from 'vitest';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock ResizeObserver which is not available in jsdom
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock getBoundingClientRect for virtualization to work
beforeAll(() => {
  Element.prototype.getBoundingClientRect = vi.fn(() => ({
    width: 800,
    height: 600,
    top: 0,
    left: 0,
    bottom: 600,
    right: 800,
    x: 0,
    y: 0,
    toJSON: () => {},
  }));

  // Mock scrollTo
  Element.prototype.scrollTo = vi.fn(() => {}) as unknown as typeof Element.prototype.scrollTo;
  
  // Mock scrollHeight and clientHeight for virtualizer
  Object.defineProperty(HTMLElement.prototype, 'scrollHeight', {
    configurable: true,
    get: function() { return 600; }
  });
  
  Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
    configurable: true,
    get: function() { return 600; }
  });
  
  Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
    configurable: true,
    get: function() { return 600; }
  });
});
