import { Languages } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { locale, toggleLocale } = useLanguage();
  const nextLanguage = locale === 'ar' ? 'English' : 'العربية';

  return (
    <Button
      type="button"
      variant="outline"
      size={compact ? 'icon' : 'sm'}
      onClick={toggleLocale}
      title={locale === 'ar' ? 'Switch to English' : 'التبديل إلى العربية'}
      aria-label={locale === 'ar' ? 'Switch to English' : 'التبديل إلى العربية'}
      className="border-primary/25 bg-card/80 text-foreground backdrop-blur-md hover:bg-primary/10 hover:text-primary"
      data-testid="button-language-switcher"
    >
      <Languages className="h-4 w-4" />
      {!compact && <span className="ms-2 font-semibold">{nextLanguage}</span>}
    </Button>
  );
}
