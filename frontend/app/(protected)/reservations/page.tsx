import Link from "next/link";
import { resolveReservationDate } from "@/features/reservations/utils/reservation-date";
import { ReservationListPage } from "@/features/reservations/components/layouts/displays/ReservationListPage";
import { ReservationDateSearch } from "@/features/reservations/components/form/ReservationDateSearch";

type ReservationPageProps = {
  searchParams: Promise<{
    date?: string | string[];
  }>;
};

export default async function ReservationsPage({
  searchParams,
}: ReservationPageProps) {
  const parameters = await searchParams;
  const targetDate = resolveReservationDate(parameters.date);

  return (
    <div className="space-y-6 p-6">
      {/* 予約作成はタイムラインの空き枠に集約し、日付操作を先頭に置く。 */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <ReservationDateSearch targetDate={targetDate} />
        <Link
          className="text-primary underline underline-offset-4"
          href={`/reservations/calendar?date=${targetDate}`}
        >
          月別カレンダーへ
        </Link>
      </div>
      <ReservationListPage targetDate={targetDate} />
    </div>
  );
}
