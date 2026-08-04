type ReservationDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ReservationDetailPage({
  params,
}: ReservationDetailPageProps) {
  const { id } = await params;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold">予約詳細</h1>

      <p className="text-muted-foreground mt-2 text-sm">予約ID：{id}</p>
    </div>
  );
}
