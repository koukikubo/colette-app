import { NewReservationFormContainer } from "@/features/reservations/components/form/NewReservationFormContainer";
import { resolveReservationDate } from "@/features/reservations/utils/reservation-date";

// 新規予約ページがURLから受け取る検索条件
type NewReservationPageProps = {
  searchParams: Promise<{
    date?: string | string[];
  }>;
};

export default async function NewReservationPage({
  searchParams,
}: NewReservationPageProps) {
  const parameters = await searchParams;
  const targetDate = resolveReservationDate(parameters.date);
  return <NewReservationFormContainer targetDate={targetDate} />;
}
