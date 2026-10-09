# Graph Report - codebase  (2026-10-09)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 4960 nodes · 14953 edges · 126 communities (112 shown, 14 thin omitted)
- Extraction: 91% EXTRACTED · 9% INFERRED · 0% AMBIGUOUS · INFERRED: 1338 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `33d8f161`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- charts-pX_xqJYu.js
- index.ts
- Checklist-QAXGfnNn.js
- Budget-D1eAoKNl.js
- Vendor.tsx
- $
- index-gVZbWIGt.js
- framer-motion-WvXl1suq.js
- e
- AppShell-kU9SMMPl.js
- r
- Landing-BZub7CLX.js
- iT
- react-vendor-GfC0Vdt6.js
- Pengaturan-BC8mQRkt.js
- xE
- package.json
- dependencies
- react
- t
- $a
- Home-CV1GHNMj.js
- G
- tn
- .start
- fn
- $
- da
- AppShell.tsx
- radix-ui-BqbpTwho.js
- schema.ts
- r
- h0
- ku
- field.tsx
- .getValue
- G
- workspaceUserId
- e_
- Ja
- n
- l1
- Yc
- my
- nh
- At
- et
- vn
- jp
- Pe
- .get
- .toString
- ze
- ct
- n
- rC
- Dh
- .forEach
- fi
- nC
- uploadValidation.test.ts
- ua
- o
- a
- la
- compilerOptions
- Io
- hr
- er
- yb
- fc
- components.json
- ot
- Shared.tsx
- en
- s
- .add
- $a
- devDependencies
- compilerOptions
- tu
- du
- Wc
- instrumentation.tsx
- reminders.ts
- wedding.ts
- @convex-dev/auth
- compilerOptions
- bs
- cC
- generate-icons.mjs
- un
- form.tsx
- a
- .forEach
- zi
- vly-toolbar-readonly.tsx
- budget.ts
- xt
- Qc
- checklist.ts
- oA
- Va
- chart.tsx
- input-group.tsx
- Ae
- workspace.ts
- scripts
- SoftAurora
- oi
- .toString
- es
- PageMascot.tsx
- ne
- Ni
- tc
- tsconfig.json
- convex.json
- vy
- RootErrorBoundary
- ToolbarErrorBoundary
- global.d.ts

## God Nodes (most connected - your core abstractions)
1. `iT()` - 369 edges
2. `$` - 341 edges
3. `cn()` - 245 edges
4. `t()` - 182 edges
5. `e()` - 173 edges
6. `r()` - 145 edges
7. `$` - 115 edges
8. `n()` - 103 edges
9. `o()` - 87 edges
10. `workspaceUserId()` - 77 edges

## Surprising Connections (you probably didn't know these)
- `ya()` --indirect_call--> `cn()`  [INFERRED]
  isolate/assets/AppShell-kU9SMMPl.js → src/lib/utils.ts
- `lo` --indirect_call--> `cn()`  [INFERRED]
  isolate/assets/Checklist-QAXGfnNn.js → src/lib/utils.ts
- `Vl()` --indirect_call--> `Sl()`  [INFERRED]
  isolate/assets/Shared-DjU1oz0h.js → isolate/assets/framer-motion-WvXl1suq.js
- `iT()` --indirect_call--> `C0()`  [INFERRED]
  isolate/assets/index-gVZbWIGt.js → isolate/assets/charts-pX_xqJYu.js
- `darker()` --indirect_call--> `Zn()`  [INFERRED]
  isolate/assets/charts-pX_xqJYu.js → isolate/assets/framer-motion-WvXl1suq.js

## Import Cycles
- None detected.

## Communities (126 total, 14 thin omitted)

### Community 0 - "charts-pX_xqJYu.js"
Cohesion: 0.01
Nodes (227): a0(), a2(), ab(), AC(), aD(), af(), Al(), aM() (+219 more)

### Community 1 - "index.ts"
Cohesion: 0.02
Nodes (182): cmdk, input-otp, @radix-ui/react-accordion, @radix-ui/react-avatar, @radix-ui/react-checkbox, @radix-ui/react-context-menu, @radix-ui/react-dialog, @radix-ui/react-hover-card (+174 more)

### Community 2 - "Checklist-QAXGfnNn.js"
Cohesion: 0.03
Nodes (122): ae, An(), ao(), Ar(), as(), Be(), Bn(), Br (+114 more)

