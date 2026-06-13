"use client";

import { cn } from "@/lib/utils";

import { FormEvent, useState } from "react";
import { loginStaff } from "./api/staff-auth-api";
import { ApiClientError } from "@/lib/api/api-client";
import { useRouter } from "next/navigation";
import { Button } from "../../../../components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "../../../../components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../../components/ui/select";
import { Input } from "../../../../components/ui/input";
import { useAuth } from "../../hooks/use-auth";

type StaffOption = {
  id: number;
  name: string;
};

type LoginFormProps = React.ComponentProps<"div"> & {
  staffOptions?: StaffOption[];
};

const temporaryStaffOptions: StaffOption[] = [{ id: 1, name: "オーナー" }];

export function LoginForm({
  className,
  staffOptions = temporaryStaffOptions,
  ...props
}: LoginFormProps) {
  const router = useRouter();

  const [staffId, setStaffId] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { refreshCurrentStaff } = useAuth();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErrorMessage("");

    if (!staffId) {
      setErrorMessage("担当者を選択してください。");
      return;
    }

    if (!password) {
      setErrorMessage("パスワードを入力してください。");
      return;
    }

    try {
      setIsSubmitting(true);

      await loginStaff({
        staff: {
          staff_id: Number(staffId),
          password,
        },
      });

      await refreshCurrentStaff();

      router.replace("/dashboard");
    } catch (error) {
      if (error instanceof ApiClientError) {
        setErrorMessage(error.message);
        return;
      }

      setErrorMessage(
        "ログインに失敗しました。時間をおいて再度お試しください。",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <form onSubmit={handleSubmit}>
        <FieldGroup>
          <div className="flex flex-col items-center gap-2 text-center">
            <h1 className="text-xl font-bold">システムログイン画面</h1>
            <p className="text-muted-foreground text-sm">
              担当者を選択し、パスワードを入力してください。
            </p>
          </div>

          <Field>
            <FieldLabel htmlFor="staff-id">担当者</FieldLabel>
            <Select
              value={staffId}
              onValueChange={setStaffId}
              disabled={isSubmitting}
            >
              <SelectTrigger id="staff-id" className="w-full">
                <SelectValue placeholder="担当者を選択してください" />
              </SelectTrigger>
              <SelectContent>
                {staffOptions.map((staff) => (
                  <SelectItem key={staff.id} value={String(staff.id)}>
                    {staff.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <FieldLabel htmlFor="password">パスワード</FieldLabel>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="パスワードを入力してください"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={isSubmitting}
              required
            />
          </Field>

          {errorMessage ? (
            <p className="text-destructive text-sm">{errorMessage}</p>
          ) : null}

          <Field>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "ログイン中..." : "ログイン"}
            </Button>
          </Field>

          <FieldDescription className="text-center">
            <button
              type="button"
              className="underline underline-offset-4"
              onClick={() =>
                setErrorMessage(
                  "パスワードリセット機能は後続実装予定です。管理者へお問い合わせください。",
                )
              }
            >
              パスワードをお忘れの方はこちら
            </button>
          </FieldDescription>
        </FieldGroup>
      </form>
    </div>
  );
}
