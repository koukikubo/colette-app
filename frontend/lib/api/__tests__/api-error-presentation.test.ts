import { describe, expect, it } from "vitest";

import { ApiClientError } from "@/lib/api/api-client";
import { getApiErrorPresentation } from "@/lib/api/api-error-presentation";

describe("getApiErrorPresentation", () => {
  it.each([
    [401, "authentication"],
    [403, "authorization"],
    [404, "not_found"],
    [409, "conflict"],
    [422, "validation"],
    [500, "unexpected"],
  ] as const)("HTTP %sを%sとして分類する", (status, kind) => {
    const presentation = getApiErrorPresentation(
      new ApiClientError("内部向けメッセージ", status),
    );

    expect(presentation.kind).toBe(kind);
    expect(presentation.description).not.toContain("内部向けメッセージ");
  });

  it("API以外の例外を予期しないエラーとして分類する", () => {
    expect(getApiErrorPresentation(new Error("unexpected")).kind).toBe(
      "unexpected",
    );
  });
});

it("Basic認証の拒否では担当者ログインへ誘導しない", () => {
  const presentation = getApiErrorPresentation(
    new ApiClientError("Basic", 401, [], "access_auth_required"),
  );
  expect(presentation.kind).toBe("access_authentication");
  expect(presentation.primaryHref).toBeUndefined();
});
it("認証元が不明な401をセッション失効と断定しない", () => {
  expect(
    getApiErrorPresentation(
      new ApiClientError("HTML", 401, [], "unexpected_response"),
    ).kind,
  ).toBe("unexpected");
});
