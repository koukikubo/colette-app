"use client";

import { ReservationForm } from "@/features/reservations/components/form/ReservationFormContainer";
import { ReservationFormValues } from "@/features/reservations/types";
import { buildNewReservationFormValues } from "@/features/reservations/utils/reservation-form";
import { useState } from "react";

type ReservationFormContainerProps = {
  targetDate: string;
};

export default function NewReservationPage({
  targetDate,
}: ReservationFormContainerProps) {
  const [values, setValues] = useState<ReservationFormValues>(() =>
    buildNewReservationFormValues({ targetDate }),
  );
  return <ReservationForm values={values} onChange={setValues} />;
}
