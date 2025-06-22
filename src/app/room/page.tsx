
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { updateUserRoom } from "@/lib/firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Copy, PartyPopper } from "lucide-react";
import { Logo } from "@/components/icons";

const formSchema = z.object({
  roomId: z.string().min(6, { message: "Room ID must be at least 6 characters." }),
});

export default function RoomPage() {
  const { user, refreshUserData } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [newRoomId, setNewRoomId] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      roomId: "",
    },
  });

  const handleCreateRoom = async () => {
    if (!user) return;
    setIsLoading(true);
    const generatedRoomId = "room-" + Math.random().toString(36).substring(2, 10);
    try {
      await updateUserRoom(user.uid, generatedRoomId);
      await refreshUserData();
      setNewRoomId(generatedRoomId);
       toast({
        title: "Room Created!",
        description: "Share the ID with your roommates.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not create a room. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyToClipboard = () => {
    if (!newRoomId) return;
    navigator.clipboard.writeText(newRoomId);
    toast({ title: "Copied!", description: "Room ID copied to clipboard." });
  };
  
  const handleGoToDashboard = () => {
    router.push("/");
  }

  async function onJoinSubmit(values: z.infer<typeof formSchema>) {
    if (!user) return;
    setIsLoading(true);
    try {
      await updateUserRoom(user.uid, values.roomId);
      await refreshUserData();
      toast({
        title: "Success!",
        description: `You have joined room: ${values.roomId}`,
      });
      router.push("/");
    } catch (error) {
       toast({
        variant: "destructive",
        title: "Error Joining Room",
        description: "Could not join the room. Please check the ID and try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-4xl mx-auto">
        <div className="flex justify-center items-center gap-2 mb-8">
            <Logo className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Roommate Expenses</h1>
        </div>
        
        {newRoomId ? (
          <Card className="w-full max-w-md mx-auto text-center">
            <CardHeader>
              <div className="mx-auto bg-primary/20 p-3 rounded-full w-fit">
                <PartyPopper className="h-10 w-10 text-primary" />
              </div>
              <CardTitle className="text-2xl pt-4">Room Created Successfully!</CardTitle>
              <CardDescription>Share this ID with your roommates for them to join.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2 border rounded-lg p-2 bg-muted">
                <p className="text-lg font-mono flex-1 text-center">{newRoomId}</p>
                <Button variant="ghost" size="icon" onClick={handleCopyToClipboard}>
                  <Copy className="h-5 w-5" />
                </Button>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full" onClick={handleGoToDashboard}>Go to Dashboard</Button>
            </CardFooter>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Create a New Room</CardTitle>
                <CardDescription>Start a new expense-sharing group with your roommates.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Click the button below to generate a unique Room ID. Share this ID with others so they can join your room.
                </p>
              </CardContent>
              <CardFooter>
                <Button className="w-full" onClick={handleCreateRoom} disabled={isLoading}>
                  {isLoading ? "Creating..." : "Create Room"}
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Join an Existing Room</CardTitle>
                <CardDescription>If your roommate has already created a room, enter the ID here.</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onJoinSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="roomId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Room ID</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter Room ID" {...field} disabled={isLoading} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? "Joining..." : "Join Room"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
