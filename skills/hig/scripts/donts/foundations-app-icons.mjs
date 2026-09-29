import { hit } from "./shared.mjs";

function scanIconComposerLaw(files) {
  const out = [];
  for (const f of files) {
    if (
      /\.iconcomposer\b/i.test(f.path) ||
      /icon composer template|variant recipes as .{0,40}HIG law|IconComposerTemplate/i.test(
        f.text,
      )
    ) {
      out.push(hit(f.path, "Icon Composer template copied as HIG law"));
    }
  }
  return out;
}

function isAppIconFile(file) {
  return (
    /AppIcon|apple-touch-icon|favicon/i.test(file.path) ||
    /data-app-icon|rel=["']apple-touch-icon["']/i.test(file.text)
  );
}

function scanBusyAppIcon(files) {
  const out = [];
  for (const f of files) {
    if (!isAppIconFile(f)) continue;
    if (
      /(headshot|portrait|selfie|photo-of|people\.jpg|person\.png)/i.test(f.text) ||
      /linear-gradient\([^)]*(,|#)[^)]*(,|#)[^)]*(,|#)[^)]*\)/.test(f.text)
    ) {
      out.push(hit(f.path, "photo or busy gradient used as app icon"));
    }
  }
  return out;
}

function scanAppIconAlpha(files) {
  const out = [];
  for (const f of files) {
    if (
      /data-app-icon[\s\S]{0,240}(mask-image|-webkit-mask|webkitMaskImage)/i.test(f.text) ||
      /class(?:Name)?=["'][^"']*app-icon[^"']*["'][\s\S]{0,160}(mask-image|border-radius:\s*22%)/i.test(
        f.text,
      )
    ) {
      out.push(hit(f.path, "alpha/mask trick on the app icon"));
    }
  }
  return out;
}

function stripAppIconMaskDecls(body) {
  return body
    .replace(/webkitMaskImage\s*:\s*["'][^"']*["']\s*,?/g, "")
    .replace(/maskImage\s*:\s*["'][^"']*["']\s*,?/g, "")
    .replace(/borderRadius\s*:\s*["']22%["']\s*,?/g, "")
    .replace(/mask-image\s*:[^;]+;?/gi, "")
    .replace(/-webkit-mask(?:-image)?\s*:[^;]+;?/gi, "")
    .replace(/border-radius\s*:\s*22%\s*;?/gi, "");
}

function applyAppIconAlpha(text) {
  let next = text.replace(
    /(<[^>]*(?:data-app-icon|class(?:Name)?=["'][^"']*app-icon)[^>]*style=\{\{)([^}]*)(\}\})/gi,
    (all, open, body, close) => {
      const stripped = stripAppIconMaskDecls(body);
      return stripped === body ? all : `${open}${stripped}${close}`;
    },
  );
  next = next.replace(
    /(<[^>]*(?:data-app-icon|class(?:Name)?=["'][^"']*app-icon)[^>]*style=["'])([^"']*)(["'])/gi,
    (all, open, body, close) => {
      const stripped = stripAppIconMaskDecls(body);
      return stripped === body ? all : `${open}${stripped}${close}`;
    },
  );
  next = next.replace(
    /((?:^|,|\n)\s*\.app-icon[^{]*)\{([^}]*)\}/gi,
    (all, sel, body) => {
      const stripped = stripAppIconMaskDecls(body);
      return stripped === body ? all : `${sel}{${stripped}}`;
    },
  );
  return next;
}

export const records = [
  {
    id: "icon-composer-templates-as-law",
    rewrite: "marker",
    scan: scanIconComposerLaw,
    apply(text, file) {
      return text;
    },
  },
  {
    id: "busy-photo-app-icon",
    rewrite: "marker",
    scan: scanBusyAppIcon,
    apply(text, file) {
      return text;
    },
  },
  {
    id: "app-icon-alpha-mask-tricks",
    rewrite: "host",
    scan: scanAppIconAlpha,
    apply(text, file) {
      return applyAppIconAlpha(text);
    },
  },
];
