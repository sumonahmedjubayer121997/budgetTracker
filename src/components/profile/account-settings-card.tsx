
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import {
  updateUserPassword,
  updateUserEmail,
  deleteCurrentUser,
  reauthenticate,
  linkGoogleAccount,
  unlinkGoogleAccount
} from "@/lib/firebase/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Settings, Trash2, KeyRound, Mail, Link as LinkIcon, Unlink } from "lucide-react";
import { ReauthDialog } from "./reauth-dialog";
import { GoogleIcon } from "@/components/icons";

export function AccountSettingsCard() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [actionToConfirm, setActionToConfirm] = useState<(() => Promise<void>) | null>(null);
  const [isReauthOpen, setIsReauthOpen] = useState(false);

  const isPasswordProvider = user?.providerData.some(p => p.providerId === "password");
  const isGoogleProvider = user?.providerData.some(p => p.providerId === "google.com");

  const withReauthentication = (action: () => Promise<void>) => {
    return () => {
      setActionToConfirm(() => action);
      setIsReauthOpen(true);
    };
  };

  const handleChangePassword = async (newPassword: string) => {
    setIsLoading(true);
    const { error } = await updateUserPassword(newPassword);
    if (error) {
      toast({ variant: "destructive", title: "Error", description: `Failed to change password: ${error}` });
    } else {
      toast({ title: "Success", description: "Password changed successfully." });
    }
    setIsLoading(false);
  };
  
  const handleChangeEmail = async (newEmail: string) => {
    setIsLoading(true);
    const { error } = await updateUserEmail(newEmail);
    if (error) {
      toast({ variant: "destructive", title: "Error", description: `Failed to change email: ${error}` });
    } else {
      toast({ title: "Success", description: "Email changed successfully. Please verify your new email." });
    }
    setIsLoading(false);
  };

  const handleDeleteAccount = async () => {
    setIsLoading(true);
    const { error } = await deleteCurrentUser();
    if (error) {
      toast({ variant: "destructive", title: "Error", description: `Failed to delete account: ${error}` });
      setIsLoading(false);
    } else {
      toast({ title: "Account Deleted", description: "Your account has been permanently deleted." });
      router.push("/login");
    }
  };

  const handleLinkGoogle = async () => {
    setIsLoading(true);
    const { error } = await linkGoogleAccount();
    if (error) {
      toast({ variant: "destructive", title: "Linking failed", description: error });
    } else {
      toast({ title: "Success", description: "Google account linked." });
    }
    setIsLoading(false);
  }
  
  const handleUnlinkGoogle = async () => {
    if (user && user.providerData.length === 1) {
        toast({ variant: "destructive", title: "Action not allowed", description: "You cannot unlink your only sign-in method." });
        return;
    }
    setIsLoading(true);
    const { error } = await unlinkGoogleAccount();
     if (error) {
      toast({ variant: "destructive", title: "Unlinking failed", description: error });
    } else {
      toast({ title: "Success", description: "Google account unlinked." });
    }
    setIsLoading(false);
  }

  const handleReauthSuccess = async (password?: string, actionType?: 'password' | 'email') => {
    setIsReauthOpen(false);
    if (actionType === 'password' && password) {
       await handleChangePassword(password);
    }
    if (actionType === 'email' && password) { // 'password' is the new email here
        await handleChangeEmail(password);
    }
    if (actionToConfirm) {
        await actionToConfirm();
        setActionToConfirm(null);
    }
  };


  return (
    <>
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-6 w-6" /> Account Settings
          </CardTitle>
          <CardDescription>Manage your account security and preferences.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
          {isPasswordProvider && (
              <>
                <Button variant="outline" onClick={() => { setActionToConfirm(null); setIsReauthOpen(true); }}>
                    <KeyRound className="mr-2 h-4 w-4" /> Change Password
                </Button>
                <Button variant="outline" onClick={() => { setActionToConfirm(null); setIsReauthOpen(true); }}>
                    <Mail className="mr-2 h-4 w-4" /> Change Email
                </Button>
              </>
          )}

          {!isGoogleProvider ? (
            <Button variant="outline" onClick={handleLinkGoogle} disabled={isLoading}>
                <GoogleIcon className="mr-2 h-4 w-4" /> Link Google Account
            </Button>
          ): (
            <Button variant="outline" onClick={withReauthentication(handleUnlinkGoogle)} disabled={isLoading}>
                <Unlink className="mr-2 h-4 w-4" /> Unlink Google Account
            </Button>
          )}

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="md:col-span-2">
                <Trash2 className="mr-2 h-4 w-4" /> Delete Account
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. All your data, including expenses and room information, will be permanently deleted.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction asChild>
                   <Button variant="destructive" onClick={withReauthentication(handleDeleteAccount)}>
                       I understand, delete my account
                   </Button>
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
      
      {isReauthOpen && (
          <ReauthDialog 
            isOpen={isReauthOpen}
            onClose={() => setIsReauthOpen(false)}
            onConfirm={handleReauthSuccess}
            needsPasswordChange={!actionToConfirm}
          />
      )}
    </>
  );
}
