// 状態管理やAPI通信はこのファイルでは行わない
import type { Customer } from "@/features/customers/types";
import type { ReservationFormValues } from "../../types";
import type { StandardListCode } from "@/features/standard-codes/types";
import type { RestaurantMaster } from "@/features/restaurant-masters/types";
import { ReservationTableSelector } from "./ReservationTableSelector";

import {
  CalendarClockIcon,
  CheckIcon,
  LoaderCircleIcon,
  NotebookPenIcon,
  UserRoundIcon,
  UsersIcon,
  UtensilsIcon,
} from "lucide-react";

import { CustomerKeywordSearch } from "@/features/customers/components/CustomerKeywordSearch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ApiFieldErrors } from "@/lib/api/api-client";

type ReservationFormProps = {
  values: ReservationFormValues;
  onChange: (newValues: ReservationFormValues) => void;
  requestedRestaurantMasterTypes: StandardListCode[];
  reservationRoutes: StandardListCode[];
  menuTypes: StandardListCode[];
  reservationOccasion: StandardListCode[];
  reservationStatuses: StandardListCode[];
  onSubmit: () => void;
  errorMessage: string | null;
  isSubmitting: boolean;
  submitLabel?: string;
  submittingLabel?: string;
  customerQuery: string;
  customers: Customer[];
  isCustomerSearching: boolean;
  customerSearchError: string | null;
  onCustomerQueryChange: (value: string) => void;
  onCustomerSearch: () => void;
  onCustomerSelect: (customer: Customer) => void;
  hasSearchedCustomers: boolean;
  fieldErrors: ApiFieldErrors;
  onClearFieldError: (fieldName: string) => void;
  onCustomerClear: () => void;
  selectedCustomerHasNoPhone: boolean;
  cancelLabel?: string;
  onCancel?: () => void;
  restaurantMasters: RestaurantMaster[];
  unavailableRestaurantMasterIds: number[];
  isAvailabilityLoading: boolean;
  availabilityErrorMessage: string | null;
};

type FieldErrorProps = {
  messages?: string[];
};

type CodeSelectProps = {
  id: string;
  value: number | null;
  options: StandardListCode[];
  placeholder?: string;
  hasError?: boolean;
  onValueChange: (value: number | null) => void;
};

const EMPTY_SELECT_VALUE = "__none__";

function FieldError({ messages }: FieldErrorProps) {
  if (!messages?.length) return null;

  return (
    <div className="space-y-1" role="alert">
      {messages.map((message) => (
        <p key={message} className="text-sm text-destructive">
          {message}
        </p>
      ))}
    </div>
  );
}

