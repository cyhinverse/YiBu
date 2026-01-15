import { Globe, Lock, Users } from 'lucide-react';

// Privacy options for posts
export const PRIVACY_OPTIONS = [
  {
    value: 'public',
    label: 'Public',
    icon: Globe,
    description: 'Anyone can see this post',
  },
  {
    value: 'followers',
    label: 'Followers',
    icon: Users,
    description: 'Only followers can see',
  },
  {
    value: 'private',
    label: 'Only me',
    icon: Lock,
    description: 'Only you can see this post',
  },
];
