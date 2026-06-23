"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

type Currency = "BDT" | "EUR";

interface CurrencyContextType {
  currency: Currency;
  toggleCurrency: () => void;
  setCurrency: (c: Currency) => void;
  convertPrice: (bdtPrice: number) => number;
  formatPrice: (bdtPrice: number) => string;
  symbol: string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

const EXCHANGE_RATE = 118; // 1 EUR ≈ 118 BDT (approximate)
const STORAGE_KEY = "nextup.currency";

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>("BDT");

  // Hydrate from localStorage so the choice persists across navigation.
  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === "BDT" || saved === "EUR") setCurrencyState(saved);
  }, []);

  const setCurrency = (c: Currency) => {
    setCurrencyState(c);
    window.localStorage.setItem(STORAGE_KEY, c);
  };

  const toggleCurrency = () => setCurrency(currency === "BDT" ? "EUR" : "BDT");

  const convertPrice = (bdtPrice: number): number =>
    currency === "EUR" ? Math.round(bdtPrice / EXCHANGE_RATE) : bdtPrice;

  const symbol = currency === "BDT" ? "৳" : "€";

  const formatPrice = (bdtPrice: number): string =>
    `${symbol} ${convertPrice(bdtPrice).toLocaleString()}`;

  return (
    <CurrencyContext.Provider
      value={{ currency, toggleCurrency, setCurrency, convertPrice, formatPrice, symbol }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
}
