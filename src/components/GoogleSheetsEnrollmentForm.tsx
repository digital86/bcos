import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { SimpleSupabaseService } from '@/lib/supabaseSimple';
import type { Formation } from '../../supabase-config';

interface GoogleSheetsEnrollmentFormProps {
  course?: Formation;
  courseName?: string; // Backward compatibility
  language?: 'fr' | 'ar';
  courseId?: string; // Backward compatibility
  theme?: 'default' | 'transparent' | 'glass';
}

const GoogleSheetsEnrollmentForm = ({ 
  course,
  courseName = '', 
  language = 'fr',
  courseId = '',
  theme = 'default'
}: GoogleSheetsEnrollmentFormProps) => {
  const location = useLocation();
  
  // Get course name from course object or fallback to courseName prop
  const getCourseName = () => {
    if (course) {
      return language === 'ar' 
        ? (course.title_ar || course.title_fr || course.title || '')
        : (course.title_fr || course.title || '');
    }
    return courseName || '';
  };

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    company: '',
    email: '',
    courseName: getCourseName(),
    pageLanguage: language,
    source: 'organic',
    referrer: '',
    utmCampaign: '',
  });
  const [errors, setErrors] = useState({
    fullName: '',
    phone: '',
    email: '',
  });
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [pixelAlreadySent, setPixelAlreadySent] = useState(false);

  // Determine language from URL
  useEffect(() => {
    const currentUrl = location.pathname;
    const isArabic = currentUrl.includes('/ar/') || currentUrl.includes('/ar');
    const isFrench = currentUrl.includes('/fr/') || currentUrl.includes('/fr');
    
    const detectedLang = isArabic ? 'ar' : (isFrench ? 'fr' : language);
    setFormData(prev => ({ ...prev, pageLanguage: detectedLang }));
  }, [location.pathname, language]);

  // Update course name when course object or language changes
  useEffect(() => {
    const newCourseName = getCourseName();
    if (newCourseName) {
      setFormData(prev => ({ ...prev, courseName: newCourseName }));
    } else if (!courseName) {
      // Fallback: Extract course name from URL
      const pathParts = window.location.pathname.split('/');
      const coursePathIndicators = ['courses', 'cours', 'coming_soon_courses', 'دورات', 'الدورات', 'formation', 'formations'];
      
      let extractedCourseName = '';
      for (let i = 0; i < pathParts.length; i++) {
        if (coursePathIndicators.includes(pathParts[i]) && 
            i + 1 < pathParts.length && 
            pathParts[i+1] && 
            !['ar', 'fr', ''].includes(pathParts[i+1])) {
          extractedCourseName = pathParts[i+1];
          break;
        }
      }
      
      if (!extractedCourseName) {
        for (let i = pathParts.length - 1; i >= 0; i--) {
          if (pathParts[i] && !['ar', 'fr', ''].includes(pathParts[i])) {
            extractedCourseName = pathParts[i].split('?')[0];
            break;
          }
        }
      }
      
      const finalCourseName = extractedCourseName || (formData.pageLanguage === 'ar' ? 'دورة-غير-محددة' : 'cours-non-specifie');
      setFormData(prev => ({ ...prev, courseName: finalCourseName }));
    }
  }, [course, language, courseName, formData.pageLanguage]);

  // Get URL parameter
  const getUrlParameter = (name: string) => {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    const regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    const results = regex.exec(location.search);
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
  };

  // Determine source
  const determineSource = () => {
    let source = getUrlParameter('source') || getUrlParameter('utm_source');
    if (source) {
      source = source.toLowerCase();
      switch(source) {
        case 'mail':
        case 'email':
        case 'newsletter':
          return 'mail';
        case 'linkedin':
        case 'lnkd':
          return 'linkedin';
        case 'facebook':
        case 'fb':
          return 'facebook';
        case 'instagram':
        case 'ig':
          return 'instagram';
        case 'tiktok':
        case 'tt':
          return 'tiktok';
        case 'telegram':
        case 'tg':
          return 'telegram';
        case 'boost':
        case 'ad':
        case 'ads':
        case 'cpc':
        case 'paid':
          return 'boost';
      }
    }
    
    const referrer = document.referrer.toLowerCase();
    if (referrer) {
      if (referrer.includes('linkedin.com')) return 'linkedin';
      if (referrer.includes('facebook.com') || referrer.includes('fb.com')) return 'facebook';
      if (referrer.includes('instagram.com')) return 'instagram';
      if (referrer.includes('tiktok.com')) return 'tiktok';
      if (referrer.includes('t.me') || referrer.includes('telegram.me')) return 'telegram';
    }
    
    return 'organic';
  };

  // Initialize form data
  useEffect(() => {
    const sourceValue = determineSource();
    const utmCampaignValue = getUrlParameter('utm_campaign');
    
    setFormData(prev => ({
      ...prev,
      source: sourceValue,
      referrer: document.referrer || 'direct',
      utmCampaign: utmCampaignValue || (sourceValue === 'boost' ? 'Boosted - Campaign Name Missing' : 'N/A'),
    }));
  }, []);

  // Validation
  const validateForm = () => {
    const newErrors = {
      fullName: '',
      phone: '',
      email: '',
    };
    let isValid = true;

    // Full name validation
    if (formData.fullName.trim().length < 3) {
      newErrors.fullName = formData.pageLanguage === 'ar' 
        ? 'يرجى إدخال اسم كامل (3 أحرف على الأقل)' 
        : 'Veuillez entrer un nom complet (min 3 caractères)';
      isValid = false;
    }

    // Phone validation
    const phoneRegex = /^[+]*[(]{0,1}[0-9]{1,4}[)]{0,1}[-\s\./0-9]*$/;
    if (!phoneRegex.test(formData.phone) || formData.phone.trim().length < 7) {
      newErrors.phone = formData.pageLanguage === 'ar' 
        ? 'يرجى إدخال رقم هاتف صحيح' 
        : 'Veuillez entrer un numéro de téléphone valide';
      isValid = false;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      newErrors.email = formData.pageLanguage === 'ar' 
        ? 'يرجى إدخال بريد إلكتروني صالح' 
        : 'Veuillez entrer une adresse email valide';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  // Send to Telegram
  const sendToTelegram = async (data: any) => {
    const botToken = '7739138447:AAFZa1HPVQjCmIcXXJHrTRLdQ1tnGm544hY';
    const chatIds = ['7506216384', '-1002832788656'];

    let sourceIndicatorString;
    switch(data.source) {
      case 'mail': sourceIndicatorString = 'Email 📧'; break;
      case 'linkedin': sourceIndicatorString = 'LinkedIn 💼'; break;
      case 'facebook': sourceIndicatorString = 'Facebook 👥'; break;
      case 'instagram': sourceIndicatorString = 'Instagram 📸'; break;
      case 'tiktok': sourceIndicatorString = 'TikTok 🎵'; break;
      case 'telegram': sourceIndicatorString = 'Telegram 📱'; break;
      case 'boost': sourceIndicatorString = 'Boost 💵'; break;
      default: sourceIndicatorString = 'Organic 🟢';
    }

    let messageLines = [];
    if (data.error) {
      messageLines.push(`🚨 *فشل في إرسال النموذج* 🚨`);
      messageLines.push(`--------------------------------------`);
      messageLines.push(`حدث خطأ أثناء محاولة المستخدم إرسال النموذج. إليك البيانات التي حاول إرسالها:`);
      messageLines.push(`*👤 الاسم:* ${data.fullName || 'لم يتم إدخاله'}`);
      messageLines.push(`*☎️ الهاتف:* ${data.phone || 'لم يتم إدخاله'}`);
      messageLines.push(`*📨 البريد:* ${data.email || 'لم يتم إدخاله'}`);
      messageLines.push(`*🏢 الشركة:* ${data.company || 'لم يتم إدخاله'}`);
      messageLines.push(`*📖 الدورة:* ${data.courseName || 'غير محدد'}`);
      messageLines.push(`*🔍 الخطأ:* ${data.error}`);
    } else if (data.pageLanguage === 'ar') {
      messageLines.push(`🔔 *تسجيل جديد لدورة: ${data.courseName || 'غير محدد'}*`);
      messageLines.push(`--------------------------------------`);
      messageLines.push(`*👤 الاسم:* ${data.fullName || 'غير محدد'}`);
      messageLines.push(`*☎️ الهاتف:* \`${data.phone || 'غير محدد'}\``);
      messageLines.push(`*📨 البريد:* ${data.email || 'غير محدد'}`);
      if (data.company && data.company !== 'غير محدد') {
        messageLines.push(`*🏢 الشركة:* ${data.company}`);
      }
      messageLines.push(`*🌐 لغة الصفحة:* عربي`);
      messageLines.push(`*📌 المصدر:* ${sourceIndicatorString}`);
      if (data.source === 'boost' && data.utmCampaign && data.utmCampaign !== 'N/A' && !data.utmCampaign.includes('Missing')) {
        messageLines.push(`*📣 الحملة (UTM):* ${data.utmCampaign}`);
      } else if (data.source === 'boost') {
        messageLines.push(`*📣 الحملة (UTM):* (غير محددة في الرابط)`);
      }
      messageLines.push(`*📅 تاريخ التسجيل:* ${data.dateInscription || 'غير محدد'}`);
      if (data.referrer && data.referrer !== 'direct') {
        messageLines.push(`*🔗 المصدر المحيل:* ${data.referrer}`);
      }
    } else {
      messageLines.push(`🔔 *Nouvelle inscription pour le cours: ${data.courseName || 'Non spécifié'}*`);
      messageLines.push(`--------------------------------------`);
      messageLines.push(`*👤 Nom:* ${data.fullName || 'Non spécifié'}`);
      messageLines.push(`*☎️ Téléphone:* \`${data.phone || 'Non spécifié'}\``);
      messageLines.push(`*📥 Email:* ${data.email || 'Non spécifié'}`);
      if (data.company && data.company !== 'Non spécifiée') {
        messageLines.push(`*🏢 Entreprise:* ${data.company}`);
      }
      messageLines.push(`*🌐 Langue page:* Français`);
      messageLines.push(`*📌 Source:* ${sourceIndicatorString}`);
      if (data.source === 'boost' && data.utmCampaign && data.utmCampaign !== 'N/A' && !data.utmCampaign.includes('Missing')) {
        messageLines.push(`*📣 Campagne (UTM):* ${data.utmCampaign}`);
      } else if (data.source === 'boost') {
        messageLines.push(`*📣 Campagne (UTM):* (Non spécifiée dans l'URL)`);
      }
      messageLines.push(`*📅 Date inscription:* ${data.dateInscription || 'Non spécifiée'}`);
      if (data.referrer && data.referrer !== 'direct') {
        messageLines.push(`*🔗 Référant:* ${data.referrer}`);
      }
    }

    const message = messageLines.join('\n');
    const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;

    chatIds.forEach(id => {
      fetch(telegramUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: id, text: message, parse_mode: 'Markdown' })
      })
      .then(response => {
        if (!response.ok) {
          return response.json().then(err => { 
            throw new Error(`[Chat ID: ${id}] ${err.description || response.statusText}`); 
          });
        }
        return response.json();
      })
      .then(telegramResponse => {
        console.log(`Message sent to Telegram chat ${id}:`, telegramResponse);
      })
      .catch(error => {
        console.error(`Error sending message to Telegram chat ${id}:`, error);
      });
    });
  };

  // Submit to Google Sheets
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    const scriptURL = 'https://script.google.com/macros/s/AKfycbwUS883ztfaHTzSipWT6LMoiLY0vZwQU2EsOTgK8NhwH7fc1O6UXbRz2iLKHIiy_VdYag/exec';
    
    const submitData = {
      ...formData,
      dateInscription: new Date().toLocaleString('fr-FR', { timeZone: 'Africa/Algiers' }),
      company: formData.company || (formData.pageLanguage === 'ar' ? 'غير محدد' : 'Non spécifiée'),
    };

    const formDataToSend = new FormData();
    Object.entries(submitData).forEach(([key, value]) => {
      formDataToSend.append(key, String(value));
    });

    // Show success immediately (optimistic UI)
    setShowSuccess(true);
    
    // Reset form immediately
    setFormData({
      fullName: '',
      phone: '',
      company: '',
      email: '',
      courseName: formData.courseName,
      pageLanguage: formData.pageLanguage,
      source: formData.source,
      referrer: formData.referrer,
      utmCampaign: formData.utmCampaign,
    });

    // Get course ID from course object or fallback to courseId prop
    const finalCourseId = course?.id || courseId || null;
    
    // Get course price (price_ttc or price)
    const coursePrice = course?.price_ttc || course?.price || 0;
    
    // Prepare enrollment data
    const enrollmentData: any = {
      formation_id: finalCourseId,
      course_id: finalCourseId, // Backward compatibility
      full_name: submitData.fullName.trim(),
      email: submitData.email.trim().toLowerCase(),
      phone: submitData.phone.trim(),
      company: submitData.company && submitData.company !== 'غير محدد' && submitData.company !== 'Non spécifiée' 
        ? submitData.company.trim() 
        : null,
      status: 'pending', // Must be: pending, confirmed, completed, or cancelled
      lead_status: 'nouveau', // Must be: nouveau, confirme, a_confirme, nos_repond_pas, pas_interest
      lead_source: submitData.source || 'website',
      amount_paid: coursePrice > 0 ? coursePrice : null, // Auto-set course price
      language_preference: submitData.pageLanguage || 'fr',
      how_did_you_hear: submitData.source || 'website',
    };

    // Try to find formation by slug if course ID not provided (async, non-blocking)
    const findFormationPromise = !finalCourseId && submitData.courseName
      ? (async () => {
          try {
            const pathParts = location.pathname.split('/');
            let slug = '';
            for (let i = pathParts.length - 1; i >= 0; i--) {
              if (pathParts[i] && !['ar', 'fr', 'formation', 'formations', 'course', 'courses', ''].includes(pathParts[i])) {
                slug = pathParts[i].split('?')[0];
                break;
              }
            }
            
            if (slug) {
              const formation = await SimpleSupabaseService.getFormationBySlugSimple(slug);
              if (formation) {
                enrollmentData.formation_id = formation.id;
                enrollmentData.course_id = formation.id;
              }
            }
          } catch (err) {
            console.warn('Could not find formation by slug:', err);
          }
        })()
      : Promise.resolve();

    // Execute all operations in parallel (non-blocking)
    Promise.allSettled([
      // 1. Submit to Google Sheets (no-cors, fire and forget)
      fetch(scriptURL, {
        method: 'POST',
        mode: 'no-cors',
        body: formDataToSend
      }).then(() => console.log('✅ Google Sheets: Form submitted')),
      
      // 2. Find formation if needed, then save to Supabase
      findFormationPromise.then(() => 
        SimpleSupabaseService.createEnrollment(enrollmentData)
          .then(() => console.log('✅ Supabase: Enrollment saved'))
          .catch((err: any) => console.error('❌ Supabase error:', err))
      ),
      
      // 3. Send to Telegram (fire and forget)
      Promise.resolve(sendToTelegram(submitData)),
      
      // 4. Facebook Pixel tracking (synchronous, already done)
    ]).catch((err) => {
      console.error('Error in parallel operations:', err);
    });

    // Facebook Pixel tracking (synchronous, immediate)
    if (typeof (window as any).fbq !== 'undefined' && !pixelAlreadySent) {
      setPixelAlreadySent(true);
      (window as any).fbq('track', 'CompleteRegistration', {
        content_name: submitData.courseName || course?.title_fr || course?.title || 'Formation',
        content_category: 'Formation',
        value: course?.price_ttc || course?.price || 0,
        currency: course?.currency || 'DZD',
        content_type: 'product',
        num_items: 1,
        course_id: course?.id || 'unknown',
        course_name: submitData.courseName || course?.title_fr || course?.title || 'Formation',
        course_category: course?.category?.name_fr || course?.category?.name || 'unknown',
        course_price: course?.price_ttc || course?.price || 0,
        course_level: course?.level || 'unknown',
        course_duration: course?.duration || 'unknown',
        course_month: new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' }).toLowerCase()
      });
      console.log('✅ Facebook Pixel: CompleteRegistration event tracked');
    }

    // Set loading to false immediately (optimistic UI)
    setLoading(false);
  };

  const isArabic = formData.pageLanguage === 'ar';
  const dir = isArabic ? 'rtl' : 'ltr';

  return (
    <>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Cairo:wght@400;600;700&display=swap" />
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />
      
      <div className={`gs-form-container gs-theme-${theme}`} style={{ direction: dir }}>
        <div className="gs-form-content">
          <form id="gsRegistrationForm" onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="gs-form-group">
                <label className="gs-label">
                  {isArabic ? 'الاسم الكامل' : 'Nom complet'}
                </label>
                <div className="gs-input-wrapper">
                  <span className="material-symbols-outlined gs-input-icon">
                    person
                  </span>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                    placeholder={isArabic ? 'الإسم و اللقب' : 'Jean Dupont'}
                    required
                    className={`gs-input ${errors.fullName ? 'invalid' : ''}`}
                  />
                </div>
                {errors.fullName && <p className="gs-error">{errors.fullName}</p>}
              </div>

              <div className="gs-form-group">
                <label className="gs-label">
                  {isArabic ? 'رقم الهاتف' : 'Téléphone'}
                </label>
                <div className="gs-input-wrapper">
                  <span className="material-symbols-outlined gs-input-icon">
                    call
                  </span>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder={isArabic ? 'أدخل رقم هاتفك' : '05 / 06 / 07...'}
                    required
                    className={`gs-input ${errors.phone ? 'invalid' : ''}`}
                  />
                </div>
                {errors.phone && <p className="gs-error">{errors.phone}</p>}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="gs-form-group">
                <label className="gs-label">
                  {isArabic ? 'البريد الإلكتروني' : 'Adresse email'}
                </label>
                <div className="gs-input-wrapper">
                  <span className="material-symbols-outlined gs-input-icon">
                    mail
                  </span>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="exemple@mail.com"
                    required
                    className={`gs-input ${errors.email ? 'invalid' : ''}`}
                  />
                </div>
                {errors.email && <p className="gs-error">{errors.email}</p>}
              </div>

              <div className="gs-form-group">
                <label className="gs-label">
                  {isArabic ? 'الشركة / المؤسسة' : 'Entreprise / Organisme'}
                </label>
                <div className="gs-input-wrapper">
                  <span className="material-symbols-outlined gs-input-icon">
                    corporate_fare
                  </span>
                  <input
                    type="text"
                    name="company"
                    value={formData.company}
                    onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                    placeholder={isArabic ? 'اسم شركتك (اختياري)' : 'Nom de votre entreprise'}
                    className="gs-input"
                  />
                </div>
              </div>
            </div>

            <div className="gs-submit-区域 pt-4">
              <button 
                type="submit" 
                className="gs-premium-btn group" 
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-3">
                    <div className="gs-spinner"></div>
                    <span>{isArabic ? 'جاري الإرسال...' : 'Envoi en cours...'}</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <span>{isArabic ? 'تأكيد التسجيل الآن' : 'CONFIRMER L\'INSCRIPTION'}</span>
                    <span className={`material-symbols-outlined transition-transform duration-300 group-hover:translate-x-1 ${isArabic ? 'rotate-180' : ''}`}>
                      arrow_forward
                    </span>
                  </div>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {showSuccess && (
        <div className="gs-modal-overlay">
          <div className="gs-modal-card" style={{ direction: dir }}>
            <div className="gs-success-icon-bg">
              <span className="material-symbols-outlined gs-success-check">check</span>
            </div>
            <h3 className="gs-modal-title">
              {isArabic ? 'تم بنجاح!' : 'Félicitations !'}
            </h3>
            <p className="gs-modal-text">
              {isArabic 
                ? 'شكراً لثقتكم. تم استلام طلبكم وسنتواصل معكم في أقرب وقت لتأكيد التسجيل.' 
                : 'Votre demande a été enregistrée avec succès. Notre équipe vous contactera sous peu pour finaliser votre inscription.'}
            </p>
            <button className="gs-modal-close" onClick={() => setShowSuccess(false)}>
              {isArabic ? 'فهمت' : 'D\'accord'}
            </button>
          </div>
        </div>
      )}

      <style>{`
        .gs-form-container {
          width: 100%;
          font-family: ${isArabic ? "'Cairo', sans-serif" : "'Inter', sans-serif"};
          padding: 1rem 0;
        }

        .gs-form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .gs-label {
          font-size: 0.95rem;
          font-weight: 600;
          color: #253b74;
          margin-bottom: 2px;
          opacity: 0.9;
        }

        .gs-input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .gs-input-icon {
          position: absolute;
          ${isArabic ? 'right' : 'left'}: 1rem;
          color: #253b74;
          opacity: 0.4;
          font-size: 1.25rem;
          pointer-events: none;
          transition: opacity 0.3s ease;
        }

        .gs-input {
          width: 100%;
          padding: 0.875rem 1rem;
          ${isArabic ? 'padding-right' : 'padding-left'}: 3.25rem;
          border: 2px solid #e2e8f0;
          border-radius: 14px;
          color: #1e293b;
          font-size: 1rem;
          background-color: #f8fafc;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          outline: none;
          box-sizing: border-box;
        }

        .gs-input::placeholder {
          color: #94a3b8;
          opacity: 0.8;
        }

        .gs-input:focus {
          border-color: #253b74;
          background-color: white;
          box-shadow: 0 0 0 4px rgba(37, 59, 116, 0.08);
        }

        .gs-input:focus + .gs-input-icon {
          opacity: 1;
          color: #253b74;
        }

        .gs-input.invalid {
          border-color: #ef4444;
          background-color: #fef2f2;
        }

        .gs-error {
          font-size: 0.75rem;
          color: #ef4444;
          font-weight: 500;
          margin-top: 0.25rem;
        }

        /* Premium Button */
        .gs-premium-btn {
          width: 100%;
          padding: 1.125rem;
          background: linear-gradient(135deg, #253b74 0%, #1e293b 100%);
          color: white;
          border: none;
          border-radius: 14px;
          font-size: 1rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          box-shadow: 0 4px 15px rgba(37, 59, 116, 0.15);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .gs-premium-btn:hover:not(:disabled) {
          transform: translateY(-2px) scale(1.01);
          box-shadow: 0 8px 25px rgba(37, 59, 116, 0.25);
          background: linear-gradient(135deg, #2d468a 0%, #253b74 100%);
        }

        .gs-premium-btn:active:not(:disabled) {
          transform: translateY(0) scale(0.98);
        }

        .gs-premium-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          filter: grayscale(0.5);
        }

        /* Spinner */
        .gs-spinner {
          width: 1.25rem;
          height: 1.25rem;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: gs-spin 0.8s linear infinite;
        }

        @keyframes gs-spin {
          to { transform: rotate(360deg); }
        }

        /* Glass Theme Adjustments */
        .gs-theme-glass .gs-input {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: white;
          backdrop-filter: blur(8px);
        }
        .gs-theme-glass .gs-label {
          color: white;
        }
        .gs-theme-glass .gs-input-icon {
          color: white;
        }
        .gs-theme-glass .gs-input:focus {
          background: rgba(255, 255, 255, 0.1);
          border-color: #bef264;
          box-shadow: 0 0 0 4px rgba(190, 242, 100, 0.2);
        }
        .gs-theme-glass .gs-premium-btn {
          background: #bef264;
          color: #1a237e;
        }

        /* Success Modal */
        .gs-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.7);
          backdrop-filter: blur(10px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
          padding: 1rem;
          animation: gs-fade-in 0.3s ease;
        }

        .gs-modal-card {
          background: white;
          padding: 2.5rem;
          border-radius: 28px;
          max-width: 440px;
          width: 100%;
          text-align: center;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          transform: translateY(0);
          animation: gs-modal-pop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        @keyframes gs-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes gs-modal-pop {
          from { transform: scale(0.9) translateY(20px); opacity: 0; }
          to { transform: scale(1) translateY(0); opacity: 1; }
        }

        .gs-success-icon-bg {
          width: 80px;
          height: 80px;
          background: #f0fdf4;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1.5rem;
        }

        .gs-success-check {
          color: #22c55e;
          font-size: 3rem !important;
          font-weight: bold;
        }

        .gs-modal-title {
          font-size: 1.75rem;
          font-weight: 800;
          color: #1e293b;
          margin-bottom: 1rem;
        }

        .gs-modal-text {
          color: #64748b;
          line-height: 1.6;
          margin-bottom: 2rem;
          font-size: 1rem;
        }

        .gs-modal-close {
          width: 100%;
          padding: 1rem;
          background: #f1f5f9;
          color: #1e293b;
          border: none;
          border-radius: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
        }

        .gs-modal-close:hover {
          background: #e2e8f0;
          transform: translateY(-1px);
        }

        @media (max-width: 768px) {
          .gs-input {
            padding: 0.75rem 1rem;
            ${isArabic ? 'padding-right' : 'padding-left'}: 2.75rem;
            font-size: 0.95rem;
          }
          .gs-input-icon {
            font-size: 1.1rem;
          }
        }
      `}</style>
    </>
  );
};

export default GoogleSheetsEnrollmentForm;
