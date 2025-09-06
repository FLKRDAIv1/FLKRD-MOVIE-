"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage, SUPPORTED_LANGUAGES } from '@/lib/language';

interface LanguageSelectorProps {
  compact?: boolean;
}

export const LanguageSelector = ({ compact = false }: LanguageSelectorProps) => {
  const { t, currentLanguage, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const handleLanguageChange = (languageCode: string) => {
    setLanguage(languageCode as any);
    setIsOpen(false);
  };

  const currentConfig = SUPPORTED_LANGUAGES[currentLanguage];

  if (compact) {
    return (
      <div className="relative">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 glass-button hover:glass-lift"
          onClick={() => setIsOpen(!isOpen)}
        >
          <Globe className="w-4 h-4 text-muted-foreground" />
        </Button>

        <AnimatePresence>
          {isOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsOpen(false)}
              />
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute bottom-full right-0 mb-2 z-50 glass-card min-w-48 max-h-64 overflow-y-auto"
              >
                <div className="p-2">
                  <div className="text-xs font-medium text-muted-foreground px-3 py-2 mb-1">
                    {t('nav.language')}
                  </div>
                  {Object.entries(SUPPORTED_LANGUAGES).map(([code, config]) => (
                    <button
                      key={code}
                      onClick={() => handleLanguageChange(code)}
                      className={`
                        w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors text-left
                        ${currentLanguage === code 
                          ? 'glass-panel text-accent-foreground' 
                          : 'hover:bg-muted/50'
                        }
                      `}
                    >
                      <span className="text-base">{config.flag}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{config.nativeName}</div>
                        <div className="text-xs text-muted-foreground truncate">{config.name}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="relative group">
      <Button
        variant="ghost"
        size="lg"
        className="w-12 h-12 p-0 glass-button hover:glass-lift"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Globe className="w-5 h-5 text-muted-foreground" />
      </Button>

      {/* Tooltip */}
      <div className="absolute left-16 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        <div className="glass-panel px-3 py-1.5 text-sm font-medium whitespace-nowrap">
          {t('nav.language')}
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, x: 10, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 10, scale: 0.95 }}
              className="absolute left-full top-0 ml-2 z-50 glass-card min-w-64 max-h-96 overflow-y-auto"
            >
              <div className="p-3">
                <div className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  {t('nav.language')}
                </div>
                
                <div className="space-y-1">
                  {Object.entries(SUPPORTED_LANGUAGES).map(([code, config]) => (
                    <button
                      key={code}
                      onClick={() => handleLanguageChange(code)}
                      className={`
                        w-full flex items-center gap-3 px-3 py-3 text-sm rounded-xl transition-all duration-200 text-left
                        ${currentLanguage === code 
                          ? 'glass-panel text-accent-foreground shadow-accent/20' 
                          : 'hover:bg-muted/50 hover:glass-lift'
                        }
                      `}
                    >
                      <span className="text-xl">{config.flag}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold truncate">{config.nativeName}</div>
                        <div className="text-xs text-muted-foreground truncate">{config.name}</div>
                        <div className="text-xs text-muted-foreground/80 truncate">{config.region}</div>
                      </div>
                      {currentLanguage === code && (
                        <div className="w-2 h-2 bg-accent rounded-full" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};