import React from 'react';
import { 
  Linkedin, 
  Facebook, 
  Twitter, 
  Link as LinkIcon, 
  Check,
  Send
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface SocialShareProps {
  url: string;
  title: string;
  description?: string;
  language?: 'fr' | 'ar';
}

const SocialShare: React.FC<SocialShareProps> = ({ url, title, description, language = 'fr' }) => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const shareLinks = {
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
    whatsapp: `https://api.whatsapp.com/send?text=${encodeURIComponent(title + ' ' + url)}`
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      toast({
        title: language === 'ar' ? 'تم نسخ الرابط!' : 'Lien copié !',
        description: language === 'ar' ? 'يمكنك الآن مشاركته.' : 'Vous pouvez maintenant le partager.',
      });
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const t = {
    fr: { share: 'Partager cet article', copy: 'Copier le lien' },
    ar: { share: 'شارك هذا المقال', copy: 'نسخ الرابط' }
  }[language];

  return (
    <div className={`flex flex-col gap-4 py-8 border-t border-b border-border my-8 ${language === 'ar' ? 'items-end' : 'items-start'}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <h4 className="text-lg font-heading font-bold text-[#253b74]">
        {t.share}
      </h4>
      <div className="flex flex-wrap gap-3">
        <Button
          variant="outline"
          size="icon"
          className="rounded-full hover:bg-[#0077b5] hover:text-white transition-all"
          onClick={() => window.open(shareLinks.linkedin, '_blank')}
          title="LinkedIn"
        >
          <Linkedin className="w-5 h-5" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="rounded-full hover:bg-[#1877f2] hover:text-white transition-all"
          onClick={() => window.open(shareLinks.facebook, '_blank')}
          title="Facebook"
        >
          <Facebook className="w-5 h-5" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="rounded-full hover:bg-[#1da1f2] hover:text-white transition-all"
          onClick={() => window.open(shareLinks.twitter, '_blank')}
          title="Twitter"
        >
          <Twitter className="w-5 h-5" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="rounded-full hover:bg-[#25d366] hover:text-white transition-all"
          onClick={() => window.open(shareLinks.whatsapp, '_blank')}
          title="WhatsApp"
        >
          <Send className="w-5 h-5" />
        </Button>
        <Button
          variant="outline"
          className="rounded-full gap-2 hover:bg-primary hover:text-white transition-all"
          onClick={copyToClipboard}
        >
          {copied ? <Check className="w-4 h-4" /> : <LinkIcon className="w-4 h-4" />}
          {t.copy}
        </Button>
      </div>
    </div>
  );
};

export default SocialShare;
