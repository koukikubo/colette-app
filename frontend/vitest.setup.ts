import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(() => {
  cleanup();
});

if (!HTMLElement.prototype.hasPointerCapture) {
  HTMLElement.prototype.hasPointerCapture = (_pointerId: number) => false;
  HTMLElement.prototype.setPointerCapture = (_pointerId: number) => {};
  HTMLElement.prototype.releasePointerCapture = (_pointerId: number) => {};
}
if (!HTMLElement.prototype.scrollIntoView) {
  HTMLElement.prototype.scrollIntoView = (
    _options?: boolean | ScrollIntoViewOptions,
  ) => {};
}
