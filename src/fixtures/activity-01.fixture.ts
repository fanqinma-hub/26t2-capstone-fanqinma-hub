import type { ActivityScreenProps } from '@/components/activity';
import { clientScenes } from '@/constants/client-assets';

/**
 * Temporary Role 2 development fixture. Role 3 will replace this with official activity data.
 * Hotspot coordinates are illustrative and have not been confirmed by the client.
 */
export const activity01DevelopmentFixture: ActivityScreenProps = {
  activityId: '1',
  title: 'Activity 1: Look and describe',
  sceneSource: clientScenes.activity1.source,
  koolMessage: 'What can you see in this picture? Tap a highlighted part if you would like a clue.',
  currentActivity: 1,
  totalActivities: 5,
  visualState: 'tapHelpAvailable',
  microphoneState: 'idle',
  feedback: {
    title: 'A clue is ready',
    message: 'Choose a highlighted part of the picture when you would like some help.',
    variant: 'help',
  },
  hotspots: [
    {
      id: 'temporary-picture-clue',
      label: 'Try a picture clue',
      x: 0.18,
      y: 0.2,
      width: 0.3,
      height: 0.25,
    },
  ],
  onMicrophonePress: () => undefined,
  onHotspotPress: () => undefined,
};
