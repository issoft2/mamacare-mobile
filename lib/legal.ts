import * as Localization from "expo-localization";
import { LEGAL_CONTENT_BY_PATH } from "@/lib/legalContent";

type LegalDocType = "privacy" | "terms";
type LegalRegion = "ng" | "uk";

interface ActiveEntry {
  language: string;
  version: string;
  path: string;
}

interface ManifestShape {
  documents?: {
    privacy?: { active?: Record<string, ActiveEntry> };
    terms?: { active?: Record<string, ActiveEntry> };
  };
}

function loadManifest(): ManifestShape {
  // JSON is treated as static runtime data for legal document routing.
  return require("@/assets/legal/manifest.json") as ManifestShape;
}

export function getUserLegalRegion(): LegalRegion {
  const raw = (Localization.getLocales?.()[0]?.regionCode ?? "").toLowerCase();
  if (raw === "gb" || raw === "uk") return "uk";
  return "ng";
}

export function getActiveLegalDocument(docType: LegalDocType, region?: LegalRegion) {
  const manifest = loadManifest();
  const selectedRegion = region ?? getUserLegalRegion();
  const activeByRegion = manifest.documents?.[docType]?.active ?? {};

  const byUserRegion = activeByRegion[selectedRegion];
  const fallback = activeByRegion.ng ?? Object.values(activeByRegion)[0];
  const resolved = byUserRegion ?? fallback;

  if (!resolved) {
    throw new Error(`No active legal document found for ${docType}.`);
  }

  return {
    docType,
    region: (byUserRegion ? selectedRegion : "ng") as LegalRegion,
    language: resolved.language,
    version: resolved.version,
    path: resolved.path,
  };
}

export function getActiveLegalRoute(docType: LegalDocType, region?: LegalRegion): string {
  const doc = getActiveLegalDocument(docType, region);
  return `/legal/${docType}?region=${doc.region}&version=${doc.version}`;
}

export function getActiveLegalContent(docType: LegalDocType, region?: LegalRegion): string {
  const doc = getActiveLegalDocument(docType, region);
  return (
    LEGAL_CONTENT_BY_PATH[doc.path] ??
    "This legal document could not be loaded. Please contact support@mumcare.com."
  );
}
