/* このファイルだけで外部の予約先・LINE窓口を設定できます。空欄は受付準備中です。 */
window.GERMANY_CONFIG = {
  contactEmail: "germany.info@hungarystudy.org", // ドイツ留学ラボ専用の問い合わせ窓口
  contactFallbackEmail: "germany.info@hungarystudy.org", // 問い合わせはドイツ留学ラボの運営窓口へ統一
  currency: {rate:177.34, date:"2026-10-09", source:"https://www.ecb.europa.eu/stats/policy_and_exchange_rates/euro_reference_exchange_rates/html/index.en.html"},
  calendly: {
    "mizu": "https://calendly.com/hungarystudy-info/ost-40",             // MizuさんのCalendly予約URL
    "riko-asahi": "https://calendly.com/hungarystudy-info/iu-40",       // あさひさんのCalendly予約URL
    "megumi-yamada": "https://calendly.com/hungarystudy-info/osn-40",    // 山田恵さんのCalendly予約URL
    "aina": "https://calendly.com/hungarystudy-info/bay-40",             // AinaさんのCalendly予約URL
    "airi-kawakita": "https://calendly.com/hungarystudy-info/tuhh-40"     // 河北彩里さんのCalendly予約URL
  },
  lineApplicationEmail: "germany.info@hungarystudy.org", // ドイツ版の申込受付メールアドレス（mailto方式）
  lineApplicationUrl: "",   // 外部申込フォームを使う場合のHTTPS URL（任意）
  lineFriendUrl: ""         // 運営の正式なLINE友だち追加URL（任意）
};

