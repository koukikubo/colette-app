export type RfStaffSummary = {
  id: number;
  code: string | null;
  name: string | null;
};

export type RfRank = {
  id: number;
  display_code: string;
  label: string;
  display_color: string | null;
};

export type RfListParams = {
  page?: number;
  per_page?: number;
};

export type RfRankOption = Pick<RfRank, "id" | "label"> & {
  display_color?: string | null;
};
