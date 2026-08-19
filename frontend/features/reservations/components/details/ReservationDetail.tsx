import type { ReactNode } from "react";
import Link from "next/link";
import {
  ArrowLeftIcon,
  CalendarClockIcon,
  HistoryIcon,
  NotebookPenIcon,
  PencilIcon,
  UserRoundIcon,
  UtensilsIcon,
  TriangleAlertIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Reservation } from "../../types";
import { formatReservationDateTimeLocal } from "../../utils/reservation-date";

type DetailItemTone = "default" | "info" | "seat" | "success" | "danger";

type ReservationDetailProps = {
  reservation: Reservation;
};

type DetailItemProps = {
  label: string;
  value: ReactNode;
  wide?: boolean;
  tone?: DetailItemTone;
};

type DetailSectionProps = {
  title: string;
  description: string;
  icon: ReactNode;
  children: ReactNode;
};

function displayValue(value: string | null | undefined): string {
  return value?.trim() || "登録なし";
}

// APIの予約日時を日本時間の画面表示用へ変換する。
function formatDateTime(value: string | null): string {
  if (!value) return "記録なし";

  const localDateTime = formatReservationDateTimeLocal(value);
  const [date, time] = localDateTime.split("T");

  if (!date || !time) return value;

  return date.replaceAll("-", "/") + " " + time;
}

function DetailItem({
  label,
  value,
  wide = false,
  tone = "default",
}: DetailItemProps) {
  const toneClassName = {
    default: "",
    info: "rounded-lg border border-sky-200 bg-sky-50 p-4",
    seat: "rounded-lg border border-violet-200 bg-violet-50 p-4",
    success: "rounded-lg border border-emerald-200 bg-emerald-50 p-4",
    danger: "rounded-lg border border-red-300 bg-red-50 p-4",
  }[tone];

  return (
    <div
      className={`${wide ? "space-y-1 md:col-span-2" : "space-y-1"} ${toneClassName}`}
    >
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>

      <dd className="wrap-break-word text-sm font-medium text-foreground">
        {value}
      </dd>
    </div>
  );
}

// 1つの詳細Card内で、情報のまとまりだけを区切って表示する。
function DetailSection({
  title,
  description,
  icon,
  children,
}: DetailSectionProps) {
  return (
    <section className="border-t px-5 py-6 first:border-t-0 sm:px-7">
      <div className="mb-5 flex items-start gap-3">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          {icon}
        </div>

        <div className="space-y-0.5">
          <h2 className="text-sm font-semibold">{title}</h2>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>

      {children}
    </section>
  );
}

