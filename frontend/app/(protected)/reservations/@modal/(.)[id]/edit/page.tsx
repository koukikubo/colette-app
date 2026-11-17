import PageContent from "../../../[id]/edit/page";
import { ReservationRouteModal } from "@/features/reservations/components/layouts/reservation-route-modal";
export default function Page(props: { params: Promise<{ id: string }> }) {
  return (
    <ReservationRouteModal title="予約編集">
      <PageContent {...props} />
    </ReservationRouteModal>
  );
}
