import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type RfRuleSetDeleteDialogProps = {
  open: boolean;
  ruleSetName: string;
  isSubmitting: boolean;
  errorMessage: string | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
};

export function RfRuleSetDeleteDialog({
  open,
  ruleSetName,
  isSubmitting,
  errorMessage,
  onOpenChange,
  onConfirm,
}: RfRuleSetDeleteDialogProps) {
  return (
    <AlertDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (isSubmitting) return;

        onOpenChange(nextOpen);
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>下書きのRFルールを削除しますか？</AlertDialogTitle>

          <AlertDialogDescription>
            「{ruleSetName}」と、その最終来店日からの期間・来店回数の条件・
            RFランク対応表を削除します。この操作は取り消せません。
          </AlertDialogDescription>
        </AlertDialogHeader>

        {errorMessage && (
          <div
            role="alert"
            className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
          >
            {errorMessage}
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isSubmitting}>戻る</AlertDialogCancel>

          <Button
            type="button"
            variant="destructive"
            disabled={isSubmitting}
            onClick={onConfirm}
          >
            {isSubmitting ? "削除中..." : "削除する"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
