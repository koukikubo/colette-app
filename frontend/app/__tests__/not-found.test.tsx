import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import NotFound from "@/app/not-found";

describe("NotFound", () => {
  it("404の説明と復帰導線を表示する", () => {
    render(<NotFound />);

    expect(
      screen.getByRole("heading", {
        name: "お探しのページが見つかりません",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "ダッシュボードへ" }),
    ).toHaveAttribute("href", "/dashboard");
    expect(screen.getByRole("link", { name: "予約一覧へ" })).toHaveAttribute(
      "href",
      "/reservations",
    );
  });
});
