import { createInitialState, transition } from '../src/conversation/dialogue-state-machine';
import { TimingThresholds, KoolMessages } from '../src/constants/conversation.config';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`[PASS] ${message}`);
}

function runVerification() {
  console.log('Starting dialogue flow verification tests...\n');

  // Test 1: createInitialState
  let state = createInitialState();
  assert(state.phase === 'IDLE', 'Initial state phase is IDLE');
  assert(state.promptId === null, 'Initial prompt ID is null');

  // Test 2: START_PROMPT with custom texts
  const customPrompt = 'Look at this big tree! What is its color?';
  const customReprompt = 'Can you describe the size of the tree?';
  const customHelp = 'Tell me if the tree is big or small.';
  
  let result = transition(state, {
    type: 'START_PROMPT',
    promptId: 'activity1_p1',
    customPromptText: customPrompt,
    customRepromptText: customReprompt,
    customHelpText: customHelp
  });

  state = result.state;
  let action = result.action;

  assert(state.phase === 'PROMPT', 'Transitions to PROMPT phase');
  assert(state.promptId === 'activity1_p1', 'Stores prompt ID');
  assert(state.currentPromptText === customPrompt, 'Stores custom prompt text');
  assert(state.currentRepromptText === customReprompt, 'Stores custom reprompt text');
  assert(state.currentHelpText === customHelp, 'Stores custom help text');
  assert(action.message === customPrompt, 'Action message matches custom prompt');
  assert(action.subtitleText === customPrompt, 'Action subtitleText matches custom prompt');

  // Test 3: PROMPT_DELIVERED transitions to LISTENING and retains subtitle
  result = transition(state, { type: 'PROMPT_DELIVERED' });
  state = result.state;
  action = result.action;

  assert(state.phase === 'LISTENING', 'Transitions to LISTENING phase');
  assert(action.message === customPrompt, 'Listening action retains custom prompt message');
  assert(action.subtitleText === customPrompt, 'Listening action retains custom prompt subtitleText');
  assert(action.shouldListen === true, 'Listening action requests mic listening');

  // Test 4: TIMER_TICK during LISTENING (below 3s) preserves text
  result = transition(state, { type: 'TIMER_TICK', elapsedMs: 1500 });
  state = result.state;
  action = result.action;

  assert(state.phase === 'LISTENING', 'Stays in LISTENING phase at 1.5s');
  assert(action.message === customPrompt, 'Ticking keeps custom prompt message');
  assert(action.subtitleText === customPrompt, 'Ticking keeps custom prompt subtitleText');

  // Test 5: TIMER_TICK reaches 3s -> transitions to VISUAL_CUE
  result = transition(state, { type: 'TIMER_TICK', elapsedMs: TimingThresholds.VISUAL_CUE_MS });
  state = result.state;
  action = result.action;

  assert(state.phase === 'VISUAL_CUE', 'Transitions to VISUAL_CUE phase at 3s');
  assert(action.message === KoolMessages.visualCue.default, 'Emits visual cue message');
  assert(action.subtitleText === KoolMessages.visualCue.default, 'Emits visual cue subtitleText');

  // Test 6: Subsequent ticks during VISUAL_CUE do NOT clear the text
  result = transition(state, { type: 'TIMER_TICK', elapsedMs: 4000 });
  state = result.state;
  action = result.action;

  assert(state.phase === 'VISUAL_CUE', 'Stays in VISUAL_CUE phase at 4s');
  assert(action.message === KoolMessages.visualCue.default, 'Subsequent ticks retain visual cue message');
  assert(action.subtitleText === KoolMessages.visualCue.default, 'Subsequent ticks retain visual cue subtitleText');

  // Test 7: TIMER_TICK reaches 6s -> transitions to REPROMPT
  result = transition(state, { type: 'TIMER_TICK', elapsedMs: TimingThresholds.REPROMPT_MS });
  state = result.state;
  action = result.action;

  assert(state.phase === 'REPROMPT', 'Transitions to REPROMPT phase at 6s');
  assert(action.message === customReprompt, 'Emits custom reprompt message');
  assert(action.subtitleText === customReprompt, 'Emits custom reprompt subtitleText');

  // Test 8: Subsequent ticks during REPROMPT do NOT clear the text
  result = transition(state, { type: 'TIMER_TICK', elapsedMs: 8000 });
  state = result.state;
  action = result.action;

  assert(state.phase === 'REPROMPT', 'Stays in REPROMPT phase at 8s');
  assert(action.message === customReprompt, 'Subsequent ticks retain custom reprompt message');
  assert(action.subtitleText === customReprompt, 'Subsequent ticks retain custom reprompt subtitle');

  // Test 9: TIMER_TICK reaches 10s -> transitions to TAP_TO_HELP
  result = transition(state, { type: 'TIMER_TICK', elapsedMs: TimingThresholds.TAP_TO_HELP_MS });
  state = result.state;
  action = result.action;

  assert(state.phase === 'TAP_TO_HELP', 'Transitions to TAP_TO_HELP phase at 10s');
  assert(action.message === KoolMessages.tapToHelp.default, 'Emits tap to help message');
  assert(action.subtitleText === KoolMessages.tapToHelp.default, 'Emits tap to help subtitle');
  assert(action.showTapHelp === true, 'Enables tap to help UI visibility');

  // Test 10: Subsequent ticks during TAP_TO_HELP do NOT clear the text
  result = transition(state, { type: 'TIMER_TICK', elapsedMs: 12000 });
  state = result.state;
  action = result.action;

  assert(state.phase === 'TAP_TO_HELP', 'Stays in TAP_TO_HELP phase at 12s');
  assert(action.message === KoolMessages.tapToHelp.default, 'Subsequent ticks retain tap help message');
  assert(action.subtitleText === KoolMessages.tapToHelp.default, 'Subsequent ticks retain tap help subtitle');

  // Test 11: TAP_HELP event -> transitions to FINAL_LISTEN
  result = transition(state, { type: 'TAP_HELP' });
  state = result.state;
  action = result.action;

  assert(state.phase === 'FINAL_LISTEN', 'Transitions to FINAL_LISTEN on help pressed');
  assert(state.scaffoldUsed === true, 'Tracks that help scaffold was used');
  assert(action.message === customHelp, 'Emits custom help response message');
  assert(action.subtitleText === customHelp, 'Emits custom help response subtitle');

  // Test 12: TIMER_TICK reaches 15s (final listen expiry) -> AUTO_ADVANCE
  result = transition(state, { type: 'TIMER_TICK', elapsedMs: TimingThresholds.FINAL_LISTEN_MS });
  state = result.state;
  action = result.action;

  assert(state.phase === 'AUTO_ADVANCE', 'Transitions to AUTO_ADVANCE after final listen window expires');
  assert(action.message === KoolMessages.fallback.timeout, 'Emits fallback timeout message');
  assert(action.subtitleText === KoolMessages.fallback.timeout, 'Emits fallback timeout subtitle');

  console.log('\nAll dialogue state machine and subtitle tests completed successfully!');
}

runVerification();
