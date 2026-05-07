/**
 * Generates JSON-LD structured data for various types
 */

export const generateOrganizationSchema = (lang: 'ar' | 'fr' = 'fr') => {
  return {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    "name": "BCOS Formation & Conseil",
    "alternateName": lang === 'ar' ? "بيكوص للتدريب والاستشارات" : "BCOS",
    "url": "https://bcos-dz.com",
    "logo": "https://bcos-dz.com/logo.png",
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "213542761931",
      "contactType": "customer service",
      "areaServed": "DZ",
      "availableLanguage": ["Arabic", "French"]
    },
    "sameAs": [
      "https://www.facebook.com/bcosdz",
      "https://www.linkedin.com/company/bcosdz/",
      "https://www.instagram.com/bcos.alg/",
      "https://www.youtube.com/@BCOSConseilFormation"
    ],
    "description": lang === 'ar' 
      ? "مؤسسة تدريب واستشارات في مجال إدارة وتسيير الشركات في الجزائر."
      : "Institution de formation et de conseil dans le domaine de la gestion et de l'administration des entreprises en Algérie."
  };
};

export const generateCourseSchema = (course: {
  name: string;
  description: string;
  provider: string;
  url: string;
  image?: string;
  offers?: {
    price: number;
    priceCurrency: string;
  };
  aggregateRating?: {
    ratingValue: number;
    reviewCount: number;
  };
}) => {
  return {
    "@context": "https://schema.org",
    "@type": "Course",
    "name": course.name,
    "description": course.description,
    "provider": {
      "@type": "Organization",
      "name": course.provider,
      "sameAs": "https://bcos-dz.com"
    },
    "url": course.url,
    ...(course.image && { "image": course.image }),
    ...(course.offers && {
      "offers": {
        "@type": "Offer",
        "price": course.offers.price,
        "priceCurrency": course.offers.priceCurrency,
        "availability": "https://schema.org/InStock"
      }
    }),
    ...(course.aggregateRating && {
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": course.aggregateRating.ratingValue,
        "reviewCount": course.aggregateRating.reviewCount,
        "bestRating": "5",
        "worstRating": "1"
      }
    })
  };
};

export const generateLocalBusinessSchema = (lang: 'ar' | 'fr' = 'fr') => {
  return {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    "name": "BCOS Formation & Conseil",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Cité 100 logts, Les Sources, Bir Mourad Raïs",
      "addressLocality": "Alger",
      "addressRegion": "Alger",
      "postalCode": "16000",
      "addressCountry": "DZ"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": "36.7323",
      "longitude": "3.0487"
    },
    "url": "https://bcos-dz.com",
    "telephone": "213542761931",
    "priceRange": "$$",
    "openingHoursSpecification": [
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Sunday"],
        "opens": "08:30",
        "closes": "17:30"
      }
    ],
    "description": lang === 'ar' 
      ? "مركز تدريب واستشارات رائد في الجزائر متخصص في تطوير المهارات المهنية والتميز الإداري."
      : "Centre de formation et de conseil leader en Algérie, spécialisé dans le développement des compétences professionnelles et l'excellence managériale."
  };
};

export const generateBreadcrumbSchema = (items: { name: string; url: string }[]) => {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.url
    }))
  };
};

export const generateArticleSchema = (article: {
  title: string;
  description: string;
  image: string;
  author: string;
  datePublished: string;
  url: string;
}) => {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": article.title,
    "description": article.description,
    "image": article.image,
    "author": {
      "@type": "Person",
      "name": article.author
    },
    "publisher": {
      "@type": "Organization",
      "name": "BCOS",
      "logo": {
        "@type": "ImageObject",
        "url": "https://bcos-dz.com/logo.png"
      }
    },
    "datePublished": article.datePublished,
    "url": article.url
  };
};
