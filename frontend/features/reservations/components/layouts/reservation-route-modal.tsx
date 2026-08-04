"use client";

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

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      router.back();
    }
  };

  return (
    <Dialog open onOpenChange={handleOpenChange}>
      <DialogContent
        className="max-h-[90vh] overflow-y-auto sm:max-w-3xl"
        onPointerDownOutside={(event) => {
          event.preventDefault();
        }}
        onEscapeKeyDown={(event) => {
          event.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>

          {description ? (
            <DialogDescription>{description}</DialogDescription>
          ) : null}
        </DialogHeader>

        {children}
      </DialogContent>
    </Dialog>
  );
}
