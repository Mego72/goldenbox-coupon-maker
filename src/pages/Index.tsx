import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { LogOut, Sparkles, List } from "lucide-react";
import CouponGenerator from "@/components/CouponGenerator";
import CouponList from "@/components/CouponList";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useLanguage } from "@/i18n/LanguageContext";
import type { User } from "@supabase/supabase-js";

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { t } = useLanguage();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
      if (!session?.user) navigate("/login");
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
      if (!session?.user) navigate("/login");
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  if (loading) return null;
  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border px-6 py-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold gold-gradient-text">{t("appName")}</h1>
        <div className="flex items-center gap-4">
          <LanguageSwitcher />
          <span className="text-sm text-muted-foreground hidden sm:block">{user.email}</span>
          <Button variant="outline" size="sm" onClick={handleLogout} className="gold-border text-primary hover:bg-primary/10">
            <LogOut className="h-4 w-4 me-1" /> {t("logout")}
          </Button>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-6 py-8">
        <Tabs defaultValue="generate" className="space-y-6">
          <TabsList className="bg-secondary">
            <TabsTrigger value="generate" className="data-[state=active]:gold-gradient-bg data-[state=active]:text-primary-foreground">
              <Sparkles className="h-4 w-4 me-2" /> {t("generate")}
            </TabsTrigger>
            <TabsTrigger value="saved" className="data-[state=active]:gold-gradient-bg data-[state=active]:text-primary-foreground">
              <List className="h-4 w-4 me-2" /> {t("savedCoupons")}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="generate">
            <CouponGenerator />
          </TabsContent>
          <TabsContent value="saved">
            <CouponList />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
