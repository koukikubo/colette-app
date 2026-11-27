import { describe, it, expect } from "vitest";
import {
  featureGuides,
  guideForPath,
  guidesForRole,
  overviewSteps,
} from "../guide-catalog";

describe("全機能のヘルプ定義", () => {
  it("公開済みの全通常ページとログインに対応する", () => {
    const pages = Object.keys(import.meta.glob("/app/**/page.tsx"));
    const paths = pages
      .filter(
        (path) =>
          (path.includes("/(protected)/") && !path.includes("/@")) ||
          path === "/app/login/page.tsx",
      )
      .map((path) =>
        path
          .replace("/app/(protected)", "")
          .replace("/app", "")
          .replace(/\/page.tsx$/, "")
          .replace(/\[id\]/g, "10"),
      );
    expect(paths.length).toBeGreaterThan(15);
    paths.forEach((path) => expect(guideForPath(path), path).toBeDefined());
    expect(new Set(featureGuides.map((guide) => guide.id)).size).toBe(
      featureGuides.length,
    );
  });
  it("未認証にはログイン・復旧だけを案内する", () => {
    expect(guidesForRole().map((guide) => guide.id)).toEqual([
      "login",
      "session",
    ]);
  });
  it("viewerは更新操作なし、operatorは顧客・予約更新、ownerはマスタ更新も案内する", () => {
    expect(
      guidesForRole("viewer")
        .flatMap((guide) => guide.topics)
        .some((topic) => topic.resource),
    ).toBe(false);
    expect(
      guidesForRole("operator")
        .flatMap((guide) => guide.topics)
        .some((topic) => topic.resource === "masters"),
    ).toBe(false);
    expect(
      guidesForRole("operator")
        .flatMap((guide) => guide.topics)
        .some((topic) => topic.resource === "reservations"),
    ).toBe(true);
    expect(
      guidesForRole("owner")
        .flatMap((guide) => guide.topics)
        .some((topic) => topic.resource === "masters"),
    ).toBe(true);
    expect(overviewSteps("viewer")[0].text).not.toContain("登録");
  });
});
