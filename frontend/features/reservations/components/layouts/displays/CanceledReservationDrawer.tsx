"use client";

import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { CanceledReservationList } from "@/features/reservations/components/layouts/displays/CanceledReservationList";
import type { Reservation } from "@/features/reservations/types";
import { ChevronRightIcon } from "lucide-react";

type CanceledReservationDrawerProps = {
  reservations: Reservation[];
  onReservationStatusChanged?: () => void;
};

export function CanceledReservationDrawer({
  reservations,
  onReservationStatusChanged,
}: CanceledReservationDrawerProps) {
  return (
    <Drawer direction="right">
      <DrawerTrigger asChild>
        <button
          type="button"
          aria-label={`キャンセル済み予約${reservations.length}件を表示`}
          className="text-left text-2xl font-semibold focus-visible:outline-none after:absolute after:inset-0 after:content-['']"
        >
          {reservations.length}件
          <ChevronRightIcon
            className="pointer-events-none absolute right-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground transition-transform group-hover:translate-x-0.5"
            aria-hidden="true"
          />
        </button>
      </DrawerTrigger>

      <DrawerContent className="h-full w-full sm:max-w-md">
        <DrawerHeader className="sr-only">
          <DrawerTitle>キャンセル済み予約</DrawerTitle>
          <DrawerDescription>
            キャンセルした予約の確認と復元ができます。
          </DrawerDescription>
        </DrawerHeader>

        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          <CanceledReservationList
            reservations={reservations}
            onReservationStatusChanged={onReservationStatusChanged}
          />
        </div>
      </DrawerContent>
    </Drawer>
  );
}
