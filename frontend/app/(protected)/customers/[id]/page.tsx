import { CustomerDetailPageClient } from "@/features/customers/components/CustomerDetailPageClient";

type CustomersDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function CustomersDetailPage({
  params,
}: CustomersDetailPageProps) {
  const { id } = await params;

  return <CustomerDetailPageClient customerId={Number(id)} />;
}
