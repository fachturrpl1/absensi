import dayjs from "dayjs";

// 1. Simpan value dasar sebagai statis agar TypeScript bisa menguncinya (Strict Typing)
export const DATE_FORMAT_VALUES = [
  "DD/MM/YYYY",
  "MM/DD/YYYY",
  "YYYY-MM-DD",
  "DD MMM YYYY",
  "MMM DD, YYYY",
  "DD MMMM YYYY",
] as const;

// Tipenya akan tetap aman: "DD/MM/YYYY" | "MM/DD/YYYY" | dst...
export type DateFormatOption = typeof DATE_FORMAT_VALUES[number];

// 2. Buat fungsi untuk meng-generate label secara dinamis menggunakan tanggal HARI INI
export const getDynamicDateFormatOptions = () => {
  const today = dayjs();

  return DATE_FORMAT_VALUES.map((format) => {
    const example = today.format(format); 
    
    const suffix = format === "YYYY-MM-DD" ? " — ISO Standard" : "";

    return {
      value: format,
      label: `${format} (${example})${suffix}`,
    };
  });
};