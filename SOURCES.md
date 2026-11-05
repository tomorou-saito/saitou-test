# データと出典

確認日：2026年11月5日

## 住民データ

- **Alexis Lours / ACNHAPI** — https://github.com/alexislours/ACNHAPI
  - 元JSON：https://github.com/alexislours/ACNHAPI/blob/master/v1a/villagers.json
  - 基本391名の日本語名・英語名・ID・種族・性格・誕生日を使用。
  - リポジトリREADMEでJSONは **CC BY 4.0** と案内。https://creativecommons.org/licenses/by/4.0/
  - 変更内容：必要な項目のみ抽出、キー名整理、種族と性格を日本語表示に変換、追加住民26名を補完。
- **Nookipedia — List of villagers in New Horizons** — https://nookipedia.com/wiki/Villager/New_Horizons
  - 追加26名の属性と合計417名の照合。
- **Nookipedia — List of villager IDs** — https://nookipedia.com/wiki/List_of_villager_IDs
  - 追加住民の内部IDを照合。
  - 個別ページも参照： https://nookipedia.com/wiki/Tulin 、 https://nookipedia.com/wiki/Mineru 、 https://nookipedia.com/wiki/Cece 、 https://nookipedia.com/wiki/Vich%C3%A9
- **任天堂 — Ver.3.0無料アップデート** — https://www.nintendo.com/jp/switch/acbaa/updates.html
  - チューリ、ミネル、なぎさ、みさきと対応amiiboによる招待。

`data.js`の`source: "acnhapi"`は基本データ、`source: "supplement"`は上記の追加データです。本文・表・画像をそのまま転載せず、属性を整理したデータセットです。ソースごとの権利・利用条件を保持してください。

## キャンプサイト

- **Animal Crossing Wiki — Campsite (New Horizons)** — https://animalcrossing.fandom.com/wiki/Campsite_(New_Horizons)
  - 50%の全候補枠・50%の不在性格候補枠、全8性格がいる場合、初回キザ、訪問間隔、履歴による候補除外の説明を参照。
- **Animal Crossing Wiki (Deutsch) — Campingplatz** — https://animalcrossingwiki.de/acnh/campingplatz
  - 不在性格が選ばれやすい傾向と訪問間隔を照合。
- **hyperT — あつまれどうぶつの森 キャンプサイト厳選のやり方** — https://hyperts.net/acnh/camp/
  - 人力統計に基づく過去の日本語説明。記事の60%という推定は他資料と数値が異なるため計算には使用していません。記事自身も統計による推定と説明しています。

任天堂が公開した公式抽選確率は今回の参照資料にはありません。コミュニティ資料間には推定の差があります。現在のゲーム内部の正確な確率として断言しません。

## アプリの参考モデル

通常住民407名から島にいる住民を除いた集合を`A`、そのうち島にいない性格の住民の集合を`M`とします。

- 不在性格があるとき：各候補の確率 = `0.5 / |A| + (候補がMに属する場合 0.5 / |M|、それ以外 0)`。
- 不在性格がないとき：各候補の確率 = `1 / |A|`。
- 性格別のグラフは、その性格を持つ候補の確率の合計。
- サンリオ6名とVer.3.0コラボ4名は`A`に含めない。
- 過去の訪問・居住、移住待ち、候補一巡後の再登場などは未反映。
- これは「訪問が起こったとき誰が来るか」のモデル。毎日の訪問発生率とは別。

## 画像

- **ACNH CDN** — https://acnhcdn.com/
  - `https://acnhcdn.com/latest/NpcIcon/{内部ID}.png`から413名分を同梱。
- 補助取得先 **ACNHAPI** — https://github.com/alexislours/ACNHAPI/tree/master/icons/villagers
- Ver.3.0追加4名の画像は同梱していません。種族を表す絵文字で代替します。

キャラクターおよびゲーム画像の権利は任天堂等の各権利者に帰属します。サンリオなどのコラボキャラクターには各社の権利も関係します。データのCCライセンスを画像に適用しないでください。出典表記は第三者画像の包括的な再配布許諾を意味しません。

## GitHub Pages

GitHub公式手順：https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site
