import { expect, test } from "@playwright/test";

// APIをモックせず、画面→Next proxy→Rails→専用PostgreSQL→画面を確認する。
test("ログインから顧客・予約・来店完了・RF計算適用まで", async ({ page }) => {
  const name = `E2E顧客${Date.now()}`;
  expect((await page.request.get("/api/v1/customers")).status()).toBe(401);
  await page.goto("/login");
  await page.getByRole("combobox", { name: "担当者", exact: true }).click();
  await page.getByRole("option", { name: /E2E管理者/ }).click();
  await page
    .getByLabel("パスワード", { exact: true })
    .fill(process.env.E2E_PASSWORD!);
  await page.getByRole("button", { name: "ログイン", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  const withoutCsrf = await page.request.post("/api/v1/customers", {
    data: {
      customer: {
        customer_kind: "individual",
        name: "CSRF拒否対象",
        kana: "キョヒタイショウ",
      },
    },
  });
  expect(withoutCsrf.status()).toBe(422);
  expect((await withoutCsrf.json()).message).toBe("CSRFトークンが不正です");

  await page.goto("/customers");
  await page.getByRole("button", { name: "顧客を登録", exact: true }).click();
  await page.getByRole("textbox", { name: /^顧客名/ }).fill(name);
  await page
    .getByRole("textbox", { name: /^フリガナ/ })
    .fill("イーツーイーコキャク");
  await page.getByLabel("電話番号", { exact: true }).fill("09000001234");
  await page.getByRole("button", { name: "登録内容を確認" }).click();
  const customerResponse = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/v1/customers") &&
      response.request().method() === "POST",
  );
  await page.getByRole("button", { name: "登録する", exact: true }).click();
  const savedCustomer = await customerResponse;
  expect(savedCustomer.status()).toBe(201);
  const customer = (await savedCustomer.json()).data.customer;
  await expect(
    page.getByRole("link", { name: `${name}の詳細を表示` }),
  ).toBeVisible();

  // 昨日の来店を画面から登録・完了し、RF計算の対象になることまで検証する。
  const yesterday = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
  }).format(new Date(Date.now() - 86_400_000));
  await page.goto(`/reservations/new?date=${yesterday}`);
  await page.getByRole("searchbox", { name: "顧客検索キーワード" }).fill(name);
  await page.getByRole("button", { name: "検索", exact: true }).click();
  await page.getByRole("button", { name: new RegExp(name) }).click();
  await page.getByLabel(/^予約開始日時/).fill(`${yesterday}T18:00`);
  await page.getByLabel(/^予約終了日時/).fill(`${yesterday}T20:00`);
  await page.getByLabel(/^人数/).fill("2");
  await page.getByRole("combobox", { name: /^希望席種/ }).click();
  await page.getByRole("option", { name: "テーブル席", exact: true }).click();
  await page.getByRole("combobox", { name: /^予約状況/ }).click();
  await page.getByRole("option", { name: "予約確定", exact: true }).click();
  const reservationResponse = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/v1/reservations") &&
      response.request().method() === "POST",
  );
  await page.getByRole("button", { name: "予約を登録", exact: true }).click();
  const savedReservation = await reservationResponse;
  expect(savedReservation.status()).toBe(201);
  const reservation = (await savedReservation.json()).data.reservation;
  expect(reservation.customer_id).toBe(customer.id);
  await expect(page).toHaveURL(/\/reservations\?date=/);
  await page.goto(`/reservations/${reservation.id}`);
  await page.getByRole("button", { name: "対応完了", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "対応完了を取り消す" }),
  ).toBeVisible();

  await page.goto("/rf-management");
  const calculationResponse = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/v1/rf_calculation_runs") &&
      response.request().method() === "POST",
  );
  await page.getByRole("button", { name: "RF計算を実行", exact: true }).click();
  const accepted = await calculationResponse;
  expect(accepted.status()).toBe(202);
  const run = (await accepted.json()).data.calculation_run;
  await expect(
    page.getByText("RF計算が完了しました", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "結果を確認して適用" }).click();
  await page
    .getByRole("button", { name: "計算結果を適用", exact: true })
    .click();
  await page
    .getByRole("alertdialog")
    .getByRole("button", { name: "計算結果を適用", exact: true })
    .click();
  await expect
    .poll(async () => {
      const response = await page.request.get("/api/v1/rf_settings");
      return (await response.json()).data.current_calculation_run?.id;
    })
    .toBe(run.id);

  // 新しい計算結果を顧客詳細と予約履歴から確認する。コードやIDを表示名と混同しない。
  await page.goto(`/customers/${customer.id}`);
  await expect(page.getByRole("heading", { name, exact: true })).toBeVisible();
  await expect(
    page.getByRole("link", { name: `予約${reservation.id}の詳細を開く` }),
  ).toBeVisible();
  const detailResponse = await page.request.get(
    `/api/v1/customers/${customer.id}`,
  );
  const detail = (await detailResponse.json()).data.customer;
  expect(detail.current_rf_rank.label).toBe("Eランク");
  expect(detail.rf_rank_basis.frequency_count).toBe(1);
});
