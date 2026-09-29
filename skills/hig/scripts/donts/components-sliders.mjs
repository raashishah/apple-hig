import { hit } from "./shared.mjs";

function scanSliderAsVolume(files) {
  const out = [];
  for (const f of files) {
    if (/\b(MPVolumeView|VolumeView)\b/.test(f.text)) continue;
    if (/data-volume-slider/.test(f.text)) {
      out.push(hit(f.path, "slider to adjust audio volume"));
      continue;
    }
    const opens = f.text.match(/<input\b[^>]*>/gi) || [];
    if (opens.some((t) => /type=["']range["']/i.test(t) && /volume/i.test(t))) {
      out.push(hit(f.path, "slider to adjust audio volume"));
      continue;
    }
    if (
      /<(input|div)[^>]*(role=["']slider["']|type=["']range["'])[^>]*volume/i.test(f.text) ||
      /<(input|div)[^>]*volume[^>]*(role=["']slider["']|type=["']range["'])/i.test(f.text)
    ) {
      out.push(hit(f.path, "slider to adjust audio volume"));
      continue;
    }
    if (/Slider\s*\([\s\S]{0,200}?volume/i.test(f.text)) {
      out.push(hit(f.path, "slider to adjust audio volume"));
      continue;
    }
    if (/\b(UISlider|NSSlider)\b/.test(f.text) && /volume/i.test(f.text)) {
      out.push(hit(f.path, "slider to adjust audio volume"));
    }
  }
  return out;
}

function applySliderAsVolume(text) {
  return text.replace(/\s*data-volume-slider(?:="[^"]*")?/g, "");
}

export const records = [
  {
    id: "slider-as-volume",
    rewrite: "marker",
    scan: scanSliderAsVolume,
    apply(text, file) {
      return applySliderAsVolume(text);
    },
  },
];
