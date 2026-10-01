import { RfRuleSetEditorPage } from "@/features/rf-management/components/rule-sets/RfRuleSetEditorPage";
import { notFound } from "next/navigation";

type RfRuleSetEditRouteProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function RfRuleSetEditRoute({
  params,
}: RfRuleSetEditRouteProps) {
  const { id } = await params;
  const ruleSetId = Number(id);

  if (!Number.isInteger(ruleSetId) || ruleSetId <= 0) {
    notFound();
  }

  return <RfRuleSetEditorPage ruleSetId={ruleSetId} />;
}
