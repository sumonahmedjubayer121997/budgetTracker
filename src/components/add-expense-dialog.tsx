
"use client";

import { useState, useRef } from "react";
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
  DialogTrigger,
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
import { CalendarIcon, PlusCircle, Paperclip, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useAuth } from "@/hooks/use-auth";
import { addExpense } from "@/lib/firebase/firestore";
import { useToast } from "@/hooks/use-toast";
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

export function AddExpenseDialog() {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { userData } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: new Date(),
      shop: "",
      items: "",
      cost: 0,
    },
  });
  
  const resetForm = () => {
    form.reset({
      date: new Date(),
      shop: "",
      items: "",
      cost: 0,
    });
    setPreview(null);
    if(fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  }


  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!userData || !userData.roomId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "You must be logged in and in a room to add an expense.",
      });
      return;
    }
    setIsLoading(true);
    try {
      await addExpense({
        ...values,
        userId: userData.userId,
        roomId: userData.roomId,
      });
      toast({
        title: "Expense Added",
        description: "Your expense has been successfully recorded.",
      });
      resetForm();
      setOpen(false);
    } catch (error: any) {
      console.error("Error adding expense:", error);
      toast({
        variant: "destructive",
        title: "Error adding expense",
        description: error.message || "There was a problem saving your expense. Please try again.",
        duration: 10000,
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
  }
  
  const handleOpenChange = (isOpen: boolean) => {
    if(!isOpen) {
        resetForm();
    }
    setOpen(isOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Expense
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Expense</DialogTitle>
          <DialogDescription>
            Fill in the details below. Click save when you're done.
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
                {isLoading ? "Saving..." : "Save Expense"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

