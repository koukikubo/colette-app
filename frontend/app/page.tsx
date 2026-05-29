import { Button } from "@/features/staff-auth/components/ui/button";

export default async function Home() {
  const response = await fetch(
    `http://localhost:3010/api/v1/health`,

    {
      cache: "no-store",
    },
  );

  const data = await response.json();
  return (
    <main className="flex min-h-screen items-center justify-center">
      <p>Welcome to COLETTE</p>
      <Button>COLETTE</Button>
      <p>{data.status}</p>
    </main>
  );
}
