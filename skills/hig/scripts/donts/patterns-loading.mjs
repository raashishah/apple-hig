import { hit, dialogRegions } from "./shared.mjs";

function scanSpinnerNoWayOut(files) {
  const out = [];
  for (const f of files) {
    const loading =
      /aria-busy=/.test(f.text) ||
      /\b(spinner|skeleton|ProgressView|UIActivityIndicatorView)\b/i.test(f.text);
    const looping = /animation:[^;]*infinite|indeterminate/i.test(f.text);
    const escape = /\b(Cancel|Stop|Dismiss|Try again)\b/.test(f.text);
    if (loading && looping && !escape) {
      out.push(hit(f.path, "indeterminate spinner with no way out"));
    }
  }
  return out;
}

function scanFakePercent(files) {
  const out = [];
  for (const f of files) {
    if (
      /fakePercent|fake[- ]progress|percent\s*\+=|Math\.min\(\s*99/i.test(f.text)
    ) {
      out.push(hit(f.path, "fake percent on a progress bar"));
    }
  }
  return out;
}

function scanLoadingModalHidesNav(files) {
  const blob = files.map((f) => f.text).join("\n");
  if (!/<(nav|header)\b/i.test(blob) && !/data-nav/.test(blob)) return [];
  const out = [];
  for (const f of files) {
    for (const region of dialogRegions(f.text)) {
      if (
        /aria-busy|spinner|ProgressView|data-skeleton/i.test(region) &&
        /data-loading-modal|position:\s*fixed|inset:\s*0/i.test(region)
      ) {
        out.push(hit(f.path, "loading modal hides nav"));
      }
    }
  }
  return out;
}

export const records = [
  {
    id: "spinner-loop-no-way-out",
    rewrite: "marker",
    scan: scanSpinnerNoWayOut,
    apply(text, file) {
      return text;
    },
  },
  {
    id: "fake-percent-progress",
    rewrite: "marker",
    scan: scanFakePercent,
    apply(text, file) {
      return text;
    },
  },
  {
    id: "loading-modal-hides-nav",
    rewrite: "marker",
    scan: scanLoadingModalHidesNav,
    apply(text, file) {
      return text;
    },
  },
];
