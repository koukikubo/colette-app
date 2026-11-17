"use client";
import { Button } from "@/components/ui/button";

type Props = {
  noun: string;
  checking: boolean;
  missing: boolean;
  found: boolean;
  error: string | null;
  busy: boolean;
  canRetry: boolean;
  onCheck: () => void;
  onRetry: () => void;
  onFound: () => void;
};

// 結果不明と保存失敗を分け、確認操作から別の新規登録を発生させない。
export function CreationRecoveryNotice(props: Props) {
  return (
    <div
      role="alert"
      className="space-y-2 rounded bg-amber-50 p-4 text-amber-950"
    >
      <p>
        {props.found
          ? `登録済みの${props.noun}を確認しました。登録し直す必要はありません。`
          : "前回の登録結果が未確認です。送信キーを保持して結果を確認します。"}
      </p>
      {props.checking && <p role="status">登録結果を確認しています。</p>}
      {props.error && <p>{props.error}</p>}
      {props.missing && (
        <p>
          まだ登録記録が見つかりません。入力が残っていない場合は元の内容を再入力してください。同じ送信キーで照合します。
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          disabled={props.busy || props.checking}
          onClick={props.onCheck}
        >
          登録結果を再確認
        </Button>
        {props.canRetry && !props.found && (
          <Button
            type="button"
            disabled={props.busy || props.checking}
            onClick={props.onRetry}
          >
            前回の内容で再試行
          </Button>
        )}
        {props.found && (
          <Button type="button" disabled={props.busy} onClick={props.onFound}>
            登録済みの内容を表示
          </Button>
        )}
      </div>
    </div>
  );
}
