import { hit } from "./shared.mjs";

function hasSiwa(text) {
  return (
    /\bdata-siwa\b/.test(text) ||
    /\bSignInWithAppleButton\b/.test(text) ||
    /\bASAuthorizationAppleIDButton\b/.test(text)
  );
}

function hasSiaPasswordCopy(text) {
  return (
    /password asked for/i.test(text) ||
    /ask(ed|ing)? (people )?for a password/i.test(text) ||
    /supply a password/i.test(text) ||
    /create a password/i.test(text)
  );
}

function hasSiaEmailCopy(text) {
  return (
    /personal email asked/i.test(text) ||
    /personal email address/i.test(text) ||
    (/private relay/i.test(text) && /email/i.test(text) && /ask|enter|provide|supply/i.test(text))
  );
}

function hasSiaLogoCopy(text) {
  return (
    /custom apple logo/i.test(text) ||
    /create a custom apple logo/i.test(text) ||
    (/apple logo/i.test(text) && /draw|invent|recreat/i.test(text))
  );
}

function scanSiaPassword(files) {
  const out = [];
  for (const f of files) {
    if (/data-sia-password/.test(f.text)) {
      out.push(hit(f.path, "a password asked for alongside sign in with apple"));
      continue;
    }
    if (!hasSiwa(f.text)) continue;
    if (hasSiaPasswordCopy(f.text)) {
      out.push(hit(f.path, "a password asked for alongside sign in with apple"));
    }
  }
  return out;
}

function applySiaPassword(text) {
  return text.replace(/\s*data-sia-password(?:="[^"]*")?/g, "");
}

function scanSiaEmail(files) {
  const out = [];
  for (const f of files) {
    if (/data-sia-email/.test(f.text)) {
      out.push(hit(f.path, "a personal email asked for when a private relay address is used"));
      continue;
    }
    if (!hasSiwa(f.text)) continue;
    if (hasSiaEmailCopy(f.text)) {
      out.push(hit(f.path, "a personal email asked for when a private relay address is used"));
    }
  }
  return out;
}

function applySiaEmail(text) {
  return text.replace(/\s*data-sia-email(?:="[^"]*")?/g, "");
}

function scanSiaLogo(files) {
  const out = [];
  for (const f of files) {
    if (/data-sia-logo/.test(f.text)) {
      out.push(hit(f.path, "a custom apple logo on the sign in with apple button"));
      continue;
    }
    if (!hasSiwa(f.text)) continue;
    if (hasSiaLogoCopy(f.text)) {
      out.push(hit(f.path, "a custom apple logo on the sign in with apple button"));
    }
  }
  return out;
}

function applySiaLogo(text) {
  return text.replace(/\s*data-sia-logo(?:="[^"]*")?/g, "");
}

export const records = [
  {
    id: "sia-password",
    rewrite: "marker",
    scan: scanSiaPassword,
    apply(text, file) {
      return applySiaPassword(text);
    },
  },
  {
    id: "sia-email",
    rewrite: "marker",
    scan: scanSiaEmail,
    apply(text, file) {
      return applySiaEmail(text);
    },
  },
  {
    id: "sia-logo",
    rewrite: "marker",
    scan: scanSiaLogo,
    apply(text, file) {
      return applySiaLogo(text);
    },
  },
];
