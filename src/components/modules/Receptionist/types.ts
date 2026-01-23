// Receptionist Configuration Types

export interface TeamMember {
  id: string;
  name: string;
  phone: string;
  role: string;
  priority: number;
  acceptsLeads: boolean;
}

export interface BusinessHours {
  day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  enabled: boolean;
  startTime: string; // HH:MM format
  endTime: string;
}

export interface FAQEntry {
  id: string;
  question: string;
  answer: string;
}

export type Industry =
  | 'contractor'
  | 'healthcare'
  | 'legal'
  | 'restaurant'
  | 'retail'
  | 'salon'
  | 'consulting'
  | 'custom';

export type VoiceId = 'amy' | 'lessac' | 'jenny' | 'ryan' | 'joe';

export type PingStrategy = 'waterfall' | 'simultaneous' | 'round-robin';

export type SolicitorHandling = 'polite_decline' | 'voicemail' | 'blocklist' | 'custom';

export type AfterHoursBehavior = 'same' | 'voicemail_only' | 'emergency_only' | 'always_try_transfer';

export interface ReceptionistConfig {
  businessId: string;
  businessName: string;
  industry: Industry;
  greetingScript: string;
  voiceId: VoiceId;

  // Team
  teamMembers: TeamMember[];

  // Call Handling
  classificationPatience: number; // seconds
  pingTimeout: number; // seconds
  pingStrategy: PingStrategy;
  ownerAcceptsLeads: boolean;
  solicitorHandling: SolicitorHandling;
  customSolicitorMessage?: string;

  // Business Hours
  businessHours: BusinessHours[];
  timezone: string;
  afterHoursBehavior: AfterHoursBehavior;

  // FAQ
  faqEntries: FAQEntry[];

  // Phone
  twilioNumber?: string;
  forwardingNumber?: string;
}

export type LeadStatus = 'pending' | 'contacted' | 'converted' | 'lost';

export type LeadUrgency = 'low' | 'medium' | 'high' | 'emergency';

export type CallOutcome =
  | 'lead_captured'
  | 'transferred'
  | 'voicemail'
  | 'hung_up'
  | 'solicitor'
  | 'wrong_number'
  | 'faq_answered';

export interface Lead {
  id: string;
  businessId: string;
  callSid: string;
  callerNumber: string;
  callerName?: string;
  summary: string;
  urgency: LeadUrgency;
  outcome: CallOutcome;
  status: LeadStatus;
  recordingUrl?: string;
  transcript?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export const INDUSTRIES: { value: Industry; label: string }[] = [
  { value: 'contractor', label: 'Contractor / Home Services' },
  { value: 'healthcare', label: 'Healthcare / Medical' },
  { value: 'legal', label: 'Legal / Law Firm' },
  { value: 'restaurant', label: 'Restaurant / Food Service' },
  { value: 'retail', label: 'Retail / E-commerce' },
  { value: 'salon', label: 'Salon / Spa / Beauty' },
  { value: 'consulting', label: 'Consulting / Professional Services' },
  { value: 'custom', label: 'Custom / Other' },
];

export const VOICES: { value: VoiceId; label: string; description: string }[] = [
  { value: 'amy', label: 'Amy', description: 'Professional, friendly female voice' },
  { value: 'lessac', label: 'Lessac', description: 'Warm, conversational female voice' },
  { value: 'jenny', label: 'Jenny', description: 'Clear, articulate female voice' },
  { value: 'ryan', label: 'Ryan', description: 'Confident, professional male voice' },
  { value: 'joe', label: 'Joe', description: 'Friendly, approachable male voice' },
];

export const PING_STRATEGIES: { value: PingStrategy; label: string; description: string }[] = [
  { value: 'waterfall', label: 'Waterfall', description: 'Call team members one at a time in priority order' },
  { value: 'simultaneous', label: 'Simultaneous', description: 'Ring all team members at once' },
  { value: 'round-robin', label: 'Round Robin', description: 'Distribute calls evenly among team members' },
];

export const SOLICITOR_OPTIONS: { value: SolicitorHandling; label: string }[] = [
  { value: 'polite_decline', label: 'Politely decline and hang up' },
  { value: 'voicemail', label: 'Send to voicemail' },
  { value: 'blocklist', label: 'Add to blocklist' },
  { value: 'custom', label: 'Custom message' },
];

export const AFTER_HOURS_OPTIONS: { value: AfterHoursBehavior; label: string }[] = [
  { value: 'same', label: 'Same as business hours' },
  { value: 'voicemail_only', label: 'Voicemail only' },
  { value: 'emergency_only', label: 'Emergency calls only' },
  { value: 'always_try_transfer', label: 'Always try to transfer' },
];

export const TIMEZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Phoenix',
  'America/Anchorage',
  'Pacific/Honolulu',
  'Europe/London',
  'Europe/Paris',
  'Asia/Tokyo',
  'Australia/Sydney',
];

export const DAYS_OF_WEEK = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
] as const;
