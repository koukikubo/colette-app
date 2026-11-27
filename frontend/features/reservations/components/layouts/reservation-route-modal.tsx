"use client";

import { useState } from "react";
import { HelpButton } from "@/features/help/components/HelpButton";
import { ReservationModalDirtyContext } from "./reservation-modal-dirty-context";
import { ConfirmDiscardChangesDialog } from "@/components/common/ConfirmDiscardChangesDialog";
import { useRouter } from "next/navigation";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type ReservationRouteModalProps = {
  title: string;
  description?: string;
  children: React.ReactNode;
};

export function ReservationRouteModal({
  title,
  description,
  children,
}: ReservationRouteModalProps) {
  const router = useRouter();
  const [dirty, setDirty] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  const close = () => {
    router.back();
    window.dispatchEvent(new Event("colette:reservations-changed"));
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      if (dirty) setConfirmDiscard(true);
      else close();
    }
  };

  return (
    <Dialog open onOpenChange={handleOpenChange}>
      <DialogContent
        data-help-host="reservation"
        className="max-h-[90vh] overflow-y-auto sm:max-w-3xl"
        onPointerDownOutside={(event) => {
          event.preventDefault();
        }}
        onEscapeKeyDown={(event) => {
          event.preventDefault();
          handleOpenChange(false);
        }}
      >
        <DialogHeader>
          <div className="flex items-center justify-between gap-3 pr-6">
            <DialogTitle>{title}</DialogTitle>
            <HelpButton />
          </div>

          <DialogDescription>
            {description ?? "予約内容を確認し、必要な項目を入力してください。"}
          </DialogDescription>
        </DialogHeader>

        <ReservationModalDirtyContext.Provider value={setDirty}>
          {children}
        </ReservationModalDirtyContext.Provider>
        <ConfirmDiscardChangesDialog
          open={confirmDiscard}
          onOpenChange={setConfirmDiscard}
          onConfirm={close}
        />
      </DialogContent>
    </Dialog>
  );
}
