import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { NavigationLink } from "@/components/common/navigation-link";

describe("共通の画面遷移リンク", () => {
  it("ボタンを入れ子にせず、戻り先を含むURLとキーボード操作を保持する", async () => {
    const user = userEvent.setup();
    const target = "/customers/1?return_to=%2Frf-analysis";
    render(<NavigationLink href={target}>顧客を確認</NavigationLink>);
    const link = screen.getByRole("link", { name: "顧客を確認" });
    expect(link).toHaveAttribute("href", target);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    await user.tab();
    expect(link).toHaveFocus();
  });
});
