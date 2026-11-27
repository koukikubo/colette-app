import { PageHeading } from "@/components/common/page-heading";
import { PasswordForm } from "@/features/staff-auth/components/session/PasswordForm";
export default function PasswordPage() {
  return (
    <div className="space-y-4 p-6">
      <PageHeading>パスワード変更</PageHeading>
      <PasswordForm />
    </div>
  );
}
