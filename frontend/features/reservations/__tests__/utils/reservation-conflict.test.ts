import { expect, it } from "vitest";
import { buildEditReservationFormValues } from "../../utils/reservation-form";
import { createReservation } from "../fixtures/reservation-fixtures";
import {
  conflictingFields,
  mergeReservation,
} from "../../utils/reservation-conflict";
it("相手だけが変えた項目を保持し、自分だけの変更を反映する", () => {
  const base = buildEditReservationFormValues(createReservation());
  const merged = mergeReservation(
    base,
    { ...base, guest_count: 3 },
    { ...base, internal_memo: "相手のメモ" },
    {},
  );
  expect(merged.guest_count).toBe(3);
  expect(merged.internal_memo).toBe("相手のメモ");
});
it("双方が変えた項目は選択を必須にする", () => {
  const base = buildEditReservationFormValues(createReservation());
  const mine = { ...base, guest_count: 3 },
    latest = { ...base, guest_count: 4 };
  expect(conflictingFields(base, mine, latest)).toEqual(["guest_count"]);
  expect(() => mergeReservation(base, mine, latest, {})).toThrow();
  expect(
    mergeReservation(base, mine, latest, { guest_count: "latest" }).guest_count,
  ).toBe(4);
});