### Community 3 - "Budget-D1eAoKNl.js"
Cohesion: 0.05
Nodes (99): Ca(), _e, Ja(), ka(), Na, va(), m, o() (+91 more)

### Community 4 - "Vendor.tsx"
Cohesion: 0.06
Nodes (117): convex, recharts, sonner, AccountSection(), loadOtpFlow(), CHART_COLORS, ChartCard(), ChartTip() (+109 more)

### Community 5 - "$"
Cohesion: 0.02
Nodes (119): $, ac, as(), B(), be, bi(), bn, bs (+111 more)

### Community 6 - "index-gVZbWIGt.js"
Cohesion: 0.03
Nodes (127): aA(), Ap(), Av, Aw, ax(), Bo(), bv, bw() (+119 more)

### Community 7 - "framer-motion-WvXl1suq.js"
Cohesion: 0.03
Nodes (111): lr(), sa(), al(), ao(), ar(), as, bi, bu() (+103 more)

### Community 8 - "e"
Cohesion: 0.03
Nodes (107): bo(), c1(), r(), co(), n(), dx(), c(), i() (+99 more)

### Community 9 - "AppShell-kU9SMMPl.js"
Cohesion: 0.03
Nodes (92): An, ba(), be(), Bn(), bt, Cn, ct(), D (+84 more)

### Community 10 - "r"
Cohesion: 0.06
Nodes (105): _1(), bf(), bN(), t(), Br(), BT(), c_(), cC() (+97 more)

### Community 11 - "Landing-BZub7CLX.js"
Cohesion: 0.03
Nodes (81): In, j, $r, a(), c, d(), h(), i (+73 more)

### Community 12 - "iT"
Cohesion: 0.05
Nodes (86): E0(), Ha(), T0(), Or(), iT(), a0(), ag(), ao() (+78 more)

### Community 13 - "react-vendor-GfC0Vdt6.js"
Cohesion: 0.06
Nodes (79): Be(), L(), c(), se, ar(), at(), be(), br() (+71 more)

### Community 14 - "Pengaturan-BC8mQRkt.js"
Cohesion: 0.05
Nodes (59): f(), r(), fa, Ln(), e(), M(), R(), lo (+51 more)

### Community 15 - "xE"
Cohesion: 0.04
Nodes (66): aj(), bj(), Bm(), Bx(), cj(), dj(), ej(), fE (+58 more)

### Community 16 - "package.json"
Cohesion: 0.03
Nodes (59): app, name, private, type, version, clsx, date-fns, @dnd-kit/core (+51 more)

### Community 17 - "dependencies"
Cohesion: 0.03
Nodes (67): dependencies, axios, class-variance-authority, clsx, cmdk, convex, @convex-dev/auth, date-fns (+59 more)

### Community 18 - "react"
Cohesion: 0.06
Nodes (54): framer-motion, gsap, @gsap/react, @hugeicons/core-free-icons, motion, react, AnimatedContent(), AnimatedContentProps (+46 more)

### Community 19 - "t"
Cohesion: 0.04
Nodes (62): _2(), An(), aS(), n(), bA, bS(), r(), cP() (+54 more)

### Community 20 - "$a"
Cohesion: 0.05
Nodes (12): $a, al, fi(), hn(), kl, L, ri, rl() (+4 more)

### Community 21 - "Home-CV1GHNMj.js"
Cohesion: 0.04
Nodes (44): jC(), e, t, e, t, d, e, t (+36 more)

### Community 22 - "G"
Cohesion: 0.05
Nodes (10): ei(), gr(), ii(), kr, oe(), pr(), qt(), rn (+2 more)

### Community 23 - "tn"
Cohesion: 0.07
Nodes (28): Ba(), kc(), Ac(), bT, ci, Cn(), ct(), dv() (+20 more)

### Community 24 - ".start"
Cohesion: 0.09
Nodes (38): aa(), au(), bo(), a(), bu(), dt(), fl(), o() (+30 more)

### Community 25 - "fn"
Cohesion: 0.05
Nodes (50): Ai(), b0(), i(), b1(), T(), Be(), bP(), d1() (+42 more)

### Community 26 - "$"
Cohesion: 0.07
Nodes (35): Jl(), Sr(), ha, Lt, nS, tS(), Xt(), Pt() (+27 more)

