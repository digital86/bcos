import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  User,
  Mail,
  Phone,
  Building,
  MessageSquare,
  Calendar,
  CheckCircle,
  Loader2,
  UserPlus
} from 'lucide-react';
import { SimpleSupabaseService } from '@/lib/supabaseSimple';
import { toast } from 'sonner';

interface EnrollmentFormProps {
  courseId: string;
  courseTitle: string;
  coursePrice?: number;
  courseCurrency?: string;
  trigger?: React.ReactNode;
}

interface FormData {
  full_name: string;
  email: string;
  phone: string;
  company: string;
  position: string;
  experience_level: string;
  motivation: string;
  preferred_date: string;
  how_did_you_hear: string;
  special_requirements: string;
}

const EnrollmentForm = ({ 
  courseId, 
  courseTitle, 
  coursePrice = 0, 
  courseCurrency = 'DZD',
  trigger 
}: EnrollmentFormProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  const [formData, setFormData] = useState<FormData>({
    full_name: '',
    email: '',
    phone: '',
    company: '',
    position: '',
    experience_level: '',
    motivation: '',
    preferred_date: '',
    how_did_you_hear: '',
    special_requirements: ''
  });

  const experienceLevels = [
    { value: 'debutant', label: 'Débutant' },
    { value: 'intermediaire', label: 'Intermédiaire' },
    { value: 'avance', label: 'Avancé' },
    { value: 'expert', label: 'Expert' }
  ];

  const hearAboutOptions = [
    { value: 'website', label: 'Site web' },
    { value: 'google', label: 'Recherche Google' },
    { value: 'social_media', label: 'Réseaux sociaux' },
    { value: 'colleague', label: 'Collègue/Ami' },
    { value: 'email', label: 'Email marketing' },
    { value: 'event', label: 'Événement/Salon' },
    { value: 'other', label: 'Autre' }
  ];

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = () => {
    const required = ['full_name', 'email', 'phone'];
    const missing = required.filter(field => !formData[field as keyof FormData].trim());
    
    if (missing.length > 0) {
      toast.error(`Veuillez remplir les champs obligatoires: ${missing.join(', ')}`);
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
        position: formData.position.trim() || null,
        experience_level: formData.experience_level || 'debutant',
        motivation: formData.motivation.trim() || null,
        preferred_date: formData.preferred_date || null,
        how_did_you_hear: formData.how_did_you_hear || 'website',
        special_requirements: formData.special_requirements.trim() || null,
        status: 'pending',
        lead_status: 'nouveau',
        lead_source: 'website',
        enrollment_date: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      await SimpleSupabaseService.createEnrollment(enrollmentData);

      setSubmitted(true);
      toast.success('Inscription envoyée avec succès!');
      
      // Reset form after delay
      setTimeout(() => {
        setIsOpen(false);
        setSubmitted(false);
        setFormData({
          full_name: '',
          email: '',
          phone: '',
          company: '',
          position: '',
          experience_level: '',
          motivation: '',
          preferred_date: '',
          how_did_you_hear: '',
          special_requirements: ''
        });
      }, 2000);

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

  const defaultTrigger = (
    <Button className="bg-accent hover:bg-accent/90 text-white">
      <UserPlus className="w-4 h-4 mr-2" />
      S'inscrire maintenant
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-accent" />
            Inscription à la formation
          </DialogTitle>
          <DialogDescription>
            <span className="font-medium text-foreground">{courseTitle}</span>
            {coursePrice > 0 && (
              <span className="block text-sm text-muted-foreground mt-1">
                Prix: {formatPrice(coursePrice, courseCurrency)}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        {submitted ? (
          <div className="text-center py-8">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-green-700 mb-2">
              Inscription envoyée avec succès!
            </h3>
            <p className="text-muted-foreground">
              Nous vous contacterons sous peu pour confirmer votre inscription.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Informations personnelles
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Nom et Prénom *</Label>
                    <Input
                      id="full_name"
                      value={formData.full_name}
                      onChange={(e) => handleInputChange('full_name', e.target.value)}
                      placeholder="Votre nom complet"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="votre.email@exemple.com"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Téléphone *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="+213 5 XX XX XX XX"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="company">Entreprise</Label>
                    <Input
                      id="company"
                      value={formData.company}
                      onChange={(e) => handleInputChange('company', e.target.value)}
                      placeholder="Nom de votre entreprise"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="position">Poste/Fonction</Label>
                    <Input
                      id="position"
                      value={formData.position}
                      onChange={(e) => handleInputChange('position', e.target.value)}
                      placeholder="Votre fonction dans l'entreprise"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="experience_level">Niveau d'expérience</Label>
                    <Select value={formData.experience_level} onValueChange={(value) => handleInputChange('experience_level', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez votre niveau" />
                      </SelectTrigger>
                      <SelectContent>
                        {experienceLevels.map((level) => (
                          <SelectItem key={level.value} value={level.value}>
                            {level.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Additional Information */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Informations complémentaires
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="motivation">Motivation pour cette formation</Label>
                  <Textarea
                    id="motivation"
                    value={formData.motivation}
                    onChange={(e) => handleInputChange('motivation', e.target.value)}
                    placeholder="Pourquoi souhaitez-vous suivre cette formation ? Quels sont vos objectifs ?"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="preferred_date">Date préférée (optionnel)</Label>
                    <Input
                      id="preferred_date"
                      type="date"
                      value={formData.preferred_date}
                      onChange={(e) => handleInputChange('preferred_date', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="how_did_you_hear">Comment nous avez-vous connus ?</Label>
                    <Select value={formData.how_did_you_hear} onValueChange={(value) => handleInputChange('how_did_you_hear', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez une option" />
                      </SelectTrigger>
                      <SelectContent>
                        {hearAboutOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="special_requirements">Besoins spéciaux ou remarques</Label>
                  <Textarea
                    id="special_requirements"
                    value={formData.special_requirements}
                    onChange={(e) => handleInputChange('special_requirements', e.target.value)}
                    placeholder="Accessibilité, régime alimentaire, autres demandes..."
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Submit Button */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={loading}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                className="bg-accent hover:bg-accent/90"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Inscription en cours...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Confirmer l'inscription
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default EnrollmentForm;




