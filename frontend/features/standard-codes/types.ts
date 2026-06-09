export type StandardListCode = {
  id: number;
  display_code: string;
  code: string;
  label: string;
  description: string | null;
  position: number;
  active: boolean;
};

export type StandardCode = {
  id: number;
  display_code: string;
  code: string;
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
