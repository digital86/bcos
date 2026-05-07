import { Facebook, Linkedin, Instagram, Youtube, Mail, Phone, Send, MessageCircle } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { EditableText } from '@/components/admin/EditableContent';
import Logo from '@/components/Logo';
import EmailObfuscator from './EmailObfuscator';

const Footer = () => {
  const location = useLocation();
  const language = location.pathname.startsWith('/ar') ? 'ar' : 'fr';
  
  const footerLinks = language === 'ar'
    ? {
        services: [
          { label: 'التدريب المهني', href: '/ar/nos-formations' },
          { label: 'الاستشارات', href: '/ar/consultation-et-accompagnement-sur-le-terrain' },
          { label: 'التعلم الإلكتروني', href: 'https://elearning.bcos-dz.com/' },
          { label: 'الفعاليات', href: '/ar/organisation-devenements-et-de-demonstrations' },
        ],
        entreprise: [
          { label: 'من نحن', href: '/ar/qui-sommes-nous' },
          { label: 'مراجعنا', href: '/ar#references' },
          { label: 'المدونة', href: '/ar/blog' },
          { label: 'الأخبار', href: '/ar/actualite' },
        ],
        support: [
          { label: 'الأجندة', href: '/ar/agenda' },


        ],
      }
    : {
        services: [
          { label: 'Formations professionnelles', href: '/fr/nos-formations' },
          { label: 'Consulting', href: '/fr/consultation-et-accompagnement-sur-le-terrain' },
          { label: 'E-learning', href: 'https://elearning.bcos-dz.com/' },
          { label: 'Événements', href: '/fr/organisation-devenements-et-de-demonstrations' },
        ],
        entreprise: [
          { label: 'À propos', href: '/fr/qui-sommes-nous' },
          { label: 'Nos références', href: '/fr#references' },
          { label: 'Blog', href: '/fr/blog' },
          { label: 'Actualité', href: '/fr/actualite' },
        ],
        support: [
          { label: 'Agenda', href: '/fr/agenda' },


        ],
      };

  const socialLinks = [
    { logoUrl: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/facebook.svg', href: 'https://www.facebook.com/bcosdz', label: 'Facebook' },
    { logoUrl: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/instagram.svg', href: 'https://www.instagram.com/bcos.alg/', label: 'Instagram' },
    { logoUrl: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/linkedin.svg', href: 'https://www.linkedin.com/company/bcosdz/', label: 'LinkedIn' },
    { logoUrl: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/youtube.svg', href: 'https://www.youtube.com/@BCOSConseilFormation', label: 'YouTube' },
    { logoUrl: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/telegram.svg', href: 'https://t.me/Nouvelles_BCOS', label: 'Telegram' },
    { logoUrl: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/whatsapp.svg', href: 'https://api.whatsapp.com/send/?phone=213542761931&text&type=phone_number&app_absent=0', label: 'WhatsApp' },
  ];

  return (
    <footer className="bg-bcos-dark text-white relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-20 right-20 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-20 w-80 h-80 bg-bcos-lime/5 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-4 lg:px-8 py-16 lg:py-20">
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-12 mb-16">
          {/* Brand Section */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <Logo className="h-14 w-auto mb-2" />
            </div>
            
            <p className="text-white/80 leading-relaxed max-w-md" dir={language === 'ar' ? 'rtl' : 'ltr'}>
               <EditableText 
                 pageKey="global" 
                 contentKey={`global_${language}_site_desc`} 
                 defaultContent={language === 'ar' 
                   ? 'منذ 2006، بيكوص ترافق الشركات الجزائرية في تطويرها من خلال التدريب والاستشارات والابتكار.'
                   : `Institution de formation et de conseil dans le domaine de la gestion et de l'administration des entreprises. Depuis 2006, BCOS œuvre à l'accompagnement et au développement de la performance des entreprises économiques.`} 
                 multiline 
               />
            </p>

            <div className="space-y-3">
              <a href="tel:+213542761931" className="flex items-center gap-3 text-white/80 hover:text-white transition-smooth">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                  <Phone className="w-5 h-5" />
                </div>
                <span>
                   213542761931
                </span>
              </a>
              <EmailObfuscator email="commerciale@bcos-dz.com" className="flex items-center gap-3 text-white/80 hover:text-white transition-smooth">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                  <Mail className="w-5 h-5" />
                </div>
                <span>
                   <EditableText pageKey="global" contentKey="global_contact_email" defaultContent="commerciale@bcos-dz.com" />
                </span>
              </EmailObfuscator>
            </div>

            <div className="flex gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition-smooth hover:scale-110"
                >
                  <img src={social.logoUrl} alt={social.label} className="w-5 h-5 object-contain brightness-0 invert opacity-70 group-hover:opacity-100 transition-opacity" />
                </a>
              ))}
            </div>
          </div>

          {/* Links Sections */}
          <div className="space-y-4" dir={language === 'ar' ? 'rtl' : 'ltr'}>
            <h4 className="font-heading font-semibold text-lg mb-4">
              {language === 'ar' ? 'خدماتنا' : 'Nos Services'}
            </h4>
            <ul className="space-y-3">
              {footerLinks.services.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-white/70 hover:text-white transition-smooth text-sm"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-4" dir={language === 'ar' ? 'rtl' : 'ltr'}>
            <h4 className="font-heading font-semibold text-lg mb-4">
              {language === 'ar' ? 'الشركة' : 'Entreprise'}
            </h4>
            <ul className="space-y-3">
              {footerLinks.entreprise.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-white/70 hover:text-white transition-smooth text-sm"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-4" dir={language === 'ar' ? 'rtl' : 'ltr'}>
            <h4 className="font-heading font-semibold text-lg mb-4">
              {language === 'ar' ? 'الدعم' : 'Support'}
            </h4>
            <ul className="space-y-3">
              {footerLinks.support.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-white/70 hover:text-white transition-smooth text-sm"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/10" dir={language === 'ar' ? 'rtl' : 'ltr'}>
          <div className={`flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-white/60 ${language === 'ar' ? 'md:flex-row-reverse' : ''}`}>
            <p>{language === 'ar' ? `© ${new Date().getFullYear()} بيكوص التدريب والاستشارات. جميع الحقوق محفوظة.` : `© ${new Date().getFullYear()} BCOS Formation & Conseil. Tous droits réservés.`}</p>
            <div className="flex gap-6">
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
