/**
 * Frostline — bir oyun gününün yukarıdan aşağı akış şeması.
 * col: -2..2 (0 = ana hat) · row: yukarıdan aşağı sıra.
 * phase: oyundaki aşama (Oyna modunda canlı vurgu için).
 * type "note": karar vermeyen açıklama kutusu, ebeveynine kesikli çizgiyle bağlanır.
 */
window.FROSTLINE_FLOW = {
  bands: [
    { phase: "morning", label: "1 · SABAH", from: 1, to: 10 },
    { phase: "route", label: "2 · ROTA", from: 11, to: 14 },
    { phase: "travel", label: "3 · SEYAHAT", from: 15, to: 17 },
    { phase: "stop", label: "4 · DURAK", from: 18, to: 20 },
    { phase: "evening", label: "5 · AKŞAM", from: 21, to: 26 },
    { phase: "night", label: "6 · GECE", from: 27, to: 50 },
  ],

  nodes: [
    // —— Başlangıç
    {
      id: "f-start", row: 0, col: 0, type: "start", phase: null,
      label: "Sefer başlar · Lokomotif + 2 vagon · 4 eşsiz karakter + 14 yolcu",
      detail: "Dünya donmuş. Elinizde bir lokomotif (kazan), bir yaşam vagonu ve bir sera vagonu var. Varılacak bir yer yok: durmak ölüm demek, yol hep devam eder. Amaç olabildiğince uzağa gitmek.",
      bullets: ["Kömür 70 · Yemek 60 · Hurda 25 · İlaç 4", "10 işçi, 4 çocuk", "Umut 60 · Hoşnutsuzluk 15"],
    },

    // —— 1 · SABAH
    {
      id: "f-morning", row: 1, col: 0, type: "process", phase: "morning",
      label: "Sabah raporu: bugünkü ve 2 günlük sıcaklık, yemek/kömür kaç gün yeter, hasta, sözler",
      detail: "Her gün dış sıcaklık düşer (−20°C → −60°C), sonra −50°C ile −62°C arasında dalgalanır. Rapor boşta kalan işçiyi, eksik ateşçiyi ve süresi dolan sözleri de uyarır.",
    },
    {
      id: "f-setup", row: 2, col: 0, type: "process", phase: "morning",
      label: "Hazırlık: işçileri Kazan / Sera / Atölye / Revir'e dağıt, karakterlere görev ver",
      detail: "Boşta işçi üretmez. Sera kapasitesi sera vagonu başına 4, atölye 2 (vagonla 4), revir 1 (vagonla 3). Dağılım hatırlanır: hastalanan işçi görevden düşer, iyileşince aynı göreve döner.",
    },
    {
      id: "n-chars", row: 2, col: 1, type: "note", phase: null, parent: "f-setup",
      label: "Selim kazanda: kömür −%25, 2 ateşçi · Leyla revirde: +3 iyileşme · Ayşe serada: +6 yemek · Kerem keşifte: ganimet ×1.4, risk ×0.6",
      detail: "Karakterler yanlış göreve konursa yetenekleri çalışmaz. Yaralanabilir veya ölebilirler. Yolda 4 yeni karakter kazanılabilir: Yusuf (Mühendis, atölye), Nermin (Öğretmen, halk), Baran (Avcı, keşif), Emine (Hemşire, revir). 'Karda bir yabancı' olayında, mülteciler arasında ya da keşifte bulunurlar.",
    },
    {
      id: "f-boilerset", row: 3, col: 0, type: "decision", phase: "morning",
      label: "Kazan seviyesi kaç olsun?",
      detail: "Seviye 0–3 (Çekirdekli kazan ile 4). Her seviye 2 ateşçi ister; ateşçi eksikse kazan daha düşük seviyede çalışır.",
    },
    {
      id: "f-boiler-low", row: 4, col: -1, type: "process", phase: "morning",
      label: "Düşük · az kömür, vagonlar soğuk, hastalık riski ↑",
      detail: "Kömür kıtlığında hayatta kalma yolu. Lokomotiften uzak vagonlar donar.",
    },
    {
      id: "f-boiler-high", row: 4, col: 0, type: "process", phase: "morning",
      label: "Yüksek · daha çok ateşçi ve kömür, vagonlar sıcak",
      detail: "Isı = kazan seviyesi + teknoloji − dış soğuk − lokomotife uzaklık.",
    },
    {
      id: "f-overdrive", row: 4, col: 1, type: "event", phase: "morning",
      label: "Aşırı yük · +1 ısı ama her gece stres +25 (Selim'le +15)",
      detail: "Stres %100 olursa kazan patlar. Kapatınca stres günde 20 düşer.",
    },
    {
      id: "f-law", row: 5, col: 0, type: "decision", phase: "morning",
      label: "Kanun Kitabı hazır mı? (2 günde bir)",
      detail: "Kanunlar kalıcıdır. Bazıları birbirini dışlar.",
    },
    {
      id: "f-law-adapt", row: 6, col: 1, type: "event", phase: "morning",
      label: "Uyum kanunu imzala: Çocuk İşçiliği ↔ Barınak · Çorba ↔ Talaş · Radikal Tedavi · Törenler ↔ Kar Mezarı · Uzatılmış/Acil Mesai",
      detail: "Her kanunun anlık umut/hoşnutsuzluk bedeli ve kalıcı kuralı var.",
    },
    {
      id: "f-law-path", row: 7, col: 1, type: "decision", phase: "morning",
      label: "4. gün geçti: hangi yol?",
      detail: "Düzen ve İnanç birbirini dışlar. Üçüncü kanunları 'çizgiyi aşmak'tır.",
    },
    {
      id: "f-law-order", row: 8, col: 1, type: "event", phase: "morning",
      label: "DÜZEN · Bekçi Devriyesi → Propaganda → Yeni Düzen (hoşnutsuzluk ≤ 95)",
      detail: "Devriye her gece hoşnutsuzluk −3, Propaganda umut +2. Yeni Düzen: umut −10, artık isyan yok.",
    },
    {
      id: "f-law-faith", row: 8, col: 2, type: "event", phase: "morning",
      label: "İNANÇ · Akşam Duaları → İnanç Bekçileri → Yeni İnanç (umut ≥ 5)",
      detail: "Dualar her gece umut +2, Bekçiler hoşnutsuzluk −3. Yeni İnanç: hoşnutsuzluk +8, umut sıfırlanamaz.",
    },
    {
      id: "f-shift", row: 9, col: 0, type: "decision", phase: "morning",
      label: "Bugünkü mesai türü?",
      detail: "Uzun mesai üretimi artırır ama insanları yorar ve öfkelendirir.",
    },
    {
      id: "f-shift-normal", row: 10, col: -1, type: "process", phase: "morning",
      label: "Normal · üretim ×1",
      detail: "Ek bedel yok.",
    },
    {
      id: "f-shift-emer", row: 10, col: 0, type: "bad-soft", phase: "morning",
      label: "Acil (24 saat) · ×2 · hoşnutsuzluk +14 · %30 ölüm",
      detail: "Acil Mesai kanunu gerekir. Bir işçi kazanın başında yığılabilir.",
    },
    {
      id: "f-shift-ext", row: 10, col: 1, type: "event", phase: "morning",
      label: "Uzatılmış · ×1.4 · hoşnutsuzluk +6 · %15 hastalık",
      detail: "Uzatılmış Mesai kanunu gerekir.",
    },

    // —— 2 · ROTA
    {
      id: "f-route", row: 11, col: 0, type: "decision", phase: "route",
      label: "Rota seç: 3 rastgele hedef + Bekle",
      detail: "Her hedefin mesafesi, kömür maliyeti, soğuğu ve riski farklı. Seyahat kömürü mesafe ve vagon sayısıyla artar.",
    },
    {
      id: "n-locs", row: 11, col: 1, type: "note", phase: null, parent: "f-route",
      label: "Kasaba: hurda, yemek, mülteci · Maden: bol kömür, göçük · Konvoy: karışık · Askeri depo: ilaç, çekirdek, akıncı · Sera ist.: yemek, tohum · Buz düzlüğü: hızlı, durak yok",
    },
    {
      id: "f-wait", row: 12, col: -1, type: "process", phase: "route",
      label: "Bekle ve ısın · 0 km, sadece ısınma kömürü",
      detail: "Fırtınada veya kömür azken mantıklı. Gün doğrudan akşama geçer.",
    },
    {
      id: "f-travel", row: 12, col: 0, type: "process", phase: "travel",
      label: "Yolculuk: kömür yanar, km ilerler, dış soğuk rotaya göre değişir",
      detail: "Kar sabanı teknolojisi seyahat kömürünü %15 düşürür.",
    },
    {
      id: "f-coalok", row: 13, col: 0, type: "decision", phase: "travel",
      label: "Kömür yolculuğa yetti mi?",
      detail: "Yetmezse tren kömürün yettiği kadar gider ve durağa varamaz.",
    },
    {
      id: "f-stranded", row: 14, col: -1, type: "bad-soft", phase: "travel",
      label: "Tren yolda kaldı · kısmi km · umut −4 · durak yok",
      detail: "Kömür sıfırlanır. Bu gece kazan sönebilir.",
    },
    {
      id: "f-goal", row: 14, col: 0, type: "decision", phase: "travel",
      label: "Yeni kilometre taşı geçildi mi? (her 500 km)",
      detail: "Varılacak bir yer yok; yol hiç bitmez. Oyun ancak kazan patlarsa, tren donarsa ya da isyan çıkarsa biter. Skor, gidilen toplam km'dir.",
    },
    {
      id: "f-milestone", row: 15, col: 1, type: "good", phase: "travel",
      label: "Kilometre taşı · umut +5 · seyir defterine işlenir",
      detail: "Üst şerit bir sonraki kilometre taşına ilerlemeyi ve en uzun sefer rekorunu gösterir.",
    },

    // —— 3 · SEYAHAT
    {
      id: "f-travel-ev", row: 16, col: 0, type: "decision", phase: "travel",
      label: "Yolda olay? (%50, fırtınada %75)",
      detail: "Koşula bağlı rastgele olaylar. Her birinde 2–3 seçenek.",
    },
    {
      id: "f-travel-event", row: 17, col: 1, type: "event", phase: "travel",
      label: "Yol olayı: seç ve bedelini öde",
      detail: "Örnek: Bağlantı kopuyor — 10 hurdayla tamir et ya da vagonu ve içindekileri bırak.",
    },
    {
      id: "n-travel-ev", row: 17, col: 2, type: "note", phase: null, parent: "f-travel-event",
      label: "Karda bir yabancı (yeni karakter) · Kar yığını · Akıncı pususu · Mülteciler · Bağlantı kopuyor · Buzlanmış makas · Geyik sürüsü · Radyo sinyali · Beyaz duvar · Kopan vagonda donanlar",
    },

    // —— 4 · DURAK
    {
      id: "f-stop", row: 18, col: 0, type: "decision", phase: "stop",
      label: "Durakta ne yapacaksın?",
      detail: "Durmak fırsat ve tehlikedir. Buz düzlüğünde ve kömür yetmezse durak yoktur.",
    },
    {
      id: "f-loot", row: 19, col: -1, type: "process", phase: "stop",
      label: "Keşif ekibi: 2 / 4 / 6 kişi · ganimet ×0.6 / ×1 / ×1.3",
      detail: "Kişi başı risk = durak tehlikesi × soğuk çarpanı × (Kerem 0.6) × (Keşif kıyafeti 0.6).",
    },
    {
      id: "f-quick", row: 19, col: 0, type: "process", phase: "stop",
      label: "Hızlı toplama · ganimet ×0.3 · risk yok",
      detail: "Tren yanındaki enkazdan ne bulunursa.",
    },
    {
      id: "f-skip", row: 19, col: 1, type: "process", phase: "stop",
      label: "Durmadan geç · hiçbir şey alma",
      detail: "Güvenli ama yarın daha az seçeneğin olur.",
    },
    {
      id: "f-loot-out", row: 20, col: -1, type: "event", phase: "stop",
      label: "Sonuç: ganimet · donma yarası (hasta) · kayıp (ölüm) · Kerem yaralanabilir",
      detail: "Ekip eksiksiz dönerse yeşil, kayıp varsa kart kırmızı olur.",
    },
    {
      id: "n-loot", row: 20, col: -2, type: "note", phase: null, parent: "f-loot-out",
      label: "Özel: Maden %15 göçük · Depo %30 akıncı, %35 buhar çekirdeği · Kasaba %25 mülteci · Sera ist. %30 tohum (sera +%15 kalıcı)",
    },

    // —— 5 · AKŞAM
    {
      id: "f-evening", row: 21, col: 0, type: "process", phase: "evening",
      label: "Akşam: gece tahmini — yemek üretim/tüketim, ısınma kömürü, en soğuk vagon",
      detail: "Kazan sönecekse burada uyarı çıkar.",
    },
    {
      id: "f-build", row: 22, col: 0, type: "decision", phase: "evening",
      label: "Vagon inşa et? (günde 1 · 20–35 hurda)",
      detail: "Hurda (ve revir için ilaç) harcanır. En fazla 8 vagon. Sefer 40 hurdayla başlar, yani ilk akşam bir vagon eklenebilir. Yusuf atölyedeyse vagonlar %25 ucuz.",
    },
    {
      id: "n-detach", row: 22, col: -1, type: "note", phase: null, parent: "f-build",
      label: "İstediğin an: son vagonu ayır → kömür tasarrufu ama umut −3 (yaşam vagonuysa −6)",
    },
    {
      id: "f-build-type", row: 23, col: 1, type: "process", phase: "evening",
      label: "Yaşam (10 yatak) · Sera · Atölye (Ar-Ge ×2) · Revir · Kömür tenderi (+60 depo)",
      detail: "Her vagon seyahat kömürünü artırır.",
    },
    {
      id: "f-build-pos", row: 24, col: 1, type: "event", phase: "evening",
      label: "Konum seç: lokomotife yakın = sıcak · arkadakiler 1 sıra uzaklaşır",
      detail: "Isı her 2 vagonda 1 düşer (Buhar boruları ile her 3 vagonda).",
    },
    {
      id: "f-research", row: 25, col: 0, type: "decision", phase: "evening",
      label: "Araştırma yap? (günde 1 · Ar-Ge + hurda)",
      detail: "Ar-Ge'yi atölye üretir.",
    },
    {
      id: "f-research-pick", row: 26, col: 1, type: "process", phase: "evening",
      label: "Yalıtım (+1 ısı) · Buhar boruları · Verimli kazan (−%20) · Sera lambaları · Kar sabanı · Keşif kıyafeti · Çekirdekli kazan",
      detail: "Çekirdekli kazan için keşifte buhar çekirdeği bulmak gerekir.",
    },

    // —— 6 · GECE
    {
      id: "f-night", row: 27, col: 0, type: "process", phase: "night",
      label: "Gece üretimi: Sera → yemek · Atölye → Ar-Ge · mesai cezaları uygulanır",
      detail: "Sera verimi soğukla düşer; Ayşe soğuk cezasını yarıya indirir.",
    },
    {
      id: "f-heatcoal", row: 28, col: 0, type: "decision", phase: "night",
      label: "Kömür ısınmaya yetti mi?",
      detail: "Isınma kömürü = kazan seviyesi ve vagon sayısına bağlı.",
    },
    {
      id: "f-boilerout", row: 29, col: 1, type: "bad-soft", phase: "night",
      label: "Kazan söndü · tüm vagonlar donuyor · umut −8",
      detail: "Ertesi sabah kazan yeniden yakılır ama gece hasar verilmiştir.",
    },
    {
      id: "f-foodok", row: 30, col: 0, type: "decision", phase: "night",
      label: "Yemek yetti mi? (kişi başı 1, Çorba −%25)",
      detail: "Stokta 2 günlükten fazla yemek varsa umut +1.",
    },
    {
      id: "f-hunger", row: 31, col: 1, type: "bad-soft", phase: "night",
      label: "Açlık · umut ↓ · hoşnutsuzluk ↑ · açlar hastalanır",
      detail: "Açık ne kadar büyükse ceza o kadar ağır.",
    },
    {
      id: "f-cold", row: 32, col: 0, type: "process", phase: "night",
      label: "Soğuk: her yaşam vagonunda ısıya göre hastalanma · yatak yetmezse koridorda uyunur",
      detail: "Koridorda uyuyanlar ekstra risk alır, hoşnutsuzluk +3.",
    },
    {
      id: "n-cold", row: 32, col: 1, type: "note", phase: null, parent: "f-cold",
      label: "Gece hastalanma riski · Donuyor %22 · Çok soğuk %13 · Soğuk %6 · Serin %2.5 · Ilık/Sıcak %1 · Talaş Katkısı ×1.3",
    },
    {
      id: "f-heal", row: 33, col: 0, type: "process", phase: "night",
      label: "Revir ve ilaç iyileştirir · tedavisiz hasta %12 ölür (Radikal Tedavi %5 + sakatlık)",
      detail: "Leyla revirde günde +3 iyileştirir; Revir Taşması kapasiteyi %50 artırır.",
    },
    {
      id: "f-deaths", row: 34, col: 0, type: "decision", phase: "night",
      label: "Bugün ölen var mı?",
      detail: "Ölümler yolculuktan, keşiften, olaylardan veya hastalıktan gelebilir.",
    },
    {
      id: "f-grief", row: 35, col: 1, type: "bad-soft", phase: "night",
      label: "Yas · ölü başına umut −4 (Törenler: yarısı) · hoşnutsuzluk +2",
      detail: "Kar Mezarı: ölü başına +2 yemek +1 hurda ama umut −2 ek.",
    },
    {
      id: "f-promise", row: 36, col: 0, type: "decision", phase: "night",
      label: "Verilen sözün sonucu?",
      detail: "Sözler gece olaylarında verilir; 2 gün içinde tutulmalıdır.",
    },
    {
      id: "f-promise-ok", row: 37, col: -1, type: "good", phase: "night",
      label: "Söz tutuldu · umut +10…14 · hoşnutsuzluk ↓",
    },
    {
      id: "f-promise-bad", row: 37, col: 1, type: "bad-soft", phase: "night",
      label: "Söz bozuldu · umut −12…16 · hoşnutsuzluk ↑",
    },
    {
      id: "f-stress", row: 38, col: 0, type: "decision", phase: "night",
      label: "Kazan stresi %100 mü?",
      detail: "Aşırı yük açıkken her gece stres birikir.",
    },
    {
      id: "f-explode", row: 39, col: -1, type: "bad", phase: null,
      label: "Kazan patladı — OYUN BİTTİ",
      detail: "Kazan giderse her şey gider.",
    },
    {
      id: "f-alive", row: 40, col: 0, type: "decision", phase: "night",
      label: "Trende hayatta kalan var mı?",
    },
    {
      id: "f-frozen", row: 41, col: -1, type: "bad", phase: null,
      label: "Tren dondu — OYUN BİTTİ",
      detail: "Son yolcu da öldü.",
    },
    {
      id: "f-revolt", row: 42, col: 0, type: "decision", phase: "night",
      label: "Umut 0 veya Hoşnutsuzluk 100 mü?",
      detail: "Düzen ve İnanç yollarının son kanunları bu sınırları kilitleyebilir.",
    },
    {
      id: "f-ult-used", row: 43, col: 1, type: "decision", phase: "night",
      label: "Son şans daha önce kullanıldı mı?",
      detail: "Her seferde yalnızca bir kez son şans verilir.",
    },
    {
      id: "f-exile", row: 44, col: 2, type: "bad", phase: null,
      label: "İsyan: trenden indirildin — OYUN BİTTİ",
      detail: "Halk seni bir istasyonda karda bırakır.",
    },
    {
      id: "f-ultimatum", row: 45, col: 1, type: "bad-soft", phase: "night",
      label: "SON ŞANS · 2 gün içinde Umut ≥ 30 ve Hoşnutsuzluk ≤ 70",
      detail: "Süre dolunca şart sağlanmamışsa isyan çıkar.",
    },
    {
      id: "f-night-ev", row: 46, col: 0, type: "decision", phase: "night",
      label: "Gece olayı? (%65)",
      detail: "Koşula bağlı ahlaki ikilemler. Doğru cevap yok; sadece bedeller var.",
    },
    {
      id: "f-dilemma", row: 47, col: -1, type: "event", phase: "night",
      label: "Ahlaki ikilem: affet / cezalandır / paylaştır / gönder",
      detail: "Her seçim umut, hoşnutsuzluk ve kaynakları farklı etkiler.",
    },
    {
      id: "n-night-ev", row: 47, col: -2, type: "note", phase: null, parent: "f-dilemma",
      label: "Kömür hırsızı · Aç çocuk · Geri dönmek isteyenler · Donmuş aile · Selim'in uyarısı · Kerem'in zulası · Gizli içki · Ayşe'nin tohumları · Keşfe katılmak isteyen çocuk",
    },
    {
      id: "f-demand", row: 47, col: 1, type: "event", phase: "night",
      label: "Halkın talebi: söz ver ya da reddet / bastır",
      detail: "Grev (hoşnutsuzluk ≥ 45), Umutsuzluk (umut ≤ 40), Salgın korkusu, Leyla'nın talebi.",
    },
    {
      id: "f-newday", row: 48, col: 0, type: "process", phase: "night",
      label: "Gün biter · seyir defterine yazılır · ertesi gün daha soğuk",
    },
    {
      id: "f-storm", row: 49, col: 0, type: "decision", phase: "night",
      label: "Fırtına cephesine ulaşıldı mı? (ilki ~700 km, sonra her 550–750 km)",
      detail: "Fırtınalar tekrar eder ve uzar: 2, 2, 3, 3, sonra 4 gün. Sabah raporu cephe 300 km yaklaşınca uyarır.",
    },
    {
      id: "f-storm-proto", row: 50, col: 1, type: "bad-soft", phase: "route",
      label: "FIRTINA · −70°C, son gün −62°C · rota: fırtınada ilerle (110 km) veya sığın · yol olayı %75",
      detail: "Uzun tren fırtınada yük olur; vagon ayırmak kömürü kurtarır.",
    },
  ],

  /** route: auto | merge | gutter | rgutter | loop | note */
  edges: [
    { from: "f-start", to: "f-morning" },
    { from: "f-morning", to: "f-setup" },
    { from: "f-setup", to: "n-chars", route: "note" },
    { from: "f-setup", to: "f-boilerset" },
    { from: "f-boilerset", to: "f-boiler-low", label: "0–1" },
    { from: "f-boilerset", to: "f-boiler-high", label: "2–3" },
    { from: "f-boilerset", to: "f-overdrive", label: "+ Aşırı yük" },
    { from: "f-boiler-low", to: "f-law", route: "merge" },
    { from: "f-boiler-high", to: "f-law", route: "merge" },
    { from: "f-overdrive", to: "f-law", route: "merge" },
    { from: "f-law", to: "f-law-adapt", label: "Evet" },
    { from: "f-law", to: "f-shift", label: "Hayır" },
    { from: "f-law-adapt", to: "f-law-path" },
    { from: "f-law-path", to: "f-law-order", label: "Düzen" },
    { from: "f-law-path", to: "f-law-faith", label: "İnanç" },
    { from: "f-law-order", to: "f-shift", route: "merge" },
    { from: "f-law-faith", to: "f-shift", route: "merge" },
    { from: "f-shift", to: "f-shift-normal", label: "Normal" },
    { from: "f-shift", to: "f-shift-emer", label: "Acil" },
    { from: "f-shift", to: "f-shift-ext", label: "Uzatılmış" },
    { from: "f-shift-normal", to: "f-route", route: "merge" },
    { from: "f-shift-emer", to: "f-route", route: "merge" },
    { from: "f-shift-ext", to: "f-route", route: "merge" },

    { from: "f-route", to: "n-locs", route: "note" },
    { from: "f-route", to: "f-wait", label: "Bekle" },
    { from: "f-route", to: "f-travel", label: "Git" },
    { from: "f-wait", to: "f-evening", route: "gutter" },
    { from: "f-travel", to: "f-coalok" },
    { from: "f-coalok", to: "f-stranded", label: "Hayır" },
    { from: "f-coalok", to: "f-goal", label: "Evet" },
    { from: "f-stranded", to: "f-evening", route: "gutter" },
    { from: "f-goal", to: "f-milestone", label: "Evet" },
    { from: "f-goal", to: "f-travel-ev", label: "Hayır" },
    { from: "f-milestone", to: "f-travel-ev", route: "merge" },

    { from: "f-travel-ev", to: "f-travel-event", label: "Evet" },
    { from: "f-travel-ev", to: "f-stop", label: "Hayır" },
    { from: "f-travel-event", to: "n-travel-ev", route: "note" },
    { from: "f-travel-event", to: "f-stop", route: "merge" },

    { from: "f-stop", to: "f-loot", label: "Keşif" },
    { from: "f-stop", to: "f-quick", label: "Topla" },
    { from: "f-stop", to: "f-skip", label: "Geç" },
    { from: "f-loot", to: "f-loot-out" },
    { from: "f-loot-out", to: "n-loot", route: "note" },
    { from: "f-loot-out", to: "f-evening", route: "merge" },
    { from: "f-quick", to: "f-evening", route: "merge" },
    { from: "f-skip", to: "f-evening", route: "merge" },

    { from: "f-evening", to: "f-build" },
    { from: "f-build", to: "n-detach", route: "note" },
    { from: "f-build", to: "f-build-type", label: "Evet" },
    { from: "f-build", to: "f-research", label: "Hayır" },
    { from: "f-build-type", to: "f-build-pos" },
    { from: "f-build-pos", to: "f-research", route: "merge" },
    { from: "f-research", to: "f-research-pick", label: "Evet" },
    { from: "f-research", to: "f-night", label: "Hayır · Günü bitir" },
    { from: "f-research-pick", to: "f-night", route: "merge" },

    { from: "f-night", to: "f-heatcoal" },
    { from: "f-heatcoal", to: "f-boilerout", label: "Hayır" },
    { from: "f-heatcoal", to: "f-foodok", label: "Evet" },
    { from: "f-boilerout", to: "f-foodok", route: "merge" },
    { from: "f-foodok", to: "f-hunger", label: "Hayır" },
    { from: "f-foodok", to: "f-cold", label: "Evet" },
    { from: "f-hunger", to: "f-cold", route: "merge" },
    { from: "f-cold", to: "n-cold", route: "note" },
    { from: "f-cold", to: "f-heal" },
    { from: "f-heal", to: "f-deaths" },
    { from: "f-deaths", to: "f-grief", label: "Evet" },
    { from: "f-deaths", to: "f-promise", label: "Hayır" },
    { from: "f-grief", to: "f-promise", route: "merge" },
    { from: "f-promise", to: "f-promise-ok", label: "Tutuldu" },
    { from: "f-promise", to: "f-stress", label: "Söz yok / süre var" },
    { from: "f-promise", to: "f-promise-bad", label: "Bozuldu" },
    { from: "f-promise-ok", to: "f-stress", route: "merge" },
    { from: "f-promise-bad", to: "f-stress", route: "merge" },
    { from: "f-stress", to: "f-explode", label: "Evet" },
    { from: "f-stress", to: "f-alive", label: "Hayır" },
    { from: "f-alive", to: "f-frozen", label: "Hayır" },
    { from: "f-alive", to: "f-revolt", label: "Evet" },
    { from: "f-revolt", to: "f-ult-used", label: "Evet" },
    { from: "f-revolt", to: "f-night-ev", label: "Hayır" },
    { from: "f-ult-used", to: "f-exile", label: "Evet" },
    { from: "f-ult-used", to: "f-ultimatum", label: "Hayır" },
    { from: "f-ultimatum", to: "f-night-ev", route: "merge" },
    { from: "f-night-ev", to: "f-dilemma", label: "İkilem" },
    { from: "f-night-ev", to: "f-demand", label: "Talep" },
    { from: "f-night-ev", to: "f-newday", label: "Sakin" },
    { from: "f-dilemma", to: "n-night-ev", route: "note" },
    { from: "f-dilemma", to: "f-newday", route: "merge" },
    { from: "f-demand", to: "f-newday", route: "merge" },
    { from: "f-newday", to: "f-storm" },
    { from: "f-storm", to: "f-storm-proto", label: "Evet" },
    { from: "f-storm", to: "f-morning", label: "Hayır · ertesi sabah", route: "loop" },
    { from: "f-storm-proto", to: "f-morning", route: "loop2" },
  ],
};
