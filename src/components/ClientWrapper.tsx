"use client";

import React from 'react';
import { LanguageProvider } from '@/lib/language';
import { Toaster } from '@/components/ui/sonner';

interface ClientProvidersProps {
  children: React.ReactNode;
}

export const ClientProviders: React.FC<ClientProvidersProps> = ({ children }) => {
  return (
    <LanguageProvider>
      {children}
      <Toaster 
        position="bottom-center"
        expand={false}
        richColors
        closeButton
        className="sonner-toast"
      />
    </LanguageProvider>
  );
};