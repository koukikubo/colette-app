import { ApiClientError } from "@/lib/api/api-client";

type ErrorWithDigest = Error & { digest?: string };

// 利用者には内部情報を見せず、調査に必要な最小限の情報だけを記録する。
export function reportClientError(scope: string, error: ErrorWithDigest) {
  console.error(`[${scope}]`, {
    name: error.name,
    digest: error.digest,
    status: error instanceof ApiClientError ? error.status : undefined,
  });
}
