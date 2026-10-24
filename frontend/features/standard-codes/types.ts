export type StandardListCode = {
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
  system_key: string;
  display_code: string;
  name: string;
  description: string | null;
  position: number;
  active: boolean;
  items?: StandardListCode[];
};

export type StandardCodeFormValues = {
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
