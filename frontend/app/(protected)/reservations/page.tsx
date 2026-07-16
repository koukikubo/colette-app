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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">予約一覧</h1>
        <Link
          href="/reservations/new"
          className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-9 items-center justify-center rounded-md px-4 text-sm font-medium"
        >
          新規予約
        </Link>
      </div>

      <div className="space-y-2">
        <ReservationDateSearch targetDate={targetDate} />
      </div>
      <ReservationListPage targetDate={targetDate} />
    </div>
  );
}
