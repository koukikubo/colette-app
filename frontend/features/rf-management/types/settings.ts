import type { ApiSuccessResponse } from "@/lib/api/api-client";

import type { RfCalculationRun } from "./calculation";
import type { RfRuleSet } from "./rule-set";

export type RfSettingsResponse = ApiSuccessResponse<{
  published_rule_set: RfRuleSet | null;
  applied_rule_set: RfRuleSet | null;
  current_calculation_run: RfCalculationRun | null;
}>;
