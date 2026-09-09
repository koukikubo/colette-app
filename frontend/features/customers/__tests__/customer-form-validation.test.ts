import { describe, expect, it } from "vitest";

import { EMPTY_CUSTOMER_FORM_VALUES } from "../customer-form";
import { validateCustomerFormValues } from "../utils/customer-form-validation";

describe("validateCustomerFormValues", () => {
  it("必須項目が未入力なら、顧客名とフリガナのエラーを返す", () => {
    expect(validateCustomerFormValues(EMPTY_CUSTOMER_FORM_VALUES)).toEqual({
      name: ["顧客名を入力してください"],
      kana: ["フリガナを入力してください"],
    });
  });

  it("数字の区切り記号と全角数字を正規化して検証する", () => {
    const errors = validateCustomerFormValues({
      ...EMPTY_CUSTOMER_FORM_VALUES,
      name: "山田 太郎",
      kana: "ヤマダ タロウ",
      postalCode: "１２３－４５６７",
      phoneNumber: "０９０－１２３４－５６７８",
    });

    expect(errors).toEqual({});
  });

  it("不正な形式と未来の生年月日をまとめて返す", () => {
    const errors = validateCustomerFormValues({
      ...EMPTY_CUSTOMER_FORM_VALUES,
      name: "山田 太郎",
      kana: "やまだ",
      postalCode: "123",
      phoneNumber: "090",
      email: "invalid",
      birthday: "2999-01-01",
    });

    expect(errors).toMatchObject({
      kana: ["フリガナは全角カタカナで入力してください"],
      postal_code: ["郵便番号は7桁の数字で入力してください"],
      phone_number: ["電話番号は10桁または11桁の数字で入力してください"],
      email: ["メールアドレスの形式が正しくありません"],
      birthday: ["生年月日に未来の日付は指定できません"],
    });
  });

  it("法人顧客では法人名を必須にし、法人連絡先も検証する", () => {
    const errors = validateCustomerFormValues({
      ...EMPTY_CUSTOMER_FORM_VALUES,
      customerKind: "corporate",
      name: "山田 太郎",
      kana: "ヤマダ タロウ",
      companyEmail: "invalid",
    });

    expect(errors).toMatchObject({
      company_name: ["法人名を入力してください"],
      company_email: ["法人メールアドレスの形式が正しくありません"],
    });
  });

  it("各項目の最大文字数を検証する", () => {
    const errors = validateCustomerFormValues({
      ...EMPTY_CUSTOMER_FORM_VALUES,
      name: "あ".repeat(31),
      kana: "ア".repeat(31),
      address: "あ".repeat(256),
      memo: "あ".repeat(1001),
    });

    expect(errors).toMatchObject({
      name: ["顧客名は30文字以内で入力してください"],
      kana: ["フリガナは30文字以内で入力してください"],
      address: ["住所は255文字以内で入力してください"],
      memo: ["顧客メモは1000文字以内で入力してください"],
    });
  });
});
