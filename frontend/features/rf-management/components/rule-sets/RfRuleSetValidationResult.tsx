import {
  AlertCircleIcon,
  CheckCircle2Icon,
  TriangleAlertIcon,
} from "lucide-react";

import type { RfRuleSetValidation } from "../../types";

type RfRuleSetValidationResultProps = {
  validation: RfRuleSetValidation;
};

export function RfRuleSetValidationResult({
  validation,
}: RfRuleSetValidationResultProps) {
  return (
    <div className="space-y-4">
      {validation.valid ? (
        <div
          role="status"
          className="flex items-start gap-3 rounded-lg border p-4"
        >
          <CheckCircle2Icon
            className="mt-0.5 size-5 shrink-0"
            aria-hidden="true"
          />

          <div>
            <p className="font-medium">公開できる状態です</p>
            <p className="mt-1 text-sm text-muted-foreground">
              RFルールに公開を妨げる問題は見つかりませんでした。
            </p>
          </div>
        </div>
      ) : (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-lg border border-destructive/40 p-4"
        >
          <AlertCircleIcon
            className="mt-0.5 size-5 shrink-0 text-destructive"
            aria-hidden="true"
          />

          <div>
            <p className="font-medium">修正が必要です</p>
            <p className="mt-1 text-sm text-muted-foreground">
              エラーを修正してから、もう一度検証してください。
            </p>
          </div>
        </div>
      )}

      {validation.errors.length > 0 && (
        <section aria-labelledby="rf-validation-errors">
          <h3 id="rf-validation-errors" className="font-medium">
            エラー
          </h3>

          <ul className="mt-2 divide-y rounded-lg border">
            {validation.errors.map((issue, index) => (
              <li key={`${issue.code}-${index}`} className="p-3 text-sm">
                {issue.message}
              </li>
            ))}
          </ul>
        </section>
      )}

      {validation.warnings.length > 0 && (
        <section aria-labelledby="rf-validation-warnings">
          <div className="flex items-center gap-2">
            <TriangleAlertIcon className="size-4" aria-hidden="true" />
            <h3 id="rf-validation-warnings" className="font-medium">
              注意事項
            </h3>
          </div>

          <ul className="mt-2 divide-y rounded-lg border">
            {validation.warnings.map((issue, index) => (
              <li key={`${issue.code}-${index}`} className="p-3 text-sm">
                {issue.message}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
