ハンガリー基本情報 更新版 2026-10-09

反映先：wkkanekin/hungary-study のルート。ZIPを展開し、階層をそのまま反映してください。
全文を同梱しています。新規ページはguide-budapest-airport-access.html、guide-hungary-places.html、column-neptun-bueb.html。
既存上書き：basics-hungary.html、basics-hungary.css、guides.json、column.html、columns.json。
新規CSS/JS：basics-hungary-articles.css、hungary-weather.js。
images/basics/、data/、scripts/、.github/workflows/ は同じ階層へ。

気象自動更新：.github/workflows/update-hungary-weather.yml を反映後、GitHubのActionsで「Update Hungary weather」を開き、Run workflowを一度実行してください。
Settings > Actions > General > Workflow permissionsでRead and write permissionsを許可します。既存の設定がwriteなら変更不要。
その後、毎時17分UTCに実行予約。GitHub側の混雑で遅れる場合があります。気温は最新予報の当該時刻の値で、実測値ではありません。ページは10分ごとに同梱JSONを再確認します。
月別比較：NASA POWER/MERRA-2格子データ。1991〜2020年平年値、2025年・2024年を同梱。原則毎月取得し直し、年が変われば前年・前々年を切り替えます。取得失敗時は以前の成功データと更新時刻を表示。

prices.jsonは同梱・書き換えしません。既存の物価更新はそのまま参照します。
既存の食料品Guide・地域別物価Guide・大学Guide・共通スタイルと画像を参照するため、既存リポジトリへの反映用です。
Neptunの個人情報は公開用画像でモザイク処理。元の画像を公開フォルダに追加しないでください。
Googleフォト提供素材に券売機単独の写真は確認できなかったため、乗り場・Pay&GO端末の2写真を採用。券売機の購入手順は本文で説明しています。
地区図は実際の区境界図を再着色、番号変更。Tgr／Norway.today、Wikimedia Commons、CC BY-SA 4.0。各ページに出典・改変・ライセンスを記載。
大学写真は既存の公式資料由来素材を使用。ジェールは大学公式Campus lifeページの写真。各地域に出典と大学Guideへのリンクを記載。
