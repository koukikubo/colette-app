import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import ErrorPage from "@/app/error";
import { ApiClientError } from "@/lib/api/api-client";

describe("ErrorPage", () => {
  it("予期しないエラーで内部メッセージを隠し、再試行できる", async () => {
    const user = userEvent.setup();
    const reset = vi.fn();
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    render(
      <ErrorPage
        error={new Error("database connection failed")}
        reset={reset}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "処理を完了できませんでした" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("database connection failed"),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "もう一度試す" }));

    expect(reset).toHaveBeenCalledOnce();
    await waitFor(() => {
      expect(consoleError).toHaveBeenCalledWith("[RouteErrorBoundary]", {
        name: "Error",
        digest: undefined,
        status: undefined,
      });
    });
  });

  it("401では再ログインの導線を表示する", () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    render(
      <ErrorPage
        error={new ApiClientError("Unauthorized", 401)}
        reset={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("heading", {
        name: "ログインの有効期限が切れました",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "ログイン画面へ" }),
    ).toHaveAttribute("href", "/login");
  });
});
