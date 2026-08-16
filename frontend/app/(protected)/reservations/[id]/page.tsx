import { notFound } from "next/navigation";

import { ReservationDetailContainer } from "@/features/reservations/components/details/ReservationDetailContainer";

type ReservationDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ReservationDetailPage({
  params,
}: ReservationDetailPageProps) {
  const { id } = await params;
  const reservationId = Number(id);

  // URLの予約IDが正の整数でなければ、APIを呼ばずに404を表示する。
  if (!Number.isInteger(reservationId) || reservationId <= 0) {
    notFound();
  }

  return <ReservationDetailContainer reservationId={reservationId} />;
}
