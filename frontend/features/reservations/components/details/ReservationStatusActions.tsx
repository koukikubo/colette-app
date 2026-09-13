"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckIcon,
  Loader2Icon,
  Undo2Icon,
  BanIcon,
  RotateCcwIcon,
} from "lucide-react";

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

import { Button } from "@/components/ui/button";
import { ApiClientError } from "@/lib/api/api-client";
import {
  completeReservation,
  reopenReservation,
  restoreReservation,
  cancelReservation,
} from "../../api/reservation_api";
import type { Reservation } from "../../types";

type ReservationStatusActionsProps = {
  reservation: Reservation;
};

export function ReservationStatusActions({
  reservation,
}: ReservationStatusActionsProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isCompleted = reservation.completed_at !== null;
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const isCanceled = reservation.canceled_at !== null;

  const handleComplete = async () => {
    if (isSubmitting || isCompleted || isCanceled) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await completeReservation(reservation.id, {
        reservation: {
          lock_version: reservation.lock_version,
        },
      });

      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof ApiClientError
          ? error.message
          : "予約を対応完了にできませんでした。",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReopen = async () => {
    if (isSubmitting || !isCompleted || isCanceled) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await reopenReservation(reservation.id, {
        reservation: {
          lock_version: reservation.lock_version,
        },
      });

      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof ApiClientError
          ? error.message
          : "予約の対応完了を取り消せませんでした。",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = async () => {
    if (isSubmitting || isCompleted || isCanceled) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await cancelReservation(reservation.id, {
        reservation: {
          lock_version: reservation.lock_version,
        },
      });

      setIsCancelDialogOpen(false);
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof ApiClientError
          ? error.message
          : "予約をキャンセルできませんでした。",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRestore = async () => {
    if (isSubmitting || !isCanceled) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await restoreReservation(reservation.id, {
        reservation: {
          lock_version: reservation.lock_version,
        },
      });

      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof ApiClientError
          ? error.message
          : "予約を復元できませんでした。",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isCanceled) {
    return (
      <div className="space-y-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isSubmitting}
          onClick={() => void handleRestore()}
        >
          {isSubmitting ? (
            <Loader2Icon className="animate-spin" aria-hidden="true" />
          ) : (
            <RotateCcwIcon aria-hidden="true" />
          )}
          {isSubmitting ? "復元中..." : "予約を復元"}
        </Button>

        {errorMessage && (
          <p className="text-sm text-destructive" role="alert">
            {errorMessage}
          </p>
        )}
      </div>
    );
  }
  if (isCompleted) {
    return (
      <div className="space-y-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isSubmitting}
          onClick={() => void handleReopen()}
        >
          {isSubmitting ? (
            <Loader2Icon className="animate-spin" aria-hidden="true" />
          ) : (
            <Undo2Icon aria-hidden="true" />
          )}
          {isSubmitting ? "取消処理中..." : "対応完了を取り消す"}
        </Button>

        {errorMessage && (
          <p className="text-sm text-destructive" role="alert">
            {errorMessage}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          disabled={isSubmitting}
          onClick={() => void handleComplete()}
        >
          {isSubmitting ? (
            <Loader2Icon className="animate-spin" aria-hidden="true" />
          ) : (
            <CheckIcon aria-hidden="true" />
          )}
          {isSubmitting ? "完了処理中..." : "対応完了"}
        </Button>

        <AlertDialog
          open={isCancelDialogOpen}
          onOpenChange={(open) => {
            if (isSubmitting) {
              return;
            }

            setIsCancelDialogOpen(open);
            setErrorMessage(null);
          }}
        >
          <AlertDialogTrigger asChild>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={isSubmitting}
            >
              <BanIcon aria-hidden="true" />
              予約をキャンセル
            </Button>
          </AlertDialogTrigger>

          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>予約をキャンセルしますか？</AlertDialogTitle>

              <AlertDialogDescription>
                キャンセルすると、この予約は通常のタイムラインから表示されなくなります。
              </AlertDialogDescription>
            </AlertDialogHeader>

            {errorMessage && (
              <p className="text-sm text-destructive" role="alert">
                {errorMessage}
              </p>
            )}

            <AlertDialogFooter>
              <AlertDialogCancel disabled={isSubmitting}>
                戻る
              </AlertDialogCancel>

              <AlertDialogAction
                disabled={isSubmitting}
                onClick={(event) => {
                  event.preventDefault();
                  void handleCancel();
                }}
              >
                {isSubmitting && (
                  <Loader2Icon className="animate-spin" aria-hidden="true" />
                )}
                {isSubmitting ? "キャンセル処理中..." : "キャンセルを確定"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {errorMessage && !isCancelDialogOpen && (
        <p className="text-sm text-destructive" role="alert">
          {errorMessage}
        </p>
      )}
    </div>
  );
}
