# Germany university ranking page

Canonical page: `https://hungarystudy.org/germany/rankings.html`.
An existing ranking page was extended; do not create a second `university-ranking.html` page.

## Source of truth

`germany/data/ranking-catalog.json` contains reviewed institution identities, Japanese/English names, publisher aliases, main cities/states, guide links, edition-bound overall statuses and individual subject records. Each rank records the publisher, exact subject, edition, URL and verification date. QS rows also retain the publisher's public data endpoint. State-directory sources are preserved with their actual review dates.

2026-10-17 review: QS WUR 2027 (59 German ranked institutions), THE WUR 2027 (55 official university profiles), ARWU 2026 (51 German institutions in the official complete 1,000-institution table). There are 77 institution entries, including existing guide destinations and subject-only institutions. Subject data: QS and THE 2026, with distinct publisher subject names. No older THE subject edition is silently presented as 2026.

QS data was read from QS's public QSChina tables (`www.qs-topuniversities.cn`, copyright QS Quacquarelli Symonds Limited). Main TopUniversities WUR 2027 confirms publication on 18 June 2026; the subject pages confirm 25 March 2026. Leading overall values were cross-checked against TopUniversities' Germany table and institution profiles. TUM's subject release and TU Berlin's official ranking information independently confirm the architecture/engineering leading values. QSChina's `data-science` route uses the shorter label Data Science; TopUniversities identifies the corresponding subject as Data Science and Artificial Intelligence. Preserve both the exact route and this explanation.

ARWU data comes from the actual 2026 Nuxt page payload linked to the publisher page (all 1,000 entries, including 51 Germany entries), not from a truncated first page. THE profiles were parsed with `scripts/germany/ranking_sources.py` using the explicit heading, subject, year and rank tuple.

## Update procedure

1. Read the publisher's complete table or official institution profile. Check the institution identity and edition together with each rank; preserve `=` and rank bands. Do not extract an unrelated year, subject or first number from page text.
2. Resolve names explicitly. In particular, LMU and Ulm, Freiburg and Freiberg, the separate Berlin universities, Hannover Medical School and Leibniz University Hannover, and Hamburg University of Technology and University of Hamburg are different institutions. Münster's old name and the Kaiserslautern/RPTU transition remain searchable aliases.
3. Update the catalog and verification dates only for successfully checked values. Save historical editions separately before replacing them. An inaccessible page is `unverified`, never an inferred numerical rank or `out_of_range`. A complete published table can support `not_listed`; use `out_of_range` only with an explicit publisher statement.
4. Subject lists do not prove a university's complete program offering. Keep QS and THE subject definitions separate. Do not compare or average different fields or publishers as one league table.
5. Run `python scripts/build_germany_rankings.py` from any working directory. If adding a new official subject, first extend the subject translation/category map in that renderer.
6. Run `python -m unittest discover -s tests -p 'test_germany_rankings.py'`, `node --check germany/ranking-comparison.js`, and `python scripts/germany/validate.py`.
7. Check desktop and mobile rendering when a browser is available. Current verification covers static links, generated content, source/edition consistency, production JS handlers via a DOM adapter, and responsive CSS breakpoints; it does not substitute for a real rendering test.

The older `germany/data/rankings.json` and its automatic refresher remain in use elsewhere. They do not overwrite this reviewed catalog/page. The university-guide template includes the adjacent guide/ranking navigation links so future guide rebuilds preserve them. Existing university-guide article content is unchanged.
