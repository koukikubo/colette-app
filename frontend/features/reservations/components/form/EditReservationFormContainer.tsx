type EditReservationFormContainerProps = {
  reservationId: number;
};

export function EditReservationFormContainer({
  reservationId,
}: EditReservationFormContainerProps) {
  return (
    <div className="p-6">
      <p>編集対象の予約ID：{reservationId}</p>
    </div>
  );
}
