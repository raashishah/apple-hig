import { hit, countSubmitButtons, applyEqualWeightSubmits } from "./shared.mjs";

function scanEqualWeightSubmits(files) {
  const out = [];
  for (const f of files) {
    if (!/data-form-page|<form\b/.test(f.text)) continue;
    if (countSubmitButtons(f.text) >= 2) {
      out.push(hit(f.path, "multiple equal-weight submits"));
    }
  }
  return out;
}

export const records = [
  {
    id: "equal-weight-submits",
    rewrite: "host",
    scan: scanEqualWeightSubmits,
    apply(text, file) {
      return applyEqualWeightSubmits(text);
    },
  },
];
