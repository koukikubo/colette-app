type EditReservationPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditReservationPage({
  params,
}: EditReservationPageProps) {
  const { id } = await params;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold">予約編集</h1>
      <p className="mt-2 text-sm text-muted-foreground">予約ID：{id}</p>
    </div>
  );
}
