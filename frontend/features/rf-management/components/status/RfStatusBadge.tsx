import { Badge } from "@/components/ui/badge";

import {
  RF_CALCULATION_STATUS_LABELS,
  RF_RULE_SET_STATUS_LABELS,
} from "../../constants";
import type { RfCalculationStatus, RfRuleSetStatus } from "../../types";

const CALCULATION_STATUS_STYLES = {
  pending:
    "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-200",
  processing:
    "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-200",
  completed:
    "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200",
  failed:
    "border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950/50 dark:text-red-200",
} satisfies Record<RfCalculationStatus, string>;

const RULE_SET_STATUS_STYLES = {
  draft:
    "border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200",
  published:
    "border-teal-200 bg-teal-50 text-teal-800 dark:border-teal-800 dark:bg-teal-950/50 dark:text-teal-200",
  archived:
    "border-orange-200 bg-orange-50 text-orange-800 dark:border-orange-800 dark:bg-orange-950/50 dark:text-orange-200",
} satisfies Record<RfRuleSetStatus, string>;

type RfCalculationStatusBadgeProps = {
  status: RfCalculationStatus;
};

export function RfCalculationStatusBadge({
  status,
}: RfCalculationStatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      data-rf-status={status}
      className={CALCULATION_STATUS_STYLES[status]}
    >
      {RF_CALCULATION_STATUS_LABELS[status]}
    </Badge>
  );
}

type RfRuleSetStatusBadgeProps = {
  status: RfRuleSetStatus;
};

export function RfRuleSetStatusBadge({ status }: RfRuleSetStatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      data-rf-status={status}
      className={RULE_SET_STATUS_STYLES[status]}
    >
      {RF_RULE_SET_STATUS_LABELS[status]}
    </Badge>
  );
}

export function RfCurrentStatusBadge() {
  return (
    <Badge
      data-rf-status="current"
      className="border-green-700 bg-green-700 text-white dark:border-green-500 dark:bg-green-600 dark:text-white"
    >
      現在適用中
    </Badge>
  );
}
