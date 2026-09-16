import Link from "next/link";
import { TriangleAlertIcon } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type ReservationWarningDialogProps = {
  reservationName: string;
  nextReservationId: number;
  minutesUntilNextReservation: number;
};

export function ReservationWarningDialog({
  reservationName,
  nextReservationId,
  minutesUntilNextReservation,
}: ReservationWarningDialogProps) {
  const isOverdue = minutesUntilNextReservation < 0;

  const warningLabel = isOverdue
    ? `次の予約時刻を${Math.abs(minutesUntilNextReservation)}分超過`
    : `次の予約まで${minutesUntilNextReservation}分`;

  const warningDescription = isOverdue
    ? `次の予約開始時刻を${Math.abs(minutesUntilNextReservation)}分過ぎています。`
    : `次の予約開始まで残り${minutesUntilNextReservation}分です。`;

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <button
          type="button"
          aria-label={warningLabel}
          title={warningLabel}
          className="inline-flex size-7 items-center justify-center rounded-md text-amber-700 hover:bg-amber-200 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none dark:text-amber-300 dark:hover:bg-amber-900"
        >
          <TriangleAlertIcon className="size-4" aria-hidden="true" />
        </button>
      </AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>次の予約が迫っています</AlertDialogTitle>

          <AlertDialogDescription>
            {reservationName}様の予約対応が終了予定時刻を過ぎています。
          </AlertDialogDescription>
        </AlertDialogHeader>

        <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
          {warningDescription}
        </p>

        <AlertDialogFooter>
          <AlertDialogCancel>閉じる</AlertDialogCancel>

          <AlertDialogAction asChild>
            <Link
              href={`/reservations/${encodeURIComponent(
                String(nextReservationId),
              )}`}
            >
              次の予約を確認
            </Link>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
