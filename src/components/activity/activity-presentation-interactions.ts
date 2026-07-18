type MicrophoneHoldState = { current: boolean };

export function beginMicrophoneHold(
  canStart: boolean,
  holdState: MicrophoneHoldState,
  onStart: () => void,
) {
  if (!canStart) return;
  holdState.current = true;
  onStart();
}

export function endMicrophoneHold(
  canStop: boolean,
  holdState: MicrophoneHoldState,
  onStop: () => void,
) {
  if (!holdState.current && !canStop) return;
  holdState.current = false;
  onStop();
}

export function isSceneContainerAccessible(showClueTargets: boolean) {
  return !showClueTargets;
}
