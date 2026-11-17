// 予約領域だけでURL付きモーダルを扱い、認証前のルートから分離する。
export default function Layout({
  children,
  modal,
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
}) {
  return (
    <>
      {children}
      {modal}
    </>
  );
}
