import type { StaffRoleCode } from "./types";

//画面で毎回条件分岐を書かないように定数化
export const STAFF_ROLE_LABELS: Record<StaffRoleCode, string> = {
  owner: "管理者",
  operator: "一般スタッフ",
  viewer: "閲覧のみ",
};

export const STAFF_ROLE_OPTIONS = [
  {
    value: "owner",
    label: STAFF_ROLE_LABELS.owner,
  },
  {
    value: "operator",
    label: STAFF_ROLE_LABELS.operator,
  },
  {
    value: "viewer",
    label: STAFF_ROLE_LABELS.viewer,
  },
] satisfies ReadonlyArray<{
  value: StaffRoleCode;
  label: string;
}>;
