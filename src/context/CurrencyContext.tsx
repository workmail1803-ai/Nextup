"use client";

import { createContext, useContext, useState, ReactNode } from "react";

type Currency = "BDT" | "EUR";

interface CurrencyContextType {
    currency: Currency;
    toggleCurrency: () => void;
    convertPrice: (bdtPrice: number) => number;
    formatPrice: (bdtPrice: number) => string;
    symbol: string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

const EXCHANGE_RATE = 118; // 1 EUR = 118 BDT (approximate)

export function CurrencyProvider({ children }: { children: ReactNode }) {
    const [currency, setCurrency] = useState<Currency>("BDT");

    const toggleCurrency = () => {
        setCurrency((prev) => (prev === "BDT" ? "EUR" : "BDT"));
    };

    const convertPrice = (bdtPrice: number): number => {
        if (currency === "EUR") {
            return Math.round(bdtPrice / EXCHANGE_RATE);
        }
        return bdtPrice;
    };

    const formatPrice = (bdtPrice: number): string => {
        const converted = convertPrice(bdtPrice);
        const symbol = currency === "BDT" ? "৳" : "€";
        return `${symbol} ${converted.toLocaleString()}`;
    };

    const symbol = currency === "BDT" ? "৳" : "€";

    return (
        <CurrencyContext.Provider
            value={{ currency, toggleCurrency, convertPrice, formatPrice, symbol }}
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
