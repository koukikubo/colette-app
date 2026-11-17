import { ApiClientError } from "@/lib/api/api-client";

export type ApiErrorKind =
  | "authentication"
  | "authorization"
  | "not_found"
  | "conflict"
  | "validation"
  | "unexpected";

export type ApiErrorPresentation = {
  kind: ApiErrorKind;
  title: string;
  description: string;
  guidance: string;
  primaryHref?: string;
  primaryLabel: string;
};

const UNEXPECTED_ERROR: ApiErrorPresentation = {
  kind: "unexpected",
  title: "処理を完了できませんでした",
  description: "一時的な問題が発生している可能性があります。",
  guidance:
    "再試行しても解決しない場合は、時間をおいてから再度お試しください。",
  primaryLabel: "もう一度試す",
};

export function getApiErrorPresentation(error: unknown): ApiErrorPresentation {
  if (!(error instanceof ApiClientError)) return UNEXPECTED_ERROR;

  switch (error.status) {
    case 401:
      return {
        kind: "authentication",
        title: "ログインの有効期限が切れました",
        description:
          "安全のためセッションを終了しました。もう一度ログインしてください。",
        guidance:
          "ログインし直しても解決しない場合は、管理者へお問い合わせください。",
        primaryHref: "/login",
        primaryLabel: "ログイン画面へ",
      };
    case 403:
      return {
        kind: "authorization",
        title: "この操作を行う権限がありません",
        description:
          "現在のアカウントではこのページまたは操作を利用できません。",
        guidance:
          "権限が必要な場合は、店舗またはシステムの管理者へお問い合わせください。",
        primaryHref: "/dashboard",
        primaryLabel: "ダッシュボードへ",
      };
    case 404:
      return {
        kind: "not_found",
        title: "対象のデータが見つかりません",
        description:
          "削除されたか、URLが変更された可能性があります。一覧から改めてお探しください。",
        guidance:
          "一覧にも表示されない場合は、対象データの状況を管理者へ確認してください。",
        primaryHref: "/dashboard",
        primaryLabel: "ダッシュボードへ",
      };
    case 409:
      return {
        kind: "conflict",
        title: "ほかの操作によって情報が更新されました",
        description:
          "最新の内容を読み込み、変更内容を確認してからもう一度操作してください。",
        guidance:
          "同じ状態が続く場合は、ほかの利用者が編集中でないか確認してください。",
        primaryLabel: "最新の内容を読み込む",
      };
    case 422:
      return {
        kind: "validation",
        title: "入力内容を確認してください",
        description:
          "入力画面に表示されている項目ごとのメッセージを確認し、内容を修正してください。",
        guidance:
          "修正箇所が分からない場合は、各入力項目の案内を確認してください。",
        primaryLabel: "もう一度試す",
      };
    default:
      return UNEXPECTED_ERROR;
  }
}
