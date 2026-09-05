import { MenuView } from '../types';

export const ALL_ROLES = [
  'Super Admin',
  'Supervisor / Manajer',
  'Teknisi IoT',
  'Petugas Kebersihan',
] as const;

export type UserRoleType = typeof ALL_ROLES[number] | string;

export const getAllowedMenusForRole = (role: string): MenuView[] => {
  const normRole = (role || 'Super Admin').toLowerCase();

  // Petugas Kebersihan / Sanitasi
  if (normRole.includes('kebersihan') || normRole.includes('sanitasi')) {
    return [
      'dasbor',
      'dashboard',
      'jadwal-pemeliharaan',
      'rekap-kerusakan',
      'rekap-perbaikan',
      'stok-perlengkapan',
      'manajemen-perlengkapan',
      'glosarium',
      'tentang',
      'profile',
      'profil-saya',
    ];
  }

  // Teknisi IoT / MEP
  if (normRole.includes('teknisi')) {
    return [
      'dasbor',
      'dashboard',
      'data-sensor',
      'rekap-kerusakan',
      'rekap-perbaikan',
      'perangkat',
      'manajemen-iot',
      'fasilitas',
      'data-utilitas',
      'letsens-ai',
      'glosarium',
      'tentang',
      'profile',
      'profil-saya',
    ];
  }

  // Supervisor / Manajer Sarpras
  if (normRole.includes('supervisor') || normRole.includes('manajer')) {
    return [
      'dasbor',
      'dashboard',
      'data-sensor',
      'jadwal-pemeliharaan',
      'rekap-kerusakan',
      'rekap-perbaikan',
      'fasilitas',
      'data-utilitas',
      'bilik-toilet',
      'manajemen-toilet',
      'pengguna',
      'manajemen-petugas',
      'stok-perlengkapan',
      'manajemen-perlengkapan',
      'letsens-ai',
      'laporan',
      'glosarium',
      'tentang',
      'profile',
      'profil-saya',
    ];
  }

  // Super Admin / Default (Full System Access)
  return [
    'dasbor',
    'dashboard',
    'data-sensor',
    'jadwal-pemeliharaan',
    'rekap-kerusakan',
    'rekap-perbaikan',
    'fasilitas',
    'data-utilitas',
    'bilik-toilet',
    'manajemen-toilet',
    'perangkat',
    'manajemen-iot',
    'pengguna',
    'manajemen-petugas',
    'stok-perlengkapan',
    'manajemen-perlengkapan',
    'letsens-ai',
    'laporan',
    'log-aktivitas',
    'logs',
    'pengaturan',
    'pengaturan-sistem',
    'pengaturan-aplikasi',
    'glosarium',
    'tentang',
    'profile',
    'profil-saya',
  ];
};

export const isMenuAllowedForRole = (menu: MenuView, role: string): boolean => {
  if (menu === 'profile' || menu === 'profil-saya') return true;
  const allowed = getAllowedMenusForRole(role);
  return allowed.includes(menu);
};
