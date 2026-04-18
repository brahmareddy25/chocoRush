import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getAuthSession, getProfile, loginAccount, logoutAccount, registerAccount, updateProfile } from "../api/auth.js";
import { createAddressRecord, normalizeAddressBook } from "../utils/profile.js";

const AuthContext = createContext(null);
const TAB_AUTH_KEY = "chocorush_customer_tab_auth";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    async function bootstrapAuth() {
      if (window.sessionStorage.getItem(TAB_AUTH_KEY) !== "1") {
        setUser(null);
        setProfile(null);
        setBooting(false);
        return;
      }

      try {
        const session = await getAuthSession();
        setUser(session.user);
        setProfile(session.profile);
      } catch {
        setUser(null);
        setProfile(null);
      } finally {
        setBooting(false);
      }
    }

    bootstrapAuth();
  }, []);

  async function refreshProfile() {
    const response = await getProfile();
    setProfile(response.profile);
    return response.profile;
  }

  async function saveAddresses({ addresses = [], defaultAddressId = "", phone }) {
    if (!user) {
      throw new Error("Login is required.");
    }

    const nextAddresses = normalizeAddressBook(addresses);
    const response = await updateProfile({
      name: profile?.name || user.displayName || "",
      phone,
      addresses: nextAddresses,
      defaultAddressId: defaultAddressId || nextAddresses[0]?.id || "",
    });

    setUser(response.user);
    setProfile(response.profile);
    return response.profile;
  }

  async function upsertAddress({ address, makeDefault = false, phone }) {
    const existingAddresses = normalizeAddressBook(profile?.addresses || []);
    const nextAddress = createAddressRecord(address);
    const matchIndex = existingAddresses.findIndex((item) => item.id === nextAddress.id);
    const nextAddresses =
      matchIndex >= 0
        ? existingAddresses.map((item, index) => (index === matchIndex ? nextAddress : item))
        : existingAddresses.concat(nextAddress);

    return saveAddresses({
      addresses: nextAddresses,
      defaultAddressId: makeDefault ? nextAddress.id : profile?.defaultAddressId || nextAddresses[0]?.id || "",
      phone,
    });
  }

  const value = useMemo(
    () => ({
      user,
      profile,
      booting,
      login: async (email, password) => {
        const response = await loginAccount({ email, password });
        window.sessionStorage.setItem(TAB_AUTH_KEY, "1");
        setUser(response.user);
        setProfile(response.profile);
        return response;
      },
      register: async ({ name, email, password }) => {
        const response = await registerAccount({ name, email, password });
        window.sessionStorage.setItem(TAB_AUTH_KEY, "1");
        setUser(response.user);
        setProfile(response.profile);
        return response;
      },
      refreshProfile,
      updateAccount: async ({ name, phone = "", currentPassword = "", newPassword = "" }) => {
        if (!user) {
          throw new Error("Login is required.");
        }

        const response = await updateProfile({
          name,
          phone,
          currentPassword,
          newPassword,
          addresses: profile?.addresses || [],
          defaultAddressId: profile?.defaultAddressId || "",
        });

        setUser(response.user);
        setProfile(response.profile);
        return response;
      },
      saveAddresses,
      upsertAddress,
      logout: async () => {
        await logoutAccount();
        window.sessionStorage.removeItem(TAB_AUTH_KEY);
        setUser(null);
        setProfile(null);
      },
    }),
    [booting, profile, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
