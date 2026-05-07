import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { SimpleSupabaseService } from '@/lib/supabaseSimple';

interface EventFormProps {
  language?: 'fr' | 'ar';
}

const EventForm = ({ language: propLanguage = 'fr' }: EventFormProps) => {
  const location = useLocation();
  const [language, setLanguage] = useState<'fr' | 'ar'>(propLanguage);
  
  useEffect(() => {
    const path = location.pathname;
    if (path.startsWith('/ar/')) {
      setLanguage('ar');
    } else {
      setLanguage('fr');
    }
  }, [location.pathname]);

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    company: '',
    email: '',
    pageLanguage: language,
    source: 'organic',
    referrer: '',
    utmCampaign: '',
  });

  const [errors, setErrors] = useState({
    fullName: '',
    phone: '',
    email: '',
    company: '',
  });

  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Determine source
  const determineSource = () => {
    const urlParams = new URLSearchParams(location.search);
    let source = urlParams.get('source') || urlParams.get('utm_source') || '';
    
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
    const source = determineSource();
    const referrer = document.referrer || 'direct';
    const urlParams = new URLSearchParams(location.search);
    const utmCampaign = urlParams.get('utm_campaign') || urlParams.get('campaign') || 'N/A';

    setFormData(prev => ({
      ...prev,
      source,
      referrer,
      utmCampaign,
      pageLanguage: language,
    }));
  }, [location, language]);

  const validateForm = () => {
    const newErrors: typeof errors = {
      fullName: '',
      phone: '',
      email: '',
      company: '',
    };

    let isValid = true;

    if (!formData.fullName.trim() || formData.fullName.trim().length < 3) {
      newErrors.fullName = language === 'ar' 
        ? 'يرجى إدخال اسم كامل (3 أحرف على الأقل)' 
        : 'Veuillez entrer un nom complet (min 3 caractères)';
      isValid = false;
    }

    const phoneRegex = /^[+]*[(]{0,1}[0-9]{1,4}[)]{0,1}[-\s\./0-9]*$/;
    if (!formData.phone.trim() || !phoneRegex.test(formData.phone) || formData.phone.trim().length < 7) {
      newErrors.phone = language === 'ar' 
        ? 'يرجى إدخال رقم هاتف صحيح' 
        : 'Veuillez entrer un numéro de téléphone valide';
      isValid = false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim() || !emailRegex.test(formData.email)) {
      newErrors.email = language === 'ar' 
        ? 'يرجى إدخال بريد إلكتروني صالح' 
        : 'Veuillez entrer une adresse email valide';
      isValid = false;
    }

    if (!formData.company.trim()) {
      newErrors.company = language === 'ar' 
        ? 'يرجى إدخال اسم الشركة' 
        : 'Veuillez entrer le nom de l\'entreprise';
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
    if (data.pageLanguage === 'ar') {
      messageLines.push(`🎉 *طلب جديد لتنظيم فعالية* 🎉`);
      messageLines.push(`--------------------------------------`);
      messageLines.push(`*👤 الاسم:* ${data.fullName || 'غير محدد'}`);
      messageLines.push(`*☎️ الهاتف:* \`${data.phone || 'غير محدد'}\``);
      messageLines.push(`*📨 البريد:* ${data.email || 'غير محدد'}`);
      messageLines.push(`*🏢 الشركة:* ${data.company || 'غير محدد'}`);
      messageLines.push(`*🌐 لغة الصفحة:* عربي`);
      messageLines.push(`*📌 المصدر:* ${sourceIndicatorString}`);
      if (data.source === 'boost' && data.utmCampaign && data.utmCampaign !== 'N/A') {
        messageLines.push(`*📣 الحملة (UTM):* ${data.utmCampaign}`);
      }
      messageLines.push(`*📅 تاريخ الطلب:* ${data.dateRequest || 'غير محدد'}`);
      if (data.referrer && data.referrer !== 'direct') {
        messageLines.push(`*🔗 المصدر المحيل:* ${data.referrer}`);
      }
    } else {
      messageLines.push(`🎉 *Nouvelle demande d'organisation d'événement* 🎉`);
      messageLines.push(`--------------------------------------`);
      messageLines.push(`*👤 Nom:* ${data.fullName || 'Non spécifié'}`);
      messageLines.push(`*☎️ Téléphone:* \`${data.phone || 'Non spécifié'}\``);
      messageLines.push(`*📥 Email:* ${data.email || 'Non spécifié'}`);
      messageLines.push(`*🏢 Entreprise:* ${data.company || 'Non spécifié'}`);
      messageLines.push(`*🌐 Langue page:* Français`);
      messageLines.push(`*📌 Source:* ${sourceIndicatorString}`);
      if (data.source === 'boost' && data.utmCampaign && data.utmCampaign !== 'N/A') {
        messageLines.push(`*📣 Campagne (UTM):* ${data.utmCampaign}`);
      }
      messageLines.push(`*📅 Date demande:* ${data.dateRequest || 'Non spécifiée'}`);
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
        console.log(`✅ Message sent to Telegram chat ${id}:`, telegramResponse);
      })
      .catch(error => {
        console.error(`❌ Error sending message to Telegram chat ${id}:`, error);
      });
    });
  };

  // Submit to Google Sheets and Telegram
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    const scriptURL = 'https://script.google.com/macros/s/AKfycbwUS883ztfaHTzSipWT6LMoiLY0vZwQU2EsOTgK8NhwH7fc1O6UXbRz2iLKHIiy_VdYag/exec';
    
    const submitData = {
      ...formData,
      dateRequest: new Date().toLocaleString('fr-FR', { timeZone: 'Africa/Algiers' }),
      requestType: 'event_organization',
      courseName: language === 'ar' ? 'تنظيم فعالية' : 'Organisation d\'événement',
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
      pageLanguage: language,
      source: formData.source,
      referrer: formData.referrer,
      utmCampaign: formData.utmCampaign,
    });

    // Prepare event request data for Supabase
    const eventRequestData: any = {
      full_name: submitData.fullName.trim(),
      email: submitData.email.trim().toLowerCase(),
      phone: submitData.phone.trim(),
      company: submitData.company.trim(),
      status: 'new',
      source: submitData.source || 'website',
      language_preference: submitData.pageLanguage || 'fr',
      request_type: 'event_organization',
    };

    // Execute all operations in parallel (non-blocking)
    Promise.allSettled([
      // 1. Submit to Google Sheets (no-cors, fire and forget)
      fetch(scriptURL, {
        method: 'POST',
        mode: 'no-cors',
        body: formDataToSend
      }).then(() => console.log('✅ Google Sheets: Event request submitted')),
      
      // 2. Save to Supabase
      SimpleSupabaseService.createEventRequest(eventRequestData)
        .then(() => console.log('✅ Supabase: Event request saved'))
        .catch((err: any) => console.error('❌ Supabase error:', err)),
      
      // 3. Send to Telegram (fire and forget)
      Promise.resolve(sendToTelegram(submitData)),
    ]).catch((err) => {
      console.error('Error in parallel operations:', err);
    });

    // Set loading to false immediately (optimistic UI)
    setLoading(false);
  };

  const isArabic = language === 'ar';
  const dir = isArabic ? 'rtl' : 'ltr';

  return (
    <>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Lato&family=Open+Sans&display=swap" />
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cairo:wght@200..1000&display=swap" />
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />
      
      <div className="gs-form-container" style={{ direction: dir, textAlign: isArabic ? 'right' : 'left' }}>
        <div className="gs-form-content">
          <form id="gsEventForm" onSubmit={handleSubmit}>
            <div className="gs-form-group">
              <label htmlFor="gsEventFullName">
                {isArabic ? 'الاسم الكامل' : 'Nom complet'}
              </label>
              <div className="gs-input-container">
                <span className="material-symbols-outlined gs-input-icon" style={{ [isArabic ? 'right' : 'left']: '20px' }}>
                  person
                </span>
                <input
                  type="text"
                  id="gsEventFullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                  placeholder={isArabic ? 'الإسم و اللقب' : 'Jean Dupont'}
                  required
                  className={errors.fullName ? 'invalid' : ''}
                  style={{ 
                    textAlign: isArabic ? 'right' : 'left',
                    padding: isArabic ? '0 60px 0 20px' : '0 20px 0 60px'
                  }}
                />
              </div>
              {errors.fullName && (
                <div className="gs-error-message" style={{ display: 'block' }}>
                  {errors.fullName}
                </div>
              )}
            </div>

            <div className="gs-form-group">
              <label htmlFor="gsEventPhone">
                {isArabic ? 'رقم الهاتف' : 'Téléphone'}
              </label>
              <div className="gs-input-container">
                <span className="material-symbols-outlined gs-input-icon" style={{ [isArabic ? 'right' : 'left']: '20px' }}>
                  call
                </span>
                <input
                  type="tel"
                  id="gsEventPhone"
                  name="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder={isArabic ? 'أدخل رقم هاتفك' : 'Entrez votre numéro'}
                  required
                  className={errors.phone ? 'invalid' : ''}
                  style={{ 
                    textAlign: isArabic ? 'right' : 'left',
                    padding: isArabic ? '0 60px 0 20px' : '0 20px 0 60px'
                  }}
                />
              </div>
              {errors.phone && (
                <div className="gs-error-message" style={{ display: 'block' }}>
                  {errors.phone}
                </div>
              )}
            </div>

            <div className="gs-form-group">
              <label htmlFor="gsEventCompany">
                {isArabic ? 'الشركة' : 'Entreprise'}
              </label>
              <div className="gs-input-container">
                <span className="material-symbols-outlined gs-input-icon" style={{ [isArabic ? 'right' : 'left']: '20px' }}>
                  business
                </span>
                <input
                  type="text"
                  id="gsEventCompany"
                  name="company"
                  value={formData.company}
                  onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                  placeholder={isArabic ? 'اسم شركتك' : 'Nom de votre entreprise'}
                  required
                  className={errors.company ? 'invalid' : ''}
                  style={{ 
                    textAlign: isArabic ? 'right' : 'left',
                    padding: isArabic ? '0 60px 0 20px' : '0 20px 0 60px'
                  }}
                />
              </div>
              {errors.company && (
                <div className="gs-error-message" style={{ display: 'block' }}>
                  {errors.company}
                </div>
              )}
            </div>

            <div className="gs-form-group">
              <label htmlFor="gsEventEmail">
                {isArabic ? 'البريد الإلكتروني' : 'Adresse email'}
              </label>
              <div className="gs-input-container">
                <span className="material-symbols-outlined gs-input-icon" style={{ [isArabic ? 'right' : 'left']: '20px' }}>
                  mail
                </span>
                <input
                  type="email"
                  id="gsEventEmail"
                  name="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder={isArabic ? 'البريد الإلكتروني' : 'exemple@domaine.com'}
                  required
                  className={errors.email ? 'invalid' : ''}
                  style={{ 
                    textAlign: isArabic ? 'right' : 'left',
                    padding: isArabic ? '0 60px 0 20px' : '0 20px 0 60px'
                  }}
                />
              </div>
              {errors.email && (
                <div className="gs-error-message" style={{ display: 'block' }}>
                  {errors.email}
                </div>
              )}
            </div>

            <input type="hidden" id="gsRequestType" name="requestType" value="event_organization" />
            <input type="hidden" id="gsPageLanguage" name="pageLanguage" value={formData.pageLanguage} />
            <input type="hidden" id="gsSource" name="source" value={formData.source} />
            <input type="hidden" id="gsReferrer" name="referrer" value={formData.referrer} />
            <input type="hidden" id="gsUtmCampaign" name="utmCampaign" value={formData.utmCampaign} />

            <div className="gs-submit-container">
              <button 
                type="submit" 
                className="gs-submit-btn" 
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="gs-loader" style={{ display: 'inline-block', marginRight: '10px' }}></div>
                    {isArabic ? 'جاري الإرسال...' : 'Envoi en cours...'}
                  </>
                ) : (
                  isArabic ? 'سجل الآن' : 'INSCRIVEZ-VOUS MAINTENANT'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Success Popup */}
      {showSuccess && (
        <div className="gs-popup gs-show">
          <div className="gs-popup-content" style={{ direction: dir }}>
            <span className="material-symbols-outlined gs-popup-icon">check_circle</span>
            <h3 className="gs-popup-title">
              {isArabic ? 'تم التسجيل بنجاح!' : 'Demande envoyée avec succès !'}
            </h3>
            <p className="gs-popup-message">
              {isArabic 
                ? 'شكراً لتسجيلك. سنتواصل معك قريباً.' 
                : 'Merci pour votre demande. Nous vous contacterons bientôt.'}
            </p>
            <button 
              className="gs-popup-btn" 
              onClick={() => setShowSuccess(false)}
            >
              {isArabic ? 'إغلاق' : 'Fermer'}
            </button>
          </div>
        </div>
      )}

      <style>{`
        .gs-form-container {
          font-family: ${isArabic ? '"Cairo", sans-serif' : "'Open Sans', sans-serif"};
          width: 100%;
          max-width: 100%;
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
          padding: 40px 50px;
          box-sizing: border-box;
          margin: 0 auto;
        }
        ${isArabic ? `
        .gs-form-container,
        .gs-form-container *,
        .gs-form-container label,
        .gs-form-container input,
        .gs-form-container input::placeholder,
        .gs-error-message,
        .gs-submit-btn,
        .gs-popup-title,
        .gs-popup-message,
        .gs-popup-btn {
          font-family: "Cairo", sans-serif !important;
        }
        ` : ''}
        .gs-form-content {
          display: flex;
          flex-direction: column;
          gap: 30px;
          max-width: 100%;
          margin: 0 auto;
        }
        .gs-form-group {
          margin-bottom: 0;
          width: 100%;
        }
        .gs-form-container label {
          display: block;
          margin-bottom: 12px;
          font-size: 18px;
          font-weight: 600;
          color: #1a237e;
        }
        .gs-input-container {
          position: relative;
          height: 60px;
          width: 100%;
        }
        .gs-input-icon {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          color: #5c6bc0;
          font-size: 24px;
        }
        .gs-form-container input {
          width: 100%;
          height: 100%;
          border: 2px solid #e2e8f0;
          border-radius: 10px;
          font-size: 18px;
          transition: all 0.3s;
          box-sizing: border-box;
          color: #1a237e;
          font-family: ${isArabic ? '"Cairo", sans-serif' : "'Open Sans', sans-serif"};
        }
        .gs-form-container input:focus {
          outline: none;
          border-color: #1a237e;
          box-shadow: 0 0 0 4px rgba(26, 35, 126, 0.2);
        }
        .gs-form-container input.invalid {
          border-color: #e53e3e;
        }
        .gs-error-message {
          color: #e53e3e;
          font-size: 16px;
          margin-top: 8px;
        }
        .gs-submit-container {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #e2e8f0;
          width: 100%;
        }
        .gs-submit-btn {
          width: 100%;
          background-color: #1a237e;
          color: white;
          border: none;
          padding: 20px;
          border-radius: 10px;
          font-size: 20px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
          text-transform: uppercase;
          letter-spacing: 1px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .gs-submit-btn:disabled {
          background-color: #9fa8da;
          cursor: not-allowed;
        }
        .gs-submit-btn:hover:not(:disabled) {
          background-color: #0d153d;
          transform: translateY(-3px);
          box-shadow: 0 6px 16px rgba(26, 35, 126, 0.3);
        }
        .gs-loader {
          border: 5px solid #f3f3f3;
          border-radius: 50%;
          border-top: 5px solid #1a237e;
          width: 30px;
          height: 30px;
          animation: gs-spin 1s linear infinite;
        }
        @keyframes gs-spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .gs-popup {
          display: none;
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 0, 0.7);
          z-index: 99999;
          justify-content: center;
          align-items: center;
          opacity: 0;
          transition: opacity 0.3s ease-in-out;
        }
        .gs-popup.gs-show {
          display: flex;
          opacity: 1;
        }
        .gs-popup-content {
          background: white;
          padding: 40px 45px;
          border-radius: 8px;
          text-align: center;
          max-width: 520px;
          width: 90%;
          box-shadow: 0 5px 25px rgba(0, 0, 0, 0.15);
          transform: scale(0.9);
          transition: transform 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28);
        }
        .gs-popup.gs-show .gs-popup-content {
          transform: scale(1);
        }
        .gs-popup-icon {
          font-size: 65px;
          color: #1a237e;
          margin-bottom: 20px;
          display: block;
          line-height: 1;
        }
        .gs-popup-title {
          font-size: 26px;
          font-weight: 600;
          margin-bottom: 15px;
          color: #1a237e;
          font-family: ${isArabic ? '"Cairo", sans-serif' : "'Lato', sans-serif"};
        }
        .gs-popup-message {
          color: #444;
          margin-bottom: 35px;
          font-size: 17px;
          line-height: 1.7;
        }
        .gs-popup-btn {
          background: #1a237e;
          color: white;
          border: none;
          padding: 12px 38px;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
          font-size: 16px;
          box-shadow: 0 3px 8px rgba(26, 35, 126, 0.2);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .gs-popup-btn:hover {
          background: #0d153d;
          transform: translateY(-2px);
          box-shadow: 0 5px 12px rgba(26, 35, 126, 0.3);
        }
        @media (max-width: 768px) {
          .gs-form-container {
            padding: 30px 20px;
            width: 100%;
          }
          .gs-form-container label {
            font-size: 16px;
          }
          .gs-form-container input {
            font-size: 16px;
          }
          .gs-input-icon {
            font-size: 20px;
          }
          .gs-submit-btn {
            font-size: 18px;
            padding: 16px;
          }
        }
        @media (max-width: 480px) {
          .gs-form-container {
            padding: 25px 15px;
            width: 100%;
          }
          .gs-input-container {
            height: 50px;
          }
          .gs-popup-content {
            padding: 30px 25px;
          }
          .gs-popup-title {
            font-size: 22px;
          }
          .gs-popup-message {
            font-size: 16px;
            margin-bottom: 25px;
          }
          .gs-popup-btn {
            padding: 11px 30px;
            font-size: 15px;
          }
          .gs-popup-icon {
            font-size: 55px;
            margin-bottom: 15px;
          }
        }
      `}</style>
    </>
  );
};

export default EventForm;
