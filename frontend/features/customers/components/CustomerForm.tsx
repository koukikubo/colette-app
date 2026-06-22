"use client";

import type { FormEventHandler } from "react";
import { CircleAlertIcon } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";

import type { CustomerFormValues } from "../customer-form";
import type { CustomerKind } from "../types";

type CustomerFormProps = {
  formId: string;
  values: CustomerFormValues;
  errors?: string[];
  disabled?: boolean;
  onChange: (values: CustomerFormValues) => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
};

function isCustomerKind(value: string): value is CustomerKind {
  return value === "individual" || value === "corporate";
}

export function CustomerForm({
  formId,
  values,
  errors = [],
  disabled = false,
  onChange,
  onSubmit,
}: CustomerFormProps) {
  function updateField<K extends keyof CustomerFormValues>(
    field: K,
    value: CustomerFormValues[K],
  ) {
    onChange({
      ...values,
      [field]: value,
    });
  }

  function handleCustomerKindChange(value: string) {
    if (!isCustomerKind(value)) {
      return;
    }

    updateField("customerKind", value);
  }

  function fieldId(field: keyof CustomerFormValues) {
    return `${formId}-${field}`;
  }

  const isCorporate = values.customerKind === "corporate";

  return (
    <form id={formId} className="space-y-6" onSubmit={onSubmit}>
      {errors.length > 0 && (
        <Alert variant="destructive">
          <CircleAlertIcon />

          <AlertTitle>入力内容を確認してください</AlertTitle>

          <AlertDescription>
            <ul className="list-disc space-y-1 pl-5">
              {errors.map((error, index) => (
                <li key={`${error}-${index}`}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <fieldset disabled={disabled} className="space-y-6">
        <section className="space-y-4">
          <div>
            <h3 className="font-medium">顧客区分</h3>

            <p className="text-sm text-muted-foreground">
              個人顧客または法人顧客を選択してください。
            </p>
          </div>

          <RadioGroup
            value={values.customerKind}
            onValueChange={handleCustomerKindChange}
            className="flex flex-wrap gap-6"
          >
            <div className="flex items-center gap-2">
              <RadioGroupItem id={fieldId("customerKind")} value="individual" />

              <Label htmlFor={fieldId("customerKind")}>個人</Label>
            </div>

            <div className="flex items-center gap-2">
              <RadioGroupItem
                id={`${fieldId("customerKind")}-corporate`}
                value="corporate"
              />

              <Label htmlFor={`${fieldId("customerKind")}-corporate`}>
                法人
              </Label>
            </div>
          </RadioGroup>
        </section>

        <section className="space-y-4 border-t pt-6">
          <div>
            <h3 className="font-medium">基本情報</h3>

            <p className="text-sm text-muted-foreground">
              顧客を識別するための基本情報を入力します。
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor={fieldId("name")}>
                顧客名
                <span className="ml-1 text-destructive" aria-hidden="true">
                  *
                </span>
              </Label>

              <Input
                id={fieldId("name")}
                value={values.name}
                onChange={(event) => updateField("name", event.target.value)}
                placeholder="例：浅井 太郎"
                maxLength={30}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={fieldId("kana")}>
                フリガナ
                <span className="ml-1 text-destructive" aria-hidden="true">
                  *
                </span>
              </Label>

              <Input
                id={fieldId("kana")}
                value={values.kana}
                onChange={(event) => updateField("kana", event.target.value)}
                placeholder="例：アサイ タロウ"
                maxLength={30}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={fieldId("birthday")}>生年月日</Label>

              <Input
                id={fieldId("birthday")}
                type="date"
                value={values.birthday}
                onChange={(event) =>
                  updateField("birthday", event.target.value)
                }
              />
            </div>
          </div>
        </section>

        <section className="space-y-4 border-t pt-6">
          <div>
            <h3 className="font-medium">連絡先</h3>

            <p className="text-sm text-muted-foreground">
              電話番号・メールアドレス・住所を入力します。
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor={fieldId("phoneNumber")}>電話番号</Label>

              <Input
                id={fieldId("phoneNumber")}
                type="tel"
                inputMode="tel"
                value={values.phoneNumber}
                onChange={(event) =>
                  updateField("phoneNumber", event.target.value)
                }
                placeholder="例：090-1234-5678"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={fieldId("email")}>メールアドレス</Label>

              <Input
                id={fieldId("email")}
                type="email"
                value={values.email}
                onChange={(event) => updateField("email", event.target.value)}
                placeholder="例：customer@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={fieldId("postalCode")}>郵便番号</Label>

              <Input
                id={fieldId("postalCode")}
                inputMode="numeric"
                value={values.postalCode}
                onChange={(event) =>
                  updateField("postalCode", event.target.value)
                }
                placeholder="例：530-0001"
                maxLength={8}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor={fieldId("address")}>住所</Label>

              <Input
                id={fieldId("address")}
                value={values.address}
                onChange={(event) => updateField("address", event.target.value)}
                placeholder="例：大阪府大阪市北区梅田1-1-1"
              />
            </div>
          </div>
        </section>

        {isCorporate && (
          <section className="space-y-4 border-t pt-6">
            <div>
              <h3 className="font-medium">法人情報</h3>

              <p className="text-sm text-muted-foreground">
                法人として管理する情報を入力します。
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor={fieldId("companyName")}>法人名</Label>

                <Input
                  id={fieldId("companyName")}
                  value={values.companyName}
                  onChange={(event) =>
                    updateField("companyName", event.target.value)
                  }
                  placeholder="例：株式会社浅井"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={fieldId("companyNameKana")}>法人名カナ</Label>

                <Input
                  id={fieldId("companyNameKana")}
                  value={values.companyNameKana}
                  onChange={(event) =>
                    updateField("companyNameKana", event.target.value)
                  }
                  placeholder="例：カブシキガイシャアサイ"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={fieldId("companyPhoneNumber")}>
                  法人電話番号
                </Label>

                <Input
                  id={fieldId("companyPhoneNumber")}
                  type="tel"
                  inputMode="tel"
                  value={values.companyPhoneNumber}
                  onChange={(event) =>
                    updateField("companyPhoneNumber", event.target.value)
                  }
                  placeholder="例：06-1234-5678"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={fieldId("companyEmail")}>
                  法人メールアドレス
                </Label>

                <Input
                  id={fieldId("companyEmail")}
                  type="email"
                  value={values.companyEmail}
                  onChange={(event) =>
                    updateField("companyEmail", event.target.value)
                  }
                  placeholder="例：info@example.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={fieldId("companyPostalCode")}>
                  法人郵便番号
                </Label>

                <Input
                  id={fieldId("companyPostalCode")}
                  inputMode="numeric"
                  value={values.companyPostalCode}
                  onChange={(event) =>
                    updateField("companyPostalCode", event.target.value)
                  }
                  placeholder="例：530-0001"
                  maxLength={8}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor={fieldId("companyAddress")}>法人住所</Label>

                <Input
                  id={fieldId("companyAddress")}
                  value={values.companyAddress}
                  onChange={(event) =>
                    updateField("companyAddress", event.target.value)
                  }
                  placeholder="例：大阪府大阪市北区梅田1-1-1"
                />
              </div>
            </div>
          </section>
        )}

        <section className="space-y-4 border-t pt-6">
          <div>
            <h3 className="font-medium">メモ</h3>

            <p className="text-sm text-muted-foreground">
              顧客対応時に共有したい情報を入力します。
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor={fieldId("memo")}>顧客メモ</Label>

            <Textarea
              id={fieldId("memo")}
              value={values.memo}
              onChange={(event) => updateField("memo", event.target.value)}
              placeholder="アレルギー、好み、対応時の注意事項など"
              rows={4}
            />
          </div>
        </section>
      </fieldset>
    </form>
  );
}
