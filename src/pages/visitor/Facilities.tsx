import { useLanguage } from '@/contexts/LanguageContext';
import { VisitorLayout } from '@/layouts/VisitorLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Bath,
  Stethoscope,
  Droplets,
  Utensils,
  Car,
  Info,
  Heart,
  Sofa,
  Navigation,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { getFacilityLabel } from '@/lib/i18n';

// Simulated facilities data with coordinates (Prayagraj Kumbh Mela area)
const mockFacilities = [
  {
    id: '1',
    type: 'washroom',
    name: 'Washroom Block A',
    nameHi: 'शौचालय ब्लॉक A',
    zone: 'Main Entry Gate',
    isAvailable: true,
    capacity: 50,
    currentUsage: 12,
    lat: 25.4358,
    lng: 81.8463,
  },
  {
    id: '2',
    type: 'washroom',
    name: 'Washroom Block B',
    nameHi: 'शौचालय ब्लॉक B',
    zone: 'Event Area',
    isAvailable: true,
    capacity: 40,
    currentUsage: 35,
    lat: 25.4372,
    lng: 81.8481,
  },
  {
    id: '3',
    type: 'medical',
    name: 'First Aid Center',
    nameHi: 'प्राथमिक चिकित्सा केंद्र',
    zone: 'Main Entry Gate',
    isAvailable: true,
    capacity: 20,
    currentUsage: 5,
    lat: 25.4361,
    lng: 81.8455,
  },
  {
    id: '4',
    type: 'medical',
    name: 'Medical Room',
    nameHi: 'चिकित्सा कक्ष',
    zone: 'Event Area',
    isAvailable: false,
    capacity: 10,
    currentUsage: 10,
    lat: 25.4380,
    lng: 81.8492,
  },
  {
    id: '5',
    type: 'water',
    name: 'Water Station 1',
    nameHi: 'जल स्टेशन 1',
    zone: 'Main Entry Gate',
    isAvailable: true,
    capacity: 100,
    currentUsage: 20,
    lat: 25.4355,
    lng: 81.8468,
  },
  {
    id: '6',
    type: 'water',
    name: 'Water Station 2',
    nameHi: 'जल स्टेशन 2',
    zone: 'Food Plaza',
    isAvailable: true,
    capacity: 80,
    currentUsage: 45,
    lat: 25.4345,
    lng: 81.8502,
  },
  {
    id: '7',
    type: 'food',
    name: 'Snack Corner',
    nameHi: 'स्नैक कॉर्नर',
    zone: 'Event Area',
    isAvailable: true,
    capacity: 200,
    currentUsage: 150,
    lat: 25.4375,
    lng: 81.8478,
  },
  {
    id: '8',
    type: 'food',
    name: 'Food Plaza',
    nameHi: 'फूड प्लाज़ा',
    zone: 'Food Plaza',
    isAvailable: true,
    capacity: 500,
    currentUsage: 380,
    lat: 25.4340,
    lng: 81.8510,
  },
  {
    id: '9',
    type: 'parking',
    name: 'Visitor Parking A',
    nameHi: 'विज़िटर पार्किंग A',
    zone: 'Visitor Parking A',
    isAvailable: true,
    capacity: 500,
    currentUsage: 175,
    lat: 25.4320,
    lng: 81.8440,
  },
  {
    id: '10',
    type: 'parking',
    name: 'Visitor Parking B',
    nameHi: 'विज़िटर पार्किंग B',
    zone: 'Visitor Parking B',
    isAvailable: true,
    capacity: 400,
    currentUsage: 112,
    lat: 25.4390,
    lng: 81.8520,
  },
  {
    id: '11',
    type: 'information',
    name: 'Help Desk',
    nameHi: 'सहायता डेस्क',
    zone: 'Main Entry Gate',
    isAvailable: true,
    capacity: 5,
    currentUsage: 2,
    lat: 25.4360,
    lng: 81.8460,
  },
  {
    id: '12',
    type: 'rest_area',
    name: 'Chill Zone',
    nameHi: 'चिल ज़ोन',
    zone: 'Chill Zone',
    isAvailable: true,
    capacity: 100,
    currentUsage: 40,
    lat: 25.4350,
    lng: 81.8485,
  },
];

