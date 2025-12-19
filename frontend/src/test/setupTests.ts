import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Remove act() warning , act is deprecated and should not be used, to remove when test lib is updated
const originalError = console.error;

vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
  const [first] = args;

  if (typeof first === 'string' && first.includes('not wrapped in act(')) {
    return;
  }

  originalError(...(args as Parameters<typeof console.error>));
});

Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  value: vi.fn(() => {
    return {
      fillRect: vi.fn(),
      clearRect: vi.fn(),
      getImageData: vi.fn(() => ({ data: [] })),
      putImageData: vi.fn(),
      createImageData: vi.fn(),
      setTransform: vi.fn(),
      drawImage: vi.fn(),
      save: vi.fn(),
      fillText: vi.fn(),
      restore: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      closePath: vi.fn(),
      stroke: vi.fn(),
      translate: vi.fn(),
      scale: vi.fn(),
      rotate: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      measureText: vi.fn(() => ({ width: 0 })),
      transform: vi.fn(),
      rect: vi.fn(),
      clip: vi.fn(),
    };
  }),
});

if (!window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
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
}

vi.mock('react-transition-group', () => ({
  CSSTransition: ({ children }: { children: React.ReactNode }) => children,
  TransitionGroup: ({ children }: { children: React.ReactNode }) => children,
}));
