import { hit } from "./shared.mjs";

function hasChartWidget(text) {
  return (
    /\bdata-chart\b/.test(text) ||
    /\bChart\s*\(/.test(text) ||
    /\b(BarMark|LineMark|PointMark|AreaMark|RectMark|RuleMark)\b/.test(text)
  );
}

function scanColorOnlyChartSeries(files) {
  const out = [];
  for (const f of files) {
    if (/data-color-only-chart/.test(f.text)) {
      out.push(hit(f.path, "relying solely on color to distinguish chart data"));
    }
  }
  return out;
}

function applyColorOnlyChartSeries(text) {
  return text.replace(/\s*data-color-only-chart(?:="[^"]*")?/g, "");
}

function scanChartCriticalBehindInteraction(files) {
  const out = [];
  for (const f of files) {
    if (/data-chart-hover-only/.test(f.text)) {
      out.push(hit(f.path, "hide critical chart information behind interaction"));
      continue;
    }
    if (!hasChartWidget(f.text)) continue;
    if (/\bon(MouseEnter|PointerEnter|Hover)\b/.test(f.text)) {
      out.push(hit(f.path, "hide critical chart information behind interaction"));
    }
  }
  return out;
}

function applyChartCriticalBehindInteraction(text) {
  return text.replace(/\s*data-chart-hover-only(?:="[^"]*")?/g, "");
}

function scanChartAsTable(files) {
  const out = [];
  for (const f of files) {
    if (/data-chart-as-table/.test(f.text)) {
      out.push(hit(f.path, "chart of data that should be a table or list"));
    }
  }
  return out;
}

function applyChartAsTable(text) {
  return text.replace(/\s*data-chart-as-table(?:="[^"]*")?/g, "");
}

function scanOvercrowdedChart(files) {
  const out = [];
  for (const f of files) {
    if (/data-overcrowded-chart/.test(f.text)) {
      out.push(hit(f.path, "chart packed with too much data"));
    }
  }
  return out;
}

function applyOvercrowdedChart(text) {
  return text.replace(/\s*data-overcrowded-chart(?:="[^"]*")?/g, "");
}

export const records = [
  {
    id: "color-only-chart-series",
    rewrite: "marker",
    scan: scanColorOnlyChartSeries,
    apply(text, file) {
      return applyColorOnlyChartSeries(text);
    },
  },
  {
    id: "chart-critical-behind-interaction",
    rewrite: "marker",
    scan: scanChartCriticalBehindInteraction,
    apply(text, file) {
      return applyChartCriticalBehindInteraction(text);
    },
  },
  {
    id: "chart-as-table",
    rewrite: "marker",
    scan: scanChartAsTable,
    apply(text, file) {
      return applyChartAsTable(text);
    },
  },
  {
    id: "overcrowded-chart",
    rewrite: "marker",
    scan: scanOvercrowdedChart,
    apply(text, file) {
      return applyOvercrowdedChart(text);
    },
  },
];
