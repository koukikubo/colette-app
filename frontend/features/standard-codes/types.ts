export type StandardListCode = {
  id: number;
  code: string;
  label: string;
  position: number;
  active: boolean;
};

export type StandardCode = {
  id: number;
  code: string;
  name: string;
  position: number;
  active: boolean;
  items?: StandardListCode[];
};

export type StandardCodeFormValues = {
  code: string;
  name: string;
  position: number;
  active: boolean;
};

export type StandardListCodeFormValues = {
  code: string;
  label: string;
  position: number;
  active: boolean;
};
