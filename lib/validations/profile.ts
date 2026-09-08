import { z } from 'zod';

export const profileFormSchema = z.object({
  prn: z
    .string()
    .trim()
    .min(1, 'ID PERISAI / PRN wajib diisi'),
  fullName: z
    .string()
    .trim()
    .min(1, 'Nama Lengkap wajib diisi (sesuai KTM/Identitas)'),
  email: z
    .string()
    .trim()
    .min(1, 'Alamat Email wajib diisi')
    .email('Format alamat email tidak valid'),
  gender: z
    .string()
    .trim()
    .min(1, 'Jenis Kelamin wajib dipilih'),
  generation: z
    .union([z.number(), z.string()])
    .refine((val) => {
      const str = String(val).trim();
      if (!str) return false;
      const num = Number(str);
      return !isNaN(num) && Number.isInteger(num) && num > 0;
    }, 'Generasi wajib diisi dengan angka (contoh: 10, 20, 23)'),
  birthPlace: z
    .string()
    .trim()
    .min(1, 'Tempat Lahir wajib diisi'),
  birthDate: z
    .string()
    .trim()
    .min(1, 'Tanggal Lahir wajib diisi'),
  faculty: z
    .string()
    .trim()
    .min(1, 'Fakultas wajib dipilih'),
  majorProgram: z
    .string()
    .trim()
    .min(1, 'Program Studi wajib dipilih'),
  nim: z
    .string()
    .trim()
    .min(1, 'NIM wajib diisi'),
  angkatan: z
    .string()
    .trim()
    .min(1, 'Tahun Angkatan wajib diisi (contoh: 2022)'),
  phoneNumber: z
    .string()
    .trim()
    .min(1, 'Nomor WhatsApp/Telepon wajib diisi')
    .regex(/^[0-9+\-\s()]+$/, 'Nomor telepon hanya boleh berisi angka dan simbol (+, -, ())'),
  domicileAddress: z
    .string()
    .trim()
    .min(1, 'Alamat Domisili lengkap wajib diisi'),
  
  // Opsional / Boleh kosong
  originCity: z.string().optional(),
  originCityOther: z.string().optional(),
  linkedin: z.string().optional(),
  instagram: z.string().optional(),
});

export type ProfileFormValues = z.infer<typeof profileFormSchema>;
