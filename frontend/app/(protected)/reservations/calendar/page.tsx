import { ReservationCalendar } from "@/features/reservations/components/layouts/displays/ReservationCalendar";
import { resolveReservationDate } from "@/features/reservations/utils/reservation-date";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ date?: string | string[] }>;
}) {
  const parameters = await searchParams;
  return (
    <ReservationCalendar targetDate={resolveReservationDate(parameters.date)} />
  );
}
