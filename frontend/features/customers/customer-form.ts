import type {
  CreateCustomerRequest,
  Customer,
  CustomerAttributes,
  CustomerKind,
  UpdateCustomerRequest,
} from "./types";

export type CustomerFormValues = {
  customerKind: CustomerKind;

  name: string;
  kana: string;

  postalCode: string;
  address: string;
  phoneNumber: string;
  email: string;
  birthday: string;

  companyName: string;
  companyNameKana: string;
  companyPostalCode: string;
  companyAddress: string;
  companyPhoneNumber: string;
  companyEmail: string;

  memo: string;
};

export const EMPTY_CUSTOMER_FORM_VALUES: CustomerFormValues = {
  customerKind: "individual",

  name: "",
  kana: "",

  postalCode: "",
  address: "",
  phoneNumber: "",
  email: "",
  birthday: "",

  companyName: "",
  companyNameKana: "",
  companyPostalCode: "",
  companyAddress: "",
  companyPhoneNumber: "",
  companyEmail: "",

  memo: "",
};

function nullableValue(value: string) {
  const normalizedValue = value.trim();

  return normalizedValue.length > 0 ? normalizedValue : null;
}

function toCustomerAttributes(values: CustomerFormValues): CustomerAttributes {
  const isCorporate = values.customerKind === "corporate";
  return {
    customer_kind: values.customerKind,

    name: values.name.trim(),
    kana: values.kana.trim(),

    postal_code: nullableValue(values.postalCode),
    address: nullableValue(values.address),
    phone_number: nullableValue(values.phoneNumber),
    email: nullableValue(values.email),
    birthday: nullableValue(values.birthday),

    company_name: isCorporate ? nullableValue(values.companyName) : null,

    company_name_kana: isCorporate
      ? nullableValue(values.companyNameKana)
      : null,

    company_postal_code: isCorporate
      ? nullableValue(values.companyPostalCode)
      : null,

    company_address: isCorporate ? nullableValue(values.companyAddress) : null,

    company_phone_number: isCorporate
      ? nullableValue(values.companyPhoneNumber)
      : null,

    company_email: isCorporate ? nullableValue(values.companyEmail) : null,
    memo: nullableValue(values.memo),
  };
}

export function buildCreateCustomerRequest(
  values: CustomerFormValues,
): CreateCustomerRequest {
  return {
    customer: toCustomerAttributes(values),
  };
}

export function buildUpdateCustomerRequest(
  values: CustomerFormValues,
  lockVersion: number,
): UpdateCustomerRequest {
  return {
    customer: {
      ...toCustomerAttributes(values),
      lock_version: lockVersion,
    },
  };
}

export function customerToFormValues(customer: Customer): CustomerFormValues {
  return {
    customerKind: customer.customer_kind,

    name: customer.name,
    kana: customer.kana,

    postalCode: customer.postal_code ?? "",
    address: customer.address ?? "",
    phoneNumber: customer.phone_number ?? "",
    email: customer.email ?? "",
    birthday: customer.birthday ?? "",

    companyName: customer.company_name ?? "",
    companyNameKana: customer.company_name_kana ?? "",
    companyPostalCode: customer.company_postal_code ?? "",
    companyAddress: customer.company_address ?? "",
    companyPhoneNumber: customer.company_phone_number ?? "",
    companyEmail: customer.company_email ?? "",

    memo: customer.memo ?? "",
  };
}
