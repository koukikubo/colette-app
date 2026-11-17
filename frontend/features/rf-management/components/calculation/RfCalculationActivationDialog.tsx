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

type RfCalculationActivationDialogProps = {
  open: boolean;
  isSubmitting: boolean;
  errorMessage: string | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
};

export function RfCalculationActivationDialog({
  open,
  isSubmitting,
  errorMessage,
  onOpenChange,
  onConfirm,
}: RfCalculationActivationDialogProps) {
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
          <AlertDialogTitle>このRF計算結果を適用しますか？</AlertDialogTitle>

          <AlertDialogDescription>
            顧客の現在のRFランクが、この計算結果で更新されます。内容を確認してから適用してください。
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

          <Button type="button" disabled={isSubmitting} onClick={onConfirm}>
            {isSubmitting ? "適用中..." : "計算結果を適用"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
