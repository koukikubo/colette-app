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

type RfCalculationRestoreDialogProps = {
  open: boolean;
  isSubmitting: boolean;
  errorMessage: string | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
};

export function RfCalculationRestoreDialog({
  open,
  isSubmitting,
  errorMessage,
  onOpenChange,
  onConfirm,
}: RfCalculationRestoreDialogProps) {
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
          <AlertDialogTitle>
            この過去のRF計算結果に戻しますか？
          </AlertDialogTitle>
          <AlertDialogDescription>
            現在適用中のRFランクから、選択した履歴の状態へ戻します。計算履歴自体は削除されません。
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
            {isSubmitting ? "復元中..." : "この結果に戻す"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
