// 個人・法人フラグ
export const CUSTOMER_KINDS = ["individual", "corporate"] as const;

export type CustomerKind = (typeof CUSTOMER_KINDS)[number];

export const CUSTOMER_VISIBILITIES = ["visible", "hidden", "all"] as const;

export type CustomerVisibility = (typeof CUSTOMER_VISIBILITIES)[number];

export type CustomerStaffSummary = {
  id: number;
  code: string | null;
  name: string | null;
};

export type Customer = {
  id: number;
  customer_kind: CustomerKind;

  name: string;
  kana: string;

  postal_code: string | null;
  address: string | null;
  phone_number: string | null;
  email: string | null;
  birthday: string | null;

  company_name: string | null;
  company_name_kana: string | null;
  company_postal_code: string | null;
  company_address: string | null;
  company_phone_number: string | null;
  company_email: string | null;

  memo: string | null;

  hidden: boolean;
  hidden_at: string | null;

  lock_version: number;

  created_by_staff: CustomerStaffSummary | null;
  updated_by_staff: CustomerStaffSummary | null;

  created_at: string;
  updated_at: string;
};

export type CustomerListParams = {
  visibility?: CustomerVisibility;
  customer_kind?: CustomerKind;
  query?: string;
};

export type CustomerAttributes = {
  customer_kind: CustomerKind;

  name: string;
  kana: string;

  postal_code?: string | null;
  address?: string | null;
  phone_number?: string | null;
  email?: string | null;
  birthday?: string | null;

  company_name?: string | null;
  company_name_kana?: string | null;
  company_postal_code?: string | null;
  company_address?: string | null;
  company_phone_number?: string | null;
  company_email?: string | null;

  memo?: string | null;
};

export type CreateCustomerRequest = {
  customer: CustomerAttributes;
};

export type UpdateCustomerRequest = {
  customer: Partial<CustomerAttributes> & {
    lock_version: number;
  };
};

// 非表示・復帰で共通して使用する
export type ChangeCustomerVisibilityRequest = {
  customer: {
    lock_version: number;
  };
};

export type CustomerListData = {
  customers: Customer[];
};

export type CustomerData = {
  customer: Customer;
};

export type ApiSuccessResponse<T> = {
  status: "success";
  data: T;
};

export type ApiErrorResponse = {
  status: "error";
  message: string;
  errors: string[];
};

export type CustomerListResponse = ApiSuccessResponse<CustomerListData>;

export type CustomerResponse = ApiSuccessResponse<CustomerData>;
