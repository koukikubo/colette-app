import { LoginFormContainer } from "@/features/staff-auth/components/login/login-form-container";
import { Brand } from "@/features/app-shell/components/brand";

export default function LoginPage() {
  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="flex h-16 shrink-0 items-center bg-card px-6 md:px-10">
        <Brand />
      </header>
      <main className="flex flex-1 items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-md rounded-xl bg-card p-6 sm:p-10">
          <LoginFormContainer />
        </div>
      </main>
    </div>
  );
}
