/**
 * Reviewable TypeSafe questions for plugin surgery.
 * The /hig runtime does not import this file and does not call Jev.
 *
 * Choice: which unmatched Apple HIG Don't the next scanner should account.
 * Noul: whether the /hig goal sentence is true. Do not mark the goal complete.
 */

export const JEV_MODEL = "jev-latest";

export const NOUL_GOAL =
  "The /hig goal is achieved: any UI host, any coding model, looks Apple-designed, with brand fonts kept and no kit.";

/** Act only when `choice` is the unique highest probability. Do not break a tie. */
export const ACT_THRESHOLD = {
  requireUniqueTopProbability: true,
};

export const NEXT_DONT = {
  id: "next_dont",
  instructions:
    "Which unmatched Apple HIG Don't should the next mechanical scanner account?",
  criteria: {
    mac_tab_canon:
      "iPhone tab-bar-only exclusive canon.",
    ios_tabs_on_windows:
      "Force iPhone tab-bar-only canon onto Mac document windows or `register: brand` landings.",
    dock_pixel_specs:
      "Reprint Dock/path-control pixel specs.",
  },
};

export const GOAL_NOUL = {
  id: "goal_achieved",
  instructions: NOUL_GOAL,
};

export function buildJevState() {
  return {
    goal: NOUL_GOAL,
    host_rules: {
      brand_fonts_stay: true,
      kit_injected: false,
      required_ids: 12,
      design_principles_dont_coverage_complete: false,
      visual_any_host_apple_ness: "unproven",
      dont_coverage_complete_topics: 127,
      catalog_topics: 158,
    },
    unmatched_donts: Object.entries(NEXT_DONT.criteria).map(([label, sentence]) => ({
      label,
      sentence,
    })),
  };
}

export function buildJevRequest(state = buildJevState()) {
  return {
    model: JEV_MODEL,
    state,
    questions: {
      [NEXT_DONT.id]: {
        type: "choice",
        instructions: NEXT_DONT.instructions,
        criteria: NEXT_DONT.criteria,
      },
      [GOAL_NOUL.id]: {
        type: "noul",
        instructions: GOAL_NOUL.instructions,
      },
    },
  };
}

export function readChoiceDecision(answer) {
  const probabilities = answer?.probabilities || {};
  const ranked = Object.entries(probabilities).sort((a, b) => b[1] - a[1]);
  const top = ranked[0];
  const second = ranked[1];
  if (!top) {
    return { act: false, reason: "missing probabilities" };
  }
  const tied = ACT_THRESHOLD.requireUniqueTopProbability && second && second[1] === top[1];
  if (tied) {
    return {
      act: false,
      reason: "tie",
      label: answer.choice ?? null,
      probability: top[1],
      confidence: answer.confidence ?? null,
    };
  }
  if (answer.choice !== top[0]) {
    return {
      act: false,
      reason: "choice is not the unique top probability",
      label: answer.choice ?? null,
      probability: probabilities[answer.choice] ?? null,
      confidence: answer.confidence ?? null,
    };
  }
  return {
    act: true,
    label: answer.choice,
    probability: top[1],
    confidence: answer.confidence ?? null,
  };
}
