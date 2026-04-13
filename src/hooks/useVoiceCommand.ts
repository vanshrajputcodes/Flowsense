import { useCallback, useRef, useState } from 'react';

export type VoiceCommandAction =
  | 'nearest_washroom'
  | 'find_exit'
  | 'crowd_status'
  | 'emergency_help'
  | 'order_food'
  | 'order_water'
  | 'queue_status'
  | 'unknown';

export interface VoiceCommandResult {
  transcript: string;
  action: VoiceCommandAction;
  response: string;
  responseHi: string;
}

const intentMap: Array<{ keywords: string[]; keywordsHi: string[]; action: VoiceCommandAction }> = [
  { keywords: ['washroom', 'toilet', 'bathroom', 'restroom', 'loo'], keywordsHi: ['शौचालय', 'टॉयलेट', 'बाथरूम', 'पेशाब'], action: 'nearest_washroom' },
  { keywords: ['exit', 'way out', 'gate', 'out', 'leave'], keywordsHi: ['निकास', 'बाहर', 'गेट', 'रास्ता'], action: 'find_exit' },
  { keywords: ['crowd', 'crowded', 'density', 'how many', 'busy', 'rush'], keywordsHi: ['भीड़', 'कितने लोग', 'घनत्व', 'व्यस्त'], action: 'crowd_status' },
  { keywords: ['emergency', 'help', 'sos', 'danger', 'safe', 'accident'], keywordsHi: ['आपातकाल', 'मदद', 'खतरा', 'बचाओ', 'SOS'], action: 'emergency_help' },
  { keywords: ['food', 'eat', 'hungry', 'meal', 'snack', 'order food'], keywordsHi: ['खाना', 'भोजन', 'भूख', 'खाने', 'खाद्य'], action: 'order_food' },
  { keywords: ['water', 'drink', 'thirsty', 'bottle', 'juice'], keywordsHi: ['पानी', 'पेय', 'प्यास', 'बोतल', 'जूस'], action: 'order_water' },
  { keywords: ['queue', 'token', 'wait', 'line', 'waiting time'], keywordsHi: ['कतार', 'टोकन', 'प्रतीक्षा', 'लाइन'], action: 'queue_status' },
];

const responseMap: Record<VoiceCommandAction, { en: string; hi: string }> = {
  nearest_washroom: {
    en: 'The nearest washroom is at Gate 2, 50 meters ahead. Go to Facilities for details.',
    hi: 'सबसे नजदीकी शौचालय गेट 2 पर है, 50 मीटर आगे। विवरण के लिए सुविधाएं देखें।',
  },
  find_exit: {
    en: 'The main exit is through Gate 1. Follow the green signs. You can also check the Map page.',
    hi: 'मुख्य निकास गेट 1 से है। हरे संकेत का पालन करें। मानचित्र पृष्ठ भी देखें।',
  },
  crowd_status: {
    en: 'Current crowd density is at 68%. Event area is busier. Main entry gate is safe.',
    hi: 'वर्तमान भीड़ घनत्व 68% है। इवेंट क्षेत्र अधिक व्यस्त है। मुख्य प्रवेश द्वार सुरक्षित है।',
  },
  emergency_help: {
    en: 'I am alerting emergency services now. Please press the SOS button or stay where you are.',
    hi: 'मैं अभी आपातकालीन सेवाओं को सतर्क कर रहा हूं। SOS बटन दबाएं या जहां हैं वहीं रहें।',
  },
  order_food: {
    en: 'Opening the Order page for you. You can order food, water and more.',
    hi: 'आपके लिए ऑर्डर पृष्ठ खोल रहा हूं। आप भोजन, पानी और बहुत कुछ ऑर्डर कर सकते हैं।',
  },
  order_water: {
    en: 'Opening the Order page. You can order water bottles and drinks.',
    hi: 'ऑर्डर पृष्ठ खोल रहा हूं। आप पानी की बोतलें और पेय ऑर्डर कर सकते हैं।',
  },
  queue_status: {
    en: 'Go to the Queue page to see current wait times and get a virtual token.',
    hi: 'वर्तमान प्रतीक्षा समय देखने और वर्चुअल टोकन पाने के लिए कतार पृष्ठ पर जाएं।',
  },
  unknown: {
    en: 'Sorry, I did not understand. Try saying: "Washroom", "Exit", "Crowd status", or "Emergency help".',
    hi: 'क्षमा करें, मैं समझ नहीं पाया। कहें: "शौचालय", "निकास", "भीड़ की स्थिति", या "आपातकालीन मदद"।',
  },
};

function detectIntent(text: string): VoiceCommandAction {
  const lower = text.toLowerCase();
  for (const item of intentMap) {
    if (item.keywords.some((k) => lower.includes(k)) || item.keywordsHi.some((k) => lower.includes(k))) {
      return item.action;
    }
  }
  return 'unknown';
}

function speakText(text: string, lang: 'en' | 'hi') {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = lang === 'hi' ? 'hi-IN' : 'en-IN';
  utter.rate = 0.9;
  utter.pitch = 1.1;
  window.speechSynthesis.speak(utter);
}

export function useVoiceCommand(lang: 'en' | 'hi' = 'en') {
  const [isListening, setIsListening] = useState(false);
  const [result, setResult] = useState<VoiceCommandResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  const startListening = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError(lang === 'hi' ? 'वॉयस कमांड इस ब्राउज़र में समर्थित नहीं है' : 'Voice commands not supported in this browser');
      return;
    }

    const rec = new SpeechRecognition();
    rec.lang = lang === 'hi' ? 'hi-IN' : 'en-IN';
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    recognitionRef.current = rec;

    rec.onstart = () => {
      setIsListening(true);
      setError(null);
      setResult(null);
    };

    rec.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      const action = detectIntent(transcript);
      const response = responseMap[action];
      const commandResult: VoiceCommandResult = {
        transcript,
        action,
        response: response.en,
        responseHi: response.hi,
      };
      setResult(commandResult);
      speakText(lang === 'hi' ? response.hi : response.en, lang);
    };

    rec.onerror = (e: any) => {
      setError(
        e.error === 'not-allowed'
          ? (lang === 'hi' ? 'माइक्रोफोन अनुमति दें' : 'Please allow microphone access')
          : (lang === 'hi' ? 'आवाज़ पहचानने में त्रुटि' : 'Speech recognition error')
      );
      setIsListening(false);
    };

    rec.onend = () => {
      setIsListening(false);
    };

    rec.start();
  }, [lang]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  const clearResult = useCallback(() => setResult(null), []);

  return { isListening, result, error, startListening, stopListening, clearResult };
}
