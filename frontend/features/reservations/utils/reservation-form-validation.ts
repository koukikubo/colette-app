import type { ApiFieldErrors } from "@/lib/api/api-client";
import type { ReservationFormValues } from "@/features/reservations/types";

// フロントで判断できる予約日時の入力エラーを確認する。
// Rails側のバリデーションは、保存時の最終チェックとして別途実行する。
export function validateReservationDateTimes(
  values: ReservationFormValues,
): ApiFieldErrors {
  const errors: ApiFieldErrors = {};

  if (!values.starts_at) {
    errors.starts_at = ["予約開始日時を入力してください"];
  }

  if (!values.ends_at) {
    errors.ends_at = ["予約終了日時を入力してください"];
  }

  if (!values.starts_at || !values.ends_at) {
    return errors;
  }

  const startsAt = new Date(values.starts_at).getTime();
  const endsAt = new Date(values.ends_at).getTime();

  if (endsAt <= startsAt) {
    errors.ends_at = ["予約終了日時は予約開始日時より後に指定してください"];
  }

  return errors;
}
