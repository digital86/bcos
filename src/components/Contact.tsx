import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Phone, Mail, MapPin, Clock, Send } from 'lucide-react';
import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import ScrollFloat from './ScrollFloat';
import EmailObfuscator from './EmailObfuscator';

const Contact = () => {
  const location = useLocation();
  const language = location.pathname.startsWith('/ar') ? 'ar' : 'fr';
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    message: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success(language === 'ar' 
      ? 'تم إرسال الرسالة بنجاح! سنرد عليك قريباً.'
      : 'Message envoyé avec succès! Nous vous répondrons rapidement.'
    );
    setFormData({ name: '', email: '', phone: '', company: '', message: '' });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const contactInfo = language === 'ar'
    ? [
        {
          icon: Phone,
          title: 'الهاتف',
          content: '+213 542 76 19 31',
          subContent: 'متاح خلال أوقات العمل',
        },
        {
          icon: Mail,
          title: 'البريد الإلكتروني',
          content: 'commerciale@bcos-dz.com',
          subContent: 'نرد خلال 24 ساعة',
        },
        {
          icon: MapPin,
          title: 'العنوان',
          content: 'الجزائر، الجزائر',
          subContent: 'منطقة النشاط',
        },
        {
          icon: Clock,
          title: 'المواعيد',
          content: 'الأحد، الإثنين، الثلاثاء، الأربعاء، السبت: 08:00–17:00 • الخميس: 08:00–14:00 • الجمعة: مغلق',
          subContent: 'أوقات العمل الرسمية',
        },
      ]
    : [
        {
          icon: Phone,
          title: 'Téléphone',
          content: '+213 542 76 19 31',
          subContent: 'Disponible aux horaires ci-dessous',
        },
        {
          icon: Mail,
          title: 'Email',
          content: 'commerciale@bcos-dz.com',
          subContent: 'Réponse sous 24h',
        },
        {
          icon: MapPin,
          title: 'Adresse',
          content: 'Alger, Algérie',
          subContent: 'Zone d\'activité',
        },
        {
          icon: Clock,
          title: 'Horaires',
          content: 'Dimanche, Lundi, Mardi, Mercredi, Samedi: 08:00–17:00 · Jeudi: 08:00–14:00 · Vendredi: Fermé',
          subContent: 'Heures d\'ouverture',
        },
      ];

  return (
    <section id="contact" className="py-20 lg:py-32 bg-muted/30 relative overflow-hidden">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="text-center mb-16 animate-fade-in" dir={language === 'ar' ? 'rtl' : 'ltr'}>
          <ScrollFloat
            containerClassName="text-3xl lg:text-4xl xl:text-5xl font-heading text-foreground mb-6"
          >
            {language === 'ar' ? 'اتصل بنا' : 'Contactez-nous'}
          </ScrollFloat>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto text-center" style={{ textAlign: 'center' }}>
            {language === 'ar' 
              ? 'سؤال؟ مشروع؟ فريقنا في خدمتك'
              : 'Une question ? Un projet ? Notre équipe est à votre écoute'
            }
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
          {/* Left: Contact Form */}
          <div className="glass-card rounded-3xl p-8 lg:p-10 animate-slide-up" dir={language === 'ar' ? 'rtl' : 'ltr'}>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">{language === 'ar' ? 'الاسم الكامل *' : 'Nom complet *'}</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="rounded-xl h-12"
                  placeholder={language === 'ar' ? 'اسمك' : 'Votre nom'}
                  dir={language === 'ar' ? 'rtl' : 'ltr'}
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">{language === 'ar' ? 'البريد الإلكتروني *' : 'Email *'}</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="rounded-xl h-12"
                    placeholder="votre@email.com"
                    dir={language === 'ar' ? 'rtl' : 'ltr'}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">{language === 'ar' ? 'الهاتف *' : 'Téléphone *'}</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    className="rounded-xl h-12"
                    placeholder="+213..."
                    dir={language === 'ar' ? 'rtl' : 'ltr'}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="company">{language === 'ar' ? 'الشركة' : 'Société'}</Label>
                <Input
                  id="company"
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  className="rounded-xl h-12"
                  placeholder={language === 'ar' ? 'اسم شركتك' : 'Nom de votre société'}
                  dir={language === 'ar' ? 'rtl' : 'ltr'}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">{language === 'ar' ? 'الرسالة *' : 'Message *'}</Label>
                <Textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  className="rounded-xl min-h-32"
                  placeholder={language === 'ar' ? 'اوصف مشروعك أو طلبك...' : 'Décrivez votre projet ou votre demande...'}
                  dir={language === 'ar' ? 'rtl' : 'ltr'}
                />
              </div>

              <Button type="submit" size="lg" className="rounded-2xl gradient-primary w-full h-14" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                <Send className={`w-5 h-5 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
                {language === 'ar' ? 'إرسال الطلب' : 'Envoyer la demande'}
              </Button>
            </form>
          </div>

          {/* Right: Contact Info + Map */}
          <div className="space-y-8 animate-fade-in" itemScope itemType="https://schema.org/EducationalOrganization">
            {/* hidden fields for microdata completeness */}
            <meta itemProp="name" content="BCOS Formation & Conseil" />
            <meta itemProp="url" content="https://bcos-dz.com" />
            <meta itemProp="logo" content="https://bcos-dz.com/logo.png" />
            
            <div className="grid sm:grid-cols-2 gap-6">
              {contactInfo.map((info, index) => (
                <div
                  key={info.title}
                  className="glass-card rounded-2xl p-6 hover:shadow-glass transition-smooth hover:scale-105"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center mb-4">
                    <info.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-heading font-semibold text-foreground mb-2">
                    {info.title}
                  </h3>
                  {info.icon === Mail ? (
                    <EmailObfuscator email={info.content} className="text-sm text-foreground mb-1 block">
                      <span itemProp="email">{info.content}</span>
                    </EmailObfuscator>
                  ) : info.icon === Phone ? (
                    <p className="text-sm text-foreground mb-1">
                      <span itemProp="telephone">{info.content}</span>
                    </p>
                  ) : info.icon === MapPin ? (
                    <p className="text-sm text-foreground mb-1" itemProp="address" itemScope itemType="https://schema.org/PostalAddress">
                      <span itemProp="addressLocality">{info.content}</span>
                    </p>
                  ) : (
                    <p className="text-sm text-foreground mb-1">{info.content}</p>
                  )}
                  <p className="text-xs text-muted-foreground">{info.subContent}</p>
                </div>
              ))}
            </div>

            {/* Map placeholder */}
            <div className="glass-card rounded-3xl overflow-hidden h-80">
              <div className="w-full h-full bg-gradient-to-br from-primary/10 to-bcos-indigo/10 flex items-center justify-center">
                  <div className="text-center space-y-2" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                  <MapPin className="w-12 h-12 text-primary mx-auto" />
                  <p className="text-muted-foreground">{language === 'ar' ? 'خريطة تفاعلية' : 'Carte interactive'}</p>
                  <p className="text-xs text-muted-foreground">
                    Alger, Algérie
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
