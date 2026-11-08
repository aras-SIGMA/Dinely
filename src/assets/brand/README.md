# RestoLink Brand Assets

Logo RestoLink (platform UMKM kuliner). Nama brand: **RestoLink** (satu kata, R dan L kapital). Jangan diubah.

## Konsep
Ikon mangkuk hangat dengan uap dan senyum, di dalam kotak rounded. Kesan: hangat, ramah, UMKM.

## Warna
| Token | Hex | Pemakaian |
|---|---|---|
| orange-primary | #F97316 | aksen utama, "Link", tombol CTA |
| orange-dark | #EA580C | hover, gradien akhir, senyum di ikon |
| orange-light | #FDBA74 | gradien awal |
| navy | #1E293B | teks utama, "Resto" |
| slate | #64748B | tagline, teks sekunder |
| cream | #FFFBF5 | background hangat (opsional) |

Font logo: Poppins Bold (sudah diubah jadi outline di SVG, tidak perlu install font).
Font UI yang disarankan: Poppins atau Nunito.

## File
- `restolink-icon.svg` : ikon saja (kotak rounded + mangkuk)
- `restolink-logo.svg` : ikon + nama, untuk latar terang
- `restolink-logo-tagline.svg` : ikon + nama + "Platform UMKM Kuliner"
- `restolink-logo-dark.svg` / `restolink-logo-tagline-dark.svg` : versi "Resto" putih, untuk latar gelap (background transparan)
- `favicon.ico` : 16/32/48/64 px
- `png/apple-touch-icon.png` (180), `png/icon-192.png`, `png/icon-512.png` : PWA dan home screen
- `png/restolink-icon-{16,32,64,512}.png`
- `png/restolink-logo*.png` : lebar 1600 px, background transparan

## Aturan pakai
- Navbar/header: `restolink-logo.svg`, tinggi 36-44 px. Mobile/sidebar sempit: `restolink-icon.svg` saja, 32-40 px.
- Latar gelap: pakai varian `-dark`.
- Jangan ubah proporsi, warna ikon, urutan "Resto" + "Link", atau tambah efek bayangan/outline.
- Beri ruang kosong minimal setengah lebar ikon di sekeliling logo.

## Contoh pasang di Vite + React (index.html)
```html
<link rel="icon" href="/favicon.ico" sizes="any" />
<link rel="icon" type="image/svg+xml" href="/restolink-icon.svg" />
<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
<meta name="theme-color" content="#F97316" />
```
Taruh file di folder `public/` (SVG dan PNG yang dipakai).

## Contoh komponen
```tsx
export const Logo = ({ dark = false }: { dark?: boolean }) => (
  <img src={dark ? "/restolink-logo-dark.svg" : "/restolink-logo.svg"} alt="RestoLink" height={40} />
);
```
