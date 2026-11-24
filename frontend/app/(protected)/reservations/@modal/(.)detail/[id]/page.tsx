import PageContent from "../../../[id]/page";
import { ReservationRouteModal } from "@/features/reservations/components/layouts/reservation-route-modal";
export default function Page(props: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ return_to?: string | string[] }>;
}) {
  return (
    <ReservationRouteModal
      title="予約詳細"
      description="予約予定と受付状態、来店結果を確認できます。"
    >
      <PageContent {...props} />
    </ReservationRouteModal>
  );
}
