
"use client";

import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Paperclip, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useAuth } from "@/hooks/use-auth";
import { updateExpense } from "@/lib/firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import type { Expense } from "@/lib/types";
import Image from "next/image";

const formSchema = z.object({
  date: z.date({
    required_error: "A date is required.",
  }),
  shop: z.string().min(2, { message: "Shop name must be at least 2 characters." }),
  items: z.string().min(3, { message: "Item description must be at least 3 characters." }),
  cost: z.coerce.number().min(0.01, { message: "Cost must be a positive number." }),
  receipt: z.instanceof(File).optional(),
});

interface EditExpenseDialogProps {
  expense: Expense;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated: () => void;
}

export function EditExpenseDialog({ expense, open, onOpenChange, onUpdated }: EditExpenseDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { userData } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(expense.imageUrl || null);


  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: expense.date,
      shop: expense.shop,
      items: expense.items,
      cost: expense.cost,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        date: expense.date,
        shop: expense.shop,
        items: expense.items,
        cost: expense.cost,
      });
      setPreview(expense.imageUrl || null);
    }
  }, [open, expense, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!userData) return;
    setIsLoading(true);

    try {
      await updateExpense({
        ...values,
        id: expense.id,
        userId: userData.userId,
        imagePath: expense.imagePath,
      });

      toast({
        title: "Expense Updated",
        description: "Your expense has been successfully updated.",
      });
      onUpdated();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error updating expense:", error);
      toast({
        variant: "destructive",
        title: "Error updating expense",
        description: error.message || "There was a problem saving your expense.",
      });
    } finally {
      setIsLoading(false);
    }
  }
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      form.setValue("receipt", file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleRemoveImage = () => {
    form.setValue("receipt", undefined);
    setPreview(null);
    if(fileInputRef.current) {
        fileInputRef.current.value = "";
    }
    // Note: To fully remove an existing image, we would need to handle this in the submit logic
    // For now, this just removes the newly selected image or clears the preview
    // The backend logic needs to be aware of an intent to delete the image.
    // This is a simplification for now.
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Expense</DialogTitle>
          <DialogDescription>
            Update the details below. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
             <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="shop"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Shop Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., SuperMart" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="items"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Item Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="e.g., Groceries, milk, bread" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="cost"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cost</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="0.00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormItem>
                <FormLabel>Receipt Image (Optional)</FormLabel>
                {preview ? (
                <div className="relative">
                    <Image src={preview} alt="Receipt preview" width={200} height={200} className="rounded-md border"/>
                    <Button type="button" variant="ghost" size="icon" className="absolute top-1 right-1 bg-background/50 hover:bg-background/80" onClick={handleRemoveImage}>
                        <XCircle className="h-5 w-5 text-destructive" />
                    </Button>
                </div>
                ) : (
                <FormControl>
                    <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                        <Paperclip className="mr-2 h-4 w-4" />
                        Attach Image
                        <Input type="file" className="hidden" ref={fileInputRef} onChange={handleFileChange} accept="image/*" />
                    </Button>
                </FormControl>
                )}
                <FormMessage />
            </FormItem>
            <DialogFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

