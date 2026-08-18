import type { RestaurantMaster } from "@/features/restaurant-masters/types";

import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

type ReservationTableSelectorProps = {
  restaurantMasters: RestaurantMaster[];
  selectedIds: number[];
  guestCount: number;
  errorMessages?: string[];
  onChange: (selectedIds: number[]) => void;
};

// 予約へ割り当てる実テーブルの複数選択と、選択中の合計定員を表示する。
export function ReservationTableSelector({
  restaurantMasters,
  selectedIds,
  guestCount,
  errorMessages,
  onChange,
}: ReservationTableSelectorProps) {
  const selectedIdSet = new Set(selectedIds);

  const selectedRestaurantMasters = restaurantMasters.filter(
    (restaurantMaster) => selectedIdSet.has(restaurantMaster.id),
  );

  const totalCapacity = selectedRestaurantMasters.reduce(
    (total, restaurantMaster) => total + restaurantMaster.capacity,
    0,
  );

  const hasInsufficientCapacity =
    selectedRestaurantMasters.length > 0 && totalCapacity < guestCount;

  function handleCheckedChange(
    restaurantMaster: RestaurantMaster,
    checked: boolean,
  ) {
    const isSelected = selectedIdSet.has(restaurantMaster.id);

    // 割り当て済みの無効テーブルは解除できるが、解除後の再選択は許可しない。
    if (!restaurantMaster.active && !isSelected) return;

    const nextSelectedIds = checked
      ? [...selectedIds, restaurantMaster.id]
      : selectedIds.filter((id) => id !== restaurantMaster.id);

    onChange([...new Set(nextSelectedIds)]);
  }

  return (
    <section className="space-y-4 rounded-xl border bg-muted/20 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Label className="text-sm font-medium">確定テーブル</Label>
          <p className="text-sm text-muted-foreground">
            任意で複数のテーブルを割り当てられます。
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">
            選択 {selectedRestaurantMasters.length}卓
          </Badge>
          <Badge variant={hasInsufficientCapacity ? "destructive" : "outline"}>
            合計定員 {totalCapacity}名
          </Badge>
        </div>
      </div>

      {restaurantMasters.length > 0 ? (
        <div
          className="max-h-80 overflow-y-auto rounded-lg border bg-background p-2"
          role="group"
          aria-label="確定テーブル"
        >
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {restaurantMasters.map((restaurantMaster) => {
              const isSelected = selectedIdSet.has(restaurantMaster.id);
              const isDisabled = !restaurantMaster.active && !isSelected;
              const checkboxId = `restaurant-master-${restaurantMaster.id}`;

              return (
                <Label
                  key={restaurantMaster.id}
                  htmlFor={checkboxId}
                  className="flex min-h-16 cursor-pointer items-start gap-3 rounded-lg border bg-card p-2.5 transition-colors hover:bg-muted/50 has-aria-checked:border-primary has-aria-checked:bg-primary/5 has-disabled:cursor-not-allowed has-disabled:opacity-60"
                >
                  <Checkbox
                    id={checkboxId}
                    className="mt-0.5"
                    checked={isSelected}
                    disabled={isDisabled}
                    aria-invalid={Boolean(errorMessages?.length)}
                    onCheckedChange={(checked) => {
                      handleCheckedChange(restaurantMaster, checked === true);
                    }}
                  />

                  <span className="min-w-0 flex-1 space-y-0.5">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="font-medium leading-none">
                        {restaurantMaster.name}
                      </span>

                      {!restaurantMaster.active && (
                        <Badge variant="secondary">無効</Badge>
                      )}
                    </span>

                    <span className="block text-xs leading-5 text-muted-foreground">
                      {restaurantMaster.code}
                      {" / "}
                      {restaurantMaster.restaurant_master_type.label}
                      {" / "}
                      定員{restaurantMaster.capacity}名
                    </span>
                  </span>
                </Label>
              );
            })}
          </div>
        </div>
      ) : (
        <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
          選択できるテーブルがありません。
        </p>
      )}

      {selectedRestaurantMasters.length === 0 && (
        <p className="text-sm text-muted-foreground">
          未割り当てのまま予約することもできます。
        </p>
      )}

      {hasInsufficientCapacity && (
        <p className="text-sm text-destructive" role="status">
          予約人数に対して定員が不足しています。テーブルを追加してください。
        </p>
      )}

      {errorMessages?.map((message) => (
        <p key={message} className="text-sm text-destructive" role="alert">
          {message}
        </p>
      ))}
    </section>
  );
}
