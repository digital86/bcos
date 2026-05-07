import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { Loader2, Play, Pause, Settings, Clock, FileText, RefreshCw, TestTube } from 'lucide-react';

interface AutomationSettings {
  id: string;
  is_enabled: boolean;
  interval_hours: number;
  last_run_at: string | null;
  next_run_at: string | null;
  total_articles_generated: number;
  updated_at: string;
}

const BlogAutomation = () => {
  const [settings, setSettings] = useState<AutomationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [intervalHours, setIntervalHours] = useState(24);
  const [isEnabled, setIsEnabled] = useState(false);
  const [language, setLanguage] = useState<'fr' | 'ar'>('fr');
  const dir = language === 'ar' ? 'rtl' : 'ltr';

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      
      // Try to fetch settings
      let { data, error } = await supabase
        .from('blog_automation_settings')
        .select('*')
        .eq('id', '00000000-0000-0000-0000-000000000001')
        .maybeSingle(); // Use maybeSingle() instead of single() to avoid error on no rows

      if (error) {
        // If table doesn't exist, try to create default
        if (error.code === 'PGRST116' || error.message?.includes('Could not find the table')) {
          console.log('Settings not found, creating default...');
          await createDefaultSettings();
          // Retry after creation
          const retryResult = await supabase
            .from('blog_automation_settings')
            .select('*')
            .eq('id', '00000000-0000-0000-0000-000000000001')
            .maybeSingle();
          data = retryResult.data;
          error = retryResult.error;
        } else {
          throw error;
        }
      }

      if (data) {
        setSettings(data);
        setIsEnabled(data.is_enabled);
        setIntervalHours(data.interval_hours || 24);
      } else if (!error) {
        // No data and no error - create default
        await createDefaultSettings();
      }
    } catch (error: any) {
      console.error('Error loading settings:', error);
      toast.error(language === 'ar' ? 'خطأ في تحميل الإعدادات' : 'Erreur lors du chargement des paramètres');
    } finally {
      setLoading(false);
    }
  };

  const createDefaultSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('blog_automation_settings')
        .upsert({
          id: '00000000-0000-0000-0000-000000000001',
          is_enabled: false,
          interval_hours: 24,
        }, {
          onConflict: 'id'
        })
        .select()
        .single();

      if (error) {
        // If error is about constraint or duplicate, try to fetch existing
        if (error.code === '23505' || error.message?.includes('duplicate')) {
          const { data: existing } = await supabase
            .from('blog_automation_settings')
            .select('*')
            .eq('id', '00000000-0000-0000-0000-000000000001')
            .maybeSingle();
          if (existing) {
            setSettings(existing);
            setIsEnabled(existing.is_enabled);
            setIntervalHours(existing.interval_hours || 24);
            return;
          }
        }
        throw error;
      }

      if (data) {
        setSettings(data);
        setIsEnabled(false);
        setIntervalHours(24);
      }
    } catch (error: any) {
      console.error('Error creating default settings:', error);
      // Don't show error toast if it's just a duplicate key
      if (!error.message?.includes('duplicate') && error.code !== '23505') {
        toast.error(language === 'ar' ? 'خطأ في إنشاء الإعدادات' : 'Erreur lors de la création des paramètres');
      }
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);

      // Calculate next run time if enabled
      let nextRunAt = null;
      if (isEnabled) {
        const now = new Date();
        now.setHours(now.getHours() + intervalHours);
        nextRunAt = now.toISOString();
      }

      const { error } = await supabase
        .from('blog_automation_settings')
        .update({
          is_enabled: isEnabled,
          interval_hours: intervalHours,
          next_run_at: nextRunAt,
          updated_at: new Date().toISOString(),
        })
        .eq('id', '00000000-0000-0000-0000-000000000001');

      if (error) throw error;

      // Reload settings
      await loadSettings();

      toast.success(
        language === 'ar'
          ? 'تم حفظ الإعدادات بنجاح'
          : 'Paramètres enregistrés avec succès'
      );
    } catch (error: any) {
      console.error('Error saving settings:', error);
      toast.error(
        language === 'ar' ? 'خطأ في حفظ الإعدادات' : 'Erreur lors de l\'enregistrement des paramètres'
      );
    } finally {
      setSaving(false);
    }
  };

  const triggerManualRun = async () => {
    try {
      setSaving(true);
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (!supabaseUrl) {
        throw new Error('Supabase URL not configured');
      }

      const edgeFunctionUrl = `${supabaseUrl}/functions/v1/automate-blog`;
      const response = await fetch(edgeFunctionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY || ''}`,
        },
        body: JSON.stringify({ manual: true }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to trigger automation');
      }

      const data = await response.json();
      toast.success(
        language === 'ar'
          ? `تم إنشاء مقال وإرساله إلى Telegram: ${data.articleTitle || 'N/A'}`
          : `Article créé et envoyé à Telegram: ${data.articleTitle || 'N/A'}`
      );

      // Reload settings to update last_run_at
      await loadSettings();
    } catch (error: any) {
      console.error('Error triggering manual run:', error);
      toast.error(
        language === 'ar' ? 'خطأ في تشغيل الأتمتة' : 'Erreur lors du déclenchement de l\'automatisation'
      );
    } finally {
      setSaving(false);
    }
  };

  const triggerTestRun = async () => {
    try {
      setSaving(true);
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (!supabaseUrl) {
        throw new Error('Supabase URL not configured');
      }

      toast.info(language === 'ar' ? 'جاري إرسال رسالة اختبار إلى Telegram...' : 'Envoi d\'un message de test à Telegram...');

      const edgeFunctionUrl = `${supabaseUrl}/functions/v1/automate-blog`;
      const response = await fetch(edgeFunctionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY || ''}`,
        },
        body: JSON.stringify({ manual: true, test: true }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to trigger test');
      }

      const data = await response.json();
      toast.success(
        language === 'ar'
          ? `✅ تم إرسال رسالة اختبار إلى Telegram. تحقق من البوت!`
          : `✅ Message de test envoyé à Telegram. Vérifiez le bot!`
      );
    } catch (error: any) {
      console.error('Error triggering test run:', error);
      toast.error(
        language === 'ar' ? 'خطأ في إرسال رسالة الاختبار' : 'Erreur lors de l\'envoi du message de test'
      );
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return language === 'ar' ? 'لم يتم التشغيل بعد' : 'Jamais exécuté';
    const date = new Date(dateString);
    return date.toLocaleString(language === 'ar' ? 'ar-DZ' : 'fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6" dir={dir}>
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Settings className="w-6 h-6 text-primary" />
            {language === 'ar' ? 'أتمتة المقالات' : 'Automatisation des articles'}
          </h1>
          <p className="text-gray-600">
            {language === 'ar'
              ? 'إعدادات النشر التلقائي للمقالات كل 24 ساعة'
              : 'Paramètres de publication automatique d\'articles toutes les 24 heures'}
          </p>
        </div>

        {/* Language Toggle */}
        <div className="flex gap-2">
          <Button
            variant={language === 'fr' ? 'default' : 'outline'}
            onClick={() => setLanguage('fr')}
            size="sm"
          >
            Français
          </Button>
          <Button
            variant={language === 'ar' ? 'default' : 'outline'}
            onClick={() => setLanguage('ar')}
            size="sm"
          >
            العربية
          </Button>
        </div>

        {/* Settings Card */}
        <Card>
          <CardHeader>
            <CardTitle>
              {language === 'ar' ? 'إعدادات الأتمتة' : 'Paramètres d\'automatisation'}
            </CardTitle>
            <CardDescription>
              {language === 'ar'
                ? 'قم بتشغيل أو إيقاف النشر التلقائي للمقالات'
                : 'Activez ou désactivez la publication automatique d\'articles'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Enable/Disable Switch */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">
                  {language === 'ar' ? 'تفعيل الأتمتة' : 'Activer l\'automatisation'}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {language === 'ar'
                    ? 'سيتم إنشاء مقال تلقائياً كل فترة محددة'
                    : 'Un article sera créé automatiquement à chaque intervalle'}
                </p>
              </div>
              <Switch
                checked={isEnabled}
                onCheckedChange={setIsEnabled}
                disabled={saving}
              />
            </div>

            {/* Interval Hours */}
            <div className="space-y-2">
              <Label htmlFor="interval">
                {language === 'ar' ? 'الفترة بين المقالات (ساعات)' : 'Intervalle entre les articles (heures)'}
              </Label>
              <Input
                id="interval"
                type="number"
                min="1"
                max="168"
                value={intervalHours}
                onChange={(e) => setIntervalHours(parseInt(e.target.value) || 24)}
                disabled={saving}
                dir="ltr"
              />
              <p className="text-sm text-muted-foreground">
                {language === 'ar'
                  ? 'الحد الأدنى: 1 ساعة، الحد الأقصى: 168 ساعة (أسبوع)'
                  : 'Minimum: 1 heure, Maximum: 168 heures (1 semaine)'}
              </p>
            </div>

            {/* Status Info */}
            {settings && (
              <div className="space-y-4 p-4 bg-muted rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      {language === 'ar' ? 'آخر تشغيل' : 'Dernière exécution'}
                    </span>
                  </div>
                  <Badge variant="secondary">
                    {formatDate(settings.last_run_at)}
                  </Badge>
                </div>

                {isEnabled && settings.next_run_at && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">
                        {language === 'ar' ? 'التشغيل القادم' : 'Prochaine exécution'}
                      </span>
                    </div>
                    <Badge variant="default">
                      {formatDate(settings.next_run_at)}
                    </Badge>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      {language === 'ar' ? 'إجمالي المقالات المولدة' : 'Total articles générés'}
                    </span>
                  </div>
                  <Badge variant="outline">
                    {settings.total_articles_generated || 0}
                  </Badge>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4">
              <Button
                onClick={saveSettings}
                disabled={saving}
                className="flex-1"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {language === 'ar' ? 'جاري الحفظ...' : 'Enregistrement...'}
                  </>
                ) : (
                  <>
                    <Settings className="w-4 h-4 mr-2" />
                    {language === 'ar' ? 'حفظ الإعدادات' : 'Enregistrer les paramètres'}
                  </>
                )}
              </Button>

              <Button
                onClick={triggerManualRun}
                disabled={saving}
                variant="outline"
                className="flex-1"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {language === 'ar' ? 'جاري التشغيل...' : 'Exécution...'}
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    {language === 'ar' ? 'تشغيل يدوي' : 'Exécution manuelle'}
                  </>
                )}
              </Button>

              <Button
                onClick={triggerTestRun}
                disabled={saving}
                variant="secondary"
                className="flex-1"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {language === 'ar' ? 'جاري الاختبار...' : 'Test...'}
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    {language === 'ar' ? 'اختبار' : 'Test'}
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>
              {language === 'ar' ? 'معلومات' : 'Informations'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground" dir={dir}>
              <li>
                {language === 'ar'
                  ? '• سيتم اختيار دورة عشوائية من الدورات القادمة'
                  : '• Une formation aléatoire sera sélectionnée parmi les formations à venir'}
              </li>
              <li>
                {language === 'ar'
                  ? '• سيتم إنشاء مقال بالعربية والفرنسية تلقائياً'
                  : '• Un article sera créé automatiquement en français et en arabe'}
              </li>
              <li>
                {language === 'ar'
                  ? '• سيتم توليد صورة للدورة تلقائياً'
                  : '• Une image sera générée automatiquement pour la formation'}
              </li>
              <li>
                {language === 'ar'
                  ? '• سيتم نشر المقال تلقائياً بعد الإنشاء'
                  : '• L\'article sera publié automatiquement après création'}
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default BlogAutomation;

