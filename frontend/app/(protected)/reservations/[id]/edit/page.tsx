import { notFound } from "next/navigation";
import { EditReservationFormContainer } from "@/features/reservations/components/form/EditReservationFormContainer";

type EditReservationPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditReservationPage({
  params,
}: EditReservationPageProps) {
  const { id } = await params;
  const reservationId = Number(id);

  // 予約IDが整数でない場合や0以下の場合は404ページを表示する
  if (!Number.isInteger(reservationId) || reservationId <= 0) {
    notFound();
  }

  return <EditReservationFormContainer reservationId={reservationId} />;
}
