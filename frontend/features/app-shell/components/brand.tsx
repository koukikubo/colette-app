import Link from "next/link";

// 認証前はログイン、認証後はダッシュボードへ戻る共通のブランド表示。
export function Brand({ authenticated = false }: { authenticated?: boolean }) {
  return (
    <Link
      href={authenticated ? "/dashboard" : "/login"}
      className="inline-flex items-center gap-3 rounded-sm font-semibold tracking-tight text-primary"
    >
      <span
        aria-hidden="true"
        className="flex size-8 items-center justify-center rounded-md bg-primary text-lg text-primary-foreground"
      >
        C
      </span>
      <span className="text-xl">Colette</span>
    </Link>
  );
}
