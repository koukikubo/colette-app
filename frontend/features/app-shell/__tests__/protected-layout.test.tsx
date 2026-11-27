import { screen } from "@testing-library/react";
import { renderWithOwner as render } from "@/test-utils/auth";
import { describe, expect, it, vi } from "vitest";
import ProtectedLayout from "@/app/(protected)/layout";
import { PageHeading } from "@/components/common/page-heading";

const mocks = vi.hoisted(() => ({ pathname: "/dashboard", replace: vi.fn() }));
vi.mock("next/navigation", () => ({
  usePathname: () => mocks.pathname,
  useRouter: () => ({ replace: mocks.replace }),
}));
vi.mock("../components/app-sidebar", () => ({
  AppSidebar: () => <aside>メニュー</aside>,
}));

describe("共通UIの見出しとランドマーク", () => {
  it.each([
    "/dashboard",
    "/customers",
    "/reservations/calendar",
    "/standard-codes",
    "/staff-masters",
    "/restaurant-masters",
  ])("%sで現在地・本文・読み上げ見出しを提供する", (path) => {
    mocks.pathname = path;
    render(
      <ProtectedLayout>
        <section>本文</section>
      </ProtectedLayout>,
    );
    expect(screen.getAllByRole("main")).toHaveLength(1);
    expect(screen.getByRole("main")).toHaveAttribute("id", "main-content");
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1 })).toHaveClass("sr-only");
    expect(
      screen
        .getByRole("navigation", { name: "現在地" })
        .querySelector('[aria-current="page"]'),
    ).toBeTruthy();
  });

  it.each(["/customers/10", "/rf-management/10/edit"])(
    "%sでは業務名のH1を二重にしない",
    (path) => {
      mocks.pathname = path;
      render(
        <ProtectedLayout>
          <h1>業務上の識別名</h1>
        </ProtectedLayout>,
      );
      expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
        "業務上の識別名",
      );
    },
  );

  it("RF分析側の読み上げ見出しと共通見出しを重ねない", () => {
    mocks.pathname = "/rf-analysis";
    render(
      <ProtectedLayout>
        <PageHeading>統一RFランク表</PageHeading>
      </ProtectedLayout>,
    );
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
  });
});
