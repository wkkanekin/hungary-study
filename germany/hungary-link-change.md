# ハンガリー版からドイツ版へのリンク変更箇所

この文書は変更案だけです。既存ファイルは変更していません。

## TOPの目次

対象：`wkkanekin/hungary-study` の `index.html`、`nav.topNav` 内。
取得したファイルでは184〜187行付近に以下があります。

```html
<span class="topNavComingSoon">
    ドイツ留学ラボ
    <small>準備中</small>
</span>
```

ドイツ版の公開先が決まったら、このspanだけを次のa要素に差し替えます。

```html
<!-- 同じドメインの /germany/ に配置する場合の例 -->
<a href="/germany/">ドイツ留学ラボ</a>
```

このZIP内のgermany-studyフォルダの中身を `/germany/` 配下へ配置すれば、index.htmlがTOPになります。別ドメインに配置する場合は、公開後に確定したHTTPS URLをhrefへ指定してください。今のZIPには公開先を決め打ちしていません。

既存の `.topNav a` によって他の目次と同じ見た目になります。`topNavComingSoon`クラスとsmallの「準備中」は外してください。既存のオランダ版や不動産情報の準備中表示はこの変更の対象外です。

## その他の依存

このTOP目次の文字列はindex.htmlに直接書かれており、config.jsonやscript.jsから生成されていません。この項目をリンクにするためのCSS・JavaScript変更は不要です。画像もドイツ版内に同梱されるため、ハンガリー版images.jsonの変更も不要です。

対象リポジトリ取得日時：2026年10月1日。確認したmainのコミット：`1552d2e5b19c30bbc3077d756e43000eae859671`。行番号はその後の編集で変動するため「ドイツ留学ラボ」の文字列で確認してください。
