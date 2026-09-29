import { hit } from "./shared.mjs";

function hasMap(text) {
  return (
    /\bdata-map\b/.test(text) ||
    /\bMKMapView\b/.test(text) ||
    /\bMapKit\b/.test(text) ||
    /\bmapkit\.Map\b/.test(text)
  );
}

function hasMapCoverCopy(text) {
  return /legal link/i.test(text) && /cover/i.test(text);
}

function hasMapReplicaCopy(text) {
  return /replicat/i.test(text) && /apple maps/i.test(text);
}

function scanMapCoverLegal(files) {
  const out = [];
  for (const f of files) {
    if (/data-mapkit-cover-logo/.test(f.text)) {
      out.push(hit(f.path, "maps legal link covered all the time"));
      continue;
    }
    if (!hasMap(f.text)) continue;
    if (hasMapCoverCopy(f.text)) {
      out.push(hit(f.path, "maps legal link covered all the time"));
    }
  }
  return out;
}

function applyMapCoverLegal(text) {
  return text.replace(/\s*data-mapkit-cover-logo(?:="[^"]*")?/g, "");
}

function scanMapReplicaApple(files) {
  const out = [];
  for (const f of files) {
    if (/data-mapkit-replica/.test(f.text)) {
      out.push(hit(f.path, "indoor map that replicates apple maps"));
      continue;
    }
    if (!hasMap(f.text)) continue;
    if (hasMapReplicaCopy(f.text)) {
      out.push(hit(f.path, "indoor map that replicates apple maps"));
    }
  }
  return out;
}

function applyMapReplicaApple(text) {
  return text.replace(/\s*data-mapkit-replica(?:="[^"]*")?/g, "");
}

export const records = [
  {
    id: "map-cover-legal",
    rewrite: "marker",
    scan: scanMapCoverLegal,
    apply(text, file) {
      return applyMapCoverLegal(text);
    },
  },
  {
    id: "map-replica-apple",
    rewrite: "marker",
    scan: scanMapReplicaApple,
    apply(text, file) {
      return applyMapReplicaApple(text);
    },
  },
];