### Community 27 - "da"
Cohesion: 0.05
Nodes (17): T, au, da(), _i(), Jn, Ni(), nt(), pa() (+9 more)

### Community 28 - "AppShell.tsx"
Cohesion: 0.09
Nodes (42): lucide-react, react-router, vaul, AppShell(), NotificationBell(), pageTitleFor(), useEnsureSetup(), WorkspaceStatus (+34 more)

### Community 29 - "radix-ui-BqbpTwho.js"
Cohesion: 0.05
Nodes (32): ef, kt, al(), ar(), cl(), Dc(), dt(), eu (+24 more)

### Community 30 - "schema.ts"
Cohesion: 0.05
Nodes (25): convex-test, vitest, Role, ROLES, roleValidator, rsvpValidator, schema, seserahanStatusValidator (+17 more)

### Community 31 - "r"
Cohesion: 0.08
Nodes (43): A, N, _1(), p(), Ag(), bg(), bx(), cw() (+35 more)

### Community 32 - "h0"
Cohesion: 0.14
Nodes (47): Kl(), bm(), Bs(), cd(), ae(), f(), fe(), G() (+39 more)

### Community 33 - "ku"
Cohesion: 0.07
Nodes (13): bo(), ho(), hu(), io(), kn(), ku, mo, Oe() (+5 more)

### Community 34 - "field.tsx"
Cohesion: 0.06
Nodes (40): class-variance-authority, @radix-ui/react-separator, @radix-ui/react-slot, @radix-ui/react-toggle, @radix-ui/react-toggle-group, Badge(), badgeVariants, ButtonGroup() (+32 more)

### Community 35 - ".getValue"
Cohesion: 0.07
Nodes (21): an, Ar(), br(), Co, di(), jn(), Ln(), ni() (+13 more)

### Community 36 - "G"
Cohesion: 0.06
Nodes (43): Aq(), bq(), cf(), d0(), De(), dn(), dO(), eE() (+35 more)

### Community 37 - "workspaceUserId"
Cohesion: 0.09
Nodes (36): assertValidImageUpload(), create, createMany, inviteAll, list, remove, setInvited, setRsvp (+28 more)

### Community 38 - "e_"
Cohesion: 0.05
Nodes (35): a_(), a1(), i(), n(), t(), dw(), e_(), eo() (+27 more)

### Community 39 - "Ja"
Cohesion: 0.06
Nodes (35): ar(), aT(), t(), copy(), dm(), ek(), m(), iT() (+27 more)

### Community 40 - "n"
Cohesion: 0.09
Nodes (40): Bd(), n(), cu(), dd(), du(), Ei(), eo(), Er() (+32 more)

### Community 41 - "l1"
Cohesion: 0.08
Nodes (27): a1(), Ay(), bA(), cy(), d1(), df(), $g(), h1() (+19 more)

### Community 42 - "Yc"
Cohesion: 0.08
Nodes (5): af(), dC(), dl(), jA, Yc()

### Community 43 - "my"
Cohesion: 0.07
Nodes (38): b1(), Be(), bS(), c1(), dr(), ef(), Ho(), Ig() (+30 more)

### Community 44 - "nh"
Cohesion: 0.09
Nodes (38): au(), cc(), eh(), Ft(), ga(), Gn(), Hb(), hd() (+30 more)

### Community 45 - "At"
Cohesion: 0.12
Nodes (34): _0(), al(), At(), dc(), Dr(), e0(), Ef(), gm() (+26 more)

### Community 46 - "et"
Cohesion: 0.10
Nodes (32): jt, tr(), aa, et(), ah(), am(), bo(), cm() (+24 more)

### Community 47 - "vn"
Cohesion: 0.08
Nodes (15): cu(), el, hu(), il(), Io(), ji(), lu(), so() (+7 more)

### Community 48 - "jp"
Cohesion: 0.08
Nodes (29): aE(), cx(), i(), r(), DA(), eh(), Ei(), Em() (+21 more)

### Community 49 - "Pe"
Cohesion: 0.11
Nodes (6): ma(), oa(), Pe(), sa(), Ui(), va()

### Community 50 - ".get"
Cohesion: 0.19
Nodes (12): bt(), cs(), Dn(), _e(), gc(), ic, jc(), pu() (+4 more)

