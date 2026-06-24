import type { ActivityHotspot } from '@/components/activity';
import { clientScenes } from '@/constants/client-assets';

/**
 * Temporary content fixture. Role 3 will replace this with official shared
 * activity data; the normalized watermelon bounds remain demo-only values.
 */
export const activity01DevelopmentFixture: {
  activityId: string;
  title: string;
  sceneSource: typeof clientScenes.activity1.source;
  currentActivity: number;
  totalActivities: number;
  hotspots: ActivityHotspot[];
} = {
  activityId: '1',
  title: 'Activity 1: Look and describe',
  sceneSource: clientScenes.activity1.source,
  currentActivity: 1,
  totalActivities: 5,
  hotspots: [
    {
      id: 'watermelon-size-clue',
      label: 'Watermelon size clue',
      x: 0.05,
      y: 0.15,
      width: 0.46,
      height: 0.64,
    },
  ],
};
