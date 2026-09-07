import React, { createContext, useContext, useEffect, useState } from 'react';
import { User as FirebaseUser, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut as firebaseSignOut } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { User, OperationType } from '../types';
import { handleFirestoreError } from '../utils';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userData: User | null;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  registerUser: (role: 'worker' | 'company', name: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const docRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            let data = docSnap.data() as User;
            // Auto-upgrade developer email to admin
            if (user.email === 'coppolek@gmail.com' && data.role !== 'admin') {
              try {
                // We use setDoc with merge or updateDoc, but since it's already created:
                const { updateDoc } = await import('firebase/firestore');
                await updateDoc(docRef, { role: 'admin', updatedAt: Date.now() });
                data = { ...data, role: 'admin' };
              } catch (e) {
                console.error("Auto-upgrade to admin failed", e);
              }
            }
            setUserData(data);
          } else {
            setUserData(null);
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
        }
      } else {
        setUserData(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const logout = async () => {
    await firebaseSignOut(auth);
  };

  const registerUser = async (role: 'worker' | 'company', name: string) => {
    if (!currentUser) return;
    try {
      const newUser: User = {
        uid: currentUser.uid,
        email: currentUser.email || '',
        role,
        name,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        ...(role === 'worker' ? { availabilities: [] } : {})
      };
      await setDoc(doc(db, 'users', currentUser.uid), newUser);
      setUserData(newUser);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `users/${currentUser.uid}`);
    }
  };

  return (
    <AuthContext.Provider value={{ currentUser, userData, loading, login, logout, registerUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
