import { CircleAlertIcon } from "lucide-react";

import type { RfDraftValidationIssue } from "../../utils/rf-rule-draft-validation";

type RfInlineValidationProps = {
  issues: RfDraftValidationIssue[];
};

export function RfInlineValidation({ issues }: RfInlineValidationProps) {
  if (issues.length === 0) {
    return (
      <div className="rounded-lg border p-3 text-sm">
        この設定に修正が必要な箇所はありません。
      </div>
    );
  }

  return (
    <div
      role="alert"
      className="rounded-lg border border-amber-500/40 bg-amber-500/5 p-4"
    >
      <div className="flex items-center gap-2 font-medium">
        <CircleAlertIcon className="size-4" aria-hidden="true" />
        次の箇所を修正してください
      </div>

      <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
        {issues.map((issue) => (
          <li key={issue.code}>・{issue.message}</li>
        ))}
      </ul>
    </div>
  );
}
