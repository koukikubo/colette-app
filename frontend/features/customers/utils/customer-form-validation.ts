import type { CustomerFormValues } from "@/features/customers/customer-form";
import type { ApiFieldErrors } from "@/lib/api/api-client";

const KANA_PATTERN = /^[ァ-ヶー・ 　]+$/;
const POSTAL_CODE_PATTERN = /^\d{7}$/;
const PHONE_NUMBER_PATTERN = /^\d{10,11}$/;
const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

// Rails側と同様に、全角数字やハイフンを取り除いてから桁数を確認する。
function normalizeDigits(value: string): string {
  return value
    .trim()
    .replace(/[０-９]/g, (character) =>
      String.fromCharCode(character.charCodeAt(0) - 0xfee0),
    )
    .replace(/[\s\-ー－()（）]/g, "");
}

// 日本時間の本日をYYYY-MM-DD形式で返す。
function getTodayInJapan(): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const parts = formatter.formatToParts(new Date());

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  if (!year || !month || !day) {
    throw new Error("本日の日付を取得できませんでした。");
  }

  return `${year}-${month}-${day}`;
}

// JavaScriptの内部表現ではなく、画面上の文字数として数える。
function characterLength(value: string): number {
  return Array.from(value).length;
}

// 確認ダイアログを開く前に、フロント側で判断できる顧客情報の入力エラーを確認する。
// Rails側のバリデーションは、保存時の最終チェックとして別途実行する。
export function validateCustomerFormValues(
  values: CustomerFormValues,
): ApiFieldErrors {
  const errors: ApiFieldErrors = {};

  const name = values.name.trim();
  const kana = values.kana.trim();
  const postalCode = normalizeDigits(values.postalCode);
  const phoneNumber = normalizeDigits(values.phoneNumber);
  const email = values.email.trim();

  // 各項目を独立して検証し、一度の操作ですべてのエラーを返す。
  if (!name) {
    errors.name = ["顧客名を入力してください"];
  } else if (characterLength(name) > 30) {
    errors.name = ["顧客名は30文字以内で入力してください"];
  }

  if (!kana) {
    errors.kana = ["フリガナを入力してください"];
  } else if (characterLength(kana) > 30) {
    errors.kana = ["フリガナは30文字以内で入力してください"];
  } else if (!KANA_PATTERN.test(kana)) {
    errors.kana = ["フリガナは全角カタカナで入力してください"];
  }

  if (postalCode && !POSTAL_CODE_PATTERN.test(postalCode)) {
    errors.postal_code = ["郵便番号は7桁の数字で入力してください"];
  }

  if (phoneNumber && !PHONE_NUMBER_PATTERN.test(phoneNumber)) {
    errors.phone_number = ["電話番号は10桁または11桁の数字で入力してください"];
  }

  if (email) {
    if (characterLength(email) > 255) {
      errors.email = ["メールアドレスは255文字以内で入力してください"];
    } else if (!EMAIL_PATTERN.test(email)) {
      errors.email = ["メールアドレスの形式が正しくありません"];
    }
  }

  if (values.address && characterLength(values.address.trim()) > 255) {
    errors.address = ["住所は255文字以内で入力してください"];
  }

  if (values.birthday && values.birthday > getTodayInJapan()) {
    errors.birthday = ["生年月日に未来の日付は指定できません"];
  }

  if (values.customerKind === "corporate") {
    const companyName = values.companyName.trim();
    const companyNameKana = values.companyNameKana.trim();
    const companyPostalCode = normalizeDigits(values.companyPostalCode);
    const companyPhoneNumber = normalizeDigits(values.companyPhoneNumber);
    const companyEmail = values.companyEmail.trim();

    if (!companyName) {
      errors.company_name = ["法人名を入力してください"];
    } else if (characterLength(companyName) > 100) {
      errors.company_name = ["法人名は100文字以内で入力してください"];
    }

    if (companyNameKana) {
      if (characterLength(companyNameKana) > 100) {
        errors.company_name_kana = [
          "法人名フリガナは100文字以内で入力してください",
        ];
      } else if (!KANA_PATTERN.test(companyNameKana)) {
        errors.company_name_kana = [
          "法人名フリガナは全角カタカナで入力してください",
        ];
      }
    }

    if (companyPostalCode && !POSTAL_CODE_PATTERN.test(companyPostalCode)) {
      errors.company_postal_code = [
        "法人郵便番号は7桁の数字で入力してください",
      ];
    }

    if (companyPhoneNumber && !PHONE_NUMBER_PATTERN.test(companyPhoneNumber)) {
      errors.company_phone_number = [
        "法人電話番号は10桁または11桁の数字で入力してください",
      ];
    }

    if (companyEmail) {
      if (characterLength(companyEmail) > 255) {
        errors.company_email = [
          "法人メールアドレスは255文字以内で入力してください",
        ];
      } else if (!EMAIL_PATTERN.test(companyEmail)) {
        errors.company_email = ["法人メールアドレスの形式が正しくありません"];
      }
    }

    if (
      values.companyAddress &&
      characterLength(values.companyAddress.trim()) > 255
    ) {
      errors.company_address = ["法人住所は255文字以内で入力してください"];
    }
  }

  if (characterLength(values.memo.trim()) > 1_000) {
    errors.memo = ["顧客メモは1000文字以内で入力してください"];
  }

  return errors;
}
