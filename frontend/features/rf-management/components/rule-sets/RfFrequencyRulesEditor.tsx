"use client";

import { ArrowDownIcon, ArrowUpIcon, PlusIcon, Trash2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import type { RfFrequencyRuleInput } from "../../types";
import { RfHelpTooltip } from "./RfHelpTooltip";

type RfFrequencyRulesEditorProps = {
  rules: RfFrequencyRuleInput[];
  disabled?: boolean;
  onChange: (rules: RfFrequencyRuleInput[]) => void;
};

function normalizePositions(rules: RfFrequencyRuleInput[]) {
  return rules.map((rule, index) => ({
    ...rule,
    position: index + 1,
  }));
}

function nextFrequencyCode(rules: RfFrequencyRuleInput[]) {
  const currentNumbers = rules
    .map((rule) => /^F(\d+)$/.exec(rule.code))
    .map((match) => (match ? Number(match[1]) : 0));

  return `F${Math.max(0, ...currentNumbers) + 1}`;
}

export function RfFrequencyRulesEditor({
  rules,
  disabled = false,
  onChange,
}: RfFrequencyRulesEditorProps) {
  function addRule() {
    const previousRule = rules.at(-1);

    const nextMinimum =
      previousRule?.max_visits === null ||
      previousRule?.max_visits === undefined
        ? 0
        : previousRule.max_visits + 1;

    onChange([
      ...rules,
      {
        code: nextFrequencyCode(rules),
        label: "",
        min_visits: nextMinimum,
        max_visits: null,
        position: rules.length + 1,
      },
    ]);
  }

  function updateRule(index: number, changes: Partial<RfFrequencyRuleInput>) {
    onChange(
      rules.map((rule, ruleIndex) =>
        ruleIndex === index ? { ...rule, ...changes } : rule,
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
        <div className="flex items-center gap-1">
          <p className="font-medium">対象期間内の来店回数</p>
          <RfHelpTooltip label="対象期間内の来店回数">
            基本設定で指定した期間内に、来店済みとなった予約の回数でグループを分けます。
          </RfHelpTooltip>
        </div>
        <p className="mt-1 text-muted-foreground">
          0回から順番に、空白や重複がないように回数を分けます。
          最後の条件だけ、最大来店回数を空欄にしてください。
        </p>
      </div>

      {rules.length === 0 ? (
        <div className="rounded-lg border border-dashed p-6 text-center">
          <p className="text-sm text-muted-foreground">
            対象期間内の来店回数がまだ登録されていません。
          </p>
        </div>
      ) : (
        <ol className="space-y-3">
          {rules.map((rule, index) => (
            <li key={rule.code} className="rounded-lg border p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium">条件 {index + 1}</p>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={disabled || index === 0}
                    aria-label={`条件${index + 1}を上へ移動`}
                    onClick={() => moveRule(index, -1)}
                  >
                    <ArrowUpIcon aria-hidden="true" />
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={disabled || index === rules.length - 1}
                    aria-label={`条件${index + 1}を下へ移動`}
                    onClick={() => moveRule(index, 1)}
                  >
                    <ArrowDownIcon aria-hidden="true" />
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={disabled}
                    aria-label={`条件${index + 1}を削除`}
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
                    aria-label={`条件${index + 1}の表示名`}
                    value={rule.label}
                    disabled={disabled}
                    placeholder="例：3回以上"
                    onChange={(event) =>
                      updateRule(index, { label: event.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`${rule.code}-minimum`}>最小来店回数</Label>
                  <Input
                    id={`${rule.code}-minimum`}
                    aria-label={`条件${index + 1}の最小来店回数`}
                    type="number"
                    min={0}
                    step={1}
                    value={rule.min_visits}
                    disabled={disabled}
                    onChange={(event) =>
                      updateRule(index, {
                        min_visits: Number(event.target.value),
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`${rule.code}-maximum`}>最大来店回数</Label>
                  <Input
                    id={`${rule.code}-maximum`}
                    aria-label={`条件${index + 1}の最大来店回数`}
                    type="number"
                    min={0}
                    step={1}
                    value={rule.max_visits ?? ""}
                    disabled={disabled}
                    placeholder="上限なし"
                    onChange={(event) =>
                      updateRule(index, {
                        max_visits:
                          event.target.value === ""
                            ? null
                            : Number(event.target.value),
                      })
                    }
                  />
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
        来店回数の条件を追加
      </Button>
    </div>
  );
}
