/**
 * EVFAKTA three-image AI workflow (pure helpers).
 *
 * Standard AI roles: Front, Interior, Rear — 3 selectable alternatives each.
 * Never auto-approves, never auto-Hero, never auto-publishes.
 * Official approved gallery images are never deleted.
 */

import {
  isAiEditorialArchive,
  isAiIllustrationCandidate,
  parseAiUsageType,
  type AiIllustrationUsageType,
} from "@/lib/admin/ai-image-candidates";
import type { CarImageRow, CarImageType } from "@/lib/admin/car-image-types";
import type { ResearchImageCandidate } from "@/lib/admin/research/types";

export const THREE_IMAGE_ALTERNATIVES_PER_ROLE = 3;

export const THREE_IMAGE_WORKFLOW_MARKER = "three-image-workflow";
export const AI_PREFERRED_ALTERNATIVE_MARKER = "ai-preferred-alternative";
export const AI_PROVIDER_NOTES_PREFIX = "ai_provider:";

/** Default AI generation roles for vehicle pages. */
export const THREE_IMAGE_STANDARD_ROLES = [
  {
    usageType: "front_illustration" as const,
    imageType: "front" as const,
    label: "Front",
  },
  {
    usageType: "interior_illustration" as const,
    imageType: "interior" as const,
    label: "Interior",
  },
  {
    usageType: "rear_illustration" as const,
    imageType: "rear" as const,
    label: "Rear",
  },
] as const;

export type ThreeImageRoleKey = (typeof THREE_IMAGE_STANDARD_ROLES)[number]["usageType"];
export type ThreeImageGalleryType = (typeof THREE_IMAGE_STANDARD_ROLES)[number]["imageType"];
export type ThreeImageRoleStatus = "Missing" | "Pending" | "Approved";

export type ThreeImageRoleSummary = {
  usageType: ThreeImageRoleKey;
  imageType: ThreeImageGalleryType;
  label: string;
  status: ThreeImageRoleStatus;
  preferredCandidateId: string | null;
  alternativeCount: number;
  approvedGallery: boolean;
};

export const THREE_IMAGE_PUBLIC_GALLERY_ORDER: readonly ThreeImageGalleryType[] = [
  "front",
  "interior",
  "rear",
];

export function isThreeImageUsageType(
  value: string | null | undefined,
): value is ThreeImageRoleKey {
  return THREE_IMAGE_STANDARD_ROLES.some((role) => role.usageType === value);
}

export function threeImageRoleForUsage(
  usageType: AiIllustrationUsageType | null | undefined,
): (typeof THREE_IMAGE_STANDARD_ROLES)[number] | null {
  if (!usageType) return null;
  return THREE_IMAGE_STANDARD_ROLES.find((role) => role.usageType === usageType) ?? null;
}

export function publicGalleryTypeRank(imageType: string | null | undefined): number {
  const index = THREE_IMAGE_PUBLIC_GALLERY_ORDER.indexOf(
    imageType as ThreeImageGalleryType,
  );
  return index >= 0 ? index : 100;
}

/** Preferred sort_order when applying a three-image role to car_images. */
export function sortOrderForThreeImageType(imageType: CarImageType | string): number {
  return publicGalleryTypeRank(imageType);
}

export function isPreferredThreeImageAlternative(notes: string | null | undefined): boolean {
  return Boolean(notes?.includes(AI_PREFERRED_ALTERNATIVE_MARKER));
}

export function withPreferredThreeImageAlternativeNotes(
  notes: string | null | undefined,
): string {
  const base = (notes || "").replace(
    new RegExp(`\\s*\\|\\s*${AI_PREFERRED_ALTERNATIVE_MARKER}`, "g"),
    "",
  );
  return `${base.trim()} | ${AI_PREFERRED_ALTERNATIVE_MARKER}`.replace(/^\s*\|\s*/, "");
}

export function withoutPreferredThreeImageAlternativeNotes(
  notes: string | null | undefined,
): string {
  return (notes || "")
    .replace(new RegExp(`\\s*\\|\\s*${AI_PREFERRED_ALTERNATIVE_MARKER}`, "g"), "")
    .replace(new RegExp(AI_PREFERRED_ALTERNATIVE_MARKER, "g"), "")
    .replace(/\s*\|\s*/g, " | ")
    .replace(/^\s*\|\s*|\s*\|\s*$/g, "")
    .trim();
}

export function parseAiProviderFromNotes(
  notes: string | null | undefined,
): string | null {
  if (!notes) return null;
  const match = notes.match(/ai_provider:([a-z0-9_-]+)/i);
  return match?.[1]?.toLowerCase() || null;
}

export function encodeAiProviderNotes(providerId: string | null | undefined): string | null {
  const id = providerId?.trim().toLowerCase();
  if (!id) return null;
  return `${AI_PROVIDER_NOTES_PREFIX}${id}`;
}

function galleryHasApprovedType(
  gallery: readonly CarImageRow[],
  imageType: ThreeImageGalleryType,
): boolean {
  return gallery.some((image) => image.image_type === imageType);
}

function activeThreeImageCandidates(
  candidates: readonly ResearchImageCandidate[],
): ResearchImageCandidate[] {
  return candidates.filter((candidate) => {
    if (!isAiIllustrationCandidate(candidate)) return false;
    if (isAiEditorialArchive(candidate)) return false;
    if (candidate.status === "rejected") return false;
    const usage = parseAiUsageType(candidate.notes);
    return isThreeImageUsageType(usage);
  });
}

