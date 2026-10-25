export interface WorldConfig {
  id: number;
  slug: string;
  badge: {
    dotColor: string;
    text: string;
    secondaryText?: string;
  };
  headlineTop: string;
  headlineBottom: string;
  description: string[];
  ctaText: string;
  ctaAction: 'start' | 'kit' | 'route' | 'relay';
  alignment: 'left' | 'right';
  startTime: number;
  endTime: number;
  scrollStart: number;
  scrollEnd: number;
  accentColor: string;
  theme: string;
  thumbnail: string;
  poster: string;
  stats: {
    distance: string;
    elevation: string;
    temperature: string;
    terrain: string;
  };
}

export interface NavItem {
  label: string;
  targetWorldId?: number;
  action?: string;
}

export type VideoQuality = '4k' | 'qhd' | 'fhd';

