import { EllipsisIcon } from "lucide-react";

import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ReservationStatusActions } from "@/features/reservations/components/details/ReservationStatusActions";
import type { Reservation } from "@/features/reservations/types";

type ReservationTimelineActionMenuProps = {
  reservation: Reservation;
};

export function ReservationTimelineActionMenu({
  reservation,
}: ReservationTimelineActionMenuProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`${reservation.reservation_name}様の予約操作を開く`}
          className="inline-flex size-7 items-center justify-center rounded-md bg-background/90 text-foreground shadow-sm hover:bg-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <EllipsisIcon className="size-4" aria-hidden="true" />
        </button>
      </PopoverTrigger>

      <PopoverContent align="end">
        <PopoverHeader>
          <PopoverTitle>{reservation.reservation_name} 様</PopoverTitle>

          <PopoverDescription>予約状態を変更できます。</PopoverDescription>
        </PopoverHeader>

        <ReservationStatusActions reservation={reservation} />
      </PopoverContent>
    </Popover>
  );
}
