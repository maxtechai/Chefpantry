import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  auth,
  googleProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  FirebaseUser,
  AUTHORIZED_ADMIN_EMAIL,
} from '../lib/firebase';
import { migrateGuestDataToUser } from '../lib/guestMigration';

export interface AuthLoginResult {
  success: boolean;
  isAdmin: boolean;
  user?: FirebaseUser;
  error?: string;
}

interface AuthContextType {
  currentUser: FirebaseUser | null;
  isAdmin: boolean;
  userType: 'admin' | 'user' | 'guest';
  adminEmail: string;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
  loginWithGoogle: () => Promise<AuthLoginResult>;
  loginWithEmail: (email: string, pass: string) => Promise<AuthLoginResult>;
  registerWithEmail: (name: string, email: string, pass: string) => Promise<AuthLoginResult>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Derive admin status based on verified email match
  const isAuthorizedEmail = (email?: string | null): boolean => {
    if (!email) return false;
    return email.trim().toLowerCase() === AUTHORIZED_ADMIN_EMAIL.toLowerCase();
  };

  const isAdmin = Boolean(currentUser && isAuthorizedEmail(currentUser.email));
  const userType: 'admin' | 'user' | 'guest' = currentUser
    ? isAdmin
      ? 'admin'
      : 'user'
    : 'guest';

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user && isAuthorizedEmail(user.email)) {
        localStorage.setItem('chefpantry_admin_authenticated', 'true');
      } else if (!user) {
        localStorage.removeItem('chefpantry_admin_authenticated');
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const clearError = () => setError(null);

  // Google One-Click Sign-In with Popup
  const loginWithGoogle = async (): Promise<AuthLoginResult> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      setCurrentUser(user);

      // Transition guest pantry to user cloud account
      migrateGuestDataToUser(user.uid).catch((err) => console.warn('Guest migration error:', err));

      const hasAdminRole = isAuthorizedEmail(user.email);
      if (hasAdminRole) {
        localStorage.setItem('chefpantry_admin_authenticated', 'true');
      }

      setIsLoading(false);
      return {
        success: true,
        isAdmin: hasAdminRole,
        user,
      };
    } catch (err: any) {
      let message = 'Falha ao autenticar com o Google.';
      if (err.code === 'auth/popup-closed-by-user') {
        message = 'A janela de autenticação do Google foi fechada.';
      } else if (err.code === 'auth/cancelled-popup-request') {
        message = 'Requisição de login cancelada.';
      } else if (err.message) {
        message = err.message;
      }
      setError(message);
      setIsLoading(false);
      return { success: false, isAdmin: false, error: message };
    }
  };

  // Email and Password Login
  const loginWithEmail = async (
    emailInput: string,
    passInput: string
  ): Promise<AuthLoginResult> => {
    setIsLoading(true);
    setError(null);
    const cleanEmail = emailInput.trim();

    try {
      let userCredential;
      try {
        userCredential = await signInWithEmailAndPassword(auth, cleanEmail, passInput);
      } catch (signInErr: any) {
        // If user does not exist yet for this project and matches admin, attempt creation
        if (
          (signInErr.code === 'auth/user-not-found' || signInErr.code === 'auth/invalid-credential') &&
          isAuthorizedEmail(cleanEmail)
        ) {
          try {
            userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, passInput);
          } catch (createErr) {
            throw signInErr;
          }
        } else {
          throw signInErr;
        }
      }

      const user = userCredential.user;
      setCurrentUser(user);

      // Transition guest pantry to user cloud account
      migrateGuestDataToUser(user.uid).catch((err) => console.warn('Guest migration error:', err));

      const hasAdminRole = isAuthorizedEmail(user.email);

      if (hasAdminRole) {
        localStorage.setItem('chefpantry_admin_authenticated', 'true');
      }

      setIsLoading(false);
      return {
        success: true,
        isAdmin: hasAdminRole,
        user,
      };
    } catch (err: any) {
      let message = 'Erro ao realizar login.';
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        message = 'Credenciais incorretas. Verifique seu e-mail e senha.';
      } else if (err.code === 'auth/user-not-found') {
        message = 'Usuário não encontrado. Crie sua conta para começar!';
      } else if (err.code === 'auth/weak-password') {
        message = 'A senha deve ter pelo menos 6 caracteres.';
      } else if (err.code === 'auth/invalid-email') {
        message = 'Formato de e-mail inválido.';
      } else if (err.message) {
        message = err.message;
      }
      setError(message);
      setIsLoading(false);
      return { success: false, isAdmin: false, error: message };
    }
  };

  // Register new account with Email and Password
  const registerWithEmail = async (
    nameInput: string,
    emailInput: string,
    passInput: string
  ): Promise<AuthLoginResult> => {
    setIsLoading(true);
    setError(null);
    const cleanEmail = emailInput.trim();

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, passInput);
      const user = userCredential.user;

      if (nameInput.trim()) {
        try {
          await updateProfile(user, { displayName: nameInput.trim() });
        } catch {
          // Profile name non-blocking
        }
      }

      setCurrentUser(user);

      // Transition guest pantry to user cloud account
      migrateGuestDataToUser(user.uid).catch((err) => console.warn('Guest migration error:', err));

      const hasAdminRole = isAuthorizedEmail(user.email);
      if (hasAdminRole) {
        localStorage.setItem('chefpantry_admin_authenticated', 'true');
      }

      setIsLoading(false);
      return {
        success: true,
        isAdmin: hasAdminRole,
        user,
      };
    } catch (err: any) {
      let message = 'Erro ao cadastrar conta.';
      if (err.code === 'auth/email-already-in-use') {
        message = 'Este e-mail já está em uso. Tente fazer login.';
      } else if (err.code === 'auth/weak-password') {
        message = 'A senha precisa ter pelo menos 6 caracteres.';
      } else if (err.code === 'auth/invalid-email') {
        message = 'Formato de e-mail inválido.';
      } else if (err.message) {
        message = err.message;
      }
      setError(message);
      setIsLoading(false);
      return { success: false, isAdmin: false, error: message };
    }
  };

  // Sign out
  const logout = async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
      localStorage.removeItem('chefpantry_admin_authenticated');
    } catch (err: any) {
      console.error('Erro ao sair da conta:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAdmin,
        userType,
        adminEmail: AUTHORIZED_ADMIN_EMAIL,
        isLoading,
        error,
        clearError,
        loginWithGoogle,
        loginWithEmail,
        registerWithEmail,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de um AuthProvider');
  }
  return context;
};
