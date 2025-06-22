
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { reauthenticate } from "@/lib/firebase/auth";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const reauthSchema = z.object({
  password: z.string().min(1, { message: "Password is required." }),
});
const changePasswordSchema = z.object({
    currentPassword: z.string().min(1, "Current password is required."),
    newPassword: z.string().min(6, "New password must be at least 6 characters."),
})
const changeEmailSchema = z.object({
    currentPassword: z.string().min(1, "Password is required."),
    newEmail: z.string().email("Invalid email address."),
})


interface ReauthDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (value?: string, actionType?: 'password' | 'email') => Promise<void>;
  needsPasswordChange?: boolean;
}

export function ReauthDialog({ isOpen, onClose, onConfirm, needsPasswordChange = false }: ReauthDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [actionType, setActionType] = useState<'password' | 'email' | 'reauth'>('reauth');
  
  const formReauth = useForm<z.infer<typeof reauthSchema>>({
      resolver: zodResolver(reauthSchema),
      defaultValues: { password: "" },
  });
  const formChangePassword = useForm<z.infer<typeof changePasswordSchema>>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: "", newPassword: "" },
  });
   const formChangeEmail = useForm<z.infer<typeof changeEmailSchema>>({
    resolver: zodResolver(changeEmailSchema),
    defaultValues: { currentPassword: "", newEmail: "" },
  });


  async function handleReauth(values: z.infer<typeof reauthSchema>) {
    setIsLoading(true);
    const { error } = await reauthenticate(values.password);
    if (error) {
      toast({ variant: "destructive", title: "Authentication Failed", description: "Incorrect password. Please try again." });
    } else {
      await onConfirm();
    }
    setIsLoading(false);
  }
  
  async function handleChangePassword(values: z.infer<typeof changePasswordSchema>) {
    setIsLoading(true);
    const { error } = await reauthenticate(values.currentPassword);
    if (error) {
      toast({ variant: "destructive", title: "Authentication Failed", description: "Incorrect current password." });
    } else {
      await onConfirm(values.newPassword, 'password');
    }
    setIsLoading(false);
  }
  
   async function handleChangeEmail(values: z.infer<typeof changeEmailSchema>) {
    setIsLoading(true);
    const { error } = await reauthenticate(values.currentPassword);
    if (error) {
      toast({ variant: "destructive", title: "Authentication Failed", description: "Incorrect current password." });
    } else {
      await onConfirm(values.newEmail, 'email');
    }
    setIsLoading(false);
  }

  const renderContent = () => {
    if (!needsPasswordChange) {
        return (
            <>
                <DialogHeader>
                    <DialogTitle>Re-authentication Required</DialogTitle>
                    <DialogDescription>For your security, please enter your password to continue.</DialogDescription>
                </DialogHeader>
                <Form {...formReauth}>
                    <form onSubmit={formReauth.handleSubmit(handleReauth)} className="space-y-4">
                        <FormField
                            control={formReauth.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Password</FormLabel>
                                <FormControl>
                                    <Input type="password" {...field} disabled={isLoading} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={onClose} disabled={isLoading}>Cancel</Button>
                            <Button type="submit" disabled={isLoading}>{isLoading ? "Confirming..." : "Confirm"}</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </>
        )
    }

    // Dynamic form for changing password or email
    if (actionType === 'password') {
        return (
             <>
                <DialogHeader>
                    <DialogTitle>Change Your Password</DialogTitle>
                </DialogHeader>
                <Form {...formChangePassword}>
                    <form onSubmit={formChangePassword.handleSubmit(handleChangePassword)} className="space-y-4">
                       <FormField control={formChangePassword.control} name="currentPassword" render={({ field }) => (
                            <FormItem><FormLabel>Current Password</FormLabel><FormControl><Input type="password" {...field} disabled={isLoading} /></FormControl><FormMessage /></FormItem>
                        )}/>
                        <FormField control={formChangePassword.control} name="newPassword" render={({ field }) => (
                            <FormItem><FormLabel>New Password</FormLabel><FormControl><Input type="password" {...field} disabled={isLoading} /></FormControl><FormMessage /></FormItem>
                        )}/>
                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
                            <Button type="submit" disabled={isLoading}>{isLoading ? "Saving..." : "Change Password"}</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </>
        )
    }
    
     if (actionType === 'email') {
        return (
             <>
                <DialogHeader>
                    <DialogTitle>Change Your Email</DialogTitle>
                </DialogHeader>
                <Form {...formChangeEmail}>
                    <form onSubmit={formChangeEmail.handleSubmit(handleChangeEmail)} className="space-y-4">
                       <FormField control={formChangeEmail.control} name="currentPassword" render={({ field }) => (
                            <FormItem><FormLabel>Current Password</FormLabel><FormControl><Input type="password" {...field} disabled={isLoading} /></FormControl><FormMessage /></FormItem>
                        )}/>
                        <FormField control={formChangeEmail.control} name="newEmail" render={({ field }) => (
                            <FormItem><FormLabel>New Email</FormLabel><FormControl><Input type="email" {...field} disabled={isLoading} /></FormControl><FormMessage /></FormItem>
                        )}/>
                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
                            <Button type="submit" disabled={isLoading}>{isLoading ? "Saving..." : "Change Email"}</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </>
        )
    }

    return (
        <>
            <DialogHeader>
                <DialogTitle>Change Security Settings</DialogTitle>
                <DialogDescription>What would you like to update?</DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-4 py-4">
                <Button onClick={() => setActionType('password')}>Change Password</Button>
                <Button onClick={() => setActionType('email')}>Change Email</Button>
            </div>
             <DialogFooter>
                <Button variant="ghost" onClick={onClose}>Cancel</Button>
            </DialogFooter>
        </>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
}
