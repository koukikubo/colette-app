import { describe, expect, it } from "vitest";

import {
  formatCustomerPhoneNumber,
  formatCustomerPostalCode,
} from "../utils/customer-display";

describe("customer-display", () => {
  it.each([
    [null, "-"],
    ["", "-"],
    ["09012345678", "090-1234-5678"],
    ["03-1234-5678", "03-1234-5678"],
    ["0120123456", "0120-123-456"],
    ["0751234567", "075-123-4567"],
    ["123", "123"],
  ])("電話番号 %s を %s と表示する", (value, expected) => {
    expect(formatCustomerPhoneNumber(value)).toBe(expected);
  });

  it.todo("0800から始まる電話番号を0800-123-4567形式で表示する");

  it.each([
    [null, "-"],
    ["", "-"],
    ["1234567", "123-4567"],
    ["123-4567", "123-4567"],
    ["ABC", "ABC"],
  ])("郵便番号 %s を %s と表示する", (value, expected) => {
    expect(formatCustomerPostalCode(value)).toBe(expected);
  });
});
