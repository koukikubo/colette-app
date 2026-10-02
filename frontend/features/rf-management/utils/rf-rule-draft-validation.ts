import type {
  RfFrequencyRuleInput,
  RfRankMappingInput,
  RfRecencyRuleInput,
} from "../types";

export type RfDraftValidationIssue = {
  code: string;
  message: string;
};

function conditionName(label: string, index: number) {
  return label.trim() || `条件${index + 1}`;
}

export function validateRecencyRules(
  rules: RfRecencyRuleInput[],
): RfDraftValidationIssue[] {
  if (rules.length === 0) {
    return [
      {
        code: "recency_missing",
        message: "最終来店日からの期間を1件以上追加してください。",
      },
    ];
  }

  const issues: RfDraftValidationIssue[] = [];

  rules.forEach((rule, index) => {
    const name = conditionName(rule.label, index);

    if (rule.label.trim() === "") {
      issues.push({
        code: `recency_label_${rule.code}`,
        message: `条件${index + 1}の表示名を入力してください。`,
      });
    }

    if (rule.min_days < 0 || (rule.max_days !== null && rule.max_days < 0)) {
      issues.push({
        code: `recency_negative_${rule.code}`,
        message: `「${name}」の日数は0以上で入力してください。`,
      });
    }

    if (rule.max_days !== null && rule.min_days > rule.max_days) {
      issues.push({
        code: `recency_reverse_${rule.code}`,
        message: `「${name}」の終了日数は、開始日数以上にしてください。`,
      });
    }
  });

  if (rules[0]?.min_days !== 0) {
    issues.push({
      code: "recency_start",
      message: "最初の条件は、最終来店から0日で開始してください。",
    });
  }

  rules.slice(0, -1).forEach((rule, index) => {
    const nextRule = rules[index + 1];
    const name = conditionName(rule.label, index);
    const nextName = conditionName(nextRule.label, index + 1);

    if (rule.max_days === null) {
      issues.push({
        code: `recency_unbounded_${rule.code}`,
        message: `「${name}」を上限なしにする場合は、最後の条件へ移動してください。`,
      });
      return;
    }

    const expectedMinimum = rule.max_days + 1;

    if (nextRule.min_days > expectedMinimum) {
      issues.push({
        code: `recency_gap_${rule.code}_${nextRule.code}`,
        message: `「${name}」と「${nextName}」の間で、${expectedMinimum}日から${nextRule.min_days - 1}日までが未設定です。`,
      });
    } else if (nextRule.min_days < expectedMinimum) {
      issues.push({
        code: `recency_overlap_${rule.code}_${nextRule.code}`,
        message: `「${name}」と「${nextName}」で、${nextRule.min_days}日から${rule.max_days}日までが重複しています。`,
      });
    }
  });

  if (rules.at(-1)?.max_days !== null) {
    issues.push({
      code: "recency_upper_limit",
      message: "最後の条件は終了日数を空欄にして、上限なしにしてください。",
    });
  }

  return issues;
}

export function validateFrequencyRules(
  rules: RfFrequencyRuleInput[],
): RfDraftValidationIssue[] {
  if (rules.length === 0) {
    return [
      {
        code: "frequency_missing",
        message: "対象期間内の来店回数を1件以上追加してください。",
      },
    ];
  }

  const issues: RfDraftValidationIssue[] = [];

  rules.forEach((rule, index) => {
    const name = conditionName(rule.label, index);

    if (rule.label.trim() === "") {
      issues.push({
        code: `frequency_label_${rule.code}`,
        message: `条件${index + 1}の表示名を入力してください。`,
      });
    }

    if (
      rule.min_visits < 0 ||
      (rule.max_visits !== null && rule.max_visits < 0)
    ) {
      issues.push({
        code: `frequency_negative_${rule.code}`,
        message: `「${name}」の来店回数は0以上で入力してください。`,
      });
    }

    if (rule.max_visits !== null && rule.min_visits > rule.max_visits) {
      issues.push({
        code: `frequency_reverse_${rule.code}`,
        message: `「${name}」の最大来店回数は、最小来店回数以上にしてください。`,
      });
    }
  });

  if (rules[0]?.min_visits !== 0) {
    issues.push({
      code: "frequency_start",
      message: "最初の条件は、来店回数0回で開始してください。",
    });
  }

  rules.slice(0, -1).forEach((rule, index) => {
    const nextRule = rules[index + 1];
    const name = conditionName(rule.label, index);
    const nextName = conditionName(nextRule.label, index + 1);

    if (rule.max_visits === null) {
      issues.push({
        code: `frequency_unbounded_${rule.code}`,
        message: `「${name}」を上限なしにする場合は、最後の条件へ移動してください。`,
      });
      return;
    }

    const expectedMinimum = rule.max_visits + 1;

    if (nextRule.min_visits > expectedMinimum) {
      issues.push({
        code: `frequency_gap_${rule.code}_${nextRule.code}`,
        message: `「${name}」と「${nextName}」の間で、${expectedMinimum}回から${nextRule.min_visits - 1}回までが未設定です。`,
      });
    } else if (nextRule.min_visits < expectedMinimum) {
      issues.push({
        code: `frequency_overlap_${rule.code}_${nextRule.code}`,
        message: `「${name}」と「${nextName}」で、${nextRule.min_visits}回から${rule.max_visits}回までが重複しています。`,
      });
    }
  });

  if (rules.at(-1)?.max_visits !== null) {
    issues.push({
      code: "frequency_upper_limit",
      message: "最後の条件は最大来店回数を空欄にして、上限なしにしてください。",
    });
  }

  return issues;
}

export function validateRankMappings(
  recencyRules: RfRecencyRuleInput[],
  frequencyRules: RfFrequencyRuleInput[],
  mappings: RfRankMappingInput[],
): RfDraftValidationIssue[] {
  if (recencyRules.length === 0 || frequencyRules.length === 0) return [];

  const issues: RfDraftValidationIssue[] = [];

  recencyRules.forEach((recencyRule, recencyIndex) => {
    frequencyRules.forEach((frequencyRule, frequencyIndex) => {
      const mappingExists = mappings.some(
        (mapping) =>
          mapping.recency_code === recencyRule.code &&
          mapping.frequency_code === frequencyRule.code,
      );

      if (mappingExists) return;

      issues.push({
        code: `mapping_missing_${recencyRule.code}_${frequencyRule.code}`,
        message: `「${conditionName(recencyRule.label, recencyIndex)} × ${conditionName(frequencyRule.label, frequencyIndex)}」のRFランクを選択してください。`,
      });
    });
  });

  return issues;
}
