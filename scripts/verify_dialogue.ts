import { createInitialState, transition } from '../src/conversation/dialogue-state-machine';
import { TimingThresholds, KoolMessages } from '../src/constants/conversation.config';
import {
  isChildSafe,
  sanitizeKoolMessage,
  generateClinicalRecast,
  applyResponseRules,
  enforceSentenceLimit
} from '../src/conversation/child-safe-guardrails';
import { generateRecast } from '../src/conversation/dialogue-actions';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`[PASS] ${message}`);
}

function runVerification() {
  console.log('Starting dialogue flow verification tests...\n');

  // ---------------------------------------------------------------------------
  // Phase 1: State Machine & Subtitle Persistence Tests
  // ---------------------------------------------------------------------------
  console.log('--- Phase 1: State Machine & Subtitles ---');
  let state = createInitialState();
  assert(state.phase === 'IDLE', 'Initial state phase is IDLE');
  assert(state.promptId === null, 'Initial prompt ID is null');

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

  result = transition(state, { type: 'PROMPT_DELIVERED' });
  state = result.state;
  action = result.action;

  assert(state.phase === 'LISTENING', 'Transitions to LISTENING phase');
  assert(action.message === customPrompt, 'Listening action retains custom prompt message');
  assert(action.subtitleText === customPrompt, 'Listening action retains custom prompt subtitleText');
  assert(action.shouldListen === true, 'Listening action requests mic listening');

  result = transition(state, { type: 'TIMER_TICK', elapsedMs: 1500 });
  state = result.state;
  action = result.action;

  assert(state.phase === 'LISTENING', 'Stays in LISTENING phase at 1.5s');
  assert(action.message === customPrompt, 'Ticking keeps custom prompt message');
  assert(action.subtitleText === customPrompt, 'Ticking keeps custom prompt subtitleText');

  result = transition(state, { type: 'TIMER_TICK', elapsedMs: TimingThresholds.VISUAL_CUE_MS });
  state = result.state;
  action = result.action;

  assert(state.phase === 'VISUAL_CUE', 'Transitions to VISUAL_CUE phase at 3s');
  assert(action.message === KoolMessages.visualCue.default, 'Emits visual cue message');
  assert(action.subtitleText === KoolMessages.visualCue.default, 'Emits visual cue subtitleText');

  result = transition(state, { type: 'TIMER_TICK', elapsedMs: 4000 });
  state = result.state;
  action = result.action;

  assert(state.phase === 'VISUAL_CUE', 'Stays in VISUAL_CUE phase at 4s');
  assert(action.message === KoolMessages.visualCue.default, 'Subsequent ticks retain visual cue message');
  assert(action.subtitleText === KoolMessages.visualCue.default, 'Subsequent ticks retain visual cue subtitleText');

  result = transition(state, { type: 'TIMER_TICK', elapsedMs: TimingThresholds.REPROMPT_MS });
  state = result.state;
  action = result.action;

  assert(state.phase === 'REPROMPT', 'Transitions to REPROMPT phase at 6s');
  assert(action.message === customReprompt, 'Emits custom reprompt message');
  assert(action.subtitleText === customReprompt, 'Emits custom reprompt subtitleText');

  result = transition(state, { type: 'TIMER_TICK', elapsedMs: 8000 });
  state = result.state;
  action = result.action;

  assert(state.phase === 'REPROMPT', 'Stays in REPROMPT phase at 8s');
  assert(action.message === customReprompt, 'Subsequent ticks retain custom reprompt message');
  assert(action.subtitleText === customReprompt, 'Subsequent ticks retain custom reprompt subtitle');

  result = transition(state, { type: 'TIMER_TICK', elapsedMs: TimingThresholds.TAP_TO_HELP_MS });
  state = result.state;
  action = result.action;

  assert(state.phase === 'TAP_TO_HELP', 'Transitions to TAP_TO_HELP phase at 10s');
  assert(action.message === KoolMessages.tapToHelp.default, 'Emits tap to help message');
  assert(action.subtitleText === KoolMessages.tapToHelp.default, 'Emits tap to help subtitle');
  assert(action.showTapHelp === true, 'Enables tap to help UI visibility');

  result = transition(state, { type: 'TIMER_TICK', elapsedMs: 12000 });
  state = result.state;
  action = result.action;

  assert(state.phase === 'TAP_TO_HELP', 'Stays in TAP_TO_HELP phase at 12s');
  assert(action.message === KoolMessages.tapToHelp.default, 'Subsequent ticks retain tap help message');
  assert(action.subtitleText === KoolMessages.tapToHelp.default, 'Subsequent ticks retain tap help subtitle');

  result = transition(state, { type: 'TAP_HELP' });
  state = result.state;
  action = result.action;

  assert(state.phase === 'FINAL_LISTEN', 'Transitions to FINAL_LISTEN on help pressed');
  assert(state.scaffoldUsed === true, 'Tracks that help scaffold was used');
  assert(action.message === customHelp, 'Emits custom help response message');
  assert(action.subtitleText === customHelp, 'Emits custom help response subtitle');

  result = transition(state, { type: 'TIMER_TICK', elapsedMs: TimingThresholds.FINAL_LISTEN_MS });
  state = result.state;
  action = result.action;

  assert(state.phase === 'AUTO_ADVANCE', 'Transitions to AUTO_ADVANCE after final listen window expires');
  assert(action.message === 'Great effort! Ready for the next one?', 'Emits fallback timeout message with engagement question');
  assert(action.subtitleText === 'Great effort! Ready for the next one?', 'Emits fallback timeout subtitle with engagement question');

  // ---------------------------------------------------------------------------
  // Phase 2: PROJ-15 Clinical Guardrails & Recast Tests
  // ---------------------------------------------------------------------------
  console.log('\n--- Phase 2: Clinical Guardrails & Recasts ---');

  // Clinical safety checks
  assert(isChildSafe('This is a big elephant.') === true, 'Valid message is child-safe');
  assert(isChildSafe('This is incorrect.') === false, 'Blocked clinical word "incorrect" is filtered');
  assert(isChildSafe('No!') === false, 'Blocked clinical word "no" is filtered');
  assert(isChildSafe('wrong, try again.') === false, 'Blocked clinical word "wrong" and "try again" are filtered');
  assert(isChildSafe('It was a mistake.') === false, 'Blocked clinical word "mistake" is filtered');
  
  // Non-false-positive boundary tests for "no"
  assert(isChildSafe('I know what to do') === true, 'Word "know" is not blocked by "no" filter');
  assert(isChildSafe('Touch your nose') === true, 'Word "nose" is not blocked by "no" filter');
  assert(isChildSafe('There is nothing here') === true, 'Word "nothing" is not blocked by "no" filter');
  assert(isChildSafe('Good afternoon') === true, 'Word "afternoon" is not blocked by "no" filter');

  // Indirect Recast Generator
  const recastWatermelon = generateRecast('watermelon', 'big');
  assert(recastWatermelon === 'A BIG watermelon! So big!', 'Indirect recast for watermelon is generated correctly');

  const recastApple = generateRecast('apple', 'enormous');
  assert(recastApple === 'An ENORMOUS apple! So enormous!', 'Indirect recast handles indefinite article "An" correctly');

  // Sentence Response Rules (1-2 sentences)
  assert(enforceSentenceLimit('First sentence. Second sentence. Third sentence.') === 'First sentence. Second sentence.', 'Restricts sentence count to at most 2 sentences');
  assert(enforceSentenceLimit('Hello! How are you?') === 'Hello! How are you?', 'Preserves 2 sentences');
  assert(enforceSentenceLimit('Only one.') === 'Only one.', 'Preserves 1 sentence');

  // Engagement Question Rule
  const timeoutMsg = applyResponseRules('Kool is moving on.', 'AUTO_ADVANCE');
  assert(timeoutMsg === 'Kool is moving on. Ready for the next one?', 'Appends engagement question to timeout message');

  const recastEngagement = applyResponseRules('A BIG watermelon! So big!', undefined, true);
  assert(recastEngagement === 'A BIG watermelon! Ready for the next one?', 'Appends engagement question and keeps within 2 sentences');

  console.log('\nAll dialogue, clinical safety, recast, and sentence tests completed successfully!');
}

runVerification();
