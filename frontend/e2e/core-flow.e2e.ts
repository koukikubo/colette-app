import { expect, test, type Page } from "@playwright/test";

// 全体画像で固定ヘッダーが画面途中へ写り込まないよう、撮影前に先頭へ戻す。
async function captureDashboard(page: Page, path: string) {
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  await page.screenshot({ path, fullPage: true });
}

// APIをモックせず、画面→Next proxy→Rails→専用PostgreSQL→画面を確認する。
test("ログインから顧客・予約・来店完了・RF計算適用まで", async ({ page }) => {
  const name = `E2E顧客${Date.now()}`;
  expect((await page.request.get("/api/v1/customers")).status()).toBe(401);
  await page.goto("/login");
  await expect(
    page.getByRole("combobox", { name: "担当者", exact: true }),
  ).toBeEnabled();
  await page.screenshot({
    path: "test-results/login-redesign.png",
    fullPage: true,
  });
  await page.getByRole("combobox", { name: "担当者", exact: true }).click();
  await page.getByRole("option", { name: /E2E管理者/ }).click();
  await page
    .getByLabel("パスワード", { exact: true })
    .fill(process.env.E2E_PASSWORD!);
  await page.getByRole("button", { name: "ログイン", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  // 初期DBのゼロ件と算出不能を実API・画面で確認し、店舗日付の予約導線をキーボードで開く。
  const emptyDashboard = await page.request.get("/api/v1/dashboard");
  expect(emptyDashboard.status()).toBe(200);
  const empty = (await emptyDashboard.json()).data;
  expect(Object.values(empty.summary)).toEqual([0, 0, 0, 0, 0, 0]);
  await expect(page.getByText("算出できません", { exact: true })).toBeVisible();
  await page.getByText("本日の予約状況", { exact: true }).press("Enter");
  await expect(
    page.getByRole("link", { name: "本日の予約一覧", exact: true }),
  ).toHaveAttribute("href", `/reservations?date=${empty.date}`);
  await captureDashboard(page, "test-results/dashboard-empty-desktop.png");
  await page
    .getByRole("link", { name: "本日の予約一覧", exact: true })
    .press("Enter");
  await expect(page).toHaveURL(
    new RegExp(`/reservations\\?date=${empty.date}$`),
  );

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

  // 空の専用DBで実席を登録し、T/C別の自動採番を実APIと画面で確認する。
  await page.goto("/restaurant-masters");
  let tableId: number | undefined;
  for (const [label, code, seatName] of [
    ["テーブル席", "T01", "E2Eテーブル"],
    ["カウンター席", "C01", "E2Eカウンター"],
  ]) {
    await page.getByRole("button", { name: "席を登録", exact: true }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByRole("combobox", { name: "席種", exact: true }).click();
    await page.getByRole("option", { name: label, exact: true }).click();
    await dialog
      .getByRole("textbox", { name: "席名", exact: true })
      .fill(seatName);
    await dialog.getByLabel("定員", { exact: true }).fill("2");
    const created = page.waitForResponse(
      (response) =>
        response.url().endsWith("/api/v1/restaurant_masters") &&
        response.request().method() === "POST",
    );
    await dialog.getByRole("button", { name: "登録する", exact: true }).click();
    const response = await created;
    expect(response.status()).toBe(201);
    const seat = (await response.json()).data.restaurant_master;
    expect(seat.code).toBe(code);
    if (code === "T01") tableId = seat.id;
    await expect(dialog).not.toBeVisible();
    await expect(
      page.getByRole("cell", { name: code, exact: true }),
    ).toBeVisible();
  }

  const initialCustomerRequests: string[] = [];
  const trackInitialCustomers = (
    request: import("@playwright/test").Request,
  ) => {
    if (
      new URL(request.url()).pathname === "/api/v1/customers" &&
      request.method() === "GET"
    )
      initialCustomerRequests.push(request.url());
  };
  page.on("request", trackInitialCustomers);
  await page.goto("/customers");
  await expect(page.getByText("表示中の顧客数", { exact: true })).toBeVisible();
  expect(initialCustomerRequests).toEqual([]);
  await page.screenshot({
    path: "test-results/customer-search-224-initial.png",
    fullPage: true,
  });
  page.off("request", trackInitialCustomers);
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
    page.getByText("顧客情報を保存しました。", { exact: true }),
  ).toBeVisible();
  await page.getByRole("searchbox", { name: "顧客検索キーワード" }).fill(name);
  await page.getByRole("button", { name: "検索", exact: true }).click();
  await expect(
    page.getByRole("link", { name: `${name}の詳細を表示` }),
  ).toBeVisible();

  // 昨日の来店を画面から登録・完了し、RF計算の対象になることまで検証する。
  const yesterday = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
  }).format(new Date(Date.now() - 86_400_000));
  await page.goto(`/reservations/calendar?date=${yesterday}`);
  await page
    .getByRole("link", { name: new RegExp(`^${yesterday} 予約`) })
    .click();
  await expect(page).toHaveURL(
    new RegExp(`/reservations\\?date=${yesterday}$`),
  );
  await page
    .getByRole("link", {
      name: `E2Eテーブル ${yesterday} 18:00から予約を登録`,
      exact: true,
    })
    .press("Enter");
  await expect(
    page.getByRole("dialog", { name: "新規予約", exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel(/^予約開始日時/)).toHaveValue(
    `${yesterday}T18:00`,
  );
  await expect(
    page.getByRole("checkbox", { name: /E2Eテーブル/ }),
  ).toBeChecked();
  await page.getByLabel(/^予約者名/).fill("入力保全の確認");
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("alertdialog", { name: "入力内容を破棄しますか？" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "編集を続ける", exact: true }).click();
  await expect(page.getByLabel(/^予約者名/)).toHaveValue("入力保全の確認");
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
  await page.getByRole("checkbox", { name: /E2Eテーブル/ }).check();
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
  expect(reservation.restaurant_master_ids).toEqual([tableId]);
  await expect(page).toHaveURL(/\/reservations\?date=/);
  await page
    .getByRole("link", { name: `${name}様の予約詳細を開く`, exact: true })
    .click();
  await expect(
    page.getByRole("dialog", { name: "予約詳細", exact: true }),
  ).toBeVisible();
  // 編集の中止・保存のどちらも、詳細を閉じれば元のタイムラインへ戻る。
  for (const save of [false, true]) {
    await page.getByRole("link", { name: /編集する/ }).click();
    await expect(
      page.getByRole("dialog", { name: "予約編集", exact: true }),
    ).toBeVisible();
    if (save) {
      await page
        .getByLabel("店舗メモ", { exact: true })
        .fill("編集履歴の回帰確認");
      await page.getByRole("combobox", { name: /^予約状況/ }).click();
      await page.getByRole("option", { name: "仮予約", exact: true }).click();
      await page
        .getByRole("button", { name: "予約を更新", exact: true })
        .click();
      await page
        .getByRole("alertdialog")
        .getByRole("button", { name: "更新する", exact: true })
        .click();
    } else {
      await page.getByRole("button", { name: "閉じる", exact: true }).click();
    }
    await expect(
      page.getByRole("dialog", { name: "予約詳細", exact: true }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Close", exact: true }).click();
    await expect(page).toHaveURL(
      new RegExp(`/reservations\\?date=${yesterday}$`),
    );
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await page
      .getByRole("link", { name: `${name}様の予約詳細を開く`, exact: true })
      .click();
  }
  // タイムラインのメニューから、仮予約の確定と退店をキーボードで一体処理する。
  await page.getByRole("button", { name: "Close", exact: true }).click();
  await page
    .getByRole("button", { name: `${name}様の予約操作を開く`, exact: true })
    .click();
  await page.getByRole("button", { name: "退店済にする", exact: true }).click();
  await expect(
    page.getByRole("alertdialog", {
      name: "予約確定と退店を同時に記録しますか？",
    }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "確定する", exact: true })
    .press("Enter");
  await expect(page.getByRole("alertdialog")).toHaveCount(0);
  const completedLink = page.getByRole("link", {
    name: `${name}様の予約詳細を開く`,
    exact: true,
  });
  await expect(completedLink.locator("..")).toHaveAttribute(
    "data-timeline-state",
    "completed",
  );
  await page.keyboard.press("Escape");
  await completedLink.click();
  await expect(
    page.getByRole("dialog", { name: "予約詳細", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "来店結果を訂正", exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: "test-results/manual-checkout-desktop.png",
    animations: "disabled",
  });

  // 無断キャンセル訂正は理由不要。Rails保存後に応答を失っても同じキーで復旧する。
  const correctionUrl = `**/api/v1/reservations/${reservation.id}/correct_result`;
  await page.route(
    correctionUrl,
    async (route) => {
      const upstream = await route.fetch();
      expect(upstream.status()).toBe(200);
      await route.abort("failed");
    },
    { times: 1 },
  );
  await page
    .getByRole("button", { name: "来店結果を訂正", exact: true })
    .click();
  // ネイティブselectのEndキーはOS差があるため、値選択とTab移動を別々に確認する。
  await page.getByLabel("訂正後の来店結果").selectOption("no_show");
  await page.getByLabel("訂正後の来店結果").focus();
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("checkbox", { name: "予約情報も訂正する" }),
  ).toBeFocused();
  await expect(page.getByLabel("訂正理由（必須）")).toHaveCount(0);
  await page.screenshot({
    path: "test-results/manual-checkout-correction-desktop.png",
    animations: "disabled",
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect
    .poll(() =>
      page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    )
    .toBe(true);
  const correctionBounds = await page.getByRole("alertdialog").boundingBox();
  expect(correctionBounds).not.toBeNull();
  expect(correctionBounds!.x).toBeGreaterThanOrEqual(0);
  expect(correctionBounds!.x + correctionBounds!.width).toBeLessThanOrEqual(
    390,
  );
  await page.screenshot({
    path: "test-results/manual-checkout-correction-mobile.png",
    animations: "disabled",
  });
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.getByRole("button", { name: "確定する", exact: true }).click();
  await page
    .getByRole("button", { name: "同じ操作を再試行", exact: true })
    .click();
  await expect(page.getByRole("alertdialog")).toHaveCount(0);
  let audit = await page.request.get(
    `/api/v1/reservations/${reservation.id}/result_changes`,
  );
  expect(audit.status()).toBe(200);
  expect((await audit.json()).data.pagination.total_count).toBe(2);
  await page
    .getByRole("button", { name: "来店結果を訂正", exact: true })
    .click();
  await page.getByLabel("訂正後の来店結果").selectOption("checked_out");
  await expect(page.getByLabel("訂正理由（必須）")).toHaveCount(0);
  await page.getByRole("button", { name: "確定する", exact: true }).click();
  await expect(page.getByRole("alertdialog")).toHaveCount(0);
  audit = await page.request.get(
    `/api/v1/reservations/${reservation.id}/result_changes`,
  );
  expect((await audit.json()).data.pagination.total_count).toBe(3);

  await page.getByRole("button", { name: "Close", exact: true }).click();
  await expect(page).toHaveURL(/\/reservations\?date=/);
  await page.goto(`/reservations/${reservation.id}`);
  await expect(page.getByRole("dialog")).toHaveCount(0);
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
  await page.getByRole("tab", { name: "予約・来店履歴", exact: true }).click();
  await expect(
    page.getByRole("link", { name: `予約${reservation.id}の詳細を開く` }),
  ).toBeVisible();
  const detailResponse = await page.request.get(
    `/api/v1/customers/${customer.id}`,
  );
  const detail = (await detailResponse.json()).data.customer;
  expect(detail.current_rf_rank.label).toBe("Eランク");
  expect(detail.rf_rank_basis.frequency_count).toBe(1);

  // 画面で作成した1件の完了実績が月別・年次・顧客指標へ同じ定義で反映されることを照合する。
  const analyticsResponse = await page.request.get(
    "/api/v1/dashboard_analytics",
  );
  expect(analyticsResponse.status()).toBe(200);
  const analytics = (await analyticsResponse.json()).data;
  const sameMonth = yesterday.slice(0, 7) === analytics.period.current_month;
  expect(analytics.kpis.annual_visits).toBe(
    Number(yesterday.slice(0, 4)) === analytics.period.year ? 1 : 0,
  );
  expect(analytics.kpis.monthly_reservations).toBe(sameMonth ? 1 : 0);
  expect(analytics.kpis.new_customers).toBe(sameMonth ? 1 : 0);
  expect(analytics.kpis.returning_customer_ratio).toBe(sameMonth ? 0 : null);
  expect(
    analytics.monthly_series.find(
      (point: { month: string }) => point.month === yesterday.slice(0, 7),
    ),
  ).toEqual({ month: yesterday.slice(0, 7), reservations: 1, visits: 1 });

  // Railsで適用した結果を一覧検索へ接続し、選択条件を保持して詳細から戻る。
  await page.goto(`/customers?query=${encodeURIComponent(name)}`);
  await expect(
    page.getByRole("columnheader", { name: "手動ランク", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: /絞り込み/ }).click();
  await page
    .getByRole("combobox", { name: "現在適用中のRFランク" })
    .selectOption(String(detail.current_rf_rank.id));
  await page.getByRole("button", { name: "適用", exact: true }).click();
  await expect(page).toHaveURL(
    new RegExp(`rf_rank_id=${detail.current_rf_rank.id}`),
  );
  const row = page
    .getByRole("row")
    .filter({ has: page.getByText(name, { exact: true }) });
  await expect(row.getByText("Eランク", { exact: true })).toBeVisible();
  await row.getByRole("link", { name: `${name}の詳細を表示` }).click();
  await page.getByRole("link", { name: "顧客一覧へ戻る" }).click();
  await expect(page).toHaveURL(
    new RegExp(`rf_rank_id=${detail.current_rf_rank.id}`),
  );
  await expect(
    page
      .getByRole("row")
      .filter({ has: page.getByText(name, { exact: true }) })
      .getByText("Eランク", { exact: true }),
  ).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole("button", { name: /絞り込み/ })).toBeVisible();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);
  await page.screenshot({
    path: "test-results/customer-rank-search-mobile.png",
    fullPage: true,
  });
});

// 合成データだけのE2E環境で分析の数値・取得失敗からの回復・各画面幅の主要導線を確認する。
test("分析ダッシュボードとタブレット表示", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("combobox", { name: "担当者", exact: true }).click();
  await page.getByRole("option", { name: /E2E管理者/ }).click();
  await page
    .getByLabel("パスワード", { exact: true })
    .fill(process.env.E2E_PASSWORD!);
  await page.getByRole("button", { name: "ログイン", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "店舗とお客様の傾向" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "RFランク別の顧客数" }),
  ).toBeVisible();
  const response = await page.request.get("/api/v1/dashboard_analytics");
  expect(response.status()).toBe(200);
  const analytics = (await response.json()).data;
  await expect(
    page
      .getByText("年間累計来店", { exact: true })
      .locator("..")
      .getByText(`${analytics.kpis.annual_visits}件`, { exact: true }),
  ).toBeVisible();

  // 通信失敗を0件へ置き換えず、手動更新で実Railsの結果へ回復する。
  await page.route("**/api/v1/dashboard_analytics", (route) =>
    route.abort("failed"),
  );
  await page
    .getByRole("button", { name: "最新情報に更新", exact: true })
    .click();
  // Next.js標準のルート読み上げ通知ではなく、業務画面の取得エラーを検証する。
  const dashboardAlert = page.locator(".colette-page").getByRole("alert");
  await expect(dashboardAlert).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "店舗とお客様の傾向" }),
  ).not.toBeVisible();
  await page.unroute("**/api/v1/dashboard_analytics");
  await page
    .getByRole("button", { name: "最新情報に更新", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "店舗とお客様の傾向" }),
  ).toBeVisible();
  await expect(dashboardAlert).not.toBeVisible();
  await page.getByText("数値を表で確認", { exact: true }).press("Enter");
  const table = page.getByRole("table", { name: "月別予約・来店件数" });
  for (const months of [3, 6, 12]) {
    await page
      .getByRole("combobox", { name: "表示期間" })
      .selectOption(String(months));
    await expect(table.getByRole("row")).toHaveCount(months + 1);
    for (const point of analytics.monthly_series.slice(-months)) {
      const row = table.getByRole("row").filter({ hasText: point.month });
      await expect(row.getByRole("cell").nth(0)).toHaveText(
        String(point.reservations),
      );
      await expect(row.getByRole("cell").nth(1)).toHaveText(
        String(point.visits),
      );
    }
  }
  await page.getByRole("combobox", { name: "表示期間" }).selectOption("3");
  await captureDashboard(page, "test-results/dashboard-redesign-desktop.png");
  await page.setViewportSize({ width: 820, height: 1180 });
  await page.getByRole("combobox", { name: "表示期間" }).selectOption("12");
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(820);
  await page.getByRole("combobox", { name: "表示期間" }).selectOption("3");
  await captureDashboard(page, "test-results/dashboard-redesign-tablet.png");
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);
  await captureDashboard(page, "test-results/dashboard-acceptance-mobile.png");
  await page.getByText("本日の予約状況", { exact: true }).press("Enter");
  const summaryResponse = await page.request.get("/api/v1/dashboard");
  const today = (await summaryResponse.json()).data.date;
  await page
    .getByRole("link", { name: "本日の予約一覧", exact: true })
    .press("Enter");
  await expect(page).toHaveURL(new RegExp(`/reservations\\?date=${today}$`));
  await page.setViewportSize({ width: 820, height: 1180 });
  await page.getByRole("link", { name: "カレンダー", exact: true }).click();
  await expect(
    page
      .getByRole("navigation", { name: "現在地" })
      .getByText("カレンダー", { exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(820);
  await page.screenshot({
    path: "test-results/calendar-redesign-tablet.png",
    fullPage: true,
  });
});

// RFの再計算・適用も実APIとJobを使い、内訳をモックで作らない。
async function calculateBreakdownRun(
  page: Page,
  ruleId: number,
  date: string,
  csrf: string,
) {
  const headers = { "X-CSRF-Token": csrf };
  const response = await page.request.post("/api/v1/rf_calculation_runs", {
    headers,
    data: { rf_calculation: { rf_rule_set_id: ruleId, base_date: date } },
  });
  expect(response.status()).toBe(202);
  const run = (await response.json()).data.calculation_run;
  await expect
    .poll(async () => {
      const result = await page.request.get(
        `/api/v1/rf_calculation_runs/${run.id}`,
      );
      expect(result.status()).toBe(200);
      return (await result.json()).data.calculation_run.status;
    })
    .toBe("completed");
  const applied = await page.request.patch(
    `/api/v1/rf_calculation_runs/${run.id}/activate`,
    { headers },
  );
  expect(applied.status()).toBe(200);
  return run.id as number;
}

test("RF人数・セルから固定履歴の内訳と予約履歴へ進み条件を保持して戻る", async ({
  page,
}) => {
  await page.goto("/login");
  await page.getByRole("combobox", { name: "担当者", exact: true }).click();
  await page.getByRole("option", { name: /E2E管理者/ }).click();
  await page
    .getByLabel("パスワード", { exact: true })
    .fill(process.env.E2E_PASSWORD!);
  await page.getByRole("button", { name: "ログイン", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  const settingsResponse = await page.request.get("/api/v1/rf_settings");
  const settings = (await settingsResponse.json()).data;
  const previousId = settings.current_calculation_run.id;
  const date = settings.current_calculation_run.base_date;
  const csrfResponse = await page.request.get("/api/v1/csrf");
  const csrf = (await csrfResponse.json()).data.csrf_token;
  const addedIds: number[] = [];
  for (const index of [1, 2]) {
    const created = await page.request.post("/api/v1/customers", {
      headers: { "X-CSRF-Token": csrf },
      data: {
        customer: {
          customer_kind: "individual",
          name: `E2E内訳${index}`,
          kana: "イーツーイーウチワケ",
          phone_number: `0900000555${index}`,
        },
      },
    });
    expect(created.status()).toBe(201);
    addedIds.push((await created.json()).data.customer.id);
  }
  const runId = await calculateBreakdownRun(
    page,
    settings.published_rule_set.id,
    date,
    csrf,
  );
  const allResponse = await page.request.get(
    `/api/v1/rf_customers?run_id=${runId}`,
  );
  expect(allResponse.status()).toBe(200);
  const all = (await allResponse.json()).data;
  expect(all.pagination.total_count).toBe(3);
  const noVisit = all.customers.find(
    (row: { customer_id: number }) => row.customer_id === addedIds[0],
  );
  expect(noVisit.to_state).toBe("no_visit");
  const rankId = noVisit.to_rank.id;

  await page.goto("/rf-analysis");
  await page
    .locator(`a[href*="/rf-customers?run_id=${runId}&rf_rank_id=${rankId}"]`)
    .first()
    .press("Enter");
  await expect(page).toHaveURL(/\/rf-customers\?/);
  await expect(page.getByText(/条件：.*2人/)).toBeVisible();
  const rankPath = `/rf-customers?${new URLSearchParams({ run_id: String(runId), rf_rank_id: String(rankId), page: "2", per_page: "1", return_to: "/rf-analysis" })}`;
  await page.goto(rankPath);
  await expect(
    page.getByRole("combobox", { name: "1ページあたりの表示件数" }),
  ).toHaveText("1件");
  const target = all.customers
    .filter((row: { customer_id: number }) =>
      addedIds.includes(row.customer_id),
    )
    .sort(
      (a: { customer_id: number }, b: { customer_id: number }) =>
        a.customer_id - b.customer_id,
    )[1];
  await page
    .getByRole("link", { name: target.customer_name, exact: true })
    .press("Enter");
  await page.getByRole("tab", { name: "予約・来店履歴", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "予約・来店履歴", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("link", { name: "RFの顧客内訳に戻る", exact: true })
    .press("Enter");
  await expect(page).toHaveURL(
    new RegExp(`run_id=${runId}.*rf_rank_id=${rankId}.*page=2.*per_page=1`),
  );

  // 現在の適用先を更新した後も、選択済み履歴とページを再取得する。
  const newestId = await calculateBreakdownRun(
    page,
    settings.published_rule_set.id,
    date,
    csrf,
  );
  expect(newestId).not.toBe(runId);
  await page.reload();
  const fixedResponse = await page.request.get(
    `/api/v1/rf_customers?run_id=${runId}&rf_rank_id=${rankId}&page=2&per_page=1`,
  );
  const fixed = (await fixedResponse.json()).data;
  expect(fixed.run.id).toBe(runId);
  expect(fixed.customers[0].customer_id).toBe(target.customer_id);
  const breakdownApi = (url: URL) => url.pathname === "/api/v1/rf_customers";
  await page.route(breakdownApi, (route) => route.abort("failed"));
  await page.reload();
  const alert = page.locator("#main-content").getByRole("alert");
  await expect(alert).toBeVisible();
  await page.unroute(breakdownApi);
  await page.getByRole("button", { name: "再取得", exact: true }).click();
  await expect(
    page.getByRole("link", { name: target.customer_name, exact: true }),
  ).toBeVisible();
  await expect(alert).not.toBeVisible();

  const comparisonReturn = `/rf-customer-transitions?${new URLSearchParams({ start_month: date.slice(0, 7), end_month: date.slice(0, 7) })}`;
  const comparisonPath = `/rf-customers?${new URLSearchParams({ run_id: String(runId), comparison_run_id: String(previousId), category: "added", page: "2", per_page: "1", return_to: comparisonReturn })}`;
  await page.goto(comparisonPath);
  await expect(page.getByText(/条件：.*終了時点のみ.*2人/)).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: "test-results/rf-breakdown-acceptance-mobile.png",
    fullPage: true,
  });
  await expect(
    page.getByRole("link", { name: "分析画面に戻る" }),
  ).toHaveAttribute("href", comparisonReturn);

  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/rf-analysis");
  await page
    .locator('a[href*="/rf-customers?"][href*="recency_rule_id="]')
    .filter({ hasText: /^1名$/ })
    .first()
    .press("Enter");
  await expect(page.getByText(/条件：.*1人/)).toBeVisible();
  const visited = all.customers.find(
    (row: { to_state: string }) => row.to_state === "ranked",
  );
  const cellUrl = page.url();
  await page
    .getByRole("link", { name: visited.customer_name, exact: true })
    .press("Enter");
  // Linkのキー操作完了とクライアント遷移完了は別なので、詳細表示を待って戻り先を記録する。
  await page.getByRole("tab", { name: "予約・来店履歴", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "予約・来店履歴", exact: true }),
  ).toBeVisible();
  await expect(page).toHaveURL(
    new RegExp(`/customers/${visited.customer_id}\\?return_to=`),
  );
  const customerUrl = page.url();
  // 顧客詳細はPCと狭幅でも識別情報・履歴・操作が見切れず、予約詳細から戻れる。
  await page.screenshot({
    path: "test-results/customer-detail-160-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(
    page.getByRole("heading", { name: visited.customer_name, exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "test-results/customer-detail-160-mobile.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 1280, height: 900 });
  const historyResponse = await page.request.get(
    `/api/v1/customers/${visited.customer_id}/reservations`,
  );
  expect(historyResponse.status()).toBe(200);
  const reservationId = (await historyResponse.json()).data.reservations[0].id;
  await page
    .getByRole("link", {
      name: `予約${reservationId}の詳細を開く`,
      exact: true,
    })
    .press("Enter");
  await expect(page).toHaveURL(
    new RegExp(`/reservations/${reservationId}\\?return_to=`),
  );
  await page.reload();
  await page
    .getByRole("link", { name: "顧客詳細へ戻る", exact: true })
    .press("Enter");
  await expect(page).toHaveURL(customerUrl);
  await page
    .getByRole("link", { name: "RFの顧客内訳に戻る", exact: true })
    .press("Enter");
  await expect(page).toHaveURL(cellUrl);
  // 戻るURLだけでなく、同じセルの対象顧客が再表示されたことを待って証跡を残す。
  await expect(
    page.getByRole("link", { name: visited.customer_name, exact: true }),
  ).toBeVisible();
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: "test-results/rf-breakdown-acceptance-desktop.png",
    fullPage: true,
  });
});

// 専用DBで選択→処理内容確認→一括保存→応答喪失の再試行を実APIまで通す。
test("未処理予約の選択一括処理と応答喪失からの復旧", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("combobox", { name: "担当者", exact: true }).click();
  await page.getByRole("option", { name: /E2E管理者/ }).click();
  await page
    .getByLabel("パスワード", { exact: true })
    .fill(process.env.E2E_PASSWORD!);
  // 初期読取のCookie応答がCSRF取得後に到着しないよう、画面の実読取完了を待つ。
  const dashboardReads = Promise.all(
    ["/api/v1/dashboard", "/api/v1/dashboard_analytics"].map((path) =>
      page.waitForResponse(
        (response) =>
          new URL(response.url()).pathname === path &&
          response.status() === 200,
      ),
    ),
  );
  await page.getByRole("button", { name: "ログイン", exact: true }).click();
  await dashboardReads;
  await expect(page).toHaveURL(/\/dashboard$/);
  const csrf = (await (await page.request.get("/api/v1/csrf")).json()).data
    .csrf_token;
  const masters = (
    await (await page.request.get("/api/v1/standard_masters")).json()
  ).data.standard_masters;
  const status = masters.find(
    (master: { system_key: string }) =>
      master.system_key === "reservation_status",
  );
  const type = masters.find(
    (master: { system_key: string }) =>
      master.system_key === "restaurant_master_type",
  );
  const day = (offset: number) =>
    new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Tokyo" }).format(
      new Date(Date.now() - offset * 86_400_000),
    );
  const yesterday = day(1);
  const prefix = `一括確認${Date.now()}`;
  const bookings = [];
  for (const [name, date, code] of [
    [`${prefix}通常`, yesterday, "confirmed"],
    [`${prefix}仮`, yesterday, "tentative"],
    [`${prefix}過去`, day(2), "confirmed"],
  ]) {
    const response = await page.request.post("/api/v1/reservations", {
      headers: { "X-CSRF-Token": csrf, "Idempotency-Key": crypto.randomUUID() },
      data: {
        reservation: {
          reservation_name: name,
          reservation_phone_number: "09000001234",
          starts_at: `${date}T18:00:00+09:00`,
          ends_at: `${date}T20:00:00+09:00`,
          guest_count: 2,
          requested_restaurant_master_type_id: type.items.find(
            (item: { code: string }) => item.code === "T",
          ).id,
          reservation_status_id: status.items.find(
            (item: { code: string }) => item.code === code,
          ).id,
          restaurant_master_ids: [],
        },
      },
    });
    expect(response.status()).toBe(201);
    bookings.push((await response.json()).data.reservation);
  }
  // 新規フォームはマスタの予約確定を初期選択する。
  await page.goto(`/reservations/new?date=${yesterday}`);
  await expect(page.getByRole("combobox", { name: /^予約状況/ })).toHaveText(
    /予約確定/,
  );
  await page.goto(`/reservations?date=${yesterday}`);
  await page
    .getByRole("button", { name: "退店未処理の予約を確認", exact: true })
    .click();
  await expect(
    page.getByRole("checkbox", { name: `${prefix}通常を選択`, exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("checkbox", { name: `${prefix}過去を選択`, exact: true }),
  ).toHaveCount(0);
  await page
    .getByRole("checkbox", { name: `${prefix}通常を選択`, exact: true })
    .check();
  await page
    .getByLabel("一括処理の内容", { exact: true })
    .selectOption("cancel");
  await page
    .getByRole("button", { name: "選択した予約の処理を確認", exact: true })
    .click();
  await expect(page.getByRole("alertdialog")).toContainText(
    "1件の予約を通常キャンセルにする",
  );
  expect(
    (
      await (
        await page.request.get(`/api/v1/reservations/${bookings[0].id}`)
      ).json()
    ).data.reservation.visit_result,
  ).toBe("pending");
  await page
    .getByRole("button", { name: "確認した内容で実行", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "結果を確認して選び直す", exact: true }),
  ).toBeEnabled();
  expect(
    (
      await (
        await page.request.get(`/api/v1/reservations/${bookings[0].id}`)
      ).json()
    ).data.reservation.cancellation_kind,
  ).toBe("regular");
  expect(
    (
      await (
        await page.request.get(`/api/v1/reservations/${bookings[1].id}`)
      ).json()
    ).data.reservation.visit_result,
  ).toBe("pending");
  await page
    .getByRole("button", { name: "結果を確認して選び直す", exact: true })
    .click();
  await page
    .getByRole("button", { name: "過去分を含めて全選択", exact: true })
    .click();
  await expect(page.getByText(/件選択中$/)).not.toHaveText("0件選択中");
  await page
    .getByLabel("一括処理の内容", { exact: true })
    .selectOption("checkout");
  await page
    .getByRole("button", { name: "選択した予約の処理を確認", exact: true })
    .click();
  await expect(page.getByRole("alertdialog")).toContainText(`${prefix}過去`);
  await expect(
    page.getByRole("button", { name: "確認した内容で実行", exact: true }),
  ).toBeDisabled();
  await page.getByRole("checkbox", { name: /仮予約.*予約確定/ }).check();
  await page.setViewportSize({ width: 390, height: 844 });
  const bounds = await page.getByRole("alertdialog").boundingBox();
  expect(bounds!.x).toBeGreaterThanOrEqual(0);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(390);
  await page.screenshot({ path: "test-results/bulk-results-mobile.png" });
  const keys: string[] = [];
  await page.route(
    `**/api/v1/reservations/${bookings[1].id}/complete`,
    async (route) => {
      keys.push(route.request().headers()["idempotency-key"]);
      if (keys.length === 1) {
        await route.fetch();
        await route.abort("failed");
      } else await route.continue();
    },
  );
  await page
    .getByRole("button", { name: "確認した内容で実行", exact: true })
    .click();
  await expect(page.getByRole("alertdialog")).toContainText("保存結果が未確認");
  await page.getByRole("button", { name: "閉じる", exact: true }).click();
  await page.getByLabel("予約表示日", { exact: true }).fill(day(2));
  await expect(page).toHaveURL(new RegExp(`/reservations\\?date=${day(2)}$`));
  await expect(page.getByText(/結果未確認 1件/)).toBeVisible();
  await page.getByLabel("予約表示日", { exact: true }).fill(yesterday);
  await expect(page).toHaveURL(
    new RegExp(`/reservations\\?date=${yesterday}$`),
  );
  await page
    .getByRole("button", { name: "一括処理の結果・再試行を確認", exact: true })
    .click();

  await page
    .getByRole("button", {
      name: "未送信・結果未確認分を同じ操作で再試行",
      exact: true,
    })
    .click();
  await expect(
    page.getByRole("button", {
      name: "未送信・結果未確認分を同じ操作で再試行",
      exact: true,
    }),
  ).toBeDisabled();
  await expect.poll(() => keys.length).toBe(2);
  await expect(
    page.getByRole("alertdialog").getByText(/保存結果が未確認/),
  ).toHaveCount(0);
  expect(keys[0]).toBe(keys[1]);
  for (const booking of bookings.slice(1)) {
    const saved = (
      await (
        await page.request.get(`/api/v1/reservations/${booking.id}`)
      ).json()
    ).data.reservation;
    expect(saved.visit_result).toBe("checked_out");
    expect(saved.reservation_status.code).toBe("confirmed");
    const changes = (
      await (
        await page.request.get(
          `/api/v1/reservations/${booking.id}/result_changes`,
        )
      ).json()
    ).data.changes;
    expect(changes).toHaveLength(1);
  }
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.screenshot({ path: "test-results/bulk-results-desktop.png" });
});

test("顧客検索は入力前に明細を取得せず、組み合わせ条件と詳細復帰を保持する", async ({
  page,
}) => {
  await page.goto("/login");
  await page.getByRole("combobox", { name: "担当者", exact: true }).click();
  await page.getByRole("option", { name: /E2E管理者/ }).click();
  await page
    .getByLabel("パスワード", { exact: true })
    .fill(process.env.E2E_PASSWORD!);
  await page.getByRole("button", { name: "ログイン", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  const requests: string[] = [];
  const track = (request: import("@playwright/test").Request) => {
    if (
      new URL(request.url()).pathname === "/api/v1/customers" &&
      request.method() === "GET"
    )
      requests.push(request.url());
  };
  page.on("request", track);
  await page.goto("/customers");
  await expect(page.getByText("表示中の顧客数", { exact: true })).toBeVisible();
  const analytics = await page.request.get("/api/v1/customer_analytics");
  expect(analytics.status()).toBe(200);
  const target = (await analytics.json()).data.ranking[0];
  expect(target).toBeTruthy();
  const input = page.getByRole("searchbox", { name: "顧客検索キーワード" });
  await input.fill(target.name);
  expect(requests).toEqual([]);
  page.off("request", track);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: "test-results/customer-search-224-mobile.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: /絞り込み/ }).click();
  await page.getByRole("radio", { name: "個人", exact: true }).check();
  await page.getByLabel("来店回数（最小）", { exact: true }).fill("1");
  await page
    .getByLabel("最終来店日（開始）", { exact: true })
    .fill(target.last_visit_on);
  await page.getByRole("button", { name: "適用", exact: true }).press("Enter");
  await expect(
    page.getByRole("link", { name: `${target.name}の詳細を表示`, exact: true }),
  ).toBeVisible();
  await expect(page).toHaveURL(/min_visits=1/);
  const resultUrl = page.url();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.screenshot({
    path: "test-results/customer-search-224-results.png",
    fullPage: true,
  });
  await page
    .getByRole("link", { name: `${target.name}の詳細を表示`, exact: true })
    .press("Enter");
  await page
    .getByRole("link", { name: "顧客一覧へ戻る", exact: true })
    .press("Enter");
  await expect(page).toHaveURL(resultUrl);
  await page.reload();
  await expect(input).toHaveValue(target.name);
  // 来店実績がある顧客を「0回」で除外し、URLだけでなくRailsまで条件が届くことを確認する。
  await page.getByRole("button", { name: /絞り込み/ }).click();
  await page.getByLabel("来店回数（最小）", { exact: true }).fill("");
  await page.getByLabel("来店回数（最大）", { exact: true }).fill("0");
  await page.getByRole("button", { name: "適用", exact: true }).click();
  await expect(
    page.getByText("検索条件に一致する顧客が見つかりません", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "すべて解除", exact: true }).click();
  await expect(page.getByText("表示中の顧客数", { exact: true })).toBeVisible();
  expect(new URL(page.url()).search).toBe("");
  // 同条件の再検索で、画面外から更新された顧客情報を再取得する。
  await input.fill(target.name);
  await page.getByRole("button", { name: "検索", exact: true }).click();
  await expect(
    page.getByRole("link", { name: `${target.name}の詳細を表示`, exact: true }),
  ).toBeVisible();
  const current = await page.request.get(`/api/v1/customers/${target.id}`);
  const currentCustomer = (await current.json()).data.customer;
  const tokenResponse = await page.request.get("/api/v1/csrf");
  const token = (await tokenResponse.json()).data.csrf_token;
  const updatedName = `${target.name}（再取得確認）`;
  const updated = await page.request.patch(`/api/v1/customers/${target.id}`, {
    headers: { "X-CSRF-Token": token },
    data: {
      customer: {
        name: updatedName,
        lock_version: currentCustomer.lock_version,
      },
    },
  });
  expect(updated.status()).toBe(200);
  await page.getByRole("button", { name: "検索", exact: true }).click();
  await expect(
    page.getByRole("link", { name: `${updatedName}の詳細を表示`, exact: true }),
  ).toBeVisible();
});

test("店舗独自の顧客項目を設定して回答を保存し、タブと履歴の取得を維持する", async ({
  page,
}) => {
  await page.goto("/login");
  await page.getByRole("combobox", { name: "担当者", exact: true }).click();
  await page.getByRole("option", { name: /E2E管理者/ }).click();
  await page
    .getByLabel("パスワード", { exact: true })
    .fill(process.env.E2E_PASSWORD!);
  // 6回目のログインは実際の毎分5回制限に達する。認証設定を緩めず解除を待つ。
  await expect(async () => {
    const login = page.waitForResponse(
      (response) =>
        new URL(response.url()).pathname === "/api/v1/staff/login" &&
        response.request().method() === "POST",
    );
    await page.getByRole("button", { name: "ログイン", exact: true }).click();
    expect((await login).status()).toBe(200);
  }).toPass({ intervals: [1000, 5000, 10000], timeout: 75000 });
  await expect(page).toHaveURL(/\/dashboard$/);
  const definitions = (
    await (await page.request.get("/api/v1/standard_masters")).json()
  ).data.usage_places;
  const customerPlace = definitions.find(
    (place: { key: string }) => place.key === "customer_details",
  );
  expect(customerPlace).toBeTruthy();
  const label = `E2E嗜好${Date.now()}`;
  // 初期表示の通信中に固定CSRFトークンで準備せず、実際の登録画面を通す。
  await page.goto("/standard-codes");
  await expect(page.getByText("RFランク", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "追加", exact: true }).first().click();
  await page.getByLabel("名称", { exact: true }).fill(label);
  await page
    .getByLabel("使用場所", { exact: true })
    .selectOption(String(customerPlace.id));
  await page.getByLabel("入力方法", { exact: true }).selectOption("multiple");
  await page.getByLabel("分類（任意）", { exact: true }).fill("嗜好");
  await page.getByRole("button", { name: "登録", exact: true }).click();
  const creation = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === "/api/v1/standard_masters" &&
      response.request().method() === "POST",
  );
  await page.getByRole("button", { name: "保存する", exact: true }).click();
  const created = await creation;
  expect(created.status(), await created.text()).toBe(201);
  const field = (await created.json()).data.standard_master;
  await expect(page.getByRole("dialog")).toHaveCount(0);
  const token = (await (await page.request.get("/api/v1/csrf")).json()).data
    .csrf_token;
  const headers = { "X-CSRF-Token": token };
  const optionResponse = await page.request.post(
    `/api/v1/standard_masters/${field.id}/items`,
    {
      headers,
      data: { standard_list_master: { label: "日本酒", active: true } },
    },
  );
  expect(optionResponse.status()).toBe(201);
  const option = (await optionResponse.json()).data.standard_list_master;
  // 保存した使用場所と入力方法が編集フォームにも反映される。
  await page
    .getByRole("row")
    .filter({ hasText: label })
    .getByRole("button", { name: "編集", exact: true })
    .click();
  await expect(page.getByLabel("使用場所", { exact: true })).toHaveValue(
    String(customerPlace.id),
  );
  await expect(page.getByLabel("入力方法", { exact: true })).toHaveValue(
    "multiple",
  );
  await page.screenshot({
    path: "test-results/standard-code-usage-desktop.png",
    fullPage: true,
  });
  // 高さの低い画面でもフォーム全体を画面内に収め、更新操作へスクロールできる。
  await page.setViewportSize({ width: 390, height: 700 });
  const dialog = page.getByRole("dialog");
  const dialogBox = await dialog.boundingBox();
  expect(dialogBox).not.toBeNull();
  expect(dialogBox!.y).toBeGreaterThanOrEqual(0);
  expect(dialogBox!.y + dialogBox!.height).toBeLessThanOrEqual(700);
  await dialog
    .getByRole("button", { name: "更新", exact: true })
    .scrollIntoViewIfNeeded();
  await expect(
    dialog.getByRole("button", { name: "更新", exact: true }),
  ).toBeInViewport();
  await page.getByLabel("名称", { exact: true }).scrollIntoViewIfNeeded();
  await page.screenshot({
    path: "test-results/standard-code-usage-mobile.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.keyboard.press("Escape");
  const rows = (await (await page.request.get("/api/v1/customers")).json()).data
    .customers;
  const target =
    rows.find(
      (row: { rf_rank_state: string }) => row.rf_rank_state === "ranked",
    ) ?? rows[0];
  expect(target).toBeDefined();
  let historyRequests = 0;
  page.on("request", (request) => {
    if (request.url().includes(`/customers/${target.id}/reservations`))
      historyRequests++;
  });
  await page.goto(`/customers/${target.id}?return_to=%2Fcustomers`);
  await expect(
    page.getByRole("heading", { name: target.name, exact: true }),
  ).toBeVisible();
  await expect(page.getByText(label, { exact: true })).toBeVisible();
  expect(historyRequests).toBe(0);
  await page
    .getByRole("button", { name: "詳細情報を編集", exact: true })
    .click();
  await page
    .getByRole("group", { name: label, exact: true })
    .getByRole("checkbox", { name: "日本酒", exact: true })
    .check();
  // ブラウザBackを取り消した場合も、顧客画面と入力が保持される。
  page.once("dialog", (dialog) => dialog.dismiss());
  await page.goBack();
  await expect(
    page
      .getByRole("group", { name: label, exact: true })
      .getByRole("checkbox", { name: "日本酒", exact: true }),
  ).toBeChecked();
  // タブを往復しても未保存入力が消えない。
  await page.getByRole("tab", { name: "スタッフメモ", exact: true }).click();
  await page.getByRole("tab", { name: "詳細情報", exact: true }).click();
  await expect(
    page
      .getByRole("group", { name: label, exact: true })
      .getByRole("checkbox", { name: "日本酒", exact: true }),
  ).toBeChecked();
  await page.getByRole("button", { name: "変更を保存", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("保存しました");
  const saved = (
    await (
      await page.request.get(`/api/v1/customers/${target.id}/detail_fields`)
    ).json()
  ).data;
  expect(
    saved.fields.find((item: { id: number }) => item.id === field.id)
      .selected_ids,
  ).toEqual([option.id]);
  // 同じスタッフによるメモ更新後も、独自項目を古い版で保存しない。
  await page.getByRole("tab", { name: "スタッフメモ", exact: true }).click();
  await page.getByRole("button", { name: "メモを編集", exact: true }).click();
  await page
    .getByRole("textbox", { name: "スタッフ共有メモ", exact: true })
    .fill("E2E版同期確認");
  await page.getByRole("button", { name: "メモを保存", exact: true }).click();
  await expect(page.getByRole("status")).toContainText(
    "スタッフメモを保存しました",
  );
  await page.getByRole("tab", { name: "詳細情報", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "詳細情報を編集", exact: true }),
  ).toBeEnabled();
  await page
    .getByRole("button", { name: "詳細情報を編集", exact: true })
    .click();
  const afterMemo = page.waitForResponse(
    (response) =>
      response.url().endsWith(`/customers/${target.id}/detail_fields`) &&
      response.request().method() === "PATCH",
  );
  await page.getByRole("button", { name: "変更を保存", exact: true }).click();
  expect((await afterMemo).status()).toBe(200);
  await page
    .getByRole("tab", { name: "予約・来店履歴", exact: true })
    .press("Enter");
  await expect.poll(() => historyRequests).toBe(1);
  await expect(page).toHaveURL(/tab=history/);
  await page.reload();
  await expect(
    page.getByRole("tab", { name: "予約・来店履歴", exact: true }),
  ).toHaveAttribute("aria-selected", "true");
  await page.getByRole("tab", { name: "詳細情報", exact: true }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "test-results/customer-detail-225-mobile.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.screenshot({
    path: "test-results/customer-detail-225-desktop.png",
    fullPage: true,
  });
  await checkCommonUi(page);
});

// 同じ認証済み画面から、主要画面の見出し・現在地・遷移を確認する。
async function checkCommonUi(page: Page) {
  await page.setViewportSize({ width: 390, height: 844 });
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
    await expect(
      page.getByRole("navigation", { name: "現在地" }),
    ).toBeVisible();
    await expect(page.getByRole("main")).toHaveCount(1);
    await expect(page.locator("main main")).toHaveCount(0);
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    await expect(page.getByRole("heading", { level: 1 })).toHaveClass(
      /sr-only/,
    );
    await expect(
      page.locator('nav[aria-label="現在地"] [aria-current="page"]'),
    ).toHaveCount(1);
  }
  await page.goto("/rf-analysis");
  const link = page.locator('[data-slot="navigation-link"]').first();
  await expect(link).toBeVisible();
  await link.focus();
  await expect(link).toBeFocused();
  await link.press("Enter");
  await expect(page).toHaveURL(/\/rf-customers\?/);
  await expect(
    page.getByRole("heading", { name: "RF分析の対象顧客", level: 1 }),
  ).toHaveCount(1);
  await page
    .getByRole("link", { name: "分析画面に戻る", exact: true })
    .press("Enter");
  await expect(page).toHaveURL(/\/rf-analysis$/);
  await captureDashboard(page, "test-results/common-ui-226-mobile.png");
  await page.setViewportSize({ width: 1280, height: 900 });
  await captureDashboard(page, "test-results/common-ui-226-desktop.png");
}