### Community 51 - ".toString"
Cohesion: 0.08
Nodes (5): Qt, Sp(), XA(), yv, zA

### Community 52 - "ze"
Cohesion: 0.13
Nodes (29): Ql(), bh(), co(), Do(), em(), Fb(), Fl(), fo() (+21 more)

### Community 53 - "ct"
Cohesion: 0.08
Nodes (22): ai(), At(), ct, De(), dr(), Er(), fr(), fs() (+14 more)

### Community 54 - "n"
Cohesion: 0.10
Nodes (18): ci, oa(), oi(), eo(), ju(), lo(), mn, on() (+10 more)

### Community 55 - "rC"
Cohesion: 0.10
Nodes (11): Ai(), bc(), d(), lg(), m(), iy(), ky(), o() (+3 more)

### Community 56 - "Dh"
Cohesion: 0.10
Nodes (23): Bl(), aT(), Bi(), bu(), Db(), Dh(), Dl(), hn() (+15 more)

### Community 57 - ".forEach"
Cohesion: 0.09
Nodes (18): At(), dr(), a(), a(), gl(), mc(), oc(), po() (+10 more)

### Community 58 - "fi"
Cohesion: 0.10
Nodes (25): nr(), A(), as(), i(), s(), ca(), di(), e() (+17 more)

### Community 59 - "nC"
Cohesion: 0.19
Nodes (3): fl(), nC, tC()

### Community 60 - "uploadValidation.test.ts"
Cohesion: 0.10
Nodes (14): ALLOWED_IMAGE_TYPES, generateUploadUrl, MAX_UPLOAD_BYTES, WORKSPACE_TABLES, create, list, nextSortOrder(), remove (+6 more)

### Community 61 - "ua"
Cohesion: 0.20
Nodes (24): De(), ea(), Hn(), M(), O(), sa(), u(), v() (+16 more)

### Community 62 - "o"
Cohesion: 0.12
Nodes (25): Yl(), ka(), ac(), Ad(), An(), Bt(), _f(), jh() (+17 more)

### Community 63 - "a"
Cohesion: 0.08
Nodes (19): Cp(), Ep(), Ew(), hg(), hw(), Ic(), g(), j1() (+11 more)

### Community 64 - "la"
Cohesion: 0.13
Nodes (3): la(), wa(), xa()

### Community 65 - "compilerOptions"
Cohesion: 0.08
Nodes (23): compilerOptions, allowImportingTsExtensions, baseUrl, erasableSyntaxOnly, jsx, lib, module, moduleDetection (+15 more)

### Community 66 - "Io"
Cohesion: 0.10
Nodes (22): di(), dx(), e1(), ex(), gx(), hx(), Io(), g() (+14 more)

### Community 67 - "hr"
Cohesion: 0.16
Nodes (3): Gl(), hr(), Gr

### Community 68 - "er"
Cohesion: 0.15
Nodes (16): hr(), Yx(), er(), B(), E(), It(), k(), m() (+8 more)

### Community 69 - "yb"
Cohesion: 0.18
Nodes (21): cs(), tt(), Me(), Ct(), gb(), Hl(), In(), Jt() (+13 more)

### Community 70 - "fc"
Cohesion: 0.13
Nodes (7): dc(), fc(), hc(), Jo(), Nl, qc(), Xc

### Community 71 - "components.json"
Cohesion: 0.10
Nodes (19): aliases, components, hooks, lib, ui, utils, iconLibrary, registries (+11 more)

### Community 72 - "ot"
Cohesion: 0.13
Nodes (5): ot, Pe(), qu, yu, zu

### Community 73 - "Shared.tsx"
Cohesion: 0.22
Nodes (17): RowMenu(), RowMenuExtra, AlertDialog(), AlertDialogAction(), AlertDialogCancel(), AlertDialogContent(), AlertDialogDescription(), AlertDialogFooter() (+9 more)

### Community 74 - "en"
Cohesion: 0.20
Nodes (19): ha(), $s(), Te(), cs(), ds(), _e(), en(), fr() (+11 more)

### Community 75 - "s"
Cohesion: 0.15
Nodes (12): _0(), cA(), i(), Gk, IA(), u(), lb(), Op() (+4 more)

### Community 76 - ".add"
Cohesion: 0.16
Nodes (3): _c, Il(), xl

