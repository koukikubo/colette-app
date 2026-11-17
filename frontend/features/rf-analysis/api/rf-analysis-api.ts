import { apiFetch } from "@/lib/api/api-client";
import { RfAnalysisResponse } from "../types/analysis";

const RF_ANALYSIS_PATH = "/api/v1/rf_analysis";

export function fetchRfAnalysis(signal?: AbortSignal) {
  return apiFetch<RfAnalysisResponse>(RF_ANALYSIS_PATH, {
    cache: "no-store",
    signal,
  });
}
