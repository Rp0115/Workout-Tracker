// import { onAuthStateChanged, User } from "firebase/auth";
// import { doc, getDoc, updateDoc } from "firebase/firestore";
// import React, { createContext, useContext, useEffect, useState } from "react";
// import { auth, db } from "../firebaseConfig";

// interface AuthContextType {
//   user: User | null;
//   isLoading: boolean;
// }

// const AuthContext = createContext<AuthContextType>({
//   user: null,
//   isLoading: true,
// });

// export const useAuth = () => {
//   return useContext(AuthContext);
// };

// export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
//   const [user, setUser] = useState<User | null>(null);
//   const [isLoading, setIsLoading] = useState(true);

//   useEffect(() => {
//     const unsubscribe = onAuthStateChanged(auth, async (user) => {
//       setUser(user);
//       if (user) {
//         // If a user is logged in, check their Firestore profile
//         const userDocRef = doc(db, "users", user.uid);
//         const userDoc = await getDoc(userDocRef);

//         if (userDoc.exists()) {
//           const userProfile = userDoc.data();
//           // Compare the email in Auth with the one in Firestore
//           if (user.email !== userProfile.email) {
//             // If they are different, update the Firestore document
//             console.log("Emails are out of sync, updating Firestore...");
//             await updateDoc(userDocRef, {
//               email: user.email,
//             });
//           }
//         }
//       }
//       setIsLoading(false);
//     });

//     return () => unsubscribe();
//   }, []);

//   const value = {
//     user,
//     isLoading,
//   };

//   return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
// };

import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import React, { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "../firebaseConfig"; // Ensure this path is correct

// Define the shape of the context data
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
}

// Create the context with the correct initial state
const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true, // App starts in a loading state by default
});

// Provider component that wraps your app
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true); // State to track the initial auth check

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      try {
        // This function runs once when the app starts, and anytime the auth state changes.
        if (fbUser) {
          // User is signed in. Set the user state.
          setUser(fbUser);

          // Sync user data with Firestore
          const userDocRef = doc(db, "users", fbUser.uid);
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists() && fbUser.email !== userDoc.data().email) {
            // If email is out of sync, update it in Firestore
            await updateDoc(userDocRef, { email: fbUser.email });
          }
        } else {
          // User is signed out
          setUser(null);
        }
      } catch (error) {
        console.error("Auth context error:", error);
        // Handle any errors here, perhaps by setting an error state
      } finally {
        // IMPORTANT: No matter what happens, set loading to false after the initial check.
        setIsLoading(false);
      }
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []); // Empty dependency array ensures this effect runs only once on mount

  const value = {
    user,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to easily access the auth state in your components
export const useAuth = () => {
  return useContext(AuthContext);
};
