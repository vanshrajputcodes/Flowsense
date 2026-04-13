-- FlowSense AI Database Schema

-- ============================================
-- ENUMS
-- ============================================

-- User roles enum
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'visitor');

-- Zone status enum
CREATE TYPE public.zone_status AS ENUM ('green', 'yellow', 'red', 'critical');

-- Queue status enum
CREATE TYPE public.queue_status AS ENUM ('active', 'paused', 'closed');

-- Token status enum
CREATE TYPE public.token_status AS ENUM ('waiting', 'called', 'served', 'cancelled', 'expired');

-- Alert severity enum
CREATE TYPE public.alert_severity AS ENUM ('info', 'warning', 'critical', 'emergency');

-- Alert status enum
CREATE TYPE public.alert_status AS ENUM ('active', 'resolved', 'expired');

-- Facility type enum
CREATE TYPE public.facility_type AS ENUM ('washroom', 'medical', 'water', 'food', 'parking', 'information', 'prayer', 'rest_area');

-- ============================================
-- TABLES
-- ============================================

-- User Roles Table (separate from profiles for security)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'visitor',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Profiles Table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    full_name TEXT,
    phone TEXT,
    language TEXT DEFAULT 'en',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Zones Table (areas within the venue)
CREATE TABLE public.zones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    name_hi TEXT, -- Hindi name
    description TEXT,
    capacity INTEGER NOT NULL DEFAULT 1000,
    current_count INTEGER NOT NULL DEFAULT 0,
    status zone_status NOT NULL DEFAULT 'green',
    coordinates JSONB, -- For map positioning
    parent_zone_id UUID REFERENCES public.zones(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Sensor Readings Table (simulated IoT data)
CREATE TABLE public.sensor_readings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    zone_id UUID REFERENCES public.zones(id) ON DELETE CASCADE NOT NULL,
    count INTEGER NOT NULL DEFAULT 0,
    flow_rate INTEGER DEFAULT 0, -- people per minute
    temperature DECIMAL(5,2),
    recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Queues Table
CREATE TABLE public.queues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    name_hi TEXT,
    zone_id UUID REFERENCES public.zones(id) ON DELETE SET NULL,
    status queue_status NOT NULL DEFAULT 'active',
    current_token INTEGER NOT NULL DEFAULT 0,
    avg_service_time INTEGER DEFAULT 120, -- seconds
    max_capacity INTEGER DEFAULT 500,
    priority_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Queue Tokens Table
CREATE TABLE public.queue_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    queue_id UUID REFERENCES public.queues(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    token_number INTEGER NOT NULL,
    status token_status NOT NULL DEFAULT 'waiting',
    is_priority BOOLEAN DEFAULT false,
    estimated_wait_time INTEGER, -- minutes
    phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    called_at TIMESTAMP WITH TIME ZONE,
    served_at TIMESTAMP WITH TIME ZONE
);

-- Alerts Table
CREATE TABLE public.alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    title_hi TEXT,
    message TEXT NOT NULL,
    message_hi TEXT,
    severity alert_severity NOT NULL DEFAULT 'info',
    status alert_status NOT NULL DEFAULT 'active',
    zone_ids UUID[], -- Target zones (null = all zones)
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    expires_at TIMESTAMP WITH TIME ZONE,
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- Facilities Table
CREATE TABLE public.facilities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    name_hi TEXT,
    type facility_type NOT NULL,
    zone_id UUID REFERENCES public.zones(id) ON DELETE SET NULL,
    coordinates JSONB,
    is_available BOOLEAN DEFAULT true,
    capacity INTEGER,
    current_usage INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Predictions Table (AI-generated forecasts)
CREATE TABLE public.predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    zone_id UUID REFERENCES public.zones(id) ON DELETE CASCADE,
    predicted_count INTEGER NOT NULL,
    confidence DECIMAL(5,4), -- 0.0000 to 1.0000
    prediction_for TIMESTAMP WITH TIME ZONE NOT NULL,
    factors JSONB, -- weather, events, etc.
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Incidents Table (for tracking emergencies)
CREATE TABLE public.incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    zone_id UUID REFERENCES public.zones(id) ON DELETE SET NULL,
    severity alert_severity NOT NULL DEFAULT 'warning',
    status TEXT DEFAULT 'open',
    reported_by UUID REFERENCES auth.users(id),
    assigned_to UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- ============================================
-- SECURITY FUNCTIONS
-- ============================================

-- Function to check if user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'admin')
$$;

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sensor_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.queues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.queue_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;

