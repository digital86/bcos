import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  UserPlus,
  User,
  Phone,
  Mail,
  Building,
  CheckCircle,
  Loader2,
  Send
} from 'lucide-react';
import { SimpleSupabaseService } from '@/lib/supabaseSimple';
import { toast } from 'sonner';

interface DirectEnrollmentFormProps {
  courseId: string;
  courseTitle: string;
  coursePrice?: number;
  courseCurrency?: string;
}

const DirectEnrollmentForm = ({ 
  courseId, 
  courseTitle, 
  coursePrice = 0, 
  courseCurrency = 'EUR' 
}: DirectEnrollmentFormProps) => {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    company: '',
    email: ''
  });

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = () => {
    const required = ['full_name', 'phone', 'email'];
    const missing = required.filter(field => !formData[field as keyof typeof formData].trim());
    
    if (missing.length > 0) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return false;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('Veuillez saisir une adresse email valide');
      return false;
    }

    // Phone validation (basic)
    const phoneRegex = /^[\d\s\+\-\(\)]+$/;
    if (!phoneRegex.test(formData.phone)) {
      toast.error('Veuillez saisir un numéro de téléphone valide');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      setLoading(true);

      // Create enrollment data
      const enrollmentData = {
        formation_id: courseId,
        full_name: formData.full_name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        company: formData.company.trim() || null,
        position: null,
        experience_level: 'debutant',
        motivation: null,
        preferred_date: null,
        how_did_you_hear: 'website',
        special_requirements: null,
        status: 'pending',
        lead_status: 'nouveau',
        lead_source: 'website',
        enrollment_date: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      await SimpleSupabaseService.createEnrollment(enrollmentData);

      setSubmitted(true);
      toast.success('Inscription envoyée avec succès! Nous vous contacterons bientôt.');
      
      // Reset form after delay
      setTimeout(() => {
        setSubmitted(false);
        setFormData({
          full_name: '',
          phone: '',
          company: '',
          email: ''
        });
      }, 3000);

    } catch (error) {
      console.error('Error submitting enrollment:', error);
      toast.error('Erreur lors de l\'inscription. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number, currency: string) => {
    // Convert DA to DZD (Algerian Dinar ISO 4217 code)
    const currencyCode = currency === 'DA' ? 'DZD' : currency;
    
    try {
      return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: currencyCode
      }).format(price);
    } catch (error) {
      // Fallback: just show number with currency text
      return `${price.toLocaleString('fr-FR')} ${currency}`;
    }
  };

  if (submitted) {
    return (
      <div className="w-full relative overflow-hidden rounded-3xl">
        <div className="absolute inset-0 bg-primary">
          <div className="absolute inset-0 bg-[url('https://i.postimg.cc/MK7WGMx5/Asset-18.webp')] opacity-20 bg-cover bg-center mix-blend-overlay"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-slate-900/30"></div>
        </div>
        <div className="relative z-10 glass-card bg-white/10 p-12 lg:p-20 border border-white/20 shadow-2xl backdrop-blur-md text-center">
          <CheckCircle className="w-20 h-20 text-bcos-lime mx-auto mb-6 drop-shadow-lg" />
          <h3 className="text-2xl lg:text-3xl font-bold text-white mb-4">
            Inscription envoyée avec succès!
          </h3>
          <p className="text-white/80 text-lg mb-2">
            Merci pour votre inscription à <strong className="text-white">{courseTitle}</strong>
          </p>
          <p className="text-sm text-bcos-lime mt-4">
            Nous vous contacterons sous peu pour confirmer votre inscription.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full relative overflow-hidden rounded-3xl shadow-2xl mb-12">
      <div className="absolute inset-0 bg-primary">
         <div className="absolute inset-0 bg-[url('https://i.postimg.cc/MK7WGMx5/Asset-18.webp')] opacity-20 bg-cover bg-center mix-blend-overlay"></div>
         <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-slate-900/30"></div>
      </div>

      <div className="relative z-10 glass-card bg-white/10 p-8 lg:p-14 border border-white/20 backdrop-blur-md">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center p-3 bg-white/10 rounded-full mb-6">
             <UserPlus className="w-8 h-8 text-bcos-lime" />
          </div>
          <h2 className="text-3xl lg:text-4xl font-heading font-bold text-white leading-tight mb-4">
            Inscription à la formation
          </h2>
          <p className="text-lg text-white/90 font-medium mb-1">
            {courseTitle}
          </p>
          {coursePrice > 0 && (
            <p className="text-bcos-lime font-bold">
              {formatPrice(coursePrice, courseCurrency)}
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 text-left">
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="full_name" className="text-white/90">Nom et Prénom *</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => handleInputChange('full_name', e.target.value)}
                placeholder="Votre nom complet"
                required
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40 h-12 rounded-xl focus:bg-white/20 transition-colors"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white/90">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="votre.email@exemple.com"
                required
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40 h-12 rounded-xl focus:bg-white/20 transition-colors"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
             <div className="space-y-2">
               <Label htmlFor="phone" className="text-white/90">Numéro de téléphone *</Label>
               <Input
                 id="phone"
                 type="tel"
                 value={formData.phone}
                 onChange={(e) => handleInputChange('phone', e.target.value)}
                 placeholder="+213 555 123 456"
                 required
                 className="bg-white/10 border-white/20 text-white placeholder:text-white/40 h-12 rounded-xl focus:bg-white/20 transition-colors"
               />
             </div>
             
             <div className="space-y-2">
               <Label htmlFor="company" className="text-white/90">Nom de l'entreprise</Label>
               <Input
                 id="company"
                 value={formData.company}
                 onChange={(e) => handleInputChange('company', e.target.value)}
                 placeholder="Nom de votre entreprise (optionnel)"
                 className="bg-white/10 border-white/20 text-white placeholder:text-white/40 h-12 rounded-xl focus:bg-white/20 transition-colors"
               />
             </div>
          </div>

          <div className="pt-6 text-center">
            <Button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-12 py-6 bg-bcos-lime text-bcos-dark-indigo rounded-xl font-bold text-lg hover:brightness-110 shadow-lg transition-all mx-auto h-auto"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Envoi en cours...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5 mr-2" />
                  Envoyer la demande d'inscription
                </>
              )}
            </Button>
          </div>

          <div className="text-center text-xs text-white/50 mt-6 space-y-1 font-light">
            <p>* Champs obligatoires</p>
            <p>Nous vous contacterons dans les 24 heures pour confirmer votre inscription.</p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DirectEnrollmentForm;
