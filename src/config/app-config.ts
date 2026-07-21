export const activityRouteIds = ['1', '2', '3', '4', '5'] as const;

export type ActivityRouteId = (typeof activityRouteIds)[number];

export const appRoutes = {
  home: '/' as const,
  report: '/report' as const,
  reportParent: '/report?audience=parent' as const,
  reportTherapist: '/report?audience=therapist' as const,
  reportFromActivityComplete: '/report?audience=parent' as const,
  unitComplete: '/unit-complete' as const,
  activity: (activityId: ActivityRouteId) => `/activity/${activityId}` as const,
};

export interface PublicRuntimeEnvironment {
  speechMode?: string;
  azureSpeechKey?: string;
  azureSpeechRegion?: string;
}

export type RuntimeConfig =
  | {
      ok: true;
      speechMode: 'mock';
    }
  | {
      ok: true;
      speechMode: 'azure';
      azure: {
        subscriptionKey: string;
        region: string;
        source: 'env-local';
      };
    }
  | {
      ok: false;
      code: 'configuration';
      message: string;
    };

export function resolveRuntimeConfig(
  environment: PublicRuntimeEnvironment,
): RuntimeConfig {
  const speechMode = environment.speechMode?.trim();

  if (speechMode !== 'mock' && speechMode !== 'azure') {
    return {
      ok: false,
      code: 'configuration',
      message: 'EXPO_PUBLIC_SPEECH_MODE must be mock or azure.',
    };
  }

  if (speechMode === 'mock') {
    return {
      ok: true,
      speechMode: 'mock',
    };
  }

  const subscriptionKey = environment.azureSpeechKey?.trim();
  const region = environment.azureSpeechRegion?.trim();

  if (!subscriptionKey || !region) {
    return {
      ok: false,
      code: 'configuration',
      message: 'Azure speech mode requires a local key and region.',
    };
  }

  return {
    ok: true,
    speechMode: 'azure',
    azure: {
      subscriptionKey,
      region,
      source: 'env-local',
    },
  };
}

export function loadRuntimeConfig(): RuntimeConfig {
  return resolveRuntimeConfig({
    speechMode: process.env.EXPO_PUBLIC_SPEECH_MODE,
    azureSpeechKey: process.env.EXPO_PUBLIC_AZURE_SPEECH_KEY,
    azureSpeechRegion: process.env.EXPO_PUBLIC_AZURE_SPEECH_REGION,
  });
}
