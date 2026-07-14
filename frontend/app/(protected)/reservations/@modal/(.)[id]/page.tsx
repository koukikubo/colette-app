import { ReservationRouteModal } from "@/features/reservations/components/layouts/reservation-route-modal";

type ReservationDetailModalPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ReservationDetailModalPage({
  params,
}: ReservationDetailModalPageProps) {
  const { id } = await params;

  return (
    <ReservationRouteModal title="予約詳細" description={`予約ID：${id}`}>
      <div className="py-4">
        <p className="text-muted-foreground text-sm">
          予約詳細の取得と編集フォームは次のステップで実装します。
        </p>
      </div>
    </ReservationRouteModal>
  );
}
