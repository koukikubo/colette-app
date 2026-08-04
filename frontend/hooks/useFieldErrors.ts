import { useCallback, useState } from "react";

import type { ApiFieldErrors } from "@/lib/api/api-client";

export function useFieldErrors() {
  const [fieldErrors, setFieldErrors] = useState<ApiFieldErrors>({});

  // 指定した項目のエラーだけを削除する関数
  const clearFieldError = useCallback((fieldName: string) => {
    // 現在のエラー情報を元に、新しいエラー情報を作成する
    setFieldErrors((currentErrors) => {
      // 指定項目のエラーを取り除き、それ以外のエラーを取得する
      const remainingErrors = { ...currentErrors };
      delete remainingErrors[fieldName];
      // 指定項目以外のエラーだけを新しいstateとして返す
      return remainingErrors;
    });
  }, []);
  // すべての項目別エラーを削除する関数
  const clearAllFieldErrors = useCallback(() => {
    // 空のオブジェクトを設定してエラーを初期化する
    setFieldErrors({});
  }, []);
  // フォームcpで利用するエラー情報と操作用関数を返す
  return {
    fieldErrors,
    setFieldErrors,
    clearFieldError,
    clearAllFieldErrors,
  };
}
