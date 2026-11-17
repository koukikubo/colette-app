export type AutomaticSeatTypeOption = {
  id: number;
  label: string;
  code: "T" | "C";
};

// 表示名の変更や任意の希望席種に影響されず、実席の自動採番区分を判定する。
export function isAutomaticSeatType<T extends { code?: string | null }>(
  option: T,
): option is T & { code: "T" | "C" } {
  return option.code === "T" || option.code === "C";
}
