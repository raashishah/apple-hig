import { hit } from "./shared.mjs";

function hasGyro(text) {
  return (
    /\bdata-gyro\b/.test(text) ||
    /\bdata-accelerometer\b/.test(text) ||
    /\bDeviceMotionEvent\b/.test(text) ||
    /\bDeviceOrientationEvent\b/.test(text) ||
    /\bCMMotionManager\b/.test(text) ||
    /\bstartDeviceMotionUpdates\b/.test(text) ||
    /\bstartAccelerometerUpdates\b/.test(text) ||
    /\bstartGyroUpdates\b/.test(text)
  );
}

function scanMotionWithoutBenefit(files) {
  const out = [];
  for (const f of files) {
    if (/data-motion-no-benefit/.test(f.text)) {
      out.push(hit(f.path, "motion data gathered with no tangible benefit"));
    }
  }
  return out;
}

function applyMotionWithoutBenefit(text) {
  return text.replace(/\s*data-motion-no-benefit(?:="[^"]*")?/g, "");
}

function hasGameplay(text) {
  return /\bgameplay\b/i.test(text);
}

function hasMotionListener(text) {
  return /\bdevicemotion\b/i.test(text) || /\bdeviceorientation\b/i.test(text);
}

function scanMotionDirectUi(files) {
  const out = [];
  for (const f of files) {
    if (/data-motion-direct-ui/.test(f.text)) {
      out.push(
        hit(
          f.path,
          "accelerometer or gyroscope used to directly manipulate the interface outside of active gameplay",
        ),
      );
      continue;
    }
    if (!hasGyro(f.text)) continue;
    if (hasMotionListener(f.text) && !hasGameplay(f.text)) {
      out.push(
        hit(
          f.path,
          "accelerometer or gyroscope used to directly manipulate the interface outside of active gameplay",
        ),
      );
    }
  }
  return out;
}

function applyMotionDirectUi(text) {
  return text.replace(/\s*data-motion-direct-ui(?:="[^"]*")?/g, "");
}

export const records = [
  {
    id: "motion-without-benefit",
    rewrite: "marker",
    scan: scanMotionWithoutBenefit,
    apply(text, file) {
      return applyMotionWithoutBenefit(text);
    },
  },
  {
    id: "motion-direct-ui",
    rewrite: "marker",
    scan: scanMotionDirectUi,
    apply(text, file) {
      return applyMotionDirectUi(text);
    },
  },
];
