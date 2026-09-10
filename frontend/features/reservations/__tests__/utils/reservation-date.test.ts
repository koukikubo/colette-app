import { describe, expect, it } from "vitest";

import {
  addDaysToReservationDate,
  isValidReservationDate,
} from "../../utils/reservation-date";

describe("予約日付処理", () => {
  it("実在する予約日を有効と判定する", () => {
    expect(isValidReservationDate("2026-09-08")).toBe(true);
    expect(isValidReservationDate("2024-02-29")).toBe(true);
  });

  it("形式が不正、または実在しない予約日を無効と判定する", () => {
    expect(isValidReservationDate("2026/09/08")).toBe(false);
    expect(isValidReservationDate("2026-02-29")).toBe(false);
    expect(isValidReservationDate("2026-13-01")).toBe(false);
  });

  it("翌日へ移動すると、年をまたいでも正しい日付を返す", () => {
    expect(addDaysToReservationDate("2026-12-31", 1)).toBe("2027-01-01");
  });

  it("翌日へ移動すると、うるう年の2月29日を正しく返す", () => {
    expect(addDaysToReservationDate("2024-02-28", 1)).toBe("2024-02-29");
  });

  it("不正な日付を移動しようとすると、エラーにする", () => {
    expect(() => addDaysToReservationDate("2026-02-29", 1)).toThrow(
      "日付の形式が正しくありません。",
    );
  });
});
