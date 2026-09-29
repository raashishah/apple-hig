import { hit } from "./shared.mjs";

function hasReviewPrompt(text) {
  return (
    /\bdata-rating-prompt\b/.test(text) ||
    /\bRequestReviewAction\b/.test(text) ||
    /\bSKStoreReviewController\b/.test(text) ||
    /\brequestReview\s*\(/.test(text)
  );
}

function countReviewRequests(text) {
  return (String(text).match(/\brequestReview\s*\(/g) || []).length;
}

function scanRatingOnFirstLaunch(files) {
  const out = [];
  for (const f of files) {
    if (/data-rating-first-launch/.test(f.text)) {
      out.push(hit(f.path, "a rating request on first launch or during onboarding"));
      continue;
    }
    if (!hasReviewPrompt(f.text)) continue;
    if (/\bdata-first-launch\b/.test(f.text)) {
      out.push(hit(f.path, "a rating request on first launch or during onboarding"));
    }
  }
  return out;
}

function applyRatingOnFirstLaunch(text) {
  return text.replace(/\s*data-rating-first-launch(?:="[^"]*")?/g, "");
}

function scanRatingInterruptsTask(files) {
  const out = [];
  for (const f of files) {
    if (/data-rating-interrupt/.test(f.text)) {
      out.push(hit(f.path, "a rating request that interrupts people while they perform a task"));
    }
  }
  return out;
}

function applyRatingInterruptsTask(text) {
  return text.replace(/\s*data-rating-interrupt(?:="[^"]*")?/g, "");
}

function scanPesterRatingRequests(files) {
  const out = [];
  for (const f of files) {
    if (/data-rating-pester/.test(f.text)) {
      out.push(hit(f.path, "repeated rating requests that pester people"));
      continue;
    }
    if (!hasReviewPrompt(f.text)) continue;
    if (countReviewRequests(f.text) > 1) {
      out.push(hit(f.path, "repeated rating requests that pester people"));
    }
  }
  return out;
}

function applyPesterRatingRequests(text) {
  return text.replace(/\s*data-rating-pester(?:="[^"]*")?/g, "");
}

export const records = [
  {
    id: "rating-on-first-launch",
    rewrite: "marker",
    scan: scanRatingOnFirstLaunch,
    apply(text, file) {
      return applyRatingOnFirstLaunch(text);
    },
  },
  {
    id: "rating-interrupts-task",
    rewrite: "marker",
    scan: scanRatingInterruptsTask,
    apply(text, file) {
      return applyRatingInterruptsTask(text);
    },
  },
  {
    id: "pester-rating-requests",
    rewrite: "marker",
    scan: scanPesterRatingRequests,
    apply(text, file) {
      return applyPesterRatingRequests(text);
    },
  },
];