function CodeSelect({
  id,
  value,
  options,
  placeholder = "選択してください",
  hasError = false,
  onValueChange,
}: CodeSelectProps) {
  return (
    <Select
      value={value === null ? EMPTY_SELECT_VALUE : String(value)}
      onValueChange={(nextValue) => {
        onValueChange(
          nextValue === EMPTY_SELECT_VALUE ? null : Number(nextValue),
        );
      }}
    >
      <SelectTrigger
        id={id}
        className="h-10 w-full bg-background"
        aria-invalid={hasError}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent position="popper">
        <SelectItem value={EMPTY_SELECT_VALUE}>{placeholder}</SelectItem>
        {options.map((option) => (
          <SelectItem key={option.id} value={String(option.id)}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function ReservationForm({
  values,
  onChange,
  requestedRestaurantMasterTypes,
  reservationRoutes,
  menuTypes,
  reservationOccasion,
  reservationStatuses,
  onSubmit,
  errorMessage,
  isSubmitting,
  submitLabel = "予約を登録",
  submittingLabel = "登録中…",
  customerQuery,
  customers,
  isCustomerSearching,
  customerSearchError,
  onCustomerQueryChange,
  onCustomerSearch,
  onCustomerSelect,
  hasSearchedCustomers,
  fieldErrors,
  onClearFieldError,
  onCustomerClear,
  selectedCustomerHasNoPhone,
  cancelLabel,
  onCancel,
  restaurantMasters,
  unavailableRestaurantMasterIds,
  isAvailabilityLoading,
  availabilityErrorMessage,
}: ReservationFormProps) {
  return (
    <main className="min-h-[calc(100vh-var(--header-height))] bg-muted/30 px-4 py-6 sm:px-6 lg:px-8">
      <form
        className="mx-auto flex w-full max-w-5xl flex-col gap-6"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        {errorMessage && (
          <Alert variant="destructive">
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}

        <Card className="shadow-sm">
          <CardHeader className="border-b">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <UserRoundIcon className="size-4" />
              </div>
              <div>
                <CardTitle>予約者情報</CardTitle>
                <CardDescription>
                  既存顧客を検索するか、予約者情報を直接入力します。
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5 pt-1">
            <div className="space-y-2 rounded-xl border bg-muted/30 p-4">
              <Label>顧客を検索</Label>
              <CustomerKeywordSearch
                value={customerQuery}
                isLoading={isCustomerSearching}
                placeholder="氏名・カナ・電話番号で検索"
                onValueChange={onCustomerQueryChange}
                onSearch={onCustomerSearch}
              />

              {customerSearchError && (
                <p className="text-sm text-destructive" role="alert">
                  {customerSearchError}
                </p>
              )}
              {hasSearchedCustomers &&
                !isCustomerSearching &&
                customers.length === 0 &&
                !customerSearchError && (
                  <p className="text-sm text-muted-foreground">
                    該当する顧客が見つかりませんでした。
                  </p>
                )}

              {customers.length > 0 && (
                <ul className="overflow-hidden rounded-lg border bg-background shadow-sm">
                  {customers.map((customer) => (
                    <li key={customer.id} className="border-b last:border-b-0">
                      <button
                        type="button"
                        className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                        onClick={() => onCustomerSelect(customer)}
                      >
                        <span className="font-medium">{customer.name}</span>
                        <span className="text-sm text-muted-foreground">
                          {customer.phone_number ??
                            "電話番号は登録されていません。"}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {values.customer_id !== null && (
              <div>
                <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-sm text-primary">
                  <CheckIcon className="size-4" />
                  <span>{values.reservation_name}さんを選択しています</span>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onCustomerClear}
                >
                  顧客選択を解除
                </Button>
              </div>
            )}

            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="reservation-name">
                  予約者名
                  <span className="text-destructive" aria-hidden="true">
                    ＊
                  </span>
                  <span className="sr-only">必須</span>
                </Label>
                <Input
                  id="reservation-name"
                  name="reservation_name"
                  className="h-10"
                  value={values.reservation_name}
                  readOnly={values.customer_id !== null}
                  aria-invalid={Boolean(fieldErrors.reservation_name?.length)}
                  onChange={(event) => {
                    onClearFieldError("reservation_name");
                    onChange({
                      ...values,
                      reservation_name: event.target.value,
                    });
                  }}
                />
                <FieldError messages={fieldErrors.reservation_name} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reservation-phone-number">
                  電話番号
                  <span className="text-destructive" aria-hidden="true">
                    ＊
                  </span>
                  <span className="sr-only">必須</span>
                </Label>
                <Input
                  id="reservation-phone-number"
                  name="reservation_phone_number"
                  type="tel"
                  className="h-10"
                  value={values.reservation_phone_number}
                  aria-invalid={Boolean(
                    fieldErrors.reservation_phone_number?.length,
                  )}
                  onChange={(event) => {
                    onClearFieldError("reservation_phone_number");
                    onChange({
                      ...values,
                      reservation_phone_number: event.target.value,
                    });
                  }}
                />
                {values.customer_id !== null &&
                  selectedCustomerHasNoPhone &&
                  !values.reservation_phone_number && (
                    <p className="text-sm text-muted-foreground" role="status">
                      この顧客には電話番号が登録されていません。
                      <br />
                      今回の連絡先を入力してください。
                    </p>
                  )}
                <FieldError messages={fieldErrors.reservation_phone_number} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="border-b">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <CalendarClockIcon className="size-4" />
              </div>
              <div>
                <CardTitle>日時・人数</CardTitle>
                <CardDescription>
                  予約の開始・終了時刻と来店人数を設定します。
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid gap-5 pt-1 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="starts_at">
                予約開始日時
                <span className="text-destructive" aria-hidden="true">
                  ＊
                </span>
                <span className="sr-only">必須</span>
              </Label>
              <Input
                id="starts_at"
                name="starts_at"
                type="datetime-local"
                className="h-10"
                value={values.starts_at}
                aria-invalid={Boolean(fieldErrors.starts_at?.length)}
                onChange={(event) => {
                  onClearFieldError("starts_at");
                  onChange({ ...values, starts_at: event.target.value });
                }}
              />
              <FieldError messages={fieldErrors.starts_at} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ends_at">
                予約終了日時
                <span className="text-destructive" aria-hidden="true">
                  ＊
                </span>
                <span className="sr-only">必須</span>
              </Label>
              <Input
                id="ends_at"
                name="ends_at"
                type="datetime-local"
                className="h-10"
                value={values.ends_at}
                aria-invalid={Boolean(fieldErrors.ends_at?.length)}
                onChange={(event) => {
                  onClearFieldError("ends_at");
                  onChange({ ...values, ends_at: event.target.value });
                }}
              />
              <FieldError messages={fieldErrors.ends_at} />
            </div>

            <div className="space-y-2 md:col-span-2 lg:col-span-1">
              <Label htmlFor="guest_count">
                <UsersIcon className="size-4 text-muted-foreground" />
                人数
                <span className="text-destructive" aria-hidden="true">
                  ＊
                </span>
                <span className="sr-only">必須</span>
              </Label>
              <Input
                id="guest_count"
                name="guest_count"
                type="number"
                min={1}
                step={1}
                className="h-10"
                value={values.guest_count}
                aria-invalid={Boolean(fieldErrors.guest_count?.length)}
                onChange={(event) => {
                  onClearFieldError("guest_count");
                  onClearFieldError("restaurant_master_ids");

                  onChange({
                    ...values,
                    guest_count: Number(event.target.value),
                  });
                }}
              />
              <FieldError messages={fieldErrors.guest_count} />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="border-b">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <UtensilsIcon className="size-4" />
              </div>
              <div>
                <CardTitle>予約内容</CardTitle>
                <CardDescription>
                  席種やメニュー、予約経路などを選択します。
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid gap-5 pt-1 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="requested_restaurant_master_type_id">
                希望席種
                <span className="text-destructive" aria-hidden="true">
                  ＊
                </span>
                <span className="sr-only">必須</span>
              </Label>
              <CodeSelect
                id="requested_restaurant_master_type_id"
                value={values.requested_restaurant_master_type_id}
                options={requestedRestaurantMasterTypes}
                hasError={Boolean(
                  fieldErrors.requested_restaurant_master_type?.length,
                )}
                onValueChange={(value) => {
                  onClearFieldError("requested_restaurant_master_type");
                  onChange({
                    ...values,
                    requested_restaurant_master_type_id: value,
                  });
                }}
              />
              <FieldError
                messages={fieldErrors.requested_restaurant_master_type}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reservation_status_id">
                予約状況
                <span className="text-destructive" aria-hidden="true">
                  ＊
                </span>
                <span className="sr-only">必須</span>
              </Label>
              <CodeSelect
                id="reservation_status_id"
                value={values.reservation_status_id}
                options={reservationStatuses}
                hasError={Boolean(fieldErrors.reservation_status?.length)}
                onValueChange={(value) => {
                  onClearFieldError("reservation_status");
                  onChange({ ...values, reservation_status_id: value });
                }}
              />
              <FieldError messages={fieldErrors.reservation_status} />
            </div>

            <div className="md:col-span-2">
              <ReservationTableSelector
                restaurantMasters={restaurantMasters}
                selectedIds={values.restaurant_master_ids}
                guestCount={values.guest_count}
                unavailableRestaurantMasterIds={unavailableRestaurantMasterIds}
                isAvailabilityLoading={isAvailabilityLoading}
                availabilityErrorMessage={availabilityErrorMessage}
                errorMessages={fieldErrors.restaurant_master_ids}
                onChange={(selectedIds) => {
                  onClearFieldError("restaurant_master_ids");

                  onChange({
                    ...values,
                    restaurant_master_ids: selectedIds,
                  });
                }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reservation_route_id">予約経路</Label>
              <CodeSelect
                id="reservation_route_id"
                value={values.reservation_route_id}
                options={reservationRoutes}
                onValueChange={(value) =>
                  onChange({ ...values, reservation_route_id: value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="menu_type_id">メニュー</Label>
              <CodeSelect
                id="menu_type_id"
                value={values.menu_type_id}
                options={menuTypes}
                onValueChange={(value) =>
                  onChange({ ...values, menu_type_id: value })
                }
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="occasion_id">利用目的</Label>
              <CodeSelect
                id="occasion_id"
                value={values.occasion_id}
                options={reservationOccasion}
                hasError={Boolean(fieldErrors.occasion?.length)}
                onValueChange={(value) => {
                  onClearFieldError("occasion");
                  onChange({ ...values, occasion_id: value });
                }}
              />
              <FieldError messages={fieldErrors.occasion} />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="border-b">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <NotebookPenIcon className="size-4" />
              </div>
              <div>
                <CardTitle>ご要望・メモ</CardTitle>
                <CardDescription>
                  食材の好みやお客様からの要望、店舗内の共有事項を記録します。
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid gap-5 pt-1 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="allergy_note">アレルギー</Label>
              <Textarea
                id="allergy_note"
                name="allergy_note"
                placeholder="例：甲殻類アレルギー"
                value={values.allergy_note}
                onChange={(event) =>
                  onChange({ ...values, allergy_note: event.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="disliked_food_note">苦手食材</Label>
              <Textarea
                id="disliked_food_note"
                name="disliked_food_note"
                placeholder="例：パクチー、辛いもの"
                value={values.disliked_food_note}
                onChange={(event) =>
                  onChange({
                    ...values,
                    disliked_food_note: event.target.value,
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="preferred_food_note">希望食材</Label>
              <Textarea
                id="preferred_food_note"
                name="preferred_food_note"
                value={values.preferred_food_note}
                onChange={(event) =>
                  onChange({
                    ...values,
                    preferred_food_note: event.target.value,
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="favorite_drink_note">好きなドリンク</Label>
              <Textarea
                id="favorite_drink_note"
                name="favorite_drink_note"
                value={values.favorite_drink_note}
                onChange={(event) =>
                  onChange({
                    ...values,
                    favorite_drink_note: event.target.value,
                  })
                }
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="request_note">お客様からの要望</Label>
              <Textarea
                id="request_note"
                name="request_note"
                className="min-h-20"
                placeholder="席の希望や記念日の対応など"
                value={values.request_note}
                onChange={(event) =>
                  onChange({ ...values, request_note: event.target.value })
                }
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="internal_memo">店舗メモ</Label>
              <Textarea
                id="internal_memo"
                name="internal_memo"
                className="min-h-24 bg-muted/30"
                placeholder="スタッフ間で共有する内容を入力"
                value={values.internal_memo}
                onChange={(event) =>
                  onChange({ ...values, internal_memo: event.target.value })
                }
              />
            </div>
          </CardContent>

          <CardFooter className="justify-end gap-3">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                size="lg"
                disabled={isSubmitting}
                onClick={onCancel}
              >
                {cancelLabel ?? "戻る"}
              </Button>
            )}

            <Button
              type="submit"
              size="lg"
              className="min-w-32"
              disabled={isSubmitting}
            >
              {isSubmitting && (
                <LoaderCircleIcon className="animate-spin" aria-hidden="true" />
              )}
              {isSubmitting ? submittingLabel : submitLabel}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </main>
  );
}
