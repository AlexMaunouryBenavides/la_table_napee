import { afterEach, vi } from 'vitest';

/** jsdom n'a pas `matchMedia` : on dit nous-mêmes quelle taille d'écran on simule. */
export function ecranLarge(large: boolean) {
  window.matchMedia = vi.fn().mockReturnValue({
    matches: large,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  });
}

afterEach(() => {
  Reflect.deleteProperty(window, 'matchMedia');
});
