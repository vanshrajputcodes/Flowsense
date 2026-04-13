// FlowSense AI - Internationalization (i18n) Support
// Languages: English (en) and Hindi (hi)

export type Language = 'en' | 'hi';

export const translations = {
  en: {
    // App
    appName: 'FlowSense AI',
    tagline: 'Intelligent Crowd Management',
    developerCredit: 'Developed by Vansh Raj Singh',
    
    // Navigation
    home: 'Home',
    queue: 'Queue',
    map: 'Map',
    facilities: 'Facilities',
    alerts: 'Alerts',
    dashboard: 'Dashboard',
    analytics: 'Analytics',
    settings: 'Settings',
    
    // Status
    safe: 'Safe',
    moderate: 'Moderate',
    crowded: 'Crowded',
    critical: 'Critical',
    
    // Queue
    joinQueue: 'Join Queue',
    leaveQueue: 'Leave Queue',
    yourToken: 'Your Token',
    estimatedWait: 'Estimated Wait',
    currentToken: 'Current Token',
    peopleAhead: 'People Ahead',
    minutes: 'minutes',
    noActiveToken: 'No active token',
    
    // Zones
    zones: 'Zones',
    capacity: 'Capacity',
    currentOccupancy: 'Current Occupancy',
    
    // Alerts
    emergencyAlert: 'Emergency Alert',
    safetyNotice: 'Safety Notice',
    announcement: 'Announcement',
    viewAll: 'View All',
    noAlerts: 'No active alerts',
    
    // Facilities
    washroom: 'Washroom',
    medical: 'Medical',
    water: 'Water',
    food: 'Food',
    parking: 'Parking',
    information: 'Information',
    prayer: 'Prayer Room',
    restArea: 'Rest Area',
    available: 'Available',
    unavailable: 'Unavailable',
    
    // Emergency
    sos: 'SOS',
    emergencyHelp: 'Emergency Help',
    reportIncident: 'Report Incident',
    evacuate: 'Evacuate',
    
    // Admin Dashboard
    overview: 'Overview',
    totalVisitors: 'Total Visitors',
    activeQueues: 'Active Queues',
    activeAlerts: 'Active Alerts',
    systemHealth: 'System Health',
    predictions: 'Predictions',
    broadcastAlert: 'Broadcast Alert',
    
    // Common
    loading: 'Loading...',
    error: 'Error',
    retry: 'Retry',
    cancel: 'Cancel',
    confirm: 'Confirm',
    save: 'Save',
    close: 'Close',
    back: 'Back',
    next: 'Next',
    search: 'Search',
    filter: 'Filter',
    refresh: 'Refresh',
    lastUpdated: 'Last Updated',
    
    // Auth
    login: 'Login',
    logout: 'Logout',
    signUp: 'Sign Up',
    email: 'Email',
    password: 'Password',
    forgotPassword: 'Forgot Password?',
    
    // Time
    now: 'Now',
    today: 'Today',
    hours: 'hours',
    mins: 'mins',
    seconds: 'seconds',
  },
  hi: {
    // App
    appName: 'फ्लोसेंस AI',
    tagline: 'बुद्धिमान भीड़ प्रबंधन',
    developerCredit: 'वंश राज सिंह द्वारा विकसित',
    
    // Navigation
    home: 'होम',
    queue: 'कतार',
    map: 'मानचित्र',
    facilities: 'सुविधाएं',
    alerts: 'अलर्ट',
    dashboard: 'डैशबोर्ड',
    analytics: 'विश्लेषण',
    settings: 'सेटिंग्स',
    
    // Status
    safe: 'सुरक्षित',
    moderate: 'मध्यम',
    crowded: 'भीड़भाड़',
    critical: 'गंभीर',
    
    // Queue
    joinQueue: 'कतार में शामिल हों',
    leaveQueue: 'कतार छोड़ें',
    yourToken: 'आपका टोकन',
    estimatedWait: 'अनुमानित प्रतीक्षा',
    currentToken: 'वर्तमान टोकन',
    peopleAhead: 'आगे लोग',
    minutes: 'मिनट',
    noActiveToken: 'कोई सक्रिय टोकन नहीं',
    
    // Zones
    zones: 'क्षेत्र',
    capacity: 'क्षमता',
    currentOccupancy: 'वर्तमान अधिभोग',
    
    // Alerts
    emergencyAlert: 'आपातकालीन अलर्ट',
    safetyNotice: 'सुरक्षा सूचना',
    announcement: 'घोषणा',
    viewAll: 'सभी देखें',
    noAlerts: 'कोई सक्रिय अलर्ट नहीं',
    
    // Facilities
    washroom: 'शौचालय',
    medical: 'चिकित्सा',
    water: 'पानी',
    food: 'भोजन',
    parking: 'पार्किंग',
    information: 'सूचना',
    prayer: 'प्रार्थना कक्ष',
    restArea: 'विश्राम क्षेत्र',
    available: 'उपलब्ध',
    unavailable: 'अनुपलब्ध',
    
    // Emergency
    sos: 'SOS',
    emergencyHelp: 'आपातकालीन सहायता',
    reportIncident: 'घटना रिपोर्ट करें',
    evacuate: 'निकासी',
    
    // Admin Dashboard
    overview: 'अवलोकन',
    totalVisitors: 'कुल आगंतुक',
    activeQueues: 'सक्रिय कतारें',
    activeAlerts: 'सक्रिय अलर्ट',
    systemHealth: 'सिस्टम स्वास्थ्य',
    predictions: 'भविष्यवाणियां',
    broadcastAlert: 'अलर्ट प्रसारित करें',
    
    // Common
    loading: 'लोड हो रहा है...',
    error: 'त्रुटि',
    retry: 'पुनः प्रयास करें',
    cancel: 'रद्द करें',
    confirm: 'पुष्टि करें',
    save: 'सहेजें',
    close: 'बंद करें',
    back: 'वापस',
    next: 'आगे',
    search: 'खोजें',
    filter: 'फ़िल्टर',
    refresh: 'रिफ्रेश',
    lastUpdated: 'अंतिम अपडेट',
    
    // Auth
    login: 'लॉग इन',
    logout: 'लॉग आउट',
    signUp: 'साइन अप',
    email: 'ईमेल',
    password: 'पासवर्ड',
    forgotPassword: 'पासवर्ड भूल गए?',
    
    // Time
    now: 'अभी',
    today: 'आज',
    hours: 'घंटे',
    mins: 'मिनट',
    seconds: 'सेकंड',
  },
} as const;

export type TranslationKey = keyof typeof translations.en;

export function t(key: TranslationKey, language: Language = 'en'): string {
  return translations[language][key] || translations.en[key] || key;
}

export function getStatusLabel(status: string, language: Language = 'en'): string {
  const statusMap: Record<string, TranslationKey> = {
    green: 'safe',
    yellow: 'moderate',
    red: 'crowded',
    critical: 'critical',
  };
  
  const key = statusMap[status.toLowerCase()] || 'safe';
  return t(key, language);
}

export function getFacilityLabel(type: string, language: Language = 'en'): string {
  const facilityMap: Record<string, TranslationKey> = {
    washroom: 'washroom',
    medical: 'medical',
    water: 'water',
    food: 'food',
    parking: 'parking',
    information: 'information',
    prayer: 'prayer',
    rest_area: 'restArea',
  };
  
  const key = facilityMap[type.toLowerCase()] || 'information';
  return t(key, language);
}