### Community 78 - "devDependencies"
Cohesion: 0.11
Nodes (19): devDependencies, convex-test, @edge-runtime/vm, eslint, eslint-config-prettier, @eslint/js, eslint-plugin-react-hooks, eslint-plugin-react-refresh (+11 more)

### Community 79 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, moduleResolution, noEmit (+10 more)

### Community 80 - "tu"
Cohesion: 0.15
Nodes (9): ao(), ec(), ic(), sc, tc(), tu(), wu(), Qi() (+1 more)

### Community 81 - "du"
Cohesion: 0.13
Nodes (14): du(), eo(), eu(), ie(), iu(), no(), nu(), ou() (+6 more)

### Community 83 - "instrumentation.tsx"
Cohesion: 0.22
Nodes (11): @radix-ui/react-collapsible, Collapsible(), CollapsibleContent(), CollapsibleTrigger(), ErrorBoundary, ErrorBoundaryState, ErrorDialog(), GenericError (+3 more)

### Community 84 - "reminders.ts"
Cohesion: 0.15
Nodes (13): deliverPending, DeliveryResult, isReminderDay(), list, markFailed, markSent, PendingGroup, pendingOutbox (+5 more)

### Community 85 - "wedding.ts"
Cohesion: 0.14
Nodes (16): moveWorkspaceData(), addVendorCategory, completeOnboarding, DEFAULT_BUDGET_CATEGORIES, DEFAULT_CHECKLIST, DEFAULT_MOODBOARD_CATEGORIES, DEFAULT_RUNDOWN, DEFAULT_WEDDING_DATE (+8 more)

### Community 86 - "@convex-dev/auth"
Cohesion: 0.15
Nodes (10): axios, @convex-dev/auth, @oslojs/crypto, auth, emailOtp, isAuthenticated, signIn, signOut (+2 more)

### Community 87 - "compilerOptions"
Cohesion: 0.12
Nodes (15): compilerOptions, allowJs, allowSyntheticDefaultImports, forceConsistentCasingInFileNames, isolatedModules, jsx, lib, module (+7 more)

### Community 88 - "bs"
Cohesion: 0.22
Nodes (15): _s(), we, bs(), dr(), fe(), n(), hs(), lr() (+7 more)

### Community 90 - "generate-icons.mjs"
Cohesion: 0.18
Nodes (12): chunk(), clamp01(), crc32(), CRC_TABLE, encodePng(), GOLD, GOLD_LIGHT, GREEN_DARK (+4 more)

### Community 91 - "un"
Cohesion: 0.15
Nodes (13): Dr(), Fd(), GA(), H0(), e(), H2(), k2(), t1() (+5 more)

### Community 92 - "form.tsx"
Cohesion: 0.19
Nodes (13): @radix-ui/react-label, react-hook-form, FormControl(), FormDescription(), FormField(), FormFieldContext, FormFieldContextValue, FormItem() (+5 more)

### Community 93 - "a"
Cohesion: 0.19
Nodes (13): ae(), dl(), ea(), a(), Gi(), je(), ki(), kt() (+5 more)

### Community 94 - ".forEach"
Cohesion: 0.18
Nodes (11): ba(), cc(), ka(), la, ma, on(), pa, pc() (+3 more)

### Community 96 - "vly-toolbar-readonly.tsx"
Cohesion: 0.24
Nodes (11): @zumer/snapdom, ComponentInfo, FiberNode, formatReactComponentHierarchy(), getDomSelector(), getReactComponentHierarchy(), getSelectedElementAnnotation(), getSelectedElementsPrompt() (+3 more)

### Community 97 - "budget.ts"
Cohesion: 0.19
Nodes (12): addExpense, createCategory, deleteCategory, deleteExpense, ManualExpense, overview, renameCategory, requireCategory() (+4 more)

### Community 98 - "xt"
Cohesion: 0.20
Nodes (12): Go(), Gs, Ho(), Jo(), oo(), pu(), qs(), Vt() (+4 more)

### Community 99 - "Qc"
Cohesion: 0.29
Nodes (4): pS(), Qc(), sf(), UC()

### Community 100 - "checklist.ts"
Cohesion: 0.20
Nodes (11): clearDone, create, createMany, list, nextSortOrder(), remove, reorder, setPic (+3 more)

### Community 102 - "Va"
Cohesion: 0.18
Nodes (11): bi(), l(), ct(), Gt(), pa(), qi(), se(), r() (+3 more)

