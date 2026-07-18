import {
  getFluidLayout,
  getPortraitMascotVisualHeight,
} from '../activity-presentation-layout';

describe('Activity portrait presentation layout', () => {
  it('makes the desired portrait mascot larger than the horizontal baseline', () => {
    expect(getFluidLayout(390, 844).mascotVisualHeight).toBeGreaterThan(
      Math.round(844 * 0.19),
    );
  });

  it('caps mascot growth with the measured remaining height', () => {
    expect(getPortraitMascotVisualHeight({
      desiredHeight: 220,
      dialogueHeight: 100,
      gap: 10,
      headerHeight: 100,
      pageHeight: 700,
      pagePaddingV: 10,
      sceneHeight: 320,
    })).toBe(130);
  });

  it('does not change the desired height when measurements are not ready', () => {
    expect(getPortraitMascotVisualHeight({
      desiredHeight: 210,
      dialogueHeight: 0,
      gap: 10,
      headerHeight: 0,
      pageHeight: 0,
      pagePaddingV: 10,
      sceneHeight: 300,
    })).toBe(210);
  });

  it('never exceeds an extremely small remaining slot', () => {
    expect(getPortraitMascotVisualHeight({
      desiredHeight: 200,
      dialogueHeight: 130,
      gap: 10,
      headerHeight: 120,
      pageHeight: 500,
      pagePaddingV: 10,
      sceneHeight: 210,
    })).toBe(0);
  });
});
