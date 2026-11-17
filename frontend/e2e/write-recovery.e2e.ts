import { test, expect, type BrowserContext, type Page } from "@playwright/test";

async function login(page: Page) {
  await page.goto("/login");
  await page.getByRole("combobox", { name: "担当者", exact: true }).click();
  await page.getByRole("option", { name: /E2E管理者/ }).click();
  await page
    .getByLabel("パスワード", { exact: true })
    .fill(process.env.E2E_PASSWORD!);
  await page.getByRole("button", { name: "ログイン", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

// 正しいログインも回数制限の対象。専用CIコンテキスト間でCookieを共有し、制限は変更しない。
let cookies: Awaited<ReturnType<BrowserContext["cookies"]>> | null = null;
test.beforeEach(async ({ page, context }) => {
  if (cookies) await context.addCookies(cookies);
  else {
    await login(page);
    cookies = await context.cookies();
  }
});

for (const failure of ["lost", "invalid-json"] as const) {
  test(`顧客保存後の${failure}とリロードでも二重登録しない`, async ({
    page,
  }) => {
    const name = `E2E回復${failure}${Date.now()}`;
    let writes = 0;
    await page.route("**/api/v1/customers", async (route) => {
      if (route.request().method() !== "POST") return route.continue();
      writes++;
      // 本物のRailsでcommitした後、成功応答だけを失わせる。
      const response = await route.fetch();
      expect(response.status()).toBe(201);
      if (failure === "lost") await route.abort("failed");
      else
        await route.fulfill({
          status: 200,
          contentType: "text/html",
          body: "<html>unexpected upstream page</html>",
        });
    });
    await page.goto("/customers");
    await page.getByRole("button", { name: "顧客を登録", exact: true }).click();
    await page.getByLabel(/^顧客名/).fill(name);
    await page.getByLabel(/^フリガナ/).fill("カイフクカクニン");
    await page
      .getByRole("button", { name: "登録内容を確認", exact: true })
      .click();
    await page.getByRole("button", { name: "登録する", exact: true }).click();
    await expect(
      page.getByText(
        "登録済みの顧客を確認しました。登録し直す必要はありません。",
        { exact: true },
      ),
    ).toBeVisible();
    await page.reload();
    await page.getByRole("button", { name: "顧客を登録", exact: true }).click();
    await expect(
      page.getByText(
        "登録済みの顧客を確認しました。登録し直す必要はありません。",
        { exact: true },
      ),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "登録済みの内容を表示", exact: true })
      .click();
    await expect(
      page.getByRole("link", { name: `${name}の詳細を表示`, exact: true }),
    ).toBeVisible();
    const result = await page.request.get(
      `/api/v1/customers?query=${encodeURIComponent(name)}`,
    );
    expect(
      (await result.json()).data.customers.filter(
        (customer: { name: string }) => customer.name === name,
      ),
    ).toHaveLength(1);
    expect(writes).toBe(1);
  });
}

test("予約保存後の応答消失とリロードで登録済み予約を回復する", async ({
  page,
}) => {
  const date = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
  }).format(new Date(Date.now() + 2 * 86_400_000));
  const name = `E2E予約回復${Date.now()}`;
  let id: number | undefined;
  let writes = 0;
  await page.route("**/api/v1/reservations", async (route) => {
    if (route.request().method() !== "POST") return route.continue();
    writes++;
    const response = await route.fetch();
    expect(response.status()).toBe(201);
    id = (await response.json()).data.reservation.id;
    await route.abort("failed");
  });
  await page.goto(`/reservations/new?date=${date}`);
  await page.getByLabel(/^予約者名/).fill(name);
  await page.getByLabel(/^電話番号/).fill("09011112222");
  await page.getByLabel(/^予約開始日時/).fill(`${date}T18:00`);
  await page.getByLabel(/^予約終了日時/).fill(`${date}T20:00`);
  await page.getByLabel(/^人数/).fill("2");
  await page.getByRole("combobox", { name: /^希望席種/ }).click();
  await page.getByRole("option", { name: "テーブル席", exact: true }).click();
  await page.getByRole("combobox", { name: /^予約状況/ }).click();
  await page.getByRole("option", { name: "予約確定", exact: true }).click();
  await page.getByRole("button", { name: "予約を登録", exact: true }).click();
  await expect(
    page.getByText(
      "登録済みの予約を確認しました。登録し直す必要はありません。",
      { exact: true },
    ),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByText(
      "登録済みの予約を確認しました。登録し直す必要はありません。",
      { exact: true },
    ),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "登録済みの内容を表示", exact: true })
    .click();
  await expect(page).toHaveURL(new RegExp(`/reservations/detail/${id}$`));
  expect(writes).toBe(1);
});
