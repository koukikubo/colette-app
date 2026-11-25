import { CustomerDetailPageClient } from "@/features/customers/components/detail/CustomerDetailPageClient";

type CustomersDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function CustomersDetailPage({
  params,
}: CustomersDetailPageProps) {
  const { id } = await params;

  return <CustomerDetailPageClient key={id} customerId={Number(id)} />;
}
