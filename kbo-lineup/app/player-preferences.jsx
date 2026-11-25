'use client';
import {createContext,useContext,useMemo} from 'react';
const Preferences=createContext({locked:new Set(),favorites:new Set()});
export function PlayerPreferencesProvider({lockedIds,favoriteIds,children}){const value=useMemo(()=>({locked:new Set(lockedIds||[]),favorites:new Set(favoriteIds||[])}),[lockedIds,favoriteIds]);return <Preferences.Provider value={value}>{children}</Preferences.Provider>;}
export const usePlayerPreferences=()=>useContext(Preferences);
