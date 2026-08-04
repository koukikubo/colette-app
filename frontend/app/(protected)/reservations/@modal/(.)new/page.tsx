import { ReservationRouteModal } from "@/features/reservations/components/layouts/reservation-route-modal";

export default function NewReservationModalPage() {
  return (
    <ReservationRouteModal
      title="予約登録"
      description="新しい予約情報を入力します。"
    >
      <div className="py-4">
        <p className="text-muted-foreground text-sm">
          予約登録フォームは次のステップで実装します。
        </p>
      </div>
    </ReservationRouteModal>
  );
}
