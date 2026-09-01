// 顧客の電話番号を画面で読みやすい形式へ変換する。
// 保存値は変更せず、一覧・詳細画面へ表示するときだけ使用する。
export function formatCustomerPhoneNumber(
  value: string | null | undefined,
): string {
  if (!value?.trim()) {
    return "-";
  }

  const digits = value.replace(/\D/g, "");

  // 携帯電話・IP電話
  if (/^(070|080|090|050)\d{8}$/.test(digits)) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  }

  // 東京・大阪の固定電話
  if (/^(03|06)\d{8}$/.test(digits)) {
    return `${digits.slice(0, 2)}-${digits.slice(2, 6)}-${digits.slice(6)}`;
  }

  // フリーダイヤル・ナビダイヤル
  if (/^(0120|0570)\d{6}$/.test(digits)) {
    return `${digits.slice(0, 4)}-${digits.slice(4, 7)}-${digits.slice(7)}`;
  }

  if (/^0800\d{7}$/.test(digits)) {
    return `${digits.slice(0, 4)}-${digits.slice(4, 7)}-${digits.slice(7)}`;
  }

  // そのほかの11桁
  if (digits.length === 11) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  }

  // そのほかの10桁
  if (digits.length === 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }

  // 想定外の値は、情報を欠落させず元の値を表示する。
  return value.trim();
}

// 顧客の郵便番号を画面で読みやすい形式へ変換する。
// 保存値は変更せず、詳細画面へ表示するときだけ使用する。
export function formatCustomerPostalCode(
  value: string | null | undefined,
): string {
  if (!value?.trim()) {
    return "-";
  }

  const normalizedValue = value.trim();
  const digits = normalizedValue.replace("-", "");

  if (/^\d{7}$/.test(digits)) {
    return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  }

  // 想定外の値は、情報を欠落させず元の値を表示する。
  return normalizedValue;
}
