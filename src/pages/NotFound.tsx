import { useLocation, Link, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft, Search, GraduationCap, BookOpen, Mail } from "lucide-react";
import Logo from "@/components/Logo";
import SEO from "@/components/SEO";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const language = location.pathname.startsWith('/ar') ? 'ar' : 'fr';
  const isArabic = language === 'ar';

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  const content = {
    fr: {
      title: "404",
      subtitle: "Houston, nous avons un petit problème...",
      desc: "La page que vous recherchez semble s'être égarée dans nos archives ou n'a jamais existé.",
      backHome: "Retour à l'accueil",
      goBack: "Page précédente",
      quickLinks: "Liens utiles :",
      links: [
        { label: "Nos Formations", href: "/fr/nos-formations", icon: GraduationCap },
        { label: "Blog & Ressources", href: "/fr/blog", icon: BookOpen },
        { label: "Contactez-nous", href: "/fr#contact", icon: Mail },
      ]
    },
    ar: {
      title: "404",
      subtitle: "عذراً، هذه الصفحة غير موجودة...",
      desc: "يبدو أن الصفحة التي تبحث عنها قد فقدت في أرشيفاتنا أو أنها لم تكن موجودة أبداً.",
      backHome: "العودة للرئيسية",
      goBack: "الصفحة السابقة",
      quickLinks: "روابط مفيدة:",
      links: [
        { label: "دوراتنا التدريبية", href: "/ar/nos-formations", icon: GraduationCap },
        { label: "المدونة والموارد", href: "/ar/blog", icon: BookOpen },
        { label: "اتصل بنا", href: "/ar#contact", icon: Mail },
      ]
    }
  };

  const t = content[language];

  return (
    <div className={`min-h-screen flex flex-col justify-center items-center bg-background relative overflow-hidden px-4 ${isArabic ? 'font-arabic' : ''}`} dir={isArabic ? 'rtl' : 'ltr'}>
      <SEO 
        title={isArabic ? "الصفحة غير موجودة | BCOS" : "Page non trouvée | BCOS"}
        description={t.desc}
        lang={language}
        noIndex={true}
        noFollow={true}
      />
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/10 rounded-full blur-[120px]" />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/cubes.png')" }} />
      </div>

      <div className="max-w-3xl w-full text-center space-y-8 animate-fade-in">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Logo className="h-16 w-auto" />
        </div>

        {/* 404 Large Number */}
        <div className="relative inline-block">
          <h1 className="text-9xl sm:text-[12rem] font-heading font-black text-primary/5 select-none animate-pulse">
            {t.title}
          </h1>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="glass-card p-6 rounded-full shadow-2xl scale-125 sm:scale-150">
              <Search className="w-12 h-12 text-primary" />
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="space-y-4">
          <h2 className="text-2xl sm:text-4xl font-heading font-bold text-foreground">
            {t.subtitle}
          </h2>
          <p className="text-muted-foreground text-lg max-w-lg mx-auto">
            {t.desc}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
          <Button size="lg" className="rounded-2xl h-14 px-8 gradient-primary group" asChild>
            <Link to={isArabic ? "/ar" : "/fr"}>
              <Home className={`w-5 h-5 ${isArabic ? 'ml-2' : 'mr-2'}`} />
              {t.backHome}
            </Link>
          </Button>
          <Button size="lg" variant="outline" className="rounded-2xl h-14 px-8 border-primary/20 hover:bg-primary/5" onClick={() => navigate(-1)}>
            <ArrowLeft className={`w-5 h-5 ${isArabic ? 'ml-2 rotate-180' : 'mr-2'}`} />
            {t.goBack}
          </Button>
        </div>

        {/* Quick Links */}
        <div className="pt-12 border-t border-border/50 max-w-xl mx-auto">
          <p className="text-sm font-semibold text-muted-foreground mb-6 uppercase tracking-wider">
            {t.quickLinks}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {t.links.map((link) => (
              <Link 
                key={link.href} 
                to={link.href}
                className="flex items-center gap-3 p-4 rounded-2xl bg-muted/30 hover:bg-muted transition-colors group"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <link.icon className="w-5 h-5 text-primary" />
                </div>
                <span className="text-sm font-medium text-foreground">{link.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
