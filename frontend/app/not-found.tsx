import Link from "next/link";
import { CalendarDaysIcon, FileQuestionIcon, HouseIcon } from "lucide-react";

import { ApplicationErrorPage } from "@/components/common/ApplicationErrorPage";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <ApplicationErrorPage
      title="お探しのページが見つかりません"
      description="URLが正しくないか、ページが移動・削除された可能性があります。予約一覧またはダッシュボードから操作を続けてください。"
      guidance="URLを確認しても見つからない場合は、ダッシュボードから目的の画面を開き直してください。"
      icon={<FileQuestionIcon className="size-8" aria-hidden="true" />}
      actions={
        <>
          <Button asChild size="lg">
            <Link href="/dashboard">
              <HouseIcon />
              ダッシュボードへ
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/reservations">
              <CalendarDaysIcon />
              予約一覧へ
            </Link>
          </Button>
        </>
      }
    />
  );
}
