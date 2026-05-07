import { useEffect } from 'react';

interface SEOProps {
  title: string;
  description: string;
  lang?: 'ar' | 'fr' | 'en';
  canonical?: string;
  schemaData?: object;
  noIndex?: boolean;
  noFollow?: boolean;
}

const SEO = ({ 
  title, 
  description, 
  lang = 'fr', 
  canonical, 
  schemaData, 
  noIndex = false, 
  noFollow = false 
}: SEOProps) => {
  useEffect(() => {
    // Update Title
    document.title = title;
    
    // Update Description and Open Graph
    const updateMeta = (name: string, content: string, property = false) => {
      const attr = property ? 'property' : 'name';
      let meta = document.querySelector(`meta[${attr}="${name}"]`);
      if (meta) {
        meta.setAttribute('content', content);
      } else {
        meta = document.createElement('meta');
        meta.setAttribute(attr, name);
        meta.setAttribute('content', content);
        document.head.appendChild(meta);
      }
    };

    updateMeta('description', description);
    updateMeta('og:title', title, true);
    updateMeta('og:description', description, true);
    updateMeta('twitter:title', title);
    updateMeta('twitter:description', description);

    // Robots Meta (noindex, nofollow)
    let robots = document.querySelector('meta[name="robots"]');
    const robotsContent = [
      noIndex ? 'noindex' : 'index',
      noFollow ? 'nofollow' : 'follow'
    ].join(', ');

    if (!robots && (noIndex || noFollow)) {
      robots = document.createElement('meta');
      robots.setAttribute('name', 'robots');
      document.head.appendChild(robots);
    }
    
    if (robots) {
      robots.setAttribute('content', robotsContent);
    }

    // Update HTML attributes
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';

    // Canonical link
    const existingLink = document.querySelector('link[rel="canonical"]');
    if (canonical) {
      if (existingLink) {
        existingLink.setAttribute('href', canonical);
      } else {
        const link = document.createElement('link');
        link.setAttribute('rel', 'canonical');
        link.setAttribute('href', canonical);
        document.head.appendChild(link);
      }
    } else if (existingLink) {
      existingLink.remove();
    }

    // JSON-LD Schema
    let script = document.querySelector('script[type="application/ld+json"]#seo-schema');
    if (schemaData) {
      if (!script) {
        script = document.createElement('script');
        script.setAttribute('type', 'application/ld+json');
        script.setAttribute('id', 'seo-schema');
        document.head.appendChild(script);
      }
      script.textContent = JSON.stringify(schemaData);
    } else if (script) {
      script.remove();
    }

  }, [title, description, lang, canonical, schemaData, noIndex, noFollow]);

  return null;
};

export default SEO;