### Community 103 - "chart.tsx"
Cohesion: 0.27
Nodes (10): ChartConfig, ChartContainer(), ChartContext, ChartContextProps, ChartLegendContent(), ChartStyle(), ChartTooltipContent(), getPayloadConfigFromPayload() (+2 more)

### Community 104 - "input-group.tsx"
Cohesion: 0.25
Nodes (9): InputGroup(), InputGroupAddon(), inputGroupAddonVariants, InputGroupButton(), inputGroupButtonVariants, InputGroupInput(), InputGroupText(), InputGroupTextarea() (+1 more)

### Community 105 - "Ae"
Cohesion: 0.24
Nodes (9): ac(), Ae(), bs(), fo(), Ht(), jl(), rc(), ue() (+1 more)

### Community 106 - "workspace.ts"
Cohesion: 0.29
Nodes (8): CODE_ALPHABET, ensureInviteCode(), generateInviteCode(), isSharingWorkspace(), joinByInviteCode, leaveWorkspace, revealInviteCode, status

### Community 107 - "scripts"
Cohesion: 0.22
Nodes (9): scripts, build, dev, format, lint, preview, test, test:watch (+1 more)

### Community 108 - "SoftAurora"
Cohesion: 0.25
Nodes (4): ogl, hexToVec3(), SoftAurora(), SoftAuroraProps

### Community 109 - "oi"
Cohesion: 0.25
Nodes (4): ci(), oi(), wm, zm()

### Community 110 - ".toString"
Cohesion: 0.29
Nodes (6): fi(), iw(), i(), lP(), rC(), tC()

### Community 111 - "es"
Cohesion: 0.25
Nodes (7): es(), ie(), ir(), jn(), ls(), qt(), te()

### Community 112 - "PageMascot.tsx"
Cohesion: 0.29
Nodes (4): CharacterComponent, CREW, DoodleStar(), PageMascot()

### Community 113 - "ne"
Cohesion: 0.29
Nodes (4): bc(), _l(), ne(), ys()

### Community 114 - "Ni"
Cohesion: 0.33
Nodes (6): de(), er(), Ni(), m(), Ti(), tr()

### Community 116 - "tsconfig.json"
Cohesion: 0.33
Nodes (5): compilerOptions, baseUrl, paths, files, references

### Community 117 - "convex.json"
Cohesion: 0.40
Nodes (4): aiFiles, enabled, functions, $schema

## Knowledge Gaps
- **15 isolated node(s):** `date-fns`, `@edge-runtime/vm`, `embla-carousel-react`, `eslint`, `@hookform/resolvers` (+10 more)
  These have ≤1 connection - possible missing edges. (Counts symbols only; 1038 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **14 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `index.ts` to `field.tsx`, `Vendor.tsx`, `chart.tsx`, `input-group.tsx`, `Shared.tsx`, `AppShell-kU9SMMPl.js`, `Pengaturan-BC8mQRkt.js`, `form.tsx`, `AppShell.tsx`?**
  _High betweenness centrality (0.201) - this node is a cross-community bridge._
- **Are the 27 inferred relationships involving `iT()` (e.g. with `C0()` and `E0()`) actually correct?**
  _`iT()` has 27 INFERRED edges - model-reasoned connections that need verification._
- **What connects `date-fns`, `@edge-runtime/vm`, `embla-carousel-react` to the rest of the system?**
  _15 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `charts-pX_xqJYu.js` be split into smaller, more focused modules?**
  _Cohesion score 0.013082107843137255 - nodes in this community are weakly interconnected._
- **Why does `lo` connect `Pengaturan-BC8mQRkt.js` to `charts-pX_xqJYu.js`, `index.ts`, `Checklist-QAXGfnNn.js`, `Budget-D1eAoKNl.js`, `G`, `Ae`, `r`, `en`, `nh`, `At`, `et`, `Home-CV1GHNMj.js`, `tn`, `bs`, `$`, `un`, `radix-ui-BqbpTwho.js`?**
  _High betweenness centrality (0.132) - this node is a cross-community bridge._
- **Are the 13 inferred relationships involving `$` (e.g. with `De()` and `Ee()`) actually correct?**
  _`$` has 13 INFERRED edges - model-reasoned connections that need verification._
- **Should `index.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.023591087811271297 - nodes in this community are weakly interconnected._