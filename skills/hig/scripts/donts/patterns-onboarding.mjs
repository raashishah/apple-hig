import { hit } from "./shared.mjs";

function fileHasOnboarding(text) {
  return (
    /data-onboarding/.test(text) ||
    /\bOnboarding(View|Screen|Flow)?\b/.test(text) ||
    /\b(coach-?mark|feature-?tour|first-?run)\b/i.test(text) ||
    /\bisOnboarding\b/.test(text)
  );
}

function scanAccountWall(files) {
  const out = [];
  for (const f of files) {
    if (!fileHasOnboarding(f.text)) continue;
    const wall = /\b(Sign in|Log in|Create account|Create an account)\b/i.test(f.text);
    const skip = /\b(Skip|Continue as guest|Not now)\b/i.test(f.text);
    if (wall && !skip) {
      out.push(hit(f.path, "account required before any value"));
    }
  }
  return out;
}

function scanEveryPermissionPageOne(files) {
  const out = [];
  const kinds = [
    /camera|getUserMedia/i,
    /mic(?:rophone)?/i,
    /geolocation|location/i,
    /Notification\.requestPermission|notifications/i,
    /tracking|ATTrackingManager/i,
  ];
  for (const f of files) {
    if (!fileHasOnboarding(f.text)) continue;
    const hits = kinds.filter((re) => re.test(f.text)).length;
    if (hits >= 3) {
      out.push(hit(f.path, "every permission asked on page one"));
    }
  }
  return out;
}

function scanHelpInterstitials(files) {
  const out = [];
  for (const f of files) {
    if (!fileHasOnboarding(f.text)) continue;
    const steps = [
      ...(f.text.match(/data-onboarding-step/g) || []),
      ...(f.text.match(/\bhelp-card\b/g) || []),
      ...(f.text.match(/\binterstitial\b/g) || []),
    ];
    if (steps.length >= 6) {
      out.push(hit(f.path, "Help duplicated as six interstitial cards"));
    }
  }
  return out;
}

function tourOnEveryLaunch(text) {
  if (!fileHasOnboarding(text)) return false;
  return /class(?:Name)?=["'][^"']*\bevery-launch\b/i.test(text);
}

function hasTourAgainCopy(text) {
  return (
    /present it again on subsequent launches/i.test(text) ||
    /tutorial presented again on a later launch/i.test(text)
  );
}

function scanTourAgain(files) {
  const out = [];
  for (const f of files) {
    if (/data-ob-again(?![\w-])/.test(f.text)) {
      out.push(hit(f.path, "a tutorial presented again on a later launch"));
      continue;
    }
    if (!fileHasOnboarding(f.text)) continue;
    if (tourOnEveryLaunch(f.text) || hasTourAgainCopy(f.text)) {
      out.push(hit(f.path, "a tutorial presented again on a later launch"));
    }
  }
  return out;
}

function applyTourAgain(text) {
  return text.replace(/\s*data-ob-again(?:="[^"]*")?(?![\w-])/g, "");
}

export const records = [
  {
    id: "account-wall-before-value",
    rewrite: "marker",
    scan: scanAccountWall,
    apply(text, file) {
      return text;
    },
  },
  {
    id: "every-permission-on-page-one",
    rewrite: "marker",
    scan: scanEveryPermissionPageOne,
    apply(text, file) {
      return text;
    },
  },
  {
    id: "help-as-six-interstitials",
    rewrite: "marker",
    scan: scanHelpInterstitials,
    apply(text, file) {
      return text;
    },
  },
  {
    id: "ob-again",
    rewrite: "marker",
    scan: scanTourAgain,
    apply(text, file) {
      return applyTourAgain(text);
    },
  },
];
