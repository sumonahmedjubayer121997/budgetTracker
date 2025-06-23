
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { leaveRoom } from "@/lib/firebase/firestore";
import type { UserProfile } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Users, LogOut, Link as LinkIcon, DoorOpen } from "lucide-react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

interface RoomInfoCardProps {
  user: UserProfile;
}

export function RoomInfoCard({ user }: RoomInfoCardProps) {
    const router = useRouter();
    const { refreshUserData } = useAuth();
    const { toast } = useToast();
    const [roommates, setRoommates] = useState<UserProfile[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!user.roomId) return;
        const usersQuery = query(collection(db, "users"), where("roomId", "==", user.roomId));
        const unsubscribe = onSnapshot(usersQuery, (querySnapshot) => {
            const roommatesData = querySnapshot.docs.map(doc => ({ userId: doc.id, ...doc.data() })) as UserProfile[];
            setRoommates(roommatesData);
        });
        return () => unsubscribe();
    }, [user.roomId]);

    const handleLeaveRoom = async () => {
        setIsLoading(true);
        try {
            await leaveRoom(user.userId);
            await refreshUserData();
            toast({ title: "You've left the room", description: "You can now join or create a new one." });
            router.push('/room');
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Failed to leave the room." });
        } finally {
            setIsLoading(false);
        }
    }
    
    const getInitials = (name: string) => {
        const names = name.split(" ");
        return names.length > 1 ? names[0][0] + names[names.length - 1][0] : name.substring(0, 2);
    };

    if (!user.roomId) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><DoorOpen className="h-6 w-6"/> No Room Joined</CardTitle>
                    <CardDescription>You are not currently in a room.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">Join an existing room or create a new one to start sharing expenses with roommates.</p>
                </CardContent>
                <CardFooter>
                    <Button asChild className="w-full">
                        <a href="/room">Join or Create Room</a>
                    </Button>
                </CardFooter>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Users className="h-6 w-6" /> Roommates
                </CardTitle>
                <CardDescription>Manage your shared room and members.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <p className="text-sm font-medium">Members in your room:</p>
                <div className="space-y-3">
                    {roommates.map(member => (
                        <div key={member.userId} className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                                <AvatarImage src={member.avatarUrl} alt={member.name} />
                                <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-medium text-sm">{member.name}</p>
                                <p className="text-xs text-muted-foreground">{member.email}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-2 items-stretch">
                 <Button variant="outline">
                    <LinkIcon className="mr-2 h-4 w-4"/> Invite Roommate (Coming Soon)
                 </Button>
                 <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive" disabled={isLoading}>
                            <LogOut className="mr-2 h-4 w-4"/> Leave Room
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure you want to leave?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This action cannot be undone. You will lose access to all shared expenses in this room.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleLeaveRoom} disabled={isLoading}>
                                {isLoading ? "Leaving..." : "Leave"}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </CardFooter>
        </Card>
    );
}
