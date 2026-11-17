import { afterEach, expect, it, vi } from "vitest";
import { fetchCustomerCreationResult } from "@/features/customers/api/customer-api";
import { fetchReservationCreationResult } from "@/features/reservations/api/reservation_api";
afterEach(() => vi.unstubAllGlobals());
it.each([fetchCustomerCreationResult, fetchReservationCreationResult])(
  "識別できる登録結果がない応答を確定済みと扱わない",
  async (lookup) => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(Response.json({ status: "success", data: {} })),
    );
    await expect(lookup("pending-creation-key-1234")).rejects.toMatchObject({
      code: "invalid_response",
    });
  },
);
