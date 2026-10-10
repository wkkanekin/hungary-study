/* このファイルだけで外部の予約先・LINE窓口を設定できます。空欄は受付準備中です。 */
window.GERMANY_CONFIG = {
  contactEmail: "germany.info@hungarystudy.org", // ドイツ留学ラボ専用の問い合わせ窓口
  contactFallbackEmail: "info@hungarystudy.org", // 当面はハンガリー留学ラボの共通運営窓口
  currency: {rate:177.34, date:"2026-10-09", source:"https://www.ecb.europa.eu/stats/policy_and_exchange_rates/euro_reference_exchange_rates/html/index.en.html"},
  calendly: {
    "riko-asahi": "",       // 朝日理子さんのCalendly予約URL
    "megumi-yamada": "",    // 山田恵さんのCalendly予約URL
    "aina": "",             // AinaさんのCalendly予約URL
    "airi-kawakita": ""     // 河北彩里さんのCalendly予約URL
  },
  lineApplicationEmail: "", // ドイツ版の申込受付メールアドレス（mailto方式）
  lineApplicationUrl: "",   // 外部申込フォームを使う場合のHTTPS URL（任意）
  lineFriendUrl: ""         // 運営の正式なLINE友だち追加URL（任意）
};

