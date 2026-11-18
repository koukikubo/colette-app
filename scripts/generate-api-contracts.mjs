import fs from "node:fs";
import path from "node:path";
const root = path.resolve(import.meta.dirname, "..");
const input =
  process.argv[2] ?? path.join(root, "backend/tmp/api-contracts.json");
const output = path.join(root, "frontend/generated/api-contracts.ts");
const { version, samples } = JSON.parse(fs.readFileSync(input, "utf8"));
if (version !== 1 || !Array.isArray(samples) || samples.length === 0)
  throw new Error("Missing fresh Rails contract samples");
const client = (module, member) =>
  `Awaited<ReturnType<typeof import("@/features/${module}").${member}>>`;
const data = (module, name) =>
  `import("@/lib/api/api-client").ApiSuccessResponse<import("@/features/${module}").${name}>`;
const rules = [];
function route(methods, pattern, domain, type) {
  rules.push({
    methods: methods.split("|"),
    regex: new RegExp(`^/api/v1/${pattern}$`),
    domain,
    type,
  });
}
route(
  "GET",
  "dashboard_analytics",
  "dashboard",
  data("dashboard/types", "DashboardAnalytics"),
);
const customers = "customers/api/customer-api";
route(
  "GET",
  "customers/creation_result",
  "customer",
  client(customers, "fetchCustomerCreationResult"),
);
route("GET", "customers", "customer", client(customers, "fetchCustomers"));
route(
  "GET",
  "customers/:id/reservations",
  "customer",
  client(customers, "fetchCustomerReservations"),
);
route("GET", "customers/:id", "customer", client(customers, "fetchCustomer"));
route(
  "POST|PATCH",
  "customers(?:/:id(?:/hidden|/restore)?)?",
  "customer",
  client(customers, "createCustomer"),
);
route(
  "GET",
  "reservation_calendar",
  "reservation",
  data(
    "reservations/components/layouts/displays/ReservationCalendar",
    "ReservationCalendarData",
  ),
);
const reservations = "reservations/api/reservation_api";
route(
  "GET",
  "reservations/creation_result",
  "reservation",
  client(reservations, "fetchReservationCreationResult"),
);
route(
  "GET",
  "reservations",
  "reservation",
  client(reservations, "fetchReservations"),
);
route(
  "GET|POST|PATCH",
  "reservations(?:/:id(?:/cancel|/restore|/complete|/reopen|/confirm_details)?)?",
  "reservation",
  client(reservations, "fetchReservation"),
);
const staff = "staff-masters/api/staff-master-api";
route("GET", "staff_masters", "staff", client(staff, "fetchStaffMasters"));
route(
  "PATCH",
  "staff_masters/:id/password",
  "staff",
  client("staff-auth/api/password-api", "resetPassword"),
);
route(
  "GET|POST|PATCH",
  "staff_masters(?:/:id(?:/retire|/restore|/login_enabled|/reset_failed_attempts|/password)?)?",
  "staff",
  client(staff, "fetchStaffMaster"),
);
const auth = "staff-auth/api/staff-auth-api";
route(
  "GET",
  "staff/login_options",
  "auth",
  client(auth, "fetchStaffLoginOptions"),
);
route(
  "GET|POST",
  "staff/(?:login|current)",
  "auth",
  client(auth, "fetchCurrentStaff"),
);
route("DELETE", "staff/logout", "auth", client(auth, "logoutStaff"));
route(
  "PATCH",
  "staff/password",
  "auth",
  client("staff-auth/api/password-api", "changePassword"),
);
const standard = "standard-codes/api/standard-code-api";
route(
  "GET",
  "standard_masters",
  "standard",
  client(standard, "fetchStandardCodes"),
);
route(
  "GET",
  "standard_masters/:id/items",
  "standard",
  client(standard, "fetchStandardListCodes"),
);
route(
  "GET|POST|PATCH",
  "standard_masters/:id/items(?:/:id)?",
  "standard",
  client(standard, "createStandardListCode"),
);
route(
  "GET|POST|PATCH",
  "standard_masters(?:/:id)?",
  "standard",
  client(standard, "createStandardCode"),
);
const seats = "restaurant-masters/api/restaurant-masters-api";
route(
  "GET",
  "restaurant_masters",
  "restaurant",
  client(seats, "fetchRestaurantMasters"),
);
route(
  "GET|POST|PATCH",
  "restaurant_masters(?:/:id)?",
  "restaurant",
  client(seats, "fetchRestaurantMaster"),
);
route(
  "GET",
  "restaurant_master_availabilities",
  "restaurant",
  client(seats, "fetchRestaurantMasterAvailabilities"),
);
const rf = "rf-management/api/rf-management-api";
route("GET", "rf_settings", "rf", client(rf, "fetchRfSettings"));
route("GET", "rf_calculation_runs", "rf", client(rf, "fetchRfCalculationRuns"));
route(
  "POST",
  "rf_calculation_runs",
  "rf",
  client(rf, "createRfCalculationRun"),
);
route(
  "GET",
  "rf_calculation_runs/:id",
  "rf",
  client(rf, "fetchRfCalculationRun"),
);
route(
  "GET",
  "rf_calculation_runs/:id/results",
  "rf",
  client(rf, "fetchRfCalculationResults"),
);
route(
  "PATCH",
  "rf_calculation_runs/:id/activate",
  "rf",
  client(rf, "activateRfCalculationRun"),
);
route(
  "PATCH",
  "rf_calculation_runs/:id/restore",
  "rf",
  client(rf, "restoreRfCalculationRun"),
);
route("GET", "rf_rule_sets", "rf", client(rf, "fetchRfRuleSets"));
route(
  "POST",
  "rf_rule_sets/:id/validate",
  "rf",
  client(rf, "validateRfRuleSet"),
);
route(
  "GET|POST|PATCH",
  "rf_rule_sets(?:/:id(?:/publish|/archive)?)?",
  "rf",
  client(rf, "fetchRfRuleSet"),
);
route(
  "GET",
  "rf_analysis",
  "rf",
  client("rf-analysis/api/rf-analysis-api", "fetchRfAnalysis"),
);
route(
  "GET",
  "rf_rank_drops",
  "rf",
  client("rf-rank-drops/api/rf-rank-drop-api", "fetchRfRankDrops"),
);
route(
  "GET",
  "rf_rank_drop_predictions",
  "rf",
  'import("@/features/rf-rank-drops/types/rf-rank-drop-prediction").RfRankDropPredictionResponse',
);
route(
  "GET",
  "rf_customer_transitions/compare",
  "rf",
  client(
    "rf-customer-transitions/api/customer-transition-api",
    "fetchRfMonthComparison",
  ),
);
route(
  "GET",
  "rf_customer_transitions/periods",
  "rf",
  client(
    "rf-customer-transitions/api/customer-transition-api",
    "fetchRfComparisonPeriods",
  ),
);
route(
  "GET",
  "rf_customers",
  "rf",
  data(
    "rf-analysis/components/RfCustomerBreakdownPage",
    "RfCustomerBreakdownData",
  ),
);
route(
  "GET",
  "dashboard",
  "dashboard",
  data("dashboard/components/DashboardPage", "Dashboard"),
);
const domains = new Set();
const statuses = new Set();
// 追加フィールドは後方互換。必須キー・値・null・enumを既存の型で厳密に検査する。
let source =
  `// Generated from real Rails request responses. Do not edit.\n` +
  `type Compatible<T> = T extends readonly unknown[] ? { [K in keyof T]: Compatible<T[K]> } : T extends object ? { [K in keyof T]: Compatible<T[K]> } & Record<string, unknown> : T;\n` +
  `type Contract<T> = unknown extends T ? never : Compatible<T>;\n`;
