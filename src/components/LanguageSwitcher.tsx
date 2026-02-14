import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";

const LanguageSwitcher = () => {
  const { lang, setLang } = useLanguage();

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => setLang(lang === "ar" ? "en" : "ar")}
      className="gold-border text-primary hover:bg-primary/10"
    >
      <Globe className="h-4 w-4 me-1" />
      {lang === "ar" ? "EN" : "عربي"}
    </Button>
  );
};

export default LanguageSwitcher;
