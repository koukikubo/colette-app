import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthContext } from "@/features/staff-auth/providers/AuthProvider";
import { HelpCenter } from "../components/HelpCenter";
import { HelpButton } from "../components/HelpButton";

const mocks = vi.hoisted(() => ({
  path: "/dashboard",
  fetch: vi.fn(),
  save: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  usePathname: () => mocks.path,
  useRouter: () => ({ replace: vi.fn() }),
}));
vi.mock("../api/guide-state-api", () => ({
  fetchGuideState: mocks.fetch,
  saveGuideState: mocks.save,
}));
const result = (status: string) => ({
  status: "success",
  data: {
    guide_state: {
      guide_version: 1,
      status,
      updated_at: status === "unseen" ? null : "2026-11-27T00:00:00Z",
    },
  },
});
function auth(
  id = 1,
  role = "owner",
  status: "authenticated" | "expired" = "authenticated",
) {
  return {
    staff: {
      id,
      login_enabled: true,
      failed_attempts: 0,
      last_logged_in_at: null,
      staff_master: { id, code: "S1", name: "テスト担当者", role_code: role },
    },
    status,
    isAuthenticated: status === "authenticated",
    authError: null,
    refreshCurrentStaff: async () => {},
    logout: async () => {},
  };
}
const view = (value = auth()) => (
  <AuthContext.Provider value={value}>
    <input aria-label="未保存入力" defaultValue="入力を保持" />
    <HelpButton />
    <HelpCenter />
  </AuthContext.Provider>
);

beforeEach(() => {
  mocks.path = "/dashboard";
  mocks.fetch.mockReset();
  mocks.save.mockReset();
  mocks.fetch.mockResolvedValue(result("completed"));
  mocks.save.mockResolvedValue(result("skipped"));
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      disconnect() {}
      unobserve() {}
    },
  );
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("全画面のヘルプと初回案内", () => {
  it("現在のガイドを開き、検索・Escで閉じても入力とフォーカスを保持する", async () => {
    mocks.path = "/reservations";
    const user = userEvent.setup();
    render(view());
    const button = screen.getByRole("button", { name: "使い方・ヘルプ" });
    await user.click(button);
    expect(
      screen.getByRole("article", { name: "予約タイムライン・未処理予約" }),
    ).toBeInTheDocument();
    await user.type(
      screen.getByRole("textbox", { name: "ヘルプを検索" }),
      "パスワード",
    );
    expect(
      screen.getByRole("button", { name: "本人のパスワード変更" }),
    ).toBeInTheDocument();
    await user.keyboard("{Escape}");
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(screen.getByRole("textbox", { name: "未保存入力" })).toHaveValue(
      "入力を保持",
    );
    expect(button).toHaveFocus();
  });
  it("viewerに更新・再設定操作を見せず、取得失敗時もヘルプを読める", async () => {
    mocks.path = "/staff-masters";
    mocks.fetch.mockRejectedValue(new Error("offline"));
    const user = userEvent.setup();
    render(view(auth(1, "viewer")));
    await user.click(screen.getByRole("button", { name: "使い方・ヘルプ" }));
    expect(
      screen.getByRole("article", { name: "担当者マスタ" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("登録・権限・ログイン管理"),
    ).not.toBeInTheDocument();
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "取得できませんでした",
    );
  });
  it("入力中や他のダイアログ表示中には初回案内を始めない", async () => {
    vi.useFakeTimers();
    mocks.fetch.mockResolvedValue(result("unseen"));
    render(view());
    screen.getByRole("textbox", { name: "未保存入力" }).focus();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(700);
    });
    expect(
      screen.queryByRole("region", { name: "はじめての使い方" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
  it("他のダイアログが表示されている間は初回案内もヘルプも重ねない", async () => {
    vi.useFakeTimers();
    mocks.fetch.mockResolvedValue(result("unseen"));
    render(
      <>
        {view()}
        <div role="dialog" aria-label="編集中">
          編集中
        </div>
      </>,
    );
    await act(async () => {
      await vi.advanceTimersByTimeAsync(700);
    });
    expect(
      screen.queryByRole("region", { name: "はじめての使い方" }),
    ).not.toBeInTheDocument();
    expect(screen.getAllByRole("dialog")).toHaveLength(1);
  });
  it("スキップの保存失敗を表示して再試行でき、成功前には案内を消さない", async () => {
    mocks.fetch.mockResolvedValue(result("unseen"));
    mocks.save
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce(result("skipped"));
    const user = userEvent.setup();
    render(view());
    const banner = await screen.findByRole(
      "region",
      { name: "はじめての使い方" },
      { timeout: 2000 },
    );
    await user.click(screen.getByRole("button", { name: "今回はスキップ" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "保存できませんでした",
    );
    expect(banner).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "今回はスキップ" }));
    await waitFor(() =>
      expect(
        screen.queryByRole("region", { name: "はじめての使い方" }),
      ).not.toBeInTheDocument(),
    );
  });
  it("完了保存後に遅いGETで未確認へ戻らず、案内を再表示できる", async () => {
    let resolve!: (value: ReturnType<typeof result>) => void;
    mocks.fetch.mockReturnValue(
      new Promise((done) => {
        resolve = done;
      }),
    );
    mocks.save.mockResolvedValue(result("completed"));
    const user = userEvent.setup();
    render(view());
    await user.click(screen.getByRole("button", { name: "使い方・ヘルプ" }));
    await user.click(
      screen.getByRole("button", { name: "基本操作の案内を最初から見る" }),
    );
    for (let i = 0; i < 4; i++)
      await user.click(screen.getByRole("button", { name: "次へ" }));
    await user.click(screen.getByRole("button", { name: "案内を完了" }));
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    await act(async () => {
      resolve(result("unseen"));
    });
    await user.click(screen.getByRole("button", { name: "使い方・ヘルプ" }));
    expect(screen.getByText("初回案内：完了")).toBeInTheDocument();
    expect(mocks.save).toHaveBeenCalledWith("completed");
  });
  it("別端末で完了した状態を画面復帰時に取得する", async () => {
    mocks.fetch
      .mockResolvedValueOnce(result("unseen"))
      .mockResolvedValue(result("completed"));
    const user = userEvent.setup();
    render(view());
    await screen.findByRole(
      "region",
      { name: "はじめての使い方" },
      { timeout: 2000 },
    );
    await act(async () => {
      window.dispatchEvent(new Event("focus"));
    });
    await waitFor(() =>
      expect(
        screen.queryByRole("region", { name: "はじめての使い方" }),
      ).not.toBeInTheDocument(),
    );
    await user.click(screen.getByRole("button", { name: "使い方・ヘルプ" }));
    expect(screen.getByText("初回案内：完了")).toBeInTheDocument();
  });
  it("担当者切替・セッション失効でガイドと前担当者の状態を持ち越さない", async () => {
    const user = userEvent.setup();
    const rendered = render(view());
    await user.click(screen.getByRole("button", { name: "使い方・ヘルプ" }));
    rendered.rerender(view(auth(2, "viewer")));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "使い方・ヘルプ" }));
    rendered.rerender(view(auth(2, "viewer", "expired")));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "未保存入力" })).toHaveValue(
      "入力を保持",
    );
  });
});
