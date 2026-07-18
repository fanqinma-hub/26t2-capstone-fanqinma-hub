import { activityRouteIds, type ActivityRouteId } from '@/config/app-config';
import { formalDemoActivityDefinitions } from './formal-activity-demo.content';
import type {
  FormalActivityNumber,
  FormalDemoActivityDefinition,
} from './formal-activity-demo.content';

export type { FormalActivityNumber } from './formal-activity-demo.content';

export const formalActivityDemoMode = true as const;

export type FormalActivityDemoEntry = Readonly<{
  routeId: ActivityRouteId;
  activity: FormalActivityNumber;
  definition: FormalDemoActivityDefinition;
  showsFixtureReward: boolean;
  rewardMessage: string;
}>;

function createEntry(routeId: ActivityRouteId): FormalActivityDemoEntry {
  const activity = Number(routeId) as FormalActivityNumber;
  const definition = formalDemoActivityDefinitions[activity];

  return {
    routeId,
    activity,
    definition,
    showsFixtureReward: activity === 1 || activity === 3 || activity === 5,
    rewardMessage: `Activity ${activity} complete. Here is your coin!`,
  };
}

export const formalActivityDemoRegistry = {
  '1': createEntry('1'),
  '2': createEntry('2'),
  '3': createEntry('3'),
  '4': createEntry('4'),
  '5': createEntry('5'),
} satisfies Readonly<Record<ActivityRouteId, FormalActivityDemoEntry>>;

export function parseFormalActivityRouteId(
  value: string | string[] | undefined,
): ActivityRouteId | null {
  const candidate = Array.isArray(value) ? value[0] : value;
  return activityRouteIds.includes(candidate as ActivityRouteId)
    ? (candidate as ActivityRouteId)
    : null;
}

export function getNextFormalActivityRouteId(
  routeId: ActivityRouteId,
): ActivityRouteId | null {
  const index = activityRouteIds.indexOf(routeId);
  return activityRouteIds[index + 1] ?? null;
}
