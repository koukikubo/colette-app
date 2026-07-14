import Link from "next/link";

export default function ReservationsPage() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">予約一覧</h1>

        <Link
          href="/reservations/new"
          className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-9 items-center justify-center rounded-md px-4 text-sm font-medium"
        >
          新規予約
        </Link>
      </div>

      <div className="space-y-2">
        <Link
          href="/reservations/1"
          className="hover:bg-muted block rounded-md border p-4"
        >
          予約ID 1の詳細を開く
        </Link>
      </div>
    </div>
  );
}
