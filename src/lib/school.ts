export const SCHOOL_NAME = "SMA Negeri 13 Buru";
export const SCHOOL_SHORT = "SMANTILAS BURU";
export const SCHOOL_TAGLINE = "Berprestasi, Berkarakter, Berbudaya";

export const EMAIL_DOMAIN = "smanti13buru.id";

export const CLASSES = [
  "X-1",
  "X-2",
  "X-3",
  "XI-1",
  "XI-2",
  "XI-3",
  "XII-1",
  "XII-2",
  "XII-3",
] as const;

export const SUBJECTS = [
  "Matematika",
  "Bahasa Indonesia",
  "Bahasa Inggris",
  "Fisika",
  "Kimia",
  "Biologi",
  "Sejarah",
  "Geografi",
  "Ekonomi",
  "Sosiologi",
  "PPKn",
  "Pendidikan Agama",
  "Seni Budaya",
  "PJOK",
  "Informatika",
  "Bimbingan Konseling",
] as const;

export function usernameToEmail(username: string): string {
  return `${username.trim().toLowerCase()}@${EMAIL_DOMAIN}`;
}

export function normalizeUsername(username: string): string {
  return username.trim().toLowerCase().replace(/\s+/g, "");
}

export const ROLE_LABEL: Record<string, string> = {
  admin: "Admin",
  guru: "Guru",
  siswa: "Siswa",
};

export const STATUS_LABEL: Record<string, string> = {
  pending: "Menunggu Persetujuan",
  approved: "Disetujui",
  rejected: "Ditolak",
};
