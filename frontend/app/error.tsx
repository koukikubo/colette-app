"use client";

import { useEffect } from "react";
import Link from "next/link";
import {
  HouseIcon,
  LogInIcon,
  RefreshCwIcon,
  TriangleAlertIcon,
} from "lucide-react";

import { ApplicationErrorPage } from "@/components/common/ApplicationErrorPage";
import { Button } from "@/components/ui/button";
import { getApiErrorPresentation } from "@/lib/api/api-error-presentation";
import { reportClientError } from "@/lib/errors/report-client-error";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  const presentation = getApiErrorPresentation(error);

  useEffect(() => {
    reportClientError("RouteErrorBoundary", error);
  }, [error]);

  return (
    <ApplicationErrorPage
      title={presentation.title}
      description={presentation.description}
      guidance={presentation.guidance}
      icon={<TriangleAlertIcon className="size-8" aria-hidden="true" />}
      actions={
        <>
          {presentation.primaryHref ? (
            <Button asChild size="lg">
              <Link href={presentation.primaryHref}>
                {presentation.kind === "authentication" ? (
                  <LogInIcon />
                ) : (
                  <HouseIcon />
                )}
                {presentation.primaryLabel}
              </Link>
            </Button>
          ) : (
            <Button type="button" size="lg" onClick={reset}>
              <RefreshCwIcon />
              {presentation.primaryLabel}
            </Button>
          )}
          {presentation.primaryHref && (
            <Button type="button" variant="outline" size="lg" onClick={reset}>
              <RefreshCwIcon />
              もう一度試す
            </Button>
          )}
        </>
      }
    />
  );
}
