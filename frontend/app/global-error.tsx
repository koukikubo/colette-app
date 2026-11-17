"use client";

import { useEffect } from "react";
import { RefreshCwIcon, TriangleAlertIcon } from "lucide-react";

import { ApplicationErrorPage } from "@/components/common/ApplicationErrorPage";
import { Button } from "@/components/ui/button";
import { reportClientError } from "@/lib/errors/report-client-error";

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    reportClientError("GlobalErrorBoundary", error);
  }, [error]);

  return (
    <html lang="ja">
      <body>
        <ApplicationErrorPage
          title="アプリケーションを表示できません"
          description="システムの読み込み中に問題が発生しました。再試行するか、ダッシュボードから操作をやり直してください。"
          guidance="再読み込みしても復旧しない場合は、時間をおいてから再度アクセスしてください。"
          icon={<TriangleAlertIcon className="size-8" aria-hidden="true" />}
          actions={
            <>
              <Button type="button" size="lg" onClick={reset}>
                <RefreshCwIcon />
                もう一度試す
              </Button>
              <Button asChild variant="outline" size="lg">
                <a href="/dashboard">ダッシュボードへ</a>
              </Button>
            </>
          }
        />
      </body>
    </html>
  );
}
