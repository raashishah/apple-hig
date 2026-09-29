import { hit } from "./shared.mjs";

function hasAccountChrome(text) {
  return (
    /\bdata-account\b/.test(text) ||
    /\bdata-sign-in\b/.test(text) ||
    /\bdata-signin\b/.test(text)
  );
}

function scanForceAccountBeforeUse(files) {
  const out = [];
  for (const f of files) {
    if (/data-force-account/.test(f.text)) {
      out.push(hit(f.path, "account required before people can use the app"));
      continue;
    }
    if (!hasAccountChrome(f.text)) continue;
    if (/\bdata-no-guest\b/.test(f.text)) {
      out.push(hit(f.path, "account required before people can use the app"));
    }
  }
  return out;
}

function applyForceAccountBeforeUse(text) {
  return text.replace(/\s*data-force-account(?:="[^"]*")?/g, "");
}

function scanBuriedAccountDeletion(files) {
  const out = [];
  for (const f of files) {
    if (/data-buried-deletion/.test(f.text)) {
      out.push(hit(f.path, "account deletion buried in Privacy Policy or Terms"));
    }
  }
  return out;
}

function applyBuriedAccountDeletion(text) {
  return text.replace(/\s*data-buried-deletion(?:="[^"]*")?/g, "");
}

function scanPasscodeForAccountAuth(files) {
  const out = [];
  for (const f of files) {
    if (/data-passcode-auth/.test(f.text)) {
      out.push(hit(f.path, "passcode used for account authentication"));
      continue;
    }
    if (!hasAccountChrome(f.text)) continue;
    if (/\bpasscode\b/i.test(f.text)) {
      out.push(hit(f.path, "passcode used for account authentication"));
    }
  }
  return out;
}

function applyPasscodeForAccountAuth(text) {
  return text.replace(/\s*data-passcode-auth(?:="[^"]*")?/g, "");
}

export const records = [
  {
    id: "force-account-before-use",
    rewrite: "marker",
    scan: scanForceAccountBeforeUse,
    apply(text, file) {
      return applyForceAccountBeforeUse(text);
    },
  },
  {
    id: "buried-account-deletion",
    rewrite: "marker",
    scan: scanBuriedAccountDeletion,
    apply(text, file) {
      return applyBuriedAccountDeletion(text);
    },
  },
  {
    id: "passcode-for-account-auth",
    rewrite: "marker",
    scan: scanPasscodeForAccountAuth,
    apply(text, file) {
      return applyPasscodeForAccountAuth(text);
    },
  },
];