// 取得済みの予約情報を詳細画面として表示する。
export function ReservationDetail({ reservation }: ReservationDetailProps) {
  const reservationDate = formatReservationDateTimeLocal(
    reservation.starts_at,
  ).slice(0, 10);
  const isCanceled = reservation.canceled_at !== null;
  const statusLabel = isCanceled
    ? "キャンセル"
    : (reservation.reservation_status?.label ?? "状況不明");
  const totalTableCapacity = reservation.restaurant_masters.reduce(
    (total, restaurantMaster) => total + restaurantMaster.capacity,
    0,
  );

  return (
    <main className="min-h-[calc(100vh-var(--header-height))] bg-muted/30 px-4 py-6 sm:px-6 lg:px-8">
      <Card className="mx-auto w-full max-w-5xl overflow-hidden py-0 shadow-sm">
        <CardHeader className="border-b bg-muted/20 px-5 py-5 sm:px-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant={isCanceled ? "destructive" : "outline"}
                  className={
                    !isCanceled
                      ? "border-emerald-600 bg-emerald-600 text-white"
                      : undefined
                  }
                >
                  {statusLabel}
                </Badge>
              </div>

              <p className="text-sm text-muted-foreground">
                お客様名：
                <span className="font-medium text-foreground">
                  {reservation.reservation_name} 様
                </span>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button asChild variant="outline" size="sm">
                <Link href={"/reservations?date=" + reservationDate}>
                  <ArrowLeftIcon />
                  一覧へ戻る
                </Link>
              </Button>

              <Button asChild size="sm">
                <Link href={"/reservations/" + reservation.id + "/edit"}>
                  <PencilIcon />
                  編集する
                </Link>
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <DetailSection
            title="日時・人数"
            description="来店予定と予約人数を確認できます。"
            icon={<CalendarClockIcon className="size-4" />}
          >
            <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-4">
              <DetailItem
                label="予約開始"
                value={formatDateTime(reservation.starts_at)}
                tone="info"
              />
              <DetailItem
                label="予約終了"
                value={formatDateTime(reservation.ends_at)}
                tone="info"
              />
              <DetailItem
                label="予約人数"
                value={reservation.guest_count + "名"}
                tone="info"
              />
              <DetailItem
                label="予約状況"
                tone={isCanceled ? "danger" : "success"}
                value={
                  <span
                    className={
                      isCanceled
                        ? "font-semibold text-red-700"
                        : "font-semibold text-emerald-700"
                    }
                  >
                    {statusLabel}
                  </span>
                }
              />
            </dl>
          </DetailSection>

          <DetailSection
            title="予約者情報"
            description="予約時の連絡先と紐づいている顧客情報です。"
            icon={<UserRoundIcon className="size-4" />}
          >
            <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
              <DetailItem
                label="予約者名"
                value={reservation.reservation_name}
              />
              <DetailItem
                label="予約電話番号"
                value={displayValue(reservation.reservation_phone_number)}
              />
              <DetailItem
                label="顧客マスタ"
                value={reservation.customer?.name ?? "紐づけなし"}
              />
              <DetailItem
                label="フリガナ"
                value={displayValue(reservation.customer?.kana)}
              />
              <DetailItem
                label="メールアドレス"
                value={displayValue(reservation.customer?.email)}
              />
              <DetailItem
                label="会社名"
                value={displayValue(reservation.customer?.company_name)}
              />
            </dl>
          </DetailSection>

          <DetailSection
            title="席・予約内容"
            description="希望席種、確定テーブル、受付内容を確認できます。"
            icon={<UtensilsIcon className="size-4" />}
          >
            <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
              <DetailItem
                label="希望席種"
                value={
                  reservation.requested_restaurant_master_type?.label ??
                  "未選択"
                }
                tone="seat"
              />

              <DetailItem
                label="確定テーブルの合計定員"
                value={
                  reservation.restaurant_masters.length > 0
                    ? totalTableCapacity + "名"
                    : "未割り当て"
                }
              />

              <DetailItem
                label="予約経路"
                value={reservation.reservation_route?.label ?? "未選択"}
              />

              <DetailItem
                label="メニュー"
                value={reservation.menu_type?.label ?? "未選択"}
              />
              <DetailItem
                label="利用目的"
                value={reservation.occasion?.label ?? "未選択"}
              />
              <DetailItem
                label="詳細確認"
                value={
                  reservation.details_confirmed_at
                    ? formatDateTime(reservation.details_confirmed_at)
                    : "未確認"
                }
              />
              <DetailItem
                label="確定テーブル"
                wide
                tone="seat"
                value={
                  reservation.restaurant_masters.length > 0 ? (
                    <div className="flex flex-wrap gap-3">
                      {reservation.restaurant_masters.map(
                        (restaurantMaster) => (
                          <Badge
                            key={restaurantMaster.id}
                            variant="outline"
                            className={
                              restaurantMaster.active
                                ? "border-violet-300 bg-violet-50 px-4 py-2 text-base font-semibold text-violet-900"
                                : "px-4 py-2 text-base font-semibold"
                            }
                          >
                            {restaurantMaster.name}
                            {!restaurantMaster.active && "・無効"}
                          </Badge>
                        ),
                      )}
                    </div>
                  ) : (
                    "未割り当て"
                  )
                }
              />
            </dl>
          </DetailSection>

          <DetailSection
            title="ご要望・メモ"
            description="料理の対応事項とスタッフ間で共有する内容です。"
            icon={<NotebookPenIcon className="size-4" />}
          >
            <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
              <DetailItem
                label="アレルギー"
                tone={reservation.allergy_note?.trim() ? "danger" : "default"}
                value={
                  reservation.allergy_note?.trim() ? (
                    <div className="flex items-start gap-2 text-red-700">
                      <TriangleAlertIcon className="mt-0.5 size-4 shrink-0" />
                      <span className="font-semibold">
                        {reservation.allergy_note}
                      </span>
                    </div>
                  ) : (
                    "登録なし"
                  )
                }
              />

              <DetailItem
                label="苦手な食材"
                value={displayValue(reservation.disliked_food_note)}
              />

              <DetailItem
                label="好みの食材"
                value={displayValue(reservation.preferred_food_note)}
              />

              <DetailItem
                label="好みのドリンク"
                value={displayValue(reservation.favorite_drink_note)}
              />

              <DetailItem
                label="お客様からのご要望"
                value={displayValue(reservation.request_note)}
                wide
              />

              <DetailItem
                label="店舗メモ"
                value={displayValue(reservation.internal_memo)}
                wide
              />
            </dl>
          </DetailSection>

          <DetailSection
            title="管理情報"
            description="登録・更新を行った担当者と日時です。"
            icon={<HistoryIcon className="size-4" />}
          >
            <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-4">
              <DetailItem
                label="登録担当者"
                value={reservation.created_by_staff?.name ?? "記録なし"}
              />
              <DetailItem
                label="登録日時"
                value={formatDateTime(reservation.created_at)}
              />
              <DetailItem
                label="更新担当者"
                value={reservation.updated_by_staff?.name ?? "記録なし"}
              />
              <DetailItem
                label="更新日時"
                value={formatDateTime(reservation.updated_at)}
              />
              {isCanceled && (
                <DetailItem
                  label="キャンセル日時"
                  value={formatDateTime(reservation.canceled_at)}
                />
              )}
            </dl>
          </DetailSection>
        </CardContent>
      </Card>
    </main>
  );
}
