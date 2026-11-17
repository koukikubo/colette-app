import { afterEach, expect, it, vi } from "vitest";
import { apiFetch } from "../api-client";
import { SESSION_EXPIRED_EVENT } from "../session-events";
afterEach(() => vi.unstubAllGlobals());
it.each(["<html>maintenance</html>", "", '{"status":"success"}'])(
  "成功コードでも壊れた応答を保存成功にしない: %s",
  async (body) => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(body, { status: 200 })),
    );
    await expect(apiFetch("/api/v1/customers")).rejects.toMatchObject({
      code: "invalid_response",
    });
  },
);
it("Basic認証の401を担当者セッション切れとして通知しない", async () => {
  const expired = vi.fn();
  window.addEventListener(SESSION_EXPIRED_EVENT, expired);
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(
      new Response("Unauthorized", {
        status: 401,
        headers: { "WWW-Authenticate": 'Basic realm="Colette"' },
      }),
    ),
  );
  try {
    await expect(apiFetch("/api/v1/customers")).rejects.toMatchObject({
      code: "access_auth_required",
    });
    expect(expired).not.toHaveBeenCalled();
  } finally {
    window.removeEventListener(SESSION_EXPIRED_EVENT, expired);
  }
});
it("応答が返らない要求は期限で中断できる", async () => {
  vi.useFakeTimers();
  vi.stubGlobal(
    "fetch",
    vi.fn(
      (_path: string, options: RequestInit) =>
        new Promise((_resolve, reject) => {
          if (!options.signal) {
            reject(new Error("no deadline"));
            return;
          }
          options.signal.addEventListener("abort", () =>
            reject(new DOMException("timeout", "AbortError")),
          );
        }),
    ),
  );
  try {
    const assertion = expect(
      apiFetch("/api/v1/customers"),
    ).rejects.toMatchObject({ name: "AbortError" });
    await vi.advanceTimersByTimeAsync(35_000);
    await assertion;
  } finally {
    vi.useRealTimers();
  }
});
