import { expect, test } from "@playwright/test";

// 実APIの完了保存・再読込、全機能の入口、入力保全を同じ担当者で確認する。
test("全機能のヘルプとスポットライト案内を使い、完了状態と入力を保持する", async ({
  page,
}) => {
  await page.goto("/login");
  await page.getByRole("button", { name: "使い方・ヘルプ" }).click();
  await expect(
    page.getByRole("article", { name: "ログイン", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "統一RFマスタ・計算・適用", exact: true }),
  ).toHaveCount(0);
  await page.keyboard.press("Escape");
  await page.getByRole("combobox", { name: "担当者", exact: true }).click();
  await page.getByRole("option", { name: /E2E管理者/ }).click();
  await page
    .getByLabel("パスワード", { exact: true })
    .fill(process.env.E2E_PASSWORD!);
  await expect(async () => {
    const login = page.waitForResponse(
      (response) =>
        new URL(response.url()).pathname === "/api/v1/staff/login" &&
        response.request().method() === "POST",
    );
    await page.getByRole("button", { name: "ログイン", exact: true }).click();
    expect((await login).status()).toBe(200);
  }).toPass({ intervals: [1000, 5000, 10000], timeout: 75_000 });
  await expect(page).toHaveURL(/\/dashboard$/);

  await page.getByRole("button", { name: "使い方・ヘルプ" }).click();
  await page
    .getByRole("button", { name: "基本操作の案内を最初から見る" })
    .click();
  await expect(page.locator('[data-slot="guide-spotlight"]')).toHaveCount(1);
  await page.getByRole("button", { name: "次へ", exact: true }).click();
  await page.getByRole("button", { name: "戻る", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "予約管理", exact: true }),
  ).toBeVisible();
  for (let index = 0; index < 4; index++)
    await page.getByRole("button", { name: "次へ", exact: true }).click();
  const stored = page.waitForResponse(
    (response) =>
      response.url().includes("/api/v1/staff/guide_state") &&
      response.request().method() === "PATCH",
  );
  await page.getByRole("button", { name: "案内を完了", exact: true }).click();
  expect((await stored).status()).toBe(200);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.reload();
  const profile = await page.request.get("/api/v1/staff/guide_state");
  expect((await profile.json()).data.guide_state.status).toBe("completed");

  for (const path of [
    "/dashboard",
    "/customers",
    "/reservations",
    "/reservations/calendar",
    "/rf-analysis",
    "/rf-customer-transitions",
    "/rf-rank-drops",
    "/rf-rank-drops/predictions",
    "/rf-management",
    "/standard-codes",
    "/staff-masters",
    "/restaurant-masters",
    "/account/password",
  ]) {
    await page.goto(path);
    const entry = page.getByRole("button", { name: "使い方・ヘルプ" });
    await expect(entry).toBeVisible();
    await entry.click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByRole("article")).toHaveCount(1);
    await expect(
      page.getByText("初回案内：完了", { exact: true }),
    ).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(entry).toBeFocused();
  }

  // タイムラインからの予約モーダルでも、ヘルプだけを閉じて入力を続けられる。
  await page.goto("/reservations");
  await page
    .getByRole("link", { name: /^E2Eテーブル .*17:00から予約を登録$/ })
    .click();
  const reservationDialog = page.getByRole("dialog", {
    name: "新規予約",
    exact: true,
  });
  await expect(reservationDialog).toBeVisible();
  const modalName = reservationDialog.getByRole("textbox", {
    name: /^予約者名/,
  });
  await modalName.fill("モーダル内の入力を保持");
  const modalHelp = reservationDialog.getByRole("button", {
    name: "使い方・ヘルプ",
  });
  await modalHelp.click();
  await expect(
    page.getByRole("article", { name: "予約の登録・編集" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(reservationDialog).toBeVisible();
  await expect(modalName).toHaveValue("モーダル内の入力を保持");
  await expect(modalHelp).toBeFocused();

  await page.goto("/reservations/new");
  const name = page.getByRole("textbox", { name: /^予約者名/ });
  await name.fill("E2Eヘルプ入力保持");
  await page.getByRole("button", { name: "使い方・ヘルプ" }).click();
  await expect(
    page.getByRole("article", { name: "予約の登録・編集" }),
  ).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("textbox", { name: "ヘルプを検索" }).fill("通信障害");
  await page
    .getByRole("button", { name: "通信障害・セッション期限切れ", exact: true })
    .click();
  await page.screenshot({
    path: "test-results/help-227-mobile.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.screenshot({
    path: "test-results/help-227-desktop.png",
    fullPage: true,
  });
  await page.keyboard.press("Escape");
  await expect(name).toHaveValue("E2Eヘルプ入力保持");
});
