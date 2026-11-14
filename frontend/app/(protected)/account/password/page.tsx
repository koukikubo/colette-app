import { PasswordForm } from "@/features/staff-auth/components/session/PasswordForm";
export default function PasswordPage() {
  return (
    <main className="space-y-4 p-6">
      <h1 className="text-2xl font-semibold">パスワード変更</h1>
      <PasswordForm />
    </main>
  );
}