-- User Roles Policies
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
ON public.user_roles FOR ALL
USING (public.is_admin(auth.uid()));

-- Profiles Policies
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
USING (public.is_admin(auth.uid()));

-- Zones Policies (public read, admin write)
CREATE POLICY "Anyone can view zones"
ON public.zones FOR SELECT
TO authenticated, anon
USING (true);

CREATE POLICY "Admins can manage zones"
ON public.zones FOR ALL
USING (public.is_admin(auth.uid()));

-- Sensor Readings Policies
CREATE POLICY "Anyone can view sensor readings"
ON public.sensor_readings FOR SELECT
TO authenticated, anon
USING (true);

CREATE POLICY "Admins can manage sensor readings"
ON public.sensor_readings FOR ALL
USING (public.is_admin(auth.uid()));

-- Queues Policies
CREATE POLICY "Anyone can view queues"
ON public.queues FOR SELECT
TO authenticated, anon
USING (true);

CREATE POLICY "Admins can manage queues"
ON public.queues FOR ALL
USING (public.is_admin(auth.uid()));

-- Queue Tokens Policies
CREATE POLICY "Users can view their own tokens"
ON public.queue_tokens FOR SELECT
USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE POLICY "Authenticated users can create tokens"
ON public.queue_tokens FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tokens"
ON public.queue_tokens FOR UPDATE
USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

-- Alerts Policies (public read for active alerts)
CREATE POLICY "Anyone can view active alerts"
ON public.alerts FOR SELECT
TO authenticated, anon
USING (status = 'active');

CREATE POLICY "Admins can manage alerts"
ON public.alerts FOR ALL
USING (public.is_admin(auth.uid()));

-- Facilities Policies
CREATE POLICY "Anyone can view facilities"
ON public.facilities FOR SELECT
TO authenticated, anon
USING (true);

CREATE POLICY "Admins can manage facilities"
ON public.facilities FOR ALL
USING (public.is_admin(auth.uid()));

-- Predictions Policies
CREATE POLICY "Anyone can view predictions"
ON public.predictions FOR SELECT
TO authenticated, anon
USING (true);

CREATE POLICY "Admins can manage predictions"
ON public.predictions FOR ALL
USING (public.is_admin(auth.uid()));

-- Incidents Policies
CREATE POLICY "Admins can view incidents"
ON public.incidents FOR SELECT
USING (public.is_admin(auth.uid()));

CREATE POLICY "Authenticated users can create incidents"
ON public.incidents FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Admins can manage incidents"
ON public.incidents FOR ALL
USING (public.is_admin(auth.uid()));

-- ============================================
-- TRIGGERS
-- ============================================

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Apply update triggers
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_zones_updated_at
BEFORE UPDATE ON public.zones
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_queues_updated_at
BEFORE UPDATE ON public.queues
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (user_id, full_name)
    VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
    
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'visitor');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_sensor_readings_zone_id ON public.sensor_readings(zone_id);
CREATE INDEX idx_sensor_readings_recorded_at ON public.sensor_readings(recorded_at DESC);
CREATE INDEX idx_queue_tokens_queue_id ON public.queue_tokens(queue_id);
CREATE INDEX idx_queue_tokens_status ON public.queue_tokens(status);
CREATE INDEX idx_alerts_status ON public.alerts(status);
CREATE INDEX idx_predictions_zone_id ON public.predictions(zone_id);
CREATE INDEX idx_predictions_for ON public.predictions(prediction_for);