import { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Menu, X, ChevronDown, Facebook, Linkedin, Instagram, Youtube, Send, MessageCircle, MonitorPlay, Users, Building2, GraduationCap, Calendar, Rocket } from 'lucide-react';
import Logo from './Logo';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const Header = () => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isServicesOpen, setIsServicesOpen] = useState(false);
  const [isMobileServicesOpen, setIsMobileServicesOpen] = useState(false);
  const [language, setLanguage] = useState<'fr' | 'ar'>('fr');

  // Detect language from URL
  useEffect(() => {
    const path = location.pathname;
    if (path.includes('/ar/') || path === '/ar' || path.endsWith('/ar')) {
      setLanguage('ar');
    } else {
      setLanguage('fr');
    }
  }, [location.pathname]);

  // Get language prefix for URLs
  const langPrefix = language === 'ar' ? '/ar' : '/fr';

  const servicesItems = language === 'ar'
    ? [
        { 
          label: 'BCOS ONLINE - منصة التكوين أونلاين', 
          href: 'https://elearning.bcos-dz.com/',
          icon: MonitorPlay 
        },
        { 
          label: 'الاستشارة والمرافقة الميدانية', 
          href: `${langPrefix}/consultation-et-accompagnement-sur-le-terrain`,
          icon: Users
        },
        { 
          label: 'التدريب داخل المؤسسات', 
          href: `${langPrefix}/formations-intra`,
          icon: Building2
        },
        { 
          label: 'تدريباتنا', 
          href: `${langPrefix}/formations`,
          icon: GraduationCap
        },
        { 
          label: 'تنظيم الفعاليات والعروض التوضيحية', 
          href: `${langPrefix}/organisation-devenements-et-de-demonstrations`,
          icon: Calendar
        },
      ]
    : [
        { 
          label: 'BCOS ONLINE - Plateforme E-learning', 
          href: 'https://elearning.bcos-dz.com/',
          icon: MonitorPlay 
        },
        { 
          label: 'Consultation et accompagnement sur le terrain', 
          href: `${langPrefix}/consultation-et-accompagnement-sur-le-terrain`,
          icon: Users
        },
        { 
          label: 'Formations Intra-entreprises', 
          href: `${langPrefix}/formations-intra`,
          icon: Building2
        },
        { 
          label: 'Nos formations', 
          href: `${langPrefix}/nos-formations`,
          icon: GraduationCap
        },
        { 
          label: "Organisation d'événements et de démonstrations", 
          href: `${langPrefix}/organisation-devenements-et-de-demonstrations`,
          icon: Calendar
        },
        { 
          label: "Accélérateur de projets", 
          href: `${langPrefix}/accelerateur-de-projets`,
          icon: Rocket
        },
      ];

  const menuItems = language === 'ar' 
    ? [
        { label: 'BCOS ONLINE', href: 'https://elearning.bcos-dz.com/' },
        { label: 'المدونة', href: `${langPrefix}/blog` },
        { label: 'الأخبار', href: `${langPrefix}/actualite` },
        { label: 'من نحن', href: `${langPrefix}/qui-sommes-nous` },
      ]
    : [
        { label: 'BCOS ONLINE', href: 'https://elearning.bcos-dz.com/' },
        { label: 'Blog', href: `${langPrefix}/blog` },
        { label: 'Actualité', href: `${langPrefix}/actualite` },
        { label: 'Qui sommes‑nous', href: `${langPrefix}/qui-sommes-nous` },
      ];

  const dir = language === 'ar' ? 'rtl' : 'ltr';

  const handleLanguageToggle = (checked: boolean) => {
    const targetLang = checked ? 'ar' : 'fr';
    const currentPath = location.pathname;
    const isEditor = currentPath.startsWith('/editor');
    
    // Remove the editor prefix from current path to simplify replacement
    let cleanPath = isEditor ? currentPath.replace('/editor', '') : currentPath;
    if (cleanPath === '') cleanPath = '/';

    let newPath = cleanPath;

    if (targetLang === 'ar') {
      // Switching to Arabic
      if (cleanPath.startsWith('/fr')) {
        newPath = cleanPath.replace('/fr', '/ar');
      } else if (cleanPath === '/') {
        newPath = '/ar';
      } else if (!cleanPath.startsWith('/ar')) {
        newPath = `/ar${cleanPath}`;
      }
    } else {
      // Switching to French
      if (cleanPath.startsWith('/ar')) {
        newPath = cleanPath.replace('/ar', '/fr');
      } else if (cleanPath === '/ar') {
        newPath = '/fr';
      } else if (!cleanPath.startsWith('/fr')) {
        newPath = `/fr${cleanPath}`;
      }
    }
    
    // Add back the editor prefix if we were in editor mode
    if (isEditor) {
      newPath = `/editor${newPath}`;
    }
    
    // Ensure no double slashes
    newPath = newPath.replace(/\/\//g, '/');
    window.location.href = newPath;
  };

  const socialLinks = [
    { logoUrl: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/facebook.svg', href: 'https://www.facebook.com/bcosdz', name: 'Facebook' },
    { logoUrl: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/instagram.svg', href: 'https://www.instagram.com/bcos.alg/', name: 'Instagram' },
    { logoUrl: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/linkedin.svg', href: 'https://www.linkedin.com/company/bcosdz/', name: 'LinkedIn' },
    { logoUrl: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/youtube.svg', href: 'https://www.youtube.com/@BCOSConseilFormation', name: 'YouTube' },
    { logoUrl: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/telegram.svg', href: 'https://t.me/Nouvelles_BCOS', name: 'Telegram' },
    { logoUrl: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/whatsapp.svg', href: 'https://api.whatsapp.com/send/?phone=213542761931&text&type=phone_number&app_absent=0', name: 'WhatsApp' },
  ];

  return (
    <>
      <header className="fixed top-0 left-0 right-0 w-full py-6 z-50" dir={dir}></header>
      {/* Navigation bar container */}
      <div className="fixed top-0 left-0 right-0 w-full py-6 z-50 pointer-events-none" dir={dir}>
      <div className="relative container mx-auto px-4 lg:px-8">
          <div className={`bg-white rounded-full px-8 py-3.5 shadow-lg flex items-center justify-between gap-4 max-w-6xl mx-auto pointer-events-auto ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
          {/* Logo */}
          <Link to={langPrefix} className="flex items-center z-50 flex-shrink-0">
            <Logo className="h-8 w-auto" />
          </Link>

          {/* Desktop Menu */}
          <nav className={`hidden lg:flex items-center flex-1 justify-center ${language === 'ar' ? 'space-x-reverse space-x-2' : 'space-x-2'}`}>
            <Link
              to={langPrefix}
              className="text-sm font-medium text-gray-800 hover:bg-[#82BC24] hover:text-white px-4 py-2 rounded-full transition-all duration-300 whitespace-nowrap"
            >
              {language === 'ar' ? 'الرئيسية' : 'BCOS – Accueil'}
            </Link>
            
            {/* Nos services dropdown */}
            <DropdownMenu onOpenChange={setIsServicesOpen}>
              <DropdownMenuTrigger className="text-sm font-medium text-gray-800 hover:bg-[#82BC24] hover:text-white px-4 py-2 rounded-full transition-all duration-300 whitespace-nowrap flex items-center gap-1 outline-none">
                {language === 'ar' ? 'خدماتنا' : 'Nos services'}
                <ChevronDown className={`h-4 w-4 transition-transform ${isServicesOpen ? 'rotate-180' : ''}`} />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="min-w-[260px] p-1.5 flex flex-col shadow-xl border-gray-100">
                {servicesItems.map((item, index) => (
                  <DropdownMenuItem key={item.label} asChild className={`py-2 px-4 focus:bg-[#82BC24]/10 focus:text-[#82BC24] transition-all rounded-lg cursor-pointer ${index !== servicesItems.length - 1 ? 'border-b border-gray-50' : ''}`}>
                    <a href={item.href} className="block w-full group">
                      <span className="text-[13px] font-bold text-gray-800 group-hover:text-[#82BC24] transition-colors leading-tight block">
                        {item.label}
                      </span>
                    </a>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            
            {menuItems.slice(1).map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="text-sm font-medium text-gray-800 hover:bg-[#82BC24] hover:text-white px-4 py-2 rounded-full transition-all duration-300 whitespace-nowrap"
              >
                {item.label}
              </a>
            ))}
          </nav>

          {/* Desktop Right Side (Socials + Lang) */}
          <div className={`hidden lg:flex items-center gap-3 flex-shrink-0 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
             
             {/* Social Links Desktop */}
             <div className="flex items-center gap-1 border-slate-200" style={{ borderRightWidth: language === 'fr' ? '1px' : '0', borderLeftWidth: language === 'ar' ? '1px' : '0', paddingRight: language === 'fr' ? '0.75rem' : '0', paddingLeft: language === 'ar' ? '0.75rem' : '0', marginRight: language === 'fr' ? '0.25rem' : '0', marginLeft: language === 'ar' ? '0.25rem' : '0' }}>
               {socialLinks.map((social, index) => (
                 <a 
                   key={index} 
                   href={social.href} 
                   target="_blank" 
                   rel="noopener noreferrer"
                   className="p-1.5 transition-all duration-300 hover:scale-110 flex items-center justify-center grayscale hover:grayscale-0 opacity-70 hover:opacity-100"
                   title={social.name}
                 >
                   <img src={social.logoUrl} alt={social.name} className="w-4 h-4 object-contain" />
                 </a>
               ))}
             </div>

             {/* Desktop Language Switcher */}
             <div className={`flex items-center bg-slate-100 p-1 rounded-full border border-slate-200/60 shadow-inner flex-shrink-0 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
               <button 
                 onClick={() => language === 'ar' && handleLanguageToggle(false)} 
                 className={`px-4 py-1.5 rounded-full text-xs tracking-wider font-bold transition-all duration-300 ${language === 'fr' ? 'bg-white shadow-sm text-blue-800' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'}`}
               >
                 FR
               </button>
               <button 
                 onClick={() => language === 'fr' && handleLanguageToggle(true)} 
                 className={`px-4 py-1.5 rounded-full text-xs tracking-wider font-bold transition-all duration-300 ${language === 'ar' ? 'bg-white shadow-sm text-blue-800' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'}`}
               >
                 AR
               </button>
             </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden z-50 p-2 text-gray-800 flex-shrink-0"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden relative mt-4 pointer-events-auto" dir={dir}>
          <div className="bg-white rounded-2xl shadow-lg mx-4 border border-gray-100">
            <nav className={`px-6 py-6 flex flex-col ${language === 'ar' ? 'space-y-reverse space-y-4' : 'space-y-4'}`}>
              <Link
                to={langPrefix}
                className={`text-base font-medium text-gray-800 hover:text-primary transition-colors py-2 ${language === 'ar' ? 'text-right' : 'text-left'}`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {language === 'ar' ? 'الرئيسية' : 'BCOS – Accueil'}
              </Link>
              
              {/* Mobile Services Dropdown */}
              <div className="flex flex-col">
                <button
                  className={`text-base font-medium text-gray-800 hover:text-primary transition-colors py-2 flex items-center justify-between ${language === 'ar' ? 'text-right flex-row-reverse' : 'text-left'}`}
                  onClick={() => setIsMobileServicesOpen(!isMobileServicesOpen)}
                >
                  {language === 'ar' ? 'خدماتنا' : 'Nos services'}
                  <ChevronDown className={`h-4 w-4 transition-transform ${isMobileServicesOpen ? 'rotate-180' : ''}`} />
                </button>
                {isMobileServicesOpen && (
                  <div className={`mt-2 space-y-2 ${language === 'ar' ? 'pr-4 space-y-reverse' : 'pl-4'}`}>
                    {servicesItems.map((item) => (
                      <a
                        key={item.label}
                        href={item.href}
                        className={`text-sm text-gray-600 hover:text-primary transition-colors py-1 block ${language === 'ar' ? 'text-right' : 'text-left'}`}
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          setIsMobileServicesOpen(false);
                        }}
                      >
                        {item.label}
                      </a>
                    ))}
                  </div>
                )}
              </div>
              
              {menuItems.slice(1).map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className={`text-base font-medium text-gray-800 hover:text-primary transition-colors py-2 ${language === 'ar' ? 'text-right' : 'text-left'}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.label}
              </a>
            ))}
              <div className="pt-4 border-t border-gray-200 flex flex-col items-center">
                <div className="flex items-center bg-slate-100 p-1 rounded-full border border-slate-200/60 shadow-inner w-full max-w-[200px] mb-4">
                  <a
                    href={language === 'ar' ? location.pathname.replace(/^\/ar/, '/fr') : '/fr'}
                    className={`flex-1 text-center py-2 rounded-full text-sm font-bold transition-all duration-300 ${
                      language === 'fr' 
                        ? 'bg-white shadow-sm text-blue-800' 
                        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    FR
                  </a>
                  <a
                    href={language === 'fr' ? location.pathname.replace(/^\/fr/, '/ar') : '/ar'}
                    className={`flex-1 text-center py-2 rounded-full text-sm font-bold transition-all duration-300 ${
                      language === 'ar' 
                        ? 'bg-white shadow-sm text-blue-800' 
                        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    AR
                  </a>
                </div>
                
                {/* Mobile Social Links */}
                <div className="flex items-center justify-center gap-4 py-2">
                  {socialLinks.map((social, index) => (
                    <a 
                      key={index} 
                      href={social.href} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-2 transition-all duration-300 hover:scale-110 flex items-center justify-center grayscale hover:grayscale-0 opacity-70 hover:opacity-100"
                    >
                      <img src={social.logoUrl} alt={social.name} className="w-5 h-5 object-contain" />
                    </a>
                  ))}
                </div>
              </div>
          </nav>
          </div>
        </div>
      )}
      </div>
    </>
  );
};

export default Header;
