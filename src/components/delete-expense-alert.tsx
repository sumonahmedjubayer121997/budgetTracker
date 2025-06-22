
"use client";

import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { deleteExpense } from "@/lib/firebase/firestore";
import { Button } from "./ui/button";

interface DeleteExpenseAlertProps {
  expenseId: string;
  imagePath?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted: () => void;
}

export function DeleteExpenseAlert({
  expenseId,
  imagePath,
  open,
  onOpenChange,
  onDeleted,
}: DeleteExpenseAlertProps) {
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteExpense(expenseId, imagePath);
      toast({
        title: "Expense Deleted",
        description: "The expense has been successfully deleted.",
      });
      onOpenChange(false);
      onDeleted();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error Deleting Expense",
        description: error.message || "There was a problem deleting the expense.",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete this
            expense and any associated receipt image.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button onClick={handleDelete} disabled={isDeleting} variant="destructive">
                {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
