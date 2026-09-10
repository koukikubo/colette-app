import { describe, expect, it } from "vitest";

import {
  buildCreateCustomerRequest,
  buildUpdateCustomerRequest,
  customerToFormValues,
  EMPTY_CUSTOMER_FORM_VALUES,
} from "../customer-form";
import type { Customer } from "../types";

const values = {
  ...EMPTY_CUSTOMER_FORM_VALUES,
  name: " 山田 太郎 ",
  kana: " ヤマダ タロウ ",
  phoneNumber: " 09012345678 ",
  memo: " ",
};

describe("customer-form", () => {
  it("個人顧客の入力値をtrimし、空文字をnullへ変換する", () => {
    expect(buildCreateCustomerRequest(values)).toEqual({
      customer: expect.objectContaining({
        customer_kind: "individual",
        name: "山田 太郎",
        kana: "ヤマダ タロウ",
        phone_number: "09012345678",
        memo: null,
        company_name: null,
      }),
    });
  });

  it("更新リクエストへlock_versionを含める", () => {
    expect(buildUpdateCustomerRequest(values, 7).customer.lock_version).toBe(7);
  });

  it("法人顧客では法人情報をリクエストへ含める", () => {
    const request = buildCreateCustomerRequest({
      ...values,
      customerKind: "corporate",
      companyName: " 株式会社コレット ",
      companyEmail: " info@example.com ",
    });

    expect(request.customer).toMatchObject({
      customer_kind: "corporate",
      company_name: "株式会社コレット",
      company_email: "info@example.com",
    });
  });

  it("APIのnull値をフォームの空文字へ変換する", () => {
    const customer = {
      id: 1,
      customer_kind: "individual",
      name: "山田 太郎",
      kana: "ヤマダ タロウ",
      postal_code: null,
      address: null,
      phone_number: null,
      email: null,
      birthday: null,
      company_name: null,
      company_name_kana: null,
      company_postal_code: null,
      company_address: null,
      company_phone_number: null,
      company_email: null,
      memo: null,
      hidden_at: null,
      lock_version: 2,
      created_at: "2026-09-01T00:00:00+09:00",
      updated_at: "2026-09-01T00:00:00+09:00",
    } as Customer;

    expect(customerToFormValues(customer)).toMatchObject({
      name: "山田 太郎",
      postalCode: "",
      phoneNumber: "",
      companyName: "",
      memo: "",
    });
  });
});
