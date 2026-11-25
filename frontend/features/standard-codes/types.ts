export type StandardListCode = {
  // T/C等の読み取り専用の業務コード。追加の希望条件などでは未設定。
  code?: string | null;
  id: number;
  display_code: string;
  label: string;
  description: string | null;
  position: number;
  active: boolean;
  display_color: string | null;
  default_display_color?: string;
};

export type StandardCode = {
  id: number;
  // 利用者が追加した分類には、固定の業務キーを割り当てない。
  system_key: string | null;
  customer_detail_mode?: "none" | "single" | "multiple";
  customer_detail_group?: string | null;
  display_code: string;
  name: string;
  description: string | null;
  position: number;
  active: boolean;
  items?: StandardListCode[];
};

export type StandardCodeFormValues = {
  customer_detail_mode?: "none" | "single" | "multiple";
  customer_detail_group?: string | null;
  name: string;
  description: string | null;
  active: boolean;
};

export type StandardListCodeFormValues = {
  label: string;
  description: string | null;
  active: boolean;
};

export type StandardListCodeUpdateValues =
  Partial<StandardListCodeFormValues> & {
    display_color?: string | null;
  };
