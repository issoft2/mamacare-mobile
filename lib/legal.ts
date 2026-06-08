import * as Localization from "expo-localization";
import { LEGAL_CONTENT_BY_PATH } from "@/lib/legalContent";
import AsyncStorage from "@react-native-async-storage/async-storage";

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
    "This legal document could not be loaded. Please contact support@safeborn.com."
  );
}

export async function checkConsentVersion(): Promise<boolean> {
  // Simulate API call to check consent version
  const storedVersion: string = "v1.0"; // Replace with actual stored version logic
  const activeVersion: string = "v1.0"; // Replace with actual active version logic
  return storedVersion !== activeVersion;
}

export async function cacheConsentChanges(consents: Record<string, boolean>): Promise<void> {
  try {
    const cachedConsents = JSON.stringify(consents);
    await AsyncStorage.setItem("cachedConsents", cachedConsents);
  } catch (error) {
    console.error("Failed to cache consents:", error);
  }
}

export async function syncCachedConsents(): Promise<void> {
  try {
    const cachedConsents = await AsyncStorage.getItem("cachedConsents");
    if (cachedConsents) {
      const consents = JSON.parse(cachedConsents);
      // Simulate API call to sync consents
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log("Synced consents:", consents);
      await AsyncStorage.removeItem("cachedConsents");
    }
  } catch (error) {
    console.error("Failed to sync cached consents:", error);
  }
}
