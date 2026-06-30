import { LoginFormContainer } from "@/features/staff-auth/components/Auth/login-form-container";

export default function LoginPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6 md:p-10">
      <div className="w-full max-w-sm">
        <LoginFormContainer />
      </div>
    </div>
  );
}
