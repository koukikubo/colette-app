export const STAFF_ROLE_CODES = ["owner", "operator", "viewer"] as const;

export type StaffRoleCode = (typeof STAFF_ROLE_CODES)[number];

export type StaffLoginInfo = {
  id: number;
  login_enabled: boolean;
  failed_attempts: number;
  last_logged_in_at: string | null;
};

export type StaffMaster = {
  id: number;
  code: string;
  name: string;
  role_code: StaffRoleCode;
  employment_started_on: string;
  retired_on: string | null;
  memo: string | null;
  active: boolean;
  staff: StaffLoginInfo | null;
};

export type StaffMasterListData = {
  staff_masters: StaffMaster[];
};

export type StaffMasterData = {
  staff_master: StaffMaster;
};

export type ApiSuccessResponse<T> = {
  status: "success";
  data: T;
};

export type CreateStaffMasterRequest = {
  staff_master: {
    code: string;
    name: string;
    role_code: StaffRoleCode;
    employment_started_on: string;
    memo: string | null;
  };
  staff: {
    password: string;
    password_confirmation: string;
    login_enabled: boolean;
  };
};

export type UpdateStaffMasterRequest = {
  staff_master: {
    code?: string;
    name?: string;
    role_code?: StaffRoleCode;
    employment_started_on?: string;
    memo?: string | null;
  };
};

export type UpdateLoginEnabledRequest = {
  staff: {
    login_enabled: boolean;
  };
};

export type RetireStaffMasterRequest = {
  staff_master: {
    retired_on: string;
  };
};

export type StaffMasterListResponse = ApiSuccessResponse<StaffMasterListData>;

export type StaffMasterResponse = ApiSuccessResponse<StaffMasterData>;
