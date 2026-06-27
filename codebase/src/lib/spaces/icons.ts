import {
  Folder01Icon,
  FolderLibraryIcon,
  CustomerSupportIcon,
  HeadsetIcon,
  Shield01Icon,
  Megaphone01Icon,
  Rocket01Icon,
  Briefcase01Icon,
  Invoice01Icon,
  LegalDocument01Icon,
  Money01Icon,
  ChartLineData01Icon,
  Building01Icon,
  Hospital01Icon,
  Tag01Icon,
  Book02Icon,
  Notebook01Icon,
  File01Icon,
  Settings01Icon,
  Idea01Icon,
  Globe02Icon,
  PackageIcon,
} from "@hugeicons/core-free-icons";
import type { IconSvgElement } from "@hugeicons/react";

export type SpaceIconOption = {
  key: string;
  label: string;
  icon: IconSvgElement;
};

/**
 * Curated set of icons offered when creating or editing a space. The `key` is
 * what we persist in `spaces.icon`; rendering maps it back to the glyph.
 */
export const SPACE_ICONS: SpaceIconOption[] = [
  { key: "Folder01Icon", label: "Folder", icon: Folder01Icon },
  { key: "FolderLibraryIcon", label: "Library", icon: FolderLibraryIcon },
  { key: "CustomerSupportIcon", label: "Support", icon: CustomerSupportIcon },
  { key: "HeadsetIcon", label: "Help desk", icon: HeadsetIcon },
  { key: "Shield01Icon", label: "Security", icon: Shield01Icon },
  { key: "Megaphone01Icon", label: "Marketing", icon: Megaphone01Icon },
  { key: "Rocket01Icon", label: "Product", icon: Rocket01Icon },
  { key: "Briefcase01Icon", label: "Operations", icon: Briefcase01Icon },
  { key: "Invoice01Icon", label: "Billing", icon: Invoice01Icon },
  { key: "LegalDocument01Icon", label: "Legal", icon: LegalDocument01Icon },
  { key: "Money01Icon", label: "Finance", icon: Money01Icon },
  { key: "ChartLineData01Icon", label: "Analytics", icon: ChartLineData01Icon },
  { key: "Building01Icon", label: "Company", icon: Building01Icon },
  { key: "Hospital01Icon", label: "Healthcare", icon: Hospital01Icon },
  { key: "Tag01Icon", label: "Sales", icon: Tag01Icon },
  { key: "Book02Icon", label: "Handbook", icon: Book02Icon },
  { key: "Notebook01Icon", label: "Notes", icon: Notebook01Icon },
  { key: "File01Icon", label: "Documents", icon: File01Icon },
  { key: "Settings01Icon", label: "Engineering", icon: Settings01Icon },
  { key: "Idea01Icon", label: "Research", icon: Idea01Icon },
  { key: "Globe02Icon", label: "Public", icon: Globe02Icon },
  { key: "PackageIcon", label: "Inventory", icon: PackageIcon },
];

export const DEFAULT_SPACE_ICON_KEY = "Folder01Icon";

const ICON_BY_KEY = new Map(SPACE_ICONS.map((option) => [option.key, option]));

export function isSpaceIconKey(key: string): boolean {
  return ICON_BY_KEY.has(key);
}

/** Resolves a stored icon key to a glyph, falling back to the default. */
export function getSpaceIcon(key?: string | null): IconSvgElement {
  if (key && ICON_BY_KEY.has(key)) {
    return ICON_BY_KEY.get(key)!.icon;
  }

  return ICON_BY_KEY.get(DEFAULT_SPACE_ICON_KEY)!.icon;
}
