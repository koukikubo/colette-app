import type { RfRuleSet, RfRuleSetInput, RfRuleSetUpdateInput } from "../types";

export type RfRuleSetBasicValues = {
  name: string;
  aggregation_months: number;
  frequency_window_months: number;
};

export function buildCreateRfRuleSetInput(
  values: RfRuleSetBasicValues,
): RfRuleSetInput {
  return {
    ...values,
    recency_rules: [],
    frequency_rules: [],
    rank_mappings: [],
  };
}

export function buildUpdateRfRuleSetInput(
  ruleSet: RfRuleSet,
  values: RfRuleSetBasicValues,
): RfRuleSetUpdateInput {
  const recencyCodes = new Map(
    ruleSet.recency_rules.map((rule) => [rule.id, rule.code]),
  );

  const frequencyCodes = new Map(
    ruleSet.frequency_rules.map((rule) => [rule.id, rule.code]),
  );

  const rankMappings = ruleSet.rank_mappings.map((mapping) => {
    const recencyCode = recencyCodes.get(mapping.recency_rule_id);
    const frequencyCode = frequencyCodes.get(mapping.frequency_rule_id);

    if (!recencyCode || !frequencyCode) {
      throw new Error(
        "RFランク対応表に存在しないR条件またはF条件が含まれています。",
      );
    }

    return {
      recency_code: recencyCode,
      frequency_code: frequencyCode,
      rf_rank_id: mapping.rf_rank.id,
    };
  });

  return {
    ...values,
    lock_version: ruleSet.lock_version,
    recency_rules: ruleSet.recency_rules.map((rule) => ({
      code: rule.code,
      label: rule.label,
      min_days: rule.min_days,
      max_days: rule.max_days,
      position: rule.position,
    })),
    frequency_rules: ruleSet.frequency_rules.map((rule) => ({
      code: rule.code,
      label: rule.label,
      min_visits: rule.min_visits,
      max_visits: rule.max_visits,
      position: rule.position,
    })),
    rank_mappings: rankMappings,
  };
}
