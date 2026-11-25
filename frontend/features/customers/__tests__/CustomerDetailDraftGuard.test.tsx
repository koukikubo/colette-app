import { act, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { expect, it, vi } from "vitest";
import { renderWithOwner } from "@/test-utils/auth";
import { useCustomerDetailDraftGuard } from "../components/detail/useCustomerDetailDraftGuard";
function Editor() {
  const [dirty, setDirty] = useState(false);
  useCustomerDetailDraftGuard(dirty);
  return <button onClick={() => setDirty(true)}>編集</button>;
}
it("Back取消時は履歴を戻し、復帰イベントでは確認を繰り返さない", async () => {
  const forward = vi
    .spyOn(window.history, "forward")
    .mockImplementation(() => {});
  const back = vi.spyOn(window.history, "back").mockImplementation(() => {});
  const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
  renderWithOwner(<Editor />);
  await userEvent.click(screen.getByRole("button", { name: "編集" }));
  act(() => window.dispatchEvent(new PopStateEvent("popstate")));
  expect(forward).toHaveBeenCalledTimes(1);
  act(() => window.dispatchEvent(new PopStateEvent("popstate")));
  expect(confirm).toHaveBeenCalledTimes(1);
  confirm.mockReturnValue(true);
  act(() => window.dispatchEvent(new PopStateEvent("popstate")));
  expect(back).toHaveBeenCalledTimes(1);
});