export function computeThreeImageRoleStatus(input: {
  imageType: ThreeImageGalleryType;
  usageType: ThreeImageRoleKey;
  gallery: readonly CarImageRow[];
  candidates: readonly ResearchImageCandidate[];
}): ThreeImageRoleStatus {
  if (galleryHasApprovedType(input.gallery, input.imageType)) {
    return "Approved";
  }

  const roleCandidates = activeThreeImageCandidates(input.candidates).filter(
    (candidate) => parseAiUsageType(candidate.notes) === input.usageType,
  );

  const appliedOrApproved = roleCandidates.some(
    (candidate) =>
      candidate.status === "approved" ||
      candidate.status === "applied" ||
      Boolean(candidate.applied_image_id?.trim()),
  );
  if (appliedOrApproved) return "Approved";

  const pending = roleCandidates.some((candidate) => candidate.status === "pending");
  if (pending) return "Pending";

  return "Missing";
}

export function summarizeThreeImageRoles(input: {
  gallery: readonly CarImageRow[];
  candidates: readonly ResearchImageCandidate[];
}): {
  roles: ThreeImageRoleSummary[];
  galleryComplete: boolean;
  missingUsageTypes: ThreeImageRoleKey[];
} {
  const roles: ThreeImageRoleSummary[] = THREE_IMAGE_STANDARD_ROLES.map((role) => {
    const roleCandidates = activeThreeImageCandidates(input.candidates).filter(
      (candidate) => parseAiUsageType(candidate.notes) === role.usageType,
    );
    const preferred =
      roleCandidates.find((candidate) =>
        isPreferredThreeImageAlternative(candidate.notes),
      ) || null;
    const status = computeThreeImageRoleStatus({
      imageType: role.imageType,
      usageType: role.usageType,
      gallery: input.gallery,
      candidates: input.candidates,
    });

    return {
      usageType: role.usageType,
      imageType: role.imageType,
      label: role.label,
      status,
      preferredCandidateId: preferred?.id ?? null,
      alternativeCount: roleCandidates.filter((c) => c.status === "pending").length,
      approvedGallery: galleryHasApprovedType(input.gallery, role.imageType),
    };
  });

  const galleryComplete = roles.every((role) => role.status === "Approved");
  const missingUsageTypes = roles
    .filter((role) => role.status === "Missing")
    .map((role) => role.usageType);

  return { roles, galleryComplete, missingUsageTypes };
}

/**
 * Roles to generate: missing only among Front / Interior / Rear.
 * Approved gallery types are skipped; pending roles are skipped unless force.
 */
export function missingThreeImageRolesToGenerate(input: {
  gallery: readonly CarImageRow[];
  candidates: readonly ResearchImageCandidate[];
  forceRoles?: readonly ThreeImageRoleKey[];
}): ThreeImageRoleKey[] {
  if (input.forceRoles?.length) {
    return THREE_IMAGE_STANDARD_ROLES.map((r) => r.usageType).filter((usage) =>
      input.forceRoles!.includes(usage),
    );
  }
  return summarizeThreeImageRoles(input).missingUsageTypes;
}

export function countAlternativesToCreate(input: {
  usageType: ThreeImageRoleKey;
  candidates: readonly ResearchImageCandidate[];
  target?: number;
}): number {
  const target = input.target ?? THREE_IMAGE_ALTERNATIVES_PER_ROLE;
  const pending = activeThreeImageCandidates(input.candidates).filter(
    (candidate) =>
      parseAiUsageType(candidate.notes) === input.usageType &&
      candidate.status === "pending",
  ).length;
  return Math.max(0, target - pending);
}

export function groupThreeImageAlternatives(
  candidates: readonly ResearchImageCandidate[],
): Record<ThreeImageRoleKey, ResearchImageCandidate[]> {
  const groups: Record<ThreeImageRoleKey, ResearchImageCandidate[]> = {
    front_illustration: [],
    interior_illustration: [],
    rear_illustration: [],
  };

  for (const candidate of activeThreeImageCandidates(candidates)) {
    const usage = parseAiUsageType(candidate.notes);
    if (!isThreeImageUsageType(usage)) continue;
    if (candidate.status !== "pending") continue;
    groups[usage].push(candidate);
  }

  for (const key of Object.keys(groups) as ThreeImageRoleKey[]) {
    groups[key].sort((a, b) => {
      const aPref = isPreferredThreeImageAlternative(a.notes) ? 0 : 1;
      const bPref = isPreferredThreeImageAlternative(b.notes) ? 0 : 1;
      if (aPref !== bPref) return aPref - bPref;
      return (Date.parse(a.created_at || "") || 0) - (Date.parse(b.created_at || "") || 0);
    });
  }

  return groups;
}

/** Public gallery: Front → Interior → Rear, then other types by sort_order. */
export function comparePublicGalleryImages(
  a: { image_type?: string | null; sort_order?: number | null; id?: string },
  b: { image_type?: string | null; sort_order?: number | null; id?: string },
): number {
  const rankDiff = publicGalleryTypeRank(a.image_type) - publicGalleryTypeRank(b.image_type);
  if (rankDiff !== 0) return rankDiff;
  const aOrder = a.sort_order ?? 0;
  const bOrder = b.sort_order ?? 0;
  if (aOrder !== bOrder) return aOrder - bOrder;
  return (a.id || "").localeCompare(b.id || "");
}

export function threeImageEditorChangeRequest(usageType: ThreeImageRoleKey): string {
  if (usageType === "interior_illustration") {
    return "Three-image workflow: generic cabin overview illustration — no invented controls or trim.";
  }
  if (usageType === "rear_illustration") {
    return "Three-image workflow: rear three-quarter / rear design illustration.";
  }
  return "Three-image workflow: front three-quarter / front design illustration.";
}
