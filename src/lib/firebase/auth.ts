
"use client";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  updateProfile,
  reauthenticateWithCredential,
  EmailAuthProvider,
  updatePassword,
  updateEmail,
  deleteUser,
  linkWithPopup,
  unlink,
} from "firebase/auth";
import { auth } from "./config";
import { addUser, getUser, updateUserProfile } from "./firestore";

export async function signUp(name: string, email: string, password: string) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    await updateProfile(user, { displayName: name });

    // We pass an empty avatarUrl which can be updated later
    await addUser({
      userId: user.uid,
      name,
      email,
      roomId: null,
      avatarUrl: "", 
    });
    return { user, error: null };
  } catch (error: any) {
    return { user: null, error: error.message };
  }
}

export async function signIn(email: string, password: string) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { user: userCredential.user, error: null };
  } catch (error: any) {
    return { user: null, error: error.message };
  }
}

export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    const userDoc = await getUser(user.uid);

    if (!userDoc) {
      await addUser({
        userId: user.uid,
        name: user.displayName || "Anonymous",
        email: user.email!,
        roomId: null,
        avatarUrl: user.photoURL || "",
      });
    } else if (!userDoc.avatarUrl && user.photoURL) {
      // If user exists but has no avatar, update it from Google
      await updateUserProfile(user.uid, { avatarUrl: user.photoURL });
    }

    return { user, error: null };
  } catch (error: any) {
    return { user: null, error: error.message };
  }
}

export async function signOutUser() {
  await signOut(auth);
}


// Sensitive account actions

export async function reauthenticate(password: string) {
  const user = auth.currentUser;
  if (!user || !user.email) return { error: "No user found or user has no email." };
  
  const credential = EmailAuthProvider.credential(user.email, password);
  try {
    await reauthenticateWithCredential(user, credential);
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateUserPassword(newPassword: string) {
  const user = auth.currentUser;
  if (!user) return { error: "You must be logged in to change your password." };

  try {
    await updatePassword(user, newPassword);
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateUserEmail(newEmail: string) {
  const user = auth.currentUser;
  if (!user) return { error: "You must be logged in to change your email." };

  try {
    await updateEmail(user, newEmail);
    // Also update email in Firestore
    await updateUserProfile(user.uid, { email: newEmail });
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteCurrentUser() {
  const user = auth.currentUser;
  if (!user) return { error: "No user to delete." };

  try {
    await deleteUser(user);
    // Note: Deleting user data from Firestore/Storage should be handled by a Cloud Function for security.
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}


// Provider linking
export async function linkGoogleAccount() {
    const user = auth.currentUser;
    if (!user) return { error: "You must be logged in." };
    const provider = new GoogleAuthProvider();
    try {
        await linkWithPopup(user, provider);
        // Update profile with Google avatar if not set
        if (!user.photoURL && provider) {
            const result = await signInWithPopup(auth, provider);
            await updateUserProfile(user.uid, { avatarUrl: result.user.photoURL });
        }
        return { success: true, error: null };
    } catch(error: any) {
        return { success: false, error: error.message };
    }
}

export async function unlinkGoogleAccount() {
    const user = auth.currentUser;
    if (!user) return { error: "You must be logged in." };
    try {
        await unlink(user, "google.com");
        return { success: true, error: null };
    } catch(error: any) {
        return { success: false, error: error.message };
    }
}
