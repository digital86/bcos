import { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Calendar, Clock, MapPin, Users } from 'lucide-react';
import { useScheduledFormations, useFormations } from '@/hooks/useSupabase';
import type { Formation } from '../../supabase-config';

interface ScheduledFormation {
  id: string;
  formation_id: string;
  scheduled_date: string;
  scheduled_time: string;
  end_time: string;
  location?: string;
  is_online: boolean;
  max_participants?: number;
  current_participants: number;
  formation?: Formation;
}

const Agenda = () => {
  const location = useLocation();
  const language = location.pathname.startsWith('/ar') ? 'ar' : 'fr';
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [randomFormations, setRandomFormations] = useState<Formation[]>([]);
  
  const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
  const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
  
  const { scheduledFormations, loading, error } = useScheduledFormations(
    startOfMonth.toISOString().split('T')[0],
    endOfMonth.toISOString().split('T')[0]
  );
  const { formations: allFormations, loading: formationsLoading } = useFormations();

  const translations = {
    fr: {
      title: 'Programme des Formations',
      subtitle: 'Découvrez toutes nos formations programmées',
      today: "Aujourd'hui",
      noFormations: 'Aucune formation programmée',
      seeDetails: 'Voir les détails',
      online: 'En ligne',
      participants: 'Participants',
      suggested: 'Formations suggérées',
    },
    ar: {
      title: 'برنامج الدورات',
      subtitle: 'اكتشف جميع دوراتنا المبرمجة',
      today: 'اليوم',
      noFormations: 'لا توجد دورات مبرمجة',
      seeDetails: 'عرض التفاصيل',
      online: 'عبر الإنترنت',
      participants: 'المشاركون',
      suggested: 'دورات مقترحة',
    },
  };

  const t = translations[language];

  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }

    return days;
  };

  const getScheduledForDay = (day: number): ScheduledFormation[] => {
    if (!day) return [];
    const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return scheduledFormations.filter((s: ScheduledFormation) => s.scheduled_date === dateStr && s.is_active);
  };

  const monthNames = {
    fr: [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ],
    ar: [
      'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
      'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ],
  };

  const dayNames = {
    fr: ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'],
    ar: ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'],
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  useEffect(() => {
    if (!formationsLoading && allFormations.length > 0 && scheduledFormations.length === 0) {
      const sampleSize = Math.min(6, allFormations.length);
      const shuffled = [...allFormations].sort(() => Math.random() - 0.5);
      setRandomFormations(shuffled.slice(0, sampleSize));
    } else {
      setRandomFormations([]);
    }
  }, [formationsLoading, allFormations, scheduledFormations]);

  const getFormationTitle = (formation?: Formation) => {
    if (!formation) return '';
    if (language === 'ar' && formation.title_ar) {
      return formation.title_ar;
    }
    if (language === 'fr' && formation.title_fr) {
      return formation.title_fr;
    }
    return formation.title;
  };

  const days = getDaysInMonth();
  const monthName = monthNames[language][currentMonth.getMonth()];
  const dayNamesList = dayNames[language];
  const displaySubtitle = language === 'ar' 
    ? `برنامج الدورات لشهر ${monthName}` 
    : `Programme des formations du mois de ${monthName}`;
  const isRTL = language === 'ar';

  return (
    <div className="min-h-screen bg-background" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="container mx-auto px-4 pt-28 pb-12 lg:pt-36 lg:pb-20">
        {/* Header */}
        <div className="text-center mb-12 flex flex-col items-center">
          <h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-4 text-center">
            {t.title}
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-center">
            {displaySubtitle}
          </p>
        </div>

        {/* Calendar Navigation */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Button variant="outline" size="icon" onClick={() => navigateMonth('prev')}>
                  {isRTL ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                </Button>
                <h2 className="text-2xl font-bold">
                  {monthName} {currentMonth.getFullYear()}
                </h2>
                <Button variant="outline" size="icon" onClick={() => navigateMonth('next')}>
                  {isRTL ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </Button>
              </div>
              <Button variant="outline" onClick={() => setCurrentMonth(new Date())}>
                {t.today}
              </Button>
            </div>

            {/* Calendar Grid */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-red-600 mb-4">
                  {error.includes('Could not find the table') || error.includes('PGRST205')
                    ? language === 'ar'
                      ? 'الجدول غير موجود. يرجى تشغيل الـ migration في Supabase.'
                      : 'Le tableau n\'existe pas. Veuillez exécuter la migration SQL dans Supabase.'
                    : error}
                </p>
                <p className="text-sm text-gray-500">
                  {language === 'ar' 
                    ? 'ملف الـ migration: migrations/007_create_scheduled_formations.sql'
                    : 'Fichier migration: migrations/007_create_scheduled_formations.sql'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-7 gap-2">
                {/* Day headers */}
                {dayNamesList.map(day => (
                  <div key={day} className="text-center font-semibold text-gray-700 py-2">
                    {day}
                  </div>
                ))}

                {/* Calendar days */}
                {days.map((day, index) => {
                  const scheduled = getScheduledForDay(day || 0);
                  const isToday = day && 
                    new Date().toDateString() === new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day).toDateString();

                  return (
                    <div
                      key={index}
                      className={`
                        min-h-[120px] border rounded-lg p-2 transition-all
                        ${day ? 'bg-white hover:bg-gray-50 hover:shadow-md' : 'bg-gray-50'}
                        ${isToday ? 'ring-2 ring-primary bg-primary/5' : ''}
                      `}
                    >
                      {day && (
                        <>
                          <div className={`text-sm font-medium mb-2 ${isToday ? 'text-primary font-bold' : 'text-gray-900'}`}>
                            {day}
                          </div>
                          <div className="space-y-1.5">
                            {scheduled.map(schedule => {
                              const formation = schedule.formation;
                              const title = getFormationTitle(formation);
                              const slug = formation?.slug || '';
                              
                              return (
                                <Link
                                  key={schedule.id}
                                  to={`/${language}/formation/${slug}`}
                                  className="block"
                                >
                                  <div className="text-xs bg-primary/10 hover:bg-primary/20 text-primary p-2 rounded cursor-pointer transition-colors border border-primary/20">
                                    <div className="font-medium truncate mb-1">
                                      {title || 'Formation'}
                                    </div>
                                    <div className="flex items-center gap-1 text-primary/70 text-[10px]">
                                      <Clock className="w-3 h-3" />
                                      {schedule.scheduled_time} - {schedule.end_time}
                                    </div>
                                    {schedule.is_online && (
                                      <Badge variant="secondary" className="mt-1 text-[10px] px-1 py-0">
                                        {t.online}
                                      </Badge>
                                    )}
                                  </div>
                                </Link>
                              );
                            })}
                            {scheduled.length === 0 && (
                              <div className="text-xs text-gray-400 text-center py-2">
                                {t.noFormations}
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Detailed List */}
        {scheduledFormations.length > 0 && (
          <Card>
            <CardContent className="p-6">
              <h3 className="text-xl font-bold mb-6">
                {language === 'ar' ? 'قائمة الدورات المبرمجة' : 'Liste des formations programmées'}
              </h3>
              <div className="space-y-4">
                {scheduledFormations.map((schedule: ScheduledFormation) => {
                  const formation = schedule.formation;
                  const title = getFormationTitle(formation);
                  const slug = formation?.slug || '';
                  
                  return (
                    <Link
                      key={schedule.id}
                      to={`/${language}/formation/${slug}`}
                      className="block"
                    >
                      <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 hover:shadow-md transition-all">
                        <div className="flex-1">
                          <h4 className="font-semibold text-lg mb-2">
                            {title || 'Formation'}
                          </h4>
                          <div className="flex items-center gap-4 text-sm text-gray-600 flex-wrap">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {new Date(schedule.scheduled_date).toLocaleDateString(
                                language === 'ar' ? 'ar-DZ' : 'fr-FR',
                                {
                                  weekday: 'long',
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                }
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {schedule.scheduled_time} - {schedule.end_time}
                            </div>
                            {schedule.location && (
                              <div className="flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                {schedule.location}
                              </div>
                            )}
                            {schedule.is_online && (
                              <Badge variant="secondary">{t.online}</Badge>
                            )}
                            {schedule.max_participants && (
                              <div className="flex items-center gap-1">
                                <Users className="w-4 h-4" />
                                {schedule.current_participants || 0}/{schedule.max_participants}
                              </div>
                            )}
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          {t.seeDetails}
                        </Button>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Suggested formations when month is empty */}
        {scheduledFormations.length === 0 && randomFormations.length > 0 && (
          <Card>
            <CardContent className="p-6">
              <h3 className="text-xl font-bold mb-6">
                {t.suggested}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {randomFormations.map((formation) => {
                  const title = getFormationTitle(formation);
                  const slug = formation.slug || '';
                  return (
                    <Link
                      key={formation.id}
                      to={`/${language}/formation/${slug}`}
                      className="block"
                    >
                      <div className="p-4 border rounded-lg hover:bg-gray-50 hover:shadow-md transition-all">
                        <h4 className="font-semibold text-lg mb-2 truncate">
                          {title || 'Formation'}
                        </h4>
                        <div className="text-sm text-gray-600 line-clamp-2">
                          {language === 'ar'
                            ? (formation.description_ar || formation.description || '')
                            : (formation.description_fr || formation.description || '')}
                        </div>
                        <Button variant="outline" size="sm" className="mt-3">
                          {t.seeDetails}
                        </Button>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Agenda;
