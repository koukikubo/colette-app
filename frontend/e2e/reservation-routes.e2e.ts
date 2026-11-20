import { test, expect } from "@playwright/test";

// core-flowが作成した合成データを参照するだけで、通常の開発DBは使用しない。
// 本番ビルドと開発サーバーの両方で、静的URLと動的な予約IDの競合を検出する。
test("予約ルーティングの直接表示と空き枠", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("combobox", { name: "担当者", exact: true }).click();
  await page.getByRole("option", { name: /E2E管理者/ }).click();
  await page
    .getByLabel("パスワード", { exact: true })
    .fill(process.env.E2E_PASSWORD!);
  // 本番ビルドの検証に続いて同じ担当者で確認するため、実際の429制限解除を待つ。
  // アプリ側の認証制限やE2E専用DBのカウンターは変更しない。
  await expect(async () => {
    const login = page.waitForResponse(
      (response) =>
        new URL(response.url()).pathname === "/api/v1/staff/login" &&
        response.request().method() === "POST",
    );
    await page.getByRole("button", { name: "ログイン", exact: true }).click();
    const response = await login;
    expect(response.status()).toBe(200);
  }).toPass({ intervals: [1000, 5000, 10000], timeout: 75_000 });
  await expect(
    page.getByRole("heading", { name: "店舗とお客様の傾向" }),
  ).toBeVisible();

  await page.goto("/reservations");
  await expect(
    page.getByRole("link", { name: "新規予約", exact: true }),
  ).toHaveCount(0);
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(0);
  await page
    .getByRole("link", { name: /^E2Eテーブル .*17:00から予約を登録$/ })
    .waitFor();
  await page.screenshot({
    path: "test-results/reservation-timeline-main.png",
    fullPage: true,
  });
  await page
    .getByRole("link", { name: /^E2Eテーブル .*17:00から予約を登録$/ })
    .click();
  await expect(
    page.getByRole("dialog", { name: "新規予約", exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel(/^予約開始日時/)).toHaveValue(/T17:00$/);
  await expect(
    page.getByRole("checkbox", { name: /E2Eテーブル/ }),
  ).toBeChecked();
  await page.screenshot({
    path: "test-results/reservation-slot-modal.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Close", exact: true }).click();
  await expect(page).toHaveURL(/\/reservations$/);

  await page.reload();
  await page
    .getByRole("link", { name: /^E2Eカウンター .*17:15から予約を登録$/ })
    .press("Enter");
  await expect(
    page.getByRole("dialog", { name: "新規予約", exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel(/^予約開始日時/)).toHaveValue(/T17:15$/);
  await expect(
    page.getByRole("checkbox", { name: /E2Eカウンター/ }),
  ).toBeChecked();
  await page.getByRole("button", { name: "Close", exact: true }).click();
  await expect(page).toHaveURL(/\/reservations$/);

  await page
    .getByRole("link", { name: "月別カレンダーへ", exact: true })
    .click();
  await expect(page.getByRole("navigation", { name: "現在地" })).toHaveText(
    /カレンダー/,
  );
  await expect(page.getByLabel("表示月")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "お探しのページが見つかりません" }),
  ).toHaveCount(0);
});
