"use client";

import { useEffect, useState } from "react";

import { ApiClientError } from "@/lib/api/api-client";

import { fetchRfSettings } from "../api/rf-management-api";
import type { RfSettingsResponse } from "../types";

type RfSettings = RfSettingsResponse["data"];

export function useRfSettings() {
  const [settings, setSettings] = useState<RfSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadRfSettings() {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const response = await fetchRfSettings(controller.signal);

        setSettings(response.data);
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        setSettings(null);
        setErrorMessage(
          error instanceof ApiClientError
            ? error.message
            : "RF設定を取得できませんでした。",
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    void loadRfSettings();

    return () => {
      controller.abort();
    };
  }, []);

  return {
    settings,
    isLoading,
    errorMessage,
  };
}
