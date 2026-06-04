import { Sponsor } from '../types';

export const sponsors: Sponsor[] = [
  {
    id: 'sponsor-1',
    name: 'Georgia Title Partners',
    description: 'Fast, investor-friendly title searches and quiet title actions for tax deed properties.',
    category: 'Legal Services',
    url: '#',
    placements: ['sidebar', 'footer'],
    active: true
  },
  {
    id: 'sponsor-2',
    name: 'Apex Surveying',
    description: 'Quick turnaround boundary surveys and subdivision plats across metro Atlanta.',
    category: 'Surveying',
    url: '#',
    placements: ['sidebar', 'report'],
    active: true
  },
  {
    id: 'sponsor-3',
    name: 'BuildReady Financing',
    description: 'Hard money and construction loans specifically designed for infill lot developers.',
    category: 'Financing',
    url: '#',
    placements: ['footer', 'alert_email'],
    active: true
  }
];
