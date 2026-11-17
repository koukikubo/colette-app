import { screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { PermissionGate, canWrite } from "../components/session/PermissionGate";
import { renderWithRole } from "@/test-utils/auth";
it("viewerは更新操作へ進めず、operatorは顧客・予約だけを変更できる", () => {
  renderWithRole(
    <>
      <p>閲覧できる情報</p>
      <PermissionGate resource="customers">
        <button>顧客を編集</button>
      </PermissionGate>
      <PermissionGate resource="masters">
        <button>マスタを編集</button>
      </PermissionGate>
    </>,
    "viewer",
  );
  expect(screen.getByText("閲覧できる情報")).toBeInTheDocument();
  expect(screen.queryByRole("button")).not.toBeInTheDocument();
  expect(canWrite("operator", "reservations")).toBe(true);
  expect(canWrite("operator", "masters")).toBe(false);
  expect(canWrite(undefined, "customers")).toBe(false);
});
