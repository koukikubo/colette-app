"use client";

import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  addDaysToReservationDate,
  getTodayInJapan,
  isValidReservationDate,
} from "../../utils/reservation-date";

type ReservationDateSearchProps = {
  targetDate: string;
};

export function ReservationDateSearch({
  targetDate,
}: ReservationDateSearchProps) {
  const router = useRouter();

  // URLのdateを書き換えることで、表示対象日を更新する。
  // 日付をURLへ保持しておくことで、再読み込み・戻る・進む・詳細モーダルを閉じた後も選択日を維持できる。
  const moveToDate = (date: string) => {
    if (!isValidReservationDate(date)) {
      return;
    }

    const searchParams = new URLSearchParams({
      date,
    });

    router.push(`/reservation?${searchParams.toString()}`);
  };

  const moveToPreviousDay = () => {
    moveToDate(addDaysToReservationDate(targetDate, -1));
  };

  const moveToNextDay = () => {
    moveToDate(addDaysToReservationDate(targetDate, 1));
  };

  const moveToToday = () => {
    moveToDate(getTodayInJapan());
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button type="button" variant="outline" onClick={moveToPreviousDay}>
        前日
      </Button>

      <Input
        type="date"
        value={targetDate}
        className="w-auto"
        aria-label="予約表示日"
        onChange={(event) => {
          moveToDate(event.target.value);
        }}
      />

      <Button type="button" variant="outline" onClick={moveToNextDay}>
        翌日
      </Button>

      <Button type="button" variant="secondary" onClick={moveToToday}>
        今日
      </Button>
    </div>
  );
}
