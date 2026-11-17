export type InsightCustomer = {
  id: number;
  name: string;
  annual_visits: number;
  last_visit_on: string;
  days_since_visit: number;
  median_interval_days: number | null;
};
export type DashboardAnalytics = {
  period: { current_month: string; year: number; through: string };
  kpis: {
    monthly_reservations: number;
    annual_visits: number;
    new_customers: number;
    returning_customer_count: number;
    monthly_customer_count: number;
    returning_customer_ratio: number | null;
    overdue_customers: number;
  };
  monthly_series: { month: string; reservations: number; visits: number }[];
  rf: null | {
    calculation_run_id: number;
    base_date: string;
    excluded_count: number;
    unmatched_count: number;
    ranks: { id: number; label: string; count: number }[];
  };
  insights: Record<
    "regular" | "overdue" | "new_returning" | "slowing",
    { count: number; customers: InsightCustomer[] }
  >;
};
