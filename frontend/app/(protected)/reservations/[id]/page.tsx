import {
  fetchReservationOnServer,
  ReservationServerApiError,
} from "@/features/reservations/api/reservation-server-api";
import { notFound } from "next/navigation";
import { ReservationDetail } from "@/features/reservations/components/details/ReservationDetail";

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
  let reservationResponse;

  try {
    reservationResponse = await fetchReservationOnServer(reservationId);
  } catch (error) {
    if (error instanceof ReservationServerApiError && error.status === 404) {
      notFound();
    }

    throw error;
  }

  const reservation = reservationResponse.data.reservation;

  return <ReservationDetail reservation={reservation} />;
}
