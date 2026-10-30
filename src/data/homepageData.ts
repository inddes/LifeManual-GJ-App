import {
  HeartPulse,
  Brain,
  Flame,
  ShieldAlert,
  Users,
  TrendingDown,
  Compass,
  Moon,
  Briefcase,
  Hand,
  CloudRain,
  Sprout,
  BookOpen,
  Brain as BrainIcon,
  Footprints,
  type LucideIcon,
} from 'lucide-react';

export interface LifeTopic {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  link: string;
}

export const lifeTopics: LifeTopic[] = [
  { id: 'anxiety', name: 'Anxiety', description: 'Find calm amidst uncertainty', icon: HeartPulse, link: '/wisdom/anxiety' },
  { id: 'overthinking', name: 'Overthinking', description: 'Quiet the restless mind', icon: Brain, link: '/wisdom/overthinking' },
  { id: 'anger', name: 'Anger', description: 'Transform heat into clarity', icon: Flame, link: '/wisdom/anger' },
  { id: 'fear', name: 'Fear', description: 'Meet what scares you with courage', icon: ShieldAlert, link: '/mindfulness' },
  { id: 'relationships', name: 'Relationships', description: 'Navigate connection and conflict', icon: Users, link: '/mindfulness' },
  { id: 'failure', name: 'Failure', description: 'Rise with wisdom, not regret', icon: TrendingDown, link: '/mindfulness' },
  { id: 'purpose', name: 'Purpose', description: 'Discover what you are here for', icon: Compass, link: '/mindfulness' },
  { id: 'loneliness', name: 'Loneliness', description: 'Find companionship within', icon: Moon, link: '/mindfulness' },
  { id: 'work-pressure', name: 'Work & Pressure', description: 'Act with steadiness under strain', icon: Briefcase, link: '/mindfulness' },
  { id: 'self-control', name: 'Self-Control', description: 'Master the impulses that drive you', icon: Hand, link: '/mindfulness' },
  { id: 'grief-loss', name: 'Grief & Loss', description: 'Move through sorrow with grace', icon: CloudRain, link: '/mindfulness' },
  { id: 'spiritual-growth', name: 'Spiritual Growth', description: 'Deepen your inner journey', icon: Sprout, link: '/mindfulness' },
];

export interface JourneyCard {
  id: string;
  label: string;
  title: string;
  description: string;
  icon: LucideIcon;
  link: string;
}

export const journeyCards: JourneyCard[] = [
  {
    id: 'understand',
    label: 'Understand',
    title: 'Read the Bhagavad Gita',
    description: 'Explore verses, meanings and teachings systematically.',
    icon: BookOpen,
    link: '/mindfulness',
  },
  {
    id: 'apply',
    label: 'Apply',
    title: 'Wisdom for Life',
    description: 'Discover teachings for mind, relationships, work, emotions and purpose.',
    icon: BrainIcon,
    link: '/meditation',
  },
  {
    id: 'practice',
    label: 'Practice',
    title: 'Step In',
    description: 'Turn wisdom into reflection, meditation and spiritual practice.',
    icon: Footprints,
    link: '/stepin',
  },
];

export interface BeginnerStep {
  number: number;
  question: string;
}

export const beginnerSteps: BeginnerStep[] = [
  { number: 1, question: 'Why am I here?' },
  { number: 2, question: 'Who am I?' },
  { number: 3, question: 'Why is the mind difficult to control?' },
  { number: 4, question: 'What is my purpose?' },
  { number: 5, question: 'What is karma?' },
  { number: 6, question: 'What is yoga?' },
  { number: 7, question: 'Who is Krishna?' },
  { number: 8, question: 'What is bhakti?' },
];
