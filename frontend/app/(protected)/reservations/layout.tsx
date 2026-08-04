type ReservationsLayoutProps = {
  children: React.ReactNode;
  modal: React.ReactNode;
};

export default function ReservationsLayout({
  children,
  modal,
}: ReservationsLayoutProps) {
  return (
    <>
      {children}
      {modal}
    </>
  );
}
