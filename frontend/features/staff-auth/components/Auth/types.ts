export type StaffMaster = {
  id: number;
  code: string;
  name: string;
  role_code: string;
};

export type Staff = {
  id: number;
  login_enabled: boolean;
  failed_attempts: number;
  last_logged_in_at: string | null;
  staff_master: StaffMaster;
};

export type LoginStaffRequest = {
  staff: {
    staff_id: number;
    password: string;
  };
};

export type StaffAuthResponse = {
  status: "success";
  data: { staff: Staff };
};

export type LogoutResponse = {
  status: "success";
  data: {
    message: string;
  };
};

export type StaffOption = {
  id: number;
  code: string;
  name: string;
};

export type StaffLoginOptionsResponse = {
  status: "success";
  data: {
    staff_options: StaffOption[];
  };
};
