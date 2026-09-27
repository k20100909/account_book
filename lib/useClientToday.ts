"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

const getClientToday = () => {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
};

const getServerToday = () => new Date().toISOString().slice(0, 10);

export const useClientToday = () =>
  useSyncExternalStore(subscribe, getClientToday, getServerToday);
