import { ReservationRouteModal } from "@/features/reservations/components/layouts/reservation-route-modal";
import { NewReservationFormContainer } from "@/features/reservations/components/form/NewReservationFormContainer";
import { PermissionGate } from "@/features/staff-auth/components/session/PermissionGate";
import { resolveReservationDate } from "@/features/reservations/utils/reservation-date";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{
    date?: string | string[];
    time?: string;
    table_id?: string;
  }>;
}) {
  const params = await searchParams;
  return (
    <ReservationRouteModal title="新規予約">
      <PermissionGate
        resource="reservations"
        fallback={<p>閲覧専用のため予約を変更できません。</p>}
      >
        <NewReservationFormContainer
          modal
          targetDate={resolveReservationDate(params.date)}
          startTime={params.time}
          restaurantMasterId={Number(params.table_id)}
        />
      </PermissionGate>
    </ReservationRouteModal>
  );
}
