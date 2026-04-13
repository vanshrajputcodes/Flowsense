import { useState, useEffect } from 'react';
import { AdminLayout } from '@/layouts/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Megaphone, Volume2, Globe, Loader2, Play, Square, History, Languages } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const LANGUAGES = [
  { code: 'hi', name: 'Hindi', nameNative: 'हिंदी', flag: '🇮🇳' },
  { code: 'ta', name: 'Tamil', nameNative: 'தமிழ்', flag: '🇮🇳' },
  { code: 'bn', name: 'Bengali', nameNative: 'বাংলা', flag: '🇮🇳' },
  { code: 'te', name: 'Telugu', nameNative: 'తెలుగు', flag: '🇮🇳' },
  { code: 'mr', name: 'Marathi', nameNative: 'मराठी', flag: '🇮🇳' },
  { code: 'gu', name: 'Gujarati', nameNative: 'ગુજરાતી', flag: '🇮🇳' },
  { code: 'kn', name: 'Kannada', nameNative: 'ಕನ್ನಡ', flag: '🇮🇳' },
  { code: 'pa', name: 'Punjabi', nameNative: 'ਪੰਜਾਬੀ', flag: '🇮🇳' },
];

export default function PASystemPage() {
  const [text, setText] = useState('');
  const [selectedLangs, setSelectedLangs] = useState<string[]>(['hi', 'ta', 'bn', 'te']);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [history, setHistory] = useState<any[]>([]);
  const [currentLangIdx, setCurrentLangIdx] = useState(-1);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    const { data } = await supabase
      .from('pa_announcements')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);
    if (data) setHistory(data);
  };

  const handleTranslate = async () => {
    if (!text.trim()) { toast.error('Please enter announcement text'); return; }
    setIsTranslating(true);
    try {
      const { data, error } = await supabase.functions.invoke('translate-announcement', {
        body: { text: text.trim(), languages: selectedLangs },
      });
      if (error) throw error;
      setTranslations(data.translations || {});
      toast.success(`Translated to ${selectedLangs.length} languages!`);
    } catch (err: any) {
      toast.error(`Translation failed: ${err?.message || 'Unknown error'}`);
    } finally {
      setIsTranslating(false);
    }
  };

  const speakText = (text: string, lang: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const langMap: Record<string, string> = {
      en: 'en-IN', hi: 'hi-IN', ta: 'ta-IN', bn: 'bn-IN', te: 'te-IN',
      mr: 'mr-IN', gu: 'gu-IN', kn: 'kn-IN', pa: 'pa-IN',
    };
    utterance.lang = langMap[lang] || 'en-IN';
    utterance.rate = 0.9;
    utterance.volume = 1.0;
    const voices = window.speechSynthesis.getVoices();
    const match = voices.find(v => v.lang.startsWith(lang));
    if (match) utterance.voice = match;
    window.speechSynthesis.speak(utterance);
  };

  const broadcastAll = async () => {
    if (Object.keys(translations).length === 0) {
      toast.error('Translate first!');
      return;
    }
    setIsBroadcasting(true);

    // Save to DB
    await supabase.from('pa_announcements').insert({
      original_text: text,
      translations: translations,
      languages: selectedLangs,
      status: 'broadcasting',
    } as any);

    const langOrder = ['en', ...selectedLangs];
    for (let i = 0; i < langOrder.length; i++) {
      const lang = langOrder[i];
      const t = translations[lang];
      if (!t) continue;
      setCurrentLangIdx(i);
      
      await new Promise<void>((resolve) => {
        const utterance = new SpeechSynthesisUtterance(t);
        const langMap: Record<string, string> = {
          en: 'en-IN', hi: 'hi-IN', ta: 'ta-IN', bn: 'bn-IN', te: 'te-IN',
          mr: 'mr-IN', gu: 'gu-IN', kn: 'kn-IN', pa: 'pa-IN',
        };
        utterance.lang = langMap[lang] || 'en-IN';
        utterance.rate = 0.85;
        utterance.volume = 1.0;
        utterance.onend = () => setTimeout(resolve, 500);
        utterance.onerror = () => resolve();
        window.speechSynthesis.speak(utterance);
      });
    }

    setCurrentLangIdx(-1);
    setIsBroadcasting(false);
    toast.success('Broadcast complete in all languages!');
    fetchHistory();
  };

  const stopBroadcast = () => {
    window.speechSynthesis.cancel();
    setIsBroadcasting(false);
    setCurrentLangIdx(-1);
  };

  const toggleLang = (code: string) => {
    setSelectedLangs(prev => prev.includes(code) ? prev.filter(l => l !== code) : [...prev, code]);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-primary" />
            Multilingual PA System
          </h1>
          <p className="text-muted-foreground text-sm">Broadcast announcements in multiple Indian languages using AI translation</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Compose */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Globe className="w-5 h-5" /> Compose Announcement
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Type your announcement in English... e.g. 'Attention visitors, Gate 3 is now closed. Please use Gate 1 for exit.'"
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={4}
                className="resize-none"
              />

              <div>
                <p className="text-sm font-medium mb-2">Target Languages:</p>
                <div className="flex flex-wrap gap-2">
                  {LANGUAGES.map(lang => (
                    <label key={lang.code} className="flex items-center gap-1.5 cursor-pointer">
                      <Checkbox
                        checked={selectedLangs.includes(lang.code)}
                        onCheckedChange={() => toggleLang(lang.code)}
                      />
                      <span className="text-sm">{lang.flag} {lang.name} ({lang.nameNative})</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleTranslate} disabled={isTranslating || !text.trim()} className="gap-2 flex-1">
                  {isTranslating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Languages className="w-4 h-4" />}
                  {isTranslating ? 'Translating...' : 'AI Translate'}
                </Button>
                {Object.keys(translations).length > 0 && (
                  isBroadcasting ? (
                    <Button variant="destructive" onClick={stopBroadcast} className="gap-2">
                      <Square className="w-4 h-4" /> Stop
                    </Button>
                  ) : (
                    <Button onClick={broadcastAll} className="gap-2 bg-safe hover:bg-safe/90 text-safe-foreground">
                      <Play className="w-4 h-4" /> Broadcast All
                    </Button>
                  )
                )}
              </div>
            </CardContent>
          </Card>

          {/* Translations Preview */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Volume2 className="w-5 h-5" /> Translations
                {isBroadcasting && <Badge className="animate-pulse bg-safe">🔊 Broadcasting...</Badge>}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {Object.keys(translations).length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Languages className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>Translations will appear here</p>
                  <p className="text-xs mt-1">Write your message and click AI Translate</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {Object.entries(translations).map(([lang, t], idx) => {
                    const langInfo = LANGUAGES.find(l => l.code === lang);
                    const isPlaying = isBroadcasting && currentLangIdx === (lang === 'en' ? 0 : selectedLangs.indexOf(lang) + 1);
                    return (
                      <div key={lang} className={`p-3 rounded-lg border ${isPlaying ? 'border-safe bg-safe/10 ring-2 ring-safe' : 'border-border'}`}>
                        <div className="flex items-center justify-between mb-1">
                          <Badge variant="outline" className="text-xs">
                            {lang === 'en' ? '🇬🇧 English' : `${langInfo?.flag || '🌐'} ${langInfo?.name || lang} (${langInfo?.nameNative || ''})`}
                          </Badge>
                          <Button size="sm" variant="ghost" className="h-6 px-2" onClick={() => speakText(t, lang)}>
                            <Volume2 className="w-3 h-3" />
                          </Button>
                        </div>
                        <p className="text-sm">{t}</p>
                        {isPlaying && <p className="text-xs text-safe mt-1 animate-pulse">🔊 Playing now...</p>}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* History */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <History className="w-5 h-5" /> Broadcast History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {history.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">No announcements yet</p>
            ) : (
              <div className="space-y-3 max-h-[300px] overflow-y-auto">
                {history.map((h: any) => (
                  <div key={h.id} className="p-3 rounded-lg border border-border">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium text-sm">{h.original_text}</p>
                      <span className="text-xs text-muted-foreground">{new Date(h.created_at).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {(h.languages || []).map((l: string) => (
                        <Badge key={l} variant="secondary" className="text-[10px]">{l}</Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
