"use client";

import { ArrowDownIcon, ArrowUpIcon, PlusIcon, Trash2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import type { RfRecencyRuleInput } from "../../types";

type RfRecencyRulesEditorProps = {
  rules: RfRecencyRuleInput[];
  disabled?: boolean;
  onChange: (rules: RfRecencyRuleInput[]) => void;
};

function normalizePositions(rules: RfRecencyRuleInput[]) {
  return rules.map((rule, index) => ({
    ...rule,
    position: index + 1,
  }));
}

function nextRecencyCode(rules: RfRecencyRuleInput[]) {
  const currentNumbers = rules
    .map((rule) => /^R(\d+)$/.exec(rule.code))
    .map((match) => (match ? Number(match[1]) : 0));

  return `R${Math.max(0, ...currentNumbers) + 1}`;
}

export function RfRecencyRulesEditor({
  rules,
  disabled = false,
  onChange,
}: RfRecencyRulesEditorProps) {
  function addRule() {
    const previousRule = rules.at(-1);

    const nextMinimum =
      previousRule?.max_days === null || previousRule?.max_days === undefined
        ? 0
        : previousRule.max_days + 1;

    onChange([
      ...rules,
      {
        code: nextRecencyCode(rules),
        label: "",
        min_days: nextMinimum,
        max_days: null,
        position: rules.length + 1,
      },
    ]);
  }

  function updateRule(index: number, changes: Partial<RfRecencyRuleInput>) {
    onChange(
      rules.map((rule, ruleIndex) =>
        ruleIndex === index
          ? {
              ...rule,
              ...changes,
            }
          : rule,
      ),
    );
  }

  function removeRule(index: number) {
    onChange(
      normalizePositions(rules.filter((_, ruleIndex) => ruleIndex !== index)),
    );
  }

  function moveRule(index: number, direction: -1 | 1) {
    const targetIndex = index + direction;

    if (targetIndex < 0 || targetIndex >= rules.length) return;

    const nextRules = [...rules];
    const [movedRule] = nextRules.splice(index, 1);

    nextRules.splice(targetIndex, 0, movedRule);

    onChange(normalizePositions(nextRules));
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-muted/30 p-4 text-sm">
        <p className="font-medium">Recency条件</p>
        <p className="mt-1 text-muted-foreground">
          最終来店日から何日経過しているかを、重複や空白がない範囲に分けます。
          最後の条件は上限なしにしてください。
        </p>
      </div>

      {rules.length === 0 ? (
        <div className="rounded-lg border border-dashed p-6 text-center">
          <p className="text-sm text-muted-foreground">
            Recency条件がまだ登録されていません。
          </p>
        </div>
      ) : (
        <ol className="space-y-3">
          {rules.map((rule, index) => (
            <li key={rule.code} className="rounded-lg border p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium">条件 {index + 1}</p>
                  <p className="text-xs text-muted-foreground">
                    内部コード：{rule.code}
                  </p>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={disabled || index === 0}
                    aria-label={`${rule.code}を上へ移動`}
                    onClick={() => moveRule(index, -1)}
                  >
                    <ArrowUpIcon aria-hidden="true" />
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={disabled || index === rules.length - 1}
                    aria-label={`${rule.code}を下へ移動`}
                    onClick={() => moveRule(index, 1)}
                  >
                    <ArrowDownIcon aria-hidden="true" />
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={disabled}
                    aria-label={`${rule.code}を削除`}
                    onClick={() => removeRule(index)}
                  >
                    <Trash2Icon aria-hidden="true" />
                  </Button>
                </div>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor={`${rule.code}-label`}>表示名</Label>
                  <Input
                    id={`${rule.code}-label`}
                    aria-label={`${rule.code}の表示名`}
                    value={rule.label}
                    disabled={disabled}
                    placeholder="例：90日以内"
                    onChange={(event) =>
                      updateRule(index, {
                        label: event.target.value,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`${rule.code}-minimum`}>開始日数</Label>
                  <Input
                    id={`${rule.code}-minimum`}
                    aria-label={`${rule.code}の開始日数`}
                    type="number"
                    min={0}
                    step={1}
                    value={rule.min_days}
                    disabled={disabled}
                    onChange={(event) =>
                      updateRule(index, {
                        min_days: Number(event.target.value),
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`${rule.code}-maximum`}>終了日数</Label>
                  <Input
                    id={`${rule.code}-maximum`}
                    aria-label={`${rule.code}の終了日数`}
                    type="number"
                    min={0}
                    step={1}
                    value={rule.max_days ?? ""}
                    disabled={disabled}
                    placeholder="上限なし"
                    onChange={(event) =>
                      updateRule(index, {
                        max_days:
                          event.target.value === ""
                            ? null
                            : Number(event.target.value),
                      })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    空欄の場合は上限なしです。
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}

      <Button
        type="button"
        variant="outline"
        disabled={disabled}
        onClick={addRule}
      >
        <PlusIcon aria-hidden="true" />
        Recency条件を追加
      </Button>
    </div>
  );
}
