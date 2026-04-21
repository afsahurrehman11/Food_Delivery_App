import React, {createContext, useState, useContext, useEffect} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {Platform} from 'react-native';

const AuthContext = createContext(null);

// Tab-isolated storage helpers:
// On web we use sessionStorage so each browser tab (admin tab vs rider tab)
// keeps its own session and they never overwrite each other.
// On native, AsyncStorage is per-app so there's no collision.
const SESSION_USER_KEY = 'session_user';
const SESSION_TOKEN_KEY = 'session_access_token';

const sessionSet = async (key, value) => {
  if (Platform.OS === 'web') {
    sessionStorage.setItem(key, value);
  } else {
    await AsyncStorage.setItem(key, value);
  }
};

const sessionGet = async key => {
  if (Platform.OS === 'web') {
    return sessionStorage.getItem(key) || null;
  }
  return AsyncStorage.getItem(key);
};

const sessionRemove = async key => {
  if (Platform.OS === 'web') {
    sessionStorage.removeItem(key);
  } else {
    await AsyncStorage.removeItem(key);
  }
};

export {sessionGet, SESSION_TOKEN_KEY};

export const AuthProvider = ({children}) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await sessionGet(SESSION_USER_KEY);
      if (userData) {
        setUser(JSON.parse(userData));
      }
    } catch (e) {
    } finally {
      setLoading(false);
    }
  };

  const login = async userData => {
    try {
      setUser(userData);
      await sessionSet(SESSION_USER_KEY, JSON.stringify(userData));
      await sessionSet(SESSION_TOKEN_KEY, userData.access_token);
    } catch (e) {
    }
  };

  const logout = async () => {
    try {
      setUser(null);
      await sessionRemove(SESSION_USER_KEY);
      await sessionRemove(SESSION_TOKEN_KEY);
    } catch (e) {
    }
  };

  return (
    <AuthContext.Provider value={{user, loading, login, logout}}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
