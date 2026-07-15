const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

// 日本時間の本日をYYYY-MM-DD形式で返す。
export function getTodayInJapan(): string {
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

// YYYY-MM-DD形式かつ実在する日付か確認する。
export function isValidReservationDate(value: string): boolean {
  if (!DATE_PATTERN.test(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);

  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

// URLの日付が正しければ採用し未指定・不正なら日本時間の本日を返す。
export function resolveReservationDate(
  value: string | string[] | undefined,
): string {
  if (typeof value === "string" && isValidReservationDate(value)) {
    return value;
  }

  return getTodayInJapan();
}

// YYYY-MM-DD形式の日付へ指定日数を加算
// 日付入力UIの前日・翌日移動で使用する。
// UTCで計算することで、ブラウザのローカルタイムゾーンや夏時間による日付ずれを避ける。
export function addDaysToReservationDate(
  value: string,
  amount: number,
): string {
  if (!isValidReservationDate(value)) {
    throw new Error("日付の形式が正しくありません。");
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  date.setUTCDate(date.getUTCDate() + amount);

  const nextYear = date.getUTCFullYear();
  const nextMonth = String(date.getUTCMonth() + 1).padStart(2, "0");
  const nextDay = String(date.getUTCDate()).padStart(2, "0");

  return `${nextYear}-${nextMonth}-${nextDay}`;
}
