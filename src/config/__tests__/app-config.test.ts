import {
  activityRouteIds,
  appRoutes,
  resolveRuntimeConfig,
} from '../app-config';

describe('Role 1 route and runtime configuration smoke test', () => {
  it('exposes the canonical application routes', () => {
    expect(appRoutes.home).toBe('/');
    expect(appRoutes.report).toBe('/report');
    expect(appRoutes.reportFromActivityComplete).toBe(
      '/report?from=activityComplete',
    );
  });

  it('builds one generic route for each activity', () => {
    expect(activityRouteIds.map(appRoutes.activity)).toEqual([
      '/activity/1',
      '/activity/2',
      '/activity/3',
      '/activity/4',
      '/activity/5',
    ]);
  });

  it('accepts explicit mock mode without Azure credentials', () => {
    expect(resolveRuntimeConfig({ speechMode: 'mock' })).toEqual({
      ok: true,
      speechMode: 'mock',
    });
  });

  it('rejects missing or invalid speech modes', () => {
    expect(resolveRuntimeConfig({}).ok).toBe(false);
    expect(resolveRuntimeConfig({ speechMode: 'automatic' }).ok).toBe(false);
  });

  it('rejects Azure mode when either credential value is blank', () => {
    expect(
      resolveRuntimeConfig({
        speechMode: 'azure',
        azureSpeechKey: '',
        azureSpeechRegion: 'australiaeast',
      }).ok,
    ).toBe(false);

    expect(
      resolveRuntimeConfig({
        speechMode: 'azure',
        azureSpeechKey: 'local-test-key',
        azureSpeechRegion: ' ',
      }).ok,
    ).toBe(false);
  });

  it('returns validated local Azure configuration without logging it', () => {
    expect(
      resolveRuntimeConfig({
        speechMode: ' azure ',
        azureSpeechKey: ' local-test-key ',
        azureSpeechRegion: ' australiaeast ',
      }),
    ).toEqual({
      ok: true,
      speechMode: 'azure',
      azure: {
        subscriptionKey: 'local-test-key',
        region: 'australiaeast',
        source: 'env-local',
      },
    });
  });
});