let count = 0;
for (const sample of samples) {
  const { method, path: url, status, body } = sample;
  const rule = rules.find(
    (rule) => rule.methods.includes(method) && rule.regex.test(url),
  );
  let type;
  if (status >= 400) {
    type = 'import("@/lib/api/api-client").ApiErrorResponse';
    statuses.add(status);
  } else if (rule) {
    type = rule.type;
    domains.add(rule.domain);
  } else if (url === "/api/v1/rf_calculation_runs/rollback") {
    // 旧API互換の入口。現在のフロントに呼出元がなく、Rails側のspecで検証する。
    continue;
  } else {
    throw new Error(`Unmapped response: ${method} ${url} (${sample.source})`);
  }
  source += `\n// ${method} ${url} HTTP ${status} — ${sample.source}\nexport const contract${count++}: Contract<${type}> = ${JSON.stringify(body, null, 2)};\n`;
}
for (const required of [
  "customer",
  "reservation",
  "staff",
  "auth",
  "standard",
  "restaurant",
  "rf",
  "dashboard",
]) {
  if (!domains.has(required))
    throw new Error(`Missing Rails contract domain: ${required}`);
}
for (const status of [400, 401, 403, 409, 422]) {
  if (!statuses.has(status))
    throw new Error(`Missing error contract: HTTP ${status}`);
}
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, source);
console.log(
  `Generated ${count} typed Rails contract samples (${[...domains].join(", ")})`,
);
