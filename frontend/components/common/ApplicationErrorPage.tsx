import type { ReactNode } from "react";

type ApplicationErrorPageProps = {
  title: string;
  description: string;
  guidance: string;
  icon: ReactNode;
  actions: ReactNode;
};

function SentenceLines({ text }: { text: string }) {
  return text
    .split("。")
    .filter(Boolean)
    .map((sentence, index) => (
      <span key={`${index}-${sentence}`} className="block">
        {sentence}。
      </span>
    ));
}

export function ApplicationErrorPage({
  title,
  description,
  guidance,
  icon,
  actions,
}: ApplicationErrorPageProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-12 sm:px-6">
      <section className="w-full max-w-2xl overflow-hidden rounded-2xl border bg-card shadow-sm">
        <div className="border-b px-6 py-5 sm:px-8">
          <div className="flex size-11 items-center justify-center rounded-xl bg-muted text-foreground">
            {icon}
          </div>
        </div>

        <div className="space-y-8 px-6 py-8 sm:px-8 sm:py-10">
          <div className="space-y-4">
            <h1 className="text-balance text-2xl leading-snug font-semibold tracking-tight sm:text-[1.75rem]">
              {title}
            </h1>
            <p className="text-sm leading-7 text-muted-foreground sm:text-base">
              <SentenceLines text={description} />
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">{actions}</div>

          <p className="border-t pt-5 text-xs leading-6 text-muted-foreground sm:text-sm">
            <SentenceLines text={guidance} />
          </p>
        </div>
      </section>
    </main>
  );
}
