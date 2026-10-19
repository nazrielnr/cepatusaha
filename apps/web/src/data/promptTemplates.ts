export interface PromptTemplate {
  id: string
  title: string
  category: string
  suitableFor: string
  description: string
  prompt: string
  badge?: string
  iconName: string
}

export const PROMPT_CATEGORIES = [
  'Semua',
  'Kuliner & F&B',
  'Jasa & Servis',
  'Fashion & Retail',
  'Kesehatan & Beauty',
  'Properti & Wisata',
  'Digital & Kreatif',
  'Edukasi & Kursus',
] as const

export const BUSINESS_PROMPT_TEMPLATES: PromptTemplate[] = [
  {
    id: 'resto-padang',
    title: 'Restoran Padang Modern',
    category: 'Kuliner & F&B',
    suitableFor: 'Rumah makan Minang, restoran keluarga, katering masakan tradisional nusantara',
    description: 'Tampilan premium & otentik dengan reservasi meja dan galeri menu interaktif.',
    badge: 'Populer',
    iconName: 'Utensils',
    prompt:
      'Website restoran Padang modern dan elegan yang menyajikan menu kuliner khas Sumatera Barat secara visual premium. Dilengkapi dengan galeri menu interaktif, sistem reservasi meja makan online, peta lokasi cabang terintegrasi, testimoni pelanggan, serta halaman sejarah resep keluarga yang otentik.',
  },
  {
    id: 'coffee-shop',
    title: 'Specialty Coffee & Coworking',
    category: 'Kuliner & F&B',
    suitableFor: 'Kafe kekinian, roastery kopi, workspace anak muda & pekerja remote',
    description: 'Estetika industrial minimalis dengan menu artisan dan booking meeting room.',
    badge: 'Tren',
    iconName: 'Coffee',
    prompt:
      'Website Specialty Coffee Shop & Coworking Space bergaya industrial-minimalis yang aesthetic. Menampilkan menu kopi artisan, manual brew, pastry segar, reservasi meeting room dan meja kerja, kalender event live music mingguan, serta pendaftaran membership reward digital.',
  },
  {
    id: 'bakery-cake',
    title: 'Bakery & Artisan Cake Shop',
    category: 'Kuliner & F&B',
    suitableFor: 'Toko roti, pastry chef, kue ulang tahun, hampers hari raya & wedding cake',
    description: 'Desain pastel hangat dengan custom order kue dan integrasi WhatsApp checkout.',
    badge: 'Konversi Tinggi',
    iconName: 'Cake',
    prompt:
      'Website toko roti dan kue artisan dengan desain pastel hangat dan menggugah selera. Fitur: katalog varian cake dengan opsi kustomisasi topping dan ukuran, sistem pre-order pengiriman berjadwal, kalkulator porsi kue pesta, galeri kreasi wedding cake, dan checkout via WhatsApp.',
  },
  {
    id: 'laundry-sepatu',
    title: 'Laundry Sepatu & Perawatan Tas',
    category: 'Jasa & Servis',
    suitableFor: 'Shoe cleaning & repaint, spa tas kulit, cuci helm & apparel bermerek',
    description: 'Layanan pick-up delivery, before-after slider interaktif, dan tracking order.',
    badge: 'Rekomendasi',
    iconName: 'Sparkles',
    prompt:
      'Website jasa laundry dan perawatan sepatu/tas premium dengan visual bersih dan profesional. Menampilkan daftar paket treatment (deep clean, unyellowing, repaint), form booking pick-up & delivery antar-jemput, pelacak status pengerjaan, galeri before-after yang interaktif, dan garansi kepuasan.',
  },
  {
    id: 'barbershop',
    title: 'Barbershop & Grooming Pria',
    category: 'Jasa & Servis',
    suitableFor: 'Barbershop eksklusif, salon pria, akademi cukur rambut, barbershop franchise',
    description: 'Nuansa dark maskulin vintage dengan booking jam cukur online tanpa antre.',
    badge: 'Populer',
    iconName: 'Scissors',
    prompt:
      'Website barbershop premium bergaya vintage-modern bertema dark masculine. Dilengkapi katalog gaya rambut trendi, profil barber kapabel, sistem booking jadwal potong rambut tanpa antre, katalog produk pomade & hair care, serta daftar harga paket grooming lengkap.',
  },
  {
    id: 'auto-detailing',
    title: 'Cuci Mobil & Detailing Panggilan',
    category: 'Jasa & Servis',
    suitableFor: 'Jasa nano ceramic coating, salon mobil panggilan, cuci motor besar & mobil',
    description: 'Form booking alamat rumah, perbandingan paket kilau, dan portofolio HD.',
    badge: 'Efisien',
    iconName: 'Car',
    prompt:
      'Website jasa auto detailing dan cuci mobil panggilan ke rumah dengan tampilan modern dan terpercaya. Fitur: formulir booking tanggal & alamat jemputan, tabel perbandingan paket detailing, galeri hasil kilau coating HD, ulasan pelanggan, dan FAQ layanan terpercaya.',
  },
  {
    id: 'streetwear-distro',
    title: 'Brand Streetwear & Clothing Lokal',
    category: 'Fashion & Retail',
    suitableFor: 'Brand clothing distro, kaos oversize, jaket varsity, aksesoris streetwear',
    description: 'Tipografi bold urban, lookbook video musiman, dan size chart interaktif.',
    badge: 'Tren',
    iconName: 'Shirt',
    prompt:
      'Website e-commerce brand streetwear lokal dengan estetika urban edgy dan tipografi bold. Menampilkan lookbook koleksi musiman, katalog produk dengan filter ukuran/warna cerdas, panduan size chart interaktif, badge best seller/limited edition, serta tombol beli cepat via WhatsApp/Marketplace.',
  },
  {
    id: 'butik-hijab',
    title: 'Butik Hijab & Busana Muslimah',
    category: 'Fashion & Retail',
    suitableFor: 'Toko gamis syari, pashmina & hijab instan, busana pesta & mukena premium',
    description: 'Nuansa anggun earth tone dengan panduan mix-and-match gaya sehari-hari.',
    badge: 'Konversi Tinggi',
    iconName: 'Smile',
    prompt:
      'Website butik fashion hijab dan modest wear muslimah dengan nuansa anggun, earth tone, dan mewah. Memuat katalog koleksi harian hingga formal, panduan mix & match outfit, lookbook video kain, ulasan pelanggan berfoto, dan kemudahan order langsung via WhatsApp.',
  },
  {
    id: 'florist-hampers',
    title: 'Florist & Hampers Hadiah',
    category: 'Fashion & Retail',
    suitableFor: 'Toko bunga segar, buket wisuda/anniversary, papan bunga, kado ulang tahun',
    description: 'Filter momen perayaan, custom kartu ucapan, dan opsi sameday delivery.',
    badge: 'Populer',
    iconName: 'Sparkles',
    prompt:
      'Website florist online modern untuk pemesanan buket bunga segar dan hampers kustom. Fitur: pemilih kategori momen (wisuda, pernikahan, duka cita, anniversary), custom pesan kartu ucapan, opsi pengiriman sameday di kota tertentu, serta galeri rangkaian bunga estetik.',
  },
  {
    id: 'klinik-kecantikan',
    title: 'Klinik Kecantikan & Skincare Estetika',
    category: 'Kesehatan & Beauty',
    suitableFor: 'Klinik dokter kulit, aesthetic clinic, facial spa, klinik laser kecantikan',
    description: 'Profil dokter terverifikasi, konsultasi dokter online, dan etalase produk BPOM.',
    badge: 'Rekomendasi',
    iconName: 'Sparkles',
    prompt:
      'Website klinik kecantikan dan estetika berdesain bersih, terpercaya, dan menenangkan. Memuat profil dokter dermatologi tersertifikasi, penjelasan detail jenis perawatan kulit & laser, form konsultasi online / booking jadwal, etalase produk skincare BPOM, serta testimoni nyata pasien.',
  },
  {
    id: 'studio-yoga-pilates',
    title: 'Studio Yoga & Pilates Wellness',
    category: 'Kesehatan & Beauty',
    suitableFor: 'Studio senam & pilates, kelas meditasi mindful, private fitness trainer',
    description: 'Nuansa zen natural dengan jadwal kelas real-time dan paket membership.',
    badge: 'Populer',
    iconName: 'Smile',
    prompt:
      'Website studio yoga dan pilates dengan visual bernuansa zen, natural, dan menenangkan. Fitur: jadwal kelas harian dan kuota tersisa secara real-time, profil instruktur berlisensi, paket membership bulanan, opsi booking sesi private, dan panduan untuk pemula.',
  },
  {
    id: 'dental-clinic',
    title: 'Klinik Gigi & Estetika Senyum',
    category: 'Kesehatan & Beauty',
    suitableFor: 'Dokter gigi keluarga, spesialis kawat gigi (behel), veneer & scaling gigi',
    description: 'Simulasi senyum, booking janji temu ramah anak, dan transparansi tarif.',
    badge: 'Terpercaya',
    iconName: 'Smile',
    prompt:
      'Website klinik gigi modern dan ramah keluarga yang menghapus rasa takut ke dokter gigi. Fitur: booking janji temu dokter, menu layanan (scaling, bleaching, behel, implan), simulasi senyum/kalkulator estimasi biaya, profil dokter spesialis gigi, dan tur virtual klinik.',
  },
  {
    id: 'kost-coliving',
    title: 'Kost Eksklusif & Co-Living',
    category: 'Properti & Wisata',
    suitableFor: 'Pengelola indekos mewah, co-living mahasiswa & eksekutif, guest house',
    description: 'Tur kamar foto HD, filter fasilitas komplit, dan form booking survey kamar.',
    badge: 'Tren',
    iconName: 'Home',
    prompt:
      'Website kost eksklusif dan co-living modern dengan desain minimalis informatif. Menampilkan virtual room tour 360/foto HD setiap tipe kamar, daftar fasilitas lengkap (WiFi, AC, water heater, laundry), lokasi strategis dekat kampus/kantor, ketersediaan kamar real-time, dan form booking survey kamar.',
  },
  {
    id: 'villa-glamping',
    title: 'Villa & Glamping Staycation Alam',
    category: 'Properti & Wisata',
    suitableFor: 'Villa pegunungan/pantai, tempat glamping alam, resort liburan keluarga',
    description: 'Lanskap sinematik, kalender tanggal sewa, panduan wisata dan rute jalan.',
    badge: 'Estetik',
    iconName: 'Home',
    prompt:
      'Website villa dan glamping staycation dengan pemandangan alam memukau berdesain visual cinematic. Fitur: kalender ketersediaan tanggal dan harga sewa, galeri lanskap dan interior setiap unit, daftar aktivitas outdoor (barbeque, trekking, api unggun), panduan rute lokasi, dan reservasi instan WhatsApp.',
  },
  {
    id: 'interior-kontraktor',
    title: 'Desain Interior & Renovasi Rumah',
    category: 'Properti & Wisata',
    suitableFor: 'Studio arsitek, desainer interior dapur/kamar, kontraktor bangun & renovasi',
    description: 'Before-after transformasi ruangan, estimasi biaya per m2, dan alur kontrak.',
    badge: 'Terpercaya',
    iconName: 'Building2',
    prompt:
      'Website studio desain interior dan kontraktor arsitektur berkelas dengan nuansa arsitektural bersih. Menampilkan portofolio transformasi ruangan before-after interaktif, alur kerja bertahap dari konsultasi hingga serah terima, kalkulator estimasi biaya renovasi per m2, dan tombol booking konsultasi desain.',
  },
  {
    id: 'bimbel-coding-anak',
    title: 'Bimbel & Akademi Coding Anak',
    category: 'Edukasi & Kursus',
    suitableFor: 'Kursus programming anak, les privat matematika & sains, bimbel UTBK/SNBT',
    description: 'Kurikulum bertingkat interaktif, jadwal trial class gratis, dan portofolio murid.',
    badge: 'Rekomendasi',
    iconName: 'GraduationCap',
    prompt:
      'Website lembaga bimbingan belajar dan akademi coding anak interaktif yang ceria dan edukatif. Menampilkan kurikulum pembelajaran bertingkat, jadwal kelas trial gratis, profil tutor berpengalaman, karya showcase murid, dan form pendaftaran siswa baru.',
  },
  {
    id: 'digital-agency',
    title: 'Software House & Digital Agency',
    category: 'Digital & Kreatif',
    suitableFor: 'Jasa pembuatan web & app, konsultan SEO & ads, studio desain branding',
    description: 'Desain dark futuristik sleek, studi kasus interaktif, kalkulator estimasi proyek.',
    badge: 'Konversi Tinggi',
    iconName: 'Building2',
    prompt:
      'Website portofolio digital agency dan software house modern bergaya dark sleek berteknologi tinggi. Memuat showcase studi kasus proyek klien interaktif, daftar layanan (Web Dev, Mobile App, UI/UX, SEO), kalkulator estimasi budget proyek, testimoni CEO/Founder mitra, dan formulir konsultasi ide.',
  },
  {
    id: 'studio-fotografi',
    title: 'Studio Foto & Wedding Documentation',
    category: 'Digital & Kreatif',
    suitableFor: 'Fotografer pernikahan & prewedding, studio wisuda & keluarga, videografer',
    description: 'Galeri portofolio masonry, pricelist transparan, dan booking jadwal sesi foto.',
    badge: 'Estetik',
    iconName: 'Camera',
    prompt:
      'Website studio fotografi komersial dan wedding/prewedding berdesain galeri minimalis artistik. Fitur: portofolio visual masonry beresolusi tinggi, rincian paket foto & pricelist transparan, ketersediaan jadwal tanggal pemotretan, ulasan pengantin, dan formulir konsultasi konsep sesi foto.',
  },
]