const facilityIcons: Record<string, typeof Bath> = {
  washroom: Bath,
  medical: Stethoscope,
  water: Droplets,
  food: Utensils,
  parking: Car,
  information: Info,
  prayer: Heart,
  rest_area: Sofa,
};

const facilityCategories = [
  { type: 'washroom', color: 'bg-blue-500/10 text-blue-500' },
  { type: 'medical', color: 'bg-danger/10 text-danger' },
  { type: 'water', color: 'bg-cyan-500/10 text-cyan-500' },
  { type: 'food', color: 'bg-caution/10 text-caution' },
  { type: 'parking', color: 'bg-purple-500/10 text-purple-500' },
  { type: 'information', color: 'bg-primary/10 text-primary' },
  { type: 'rest_area', color: 'bg-safe/10 text-safe' },
];

export default function FacilitiesPage() {
  const { language, t } = useLanguage();

  const groupedFacilities = facilityCategories.map((cat) => ({
    ...cat,
    facilities: mockFacilities.filter((f) => f.type === cat.type),
  }));

  const getUsageLevel = (current: number, capacity: number) => {
    const percentage = (current / capacity) * 100;
    if (percentage < 50) return 'safe';
    if (percentage < 75) return 'moderate';
    return 'high';
  };

  const handleNavigate = (facility: typeof mockFacilities[0]) => {
    // Open Google Maps with directions to the facility
    const destination = `${facility.lat},${facility.lng}`;
    const label = encodeURIComponent(language === 'hi' ? facility.nameHi : facility.name);
    
    // Try to use the native navigation app if available, otherwise open Google Maps in browser
    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${destination}&destination_place_id=${label}&travelmode=walking`;
    
    window.open(googleMapsUrl, '_blank');
  };

  return (
    <VisitorLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold">{t('facilities')}</h1>
          <p className="text-muted-foreground">
            {language === 'hi'
              ? 'पास में सुविधाएं खोजें'
              : 'Find facilities near you'}
          </p>
        </div>

        {/* Quick Access Categories */}
        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
          {facilityCategories.map((cat) => {
            const Icon = facilityIcons[cat.type];
            const count = mockFacilities.filter((f) => f.type === cat.type).length;
            return (
              <button
                key={cat.type}
                className={`flex flex-col items-center gap-1 p-3 rounded-xl ${cat.color} transition-transform hover:scale-105`}
              >
                <Icon className="w-6 h-6" />
                <span className="text-[10px] font-medium">
                  {getFacilityLabel(cat.type, language)}
                </span>
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                  {count}
                </Badge>
              </button>
            );
          })}
        </div>

        {/* Facilities by Category */}
        {groupedFacilities.map((group) => {
          if (group.facilities.length === 0) return null;

          const Icon = facilityIcons[group.type];

          return (
            <Card key={group.type} className="glass-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className={`p-2 rounded-lg ${group.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  {getFacilityLabel(group.type, language)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {group.facilities.map((facility) => {
                    const usageLevel = getUsageLevel(
                      facility.currentUsage,
                      facility.capacity
                    );
                    const usagePercent = Math.round(
                      (facility.currentUsage / facility.capacity) * 100
                    );

                    return (
                      <div
                        key={facility.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium truncate">
                              {language === 'hi' ? facility.nameHi : facility.name}
                            </span>
                            {facility.isAvailable ? (
                              <CheckCircle className="w-4 h-4 text-safe flex-shrink-0" />
                            ) : (
                              <XCircle className="w-4 h-4 text-danger flex-shrink-0" />
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-muted-foreground">
                              {facility.zone}
                            </span>
                            <span className="text-xs text-muted-foreground">•</span>
                            <span
                              className={`text-xs ${
                                usageLevel === 'safe'
                                  ? 'text-safe'
                                  : usageLevel === 'moderate'
                                  ? 'text-caution'
                                  : 'text-danger'
                              }`}
                            >
                              {usagePercent}% {language === 'hi' ? 'उपयोग' : 'usage'}
                            </span>
                          </div>
                        </div>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="gap-1 ml-2"
                          onClick={() => handleNavigate(facility)}
                        >
                          <Navigation className="w-3 h-3" />
                          <span className="hidden sm:inline">
                            {language === 'hi' ? 'नेविगेट' : 'Navigate'}
                          </span>
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </VisitorLayout>
  );
}
