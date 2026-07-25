export type AdminBrand = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  country: string | null;
  website_url: string | null;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type AdminBrandInput = {
  name: string;
  slug: string;
  logo_url: string;
  country: string;
  website_url: string;
  description: string;
  is_active: boolean;
};

export type AdminBrandWrite = {
  name: string;
  slug: string;
  logo_url: string | null;
  country: string | null;
  website_url: string | null;
  description: string | null;
  is_active: boolean;
};

export const BRAND_MESSAGES = {
  unauthorized: "Du har ikke tilgang til adminpanelet.",
  unavailable: "Admin-databasen er midlertidig utilgjengelig. Prøv igjen senere.",
  notFound: "Merket ble ikke funnet.",
  createSuccess: "Merket er lagret.",
  updateSuccess: "Endringene er lagret.",
  deleteSuccess: "Merket er slettet.",
  activateSuccess: "Merket er aktivert.",
  deactivateSuccess: "Merket er deaktivert.",
  slugTaken: "Slug eller merkenavn er allerede i bruk.",
  genericError: "Noe gikk galt. Prøv igjen.",
} as const;
