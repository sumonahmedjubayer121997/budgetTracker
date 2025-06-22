
"use client";

import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Image from "next/image";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { updateUserProfile, updateUserAvatar } from "@/lib/firebase/firestore";
import type { UserProfile } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Edit3, Copy, Camera } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
});

interface UserInfoCardProps {
  user: UserProfile;
}

export function UserInfoCard({ user }: UserInfoCardProps) {
  const { refreshUserData } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: user.name,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      await updateUserProfile(user.userId, { name: values.name });
      await refreshUserData();
      toast({ title: "Success", description: "Your name has been updated." });
      setIsEditing(false);
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to update name." });
    } finally {
      setIsLoading(false);
    }
  }
  
  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      await updateUserAvatar(user.userId, file);
      await refreshUserData();
      toast({ title: "Avatar Updated", description: "Your new profile picture has been saved." });
    } catch (error) {
       toast({ variant: "destructive", title: "Upload Failed", description: "Could not upload the new avatar." });
    } finally {
       setIsUploading(false);
    }
  };

  const handleCopyRoomId = () => {
    if (!user.roomId) return;
    navigator.clipboard.writeText(user.roomId);
    toast({ title: "Copied!", description: "Room ID copied to clipboard." });
  };
  
  const getInitials = (name: string) => {
    const names = name.split(" ");
    return names.length > 1 ? names[0][0] + names[names.length - 1][0] : name.substring(0, 2);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Information</CardTitle>
        <CardDescription>View and edit your personal details.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="relative group">
            <Avatar className="h-20 w-20">
              <AvatarImage src={user.avatarUrl} alt={user.name} />
              <AvatarFallback className="text-2xl">{getInitials(user.name)}</AvatarFallback>
            </Avatar>
            <Button
              variant="ghost"
              size="icon"
              className="absolute inset-0 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              <Camera className="h-6 w-6" />
            </Button>
            <Input 
              type="file" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleAvatarChange} 
              accept="image/*"
              disabled={isUploading}
            />
          </div>
          <div>
            <p className="text-xl font-semibold">{user.name}</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
        </div>

        {isEditing ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={isLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex gap-2">
                <Button type="submit" disabled={isLoading}>{isLoading ? "Saving..." : "Save"}</Button>
                <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
              </div>
            </form>
          </Form>
        ) : (
          <div className="pt-4">
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
              <Edit3 className="mr-2 h-4 w-4" /> Edit Name
            </Button>
          </div>
        )}
        
        {user.roomId && (
          <div className="space-y-2 pt-4">
            <Label>Room ID</Label>
            <div className="flex items-center space-x-2 border rounded-md p-2 bg-muted">
                <p className="text-sm font-mono flex-1 truncate">{user.roomId}</p>
                <Button variant="ghost" size="icon" onClick={handleCopyRoomId}>
                  <Copy className="h-4 w-4" />
                </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
