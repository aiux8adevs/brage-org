// Scatter simulator: field size, thickness, kV, grid, air gap and virtual grid.
// A deliberately simple model with textbook-sized numbers (Bushong), so the trends are right and every
// number can be followed by hand. It is written out in the "How the model works" box on the page.
//
//   primary through the patient   P = mAs · (kV/70)² · e^(−μ·t),   μ = 0.2 · (70/kV)^0.6 per cm
//   scatter-to-primary ratio      SPR = 0.18 · t · √(field/43) · (1 + (kV − 70)/250) · e^(−gap/10)
//   grid                          primary through Tp, scatter through Ts (table below)
//   Bucky factor                  B = (1 + SPR) / (Tp + Ts · SPR)
//   subject contrast (bone)       C0 = 0.35 · (70/kV)^1.5,   image contrast C = C0 · P / (P + S)
//   contrast-to-noise             CNR ∝ C0 · P / √(P + S)
// With "keep the signal" on, the mAs is chosen so the detector always gets the same number of photons,
// as the exposure would be set in practice; the dose then shows the price.

const GRIDS = { none: [1, 1], 6: [0.75, 0.25], 8: [0.70, 0.17], 12: [0.65, 0.10], 16: [0.60, 0.07] };
const SID = 115, FOCAL = 1.2, TARGET = 1000;
const REFS = { field: 43, thick: 20, kv: 80, grid: "none", gap: 0, virt: "off" };

const T = {
  da: {
    title: "Spredt stråling", sub: "Video 3a, 3b og 3c om tågen over billedet, og en simulator, hvor du selv kan skrue på felt, tykkelse, kV, raster, luftspalte og virtuelt raster.",
    simTitle: "Simulator: Spredt stråling og raster",
    grund: "Grund", deep: "Fordybelse", back: "← Læring",
    parts: ["1 Spredt stråling", "2 Rasteret", "3 Andre veje"],
    partNote: "Se de tre dele i rækkefølge. Hver del er cirka fem til otte minutter.",
    geo: "Opstilling, set fra siden", prof: "Signal på detektoren", image: "Det detektoren så",
    profNote: "Cyan: primære fotoner. Rød: spredte fotoner, der nåede detektoren.",
    imgNote: "Syntetisk fantom: bløddel, knogle og en lille læsion. Støjen er regnet ud fra antallet af fotoner.",
    tasks: "Opgaver", answer: "Vis svar", of: "af", prev: "Forrige opgave", next: "Næste opgave",
    model: "Sådan virker modellen", foot: "© 2026 Oliver Brage. Alle rettigheder forbeholdes.", privacy: "Privatliv",
    ctl: { field: "Felt (indblænding)", thick: "Patientens tykkelse", kv: "Kilovolt", grid: "Raster", gap: "Luftspalte",
           virt: "Virtuelt raster", none: "Intet", on: "Til", off: "Fra", reset: "Nulstil" },
    help: { field: "Bredden af det bestrålede felt.", thick: "Tykkelsen af det væv, strålen skal igennem.",
            kv: "Højere kV: mere går igennem, men mindre forskel mellem knogle og bløddel.",
            grid: "Skaktforholdet. Højere fanger mere spredning, men koster mere mAs.",
            gap: "Afstand mellem patient og detektor.", virt: "Software, der regner tågen ud og trækker den fra." },
    k: { spr: "SPR, spredt / primær", contrast: "Kontrast", cnr: "Kontrast i forhold til støj (CNR)", mas: "mAs",
         dose: "Dosis", bucky: "Bucky-faktor", mag: "Forstørrelse", blur: "Geometrisk uskarphed" },
    f: { spr: v => v < 0.5 ? "lidt spredning" : v < 1 ? "mindre spredt end primær" : "mere spredt end primær",
         contrast: "af kontrasten uden spredning", cnr: "i forhold til ingen raster, felt 43 cm, 20 cm, 80 kV",
         mas: "valgt, så detektoren får lige mange fotoner", dose: "i forhold til samme reference", bucky: "så mange gange op med mAs",
         mag: "billedet er forstørret", blur: "halvskygge ved 1,2 mm fokus", nobucky: "intet raster" },
    dec: ",",
    modelText: `<p>Modellen er enkel med vilje, så du kan regne efter. Tallene er af samme størrelse som i Bushong.</p>
<p>Primær stråling gennem patienten: $P = \\text{mAs} \\cdot (kV/70)^2 \\cdot e^{-\\mu t}$, med $\\mu = 0{,}2 \\cdot (70/kV)^{0{,}6}$ pr. cm.</p>
<p>Spredt i forhold til primær: $\\text{SPR} = 0{,}18 \\cdot t \\cdot \\sqrt{\\text{felt}/43} \\cdot (1 + (kV-70)/250) \\cdot e^{-\\text{luftspalte}/10}$.</p>
<p>Rasteret lader en andel $T_p$ af de primære og $T_s$ af de spredte igennem (6:1: 0,75 og 0,25 · 8:1: 0,70 og 0,17 · 12:1: 0,65 og 0,10 · 16:1: 0,60 og 0,07).
Bucky-faktoren er så $B = (1 + \\text{SPR}) / (T_p + T_s \\cdot \\text{SPR})$.</p>
<p>Knoglens kontrast uden spredning er $C_0 = 0{,}35 \\cdot (70/kV)^{1{,}5}$, og med spredning $C = C_0 \\cdot P/(P+S)$. Støjen er $\\sqrt{P+S}$, så $\\text{CNR} \\propto C_0 P/\\sqrt{P+S}$.</p>
<p>mAs vælges, så detektoren altid får lige mange fotoner, sådan som eksponeringen sættes i praksis. Dosis er mAs gange $(kV/70)^2$, i forhold til referencen.
Det virtuelle raster trækker 85 % af tågens gennemsnit fra, men ikke dens støj.</p>`,
    groups: [
      ["Tågen", [
        ["Hvor meget er spredt?", "Nulstil. Hvad er SPR? Hvad betyder tallet?", "SPR er cirka 3,7. Der rammer næsten fire gange så mange spredte som primære fotoner detektoren. Det er typisk for maven uden raster."],
        ["Tyndere patient", "Sæt tykkelsen fra 20 til 10 cm. Hvad sker der med SPR og kontrasten?", "SPR halveres omtrent, fordi der er halvt så meget væv at sprede i, og kontrasten stiger."],
        ["Hvor er tågen?", "Se på det røde lag i signalkurven. Er det jævnt?", "Nej. Det er en blød bakke, højest midt på. Derfor kan tågen ikke fjernes med en simpel justering af lysheden."],
      ]],
      ["Indblænding", [
        ["Mindre felt", "Gå fra 43 til 15 cm felt. Hvad sker der med SPR, kontrast og dosis?", "SPR falder, kontrasten og CNR stiger. Dosis per cm² er den samme, men et mindre område bestråles. Indblænding er det eneste værktøj, der både giver bedre billede og mindre stråling til patienten."],
      ]],
      ["Kilovolt", [
        ["Højere kV", "Skru kV fra 60 til 110. Hvad sker der med kontrast, mAs og dosis?", "mAs og dosis falder, fordi mere går igennem. Men kontrasten falder også, både fordi knogle og bløddel ligner hinanden mere, og fordi SPR stiger lidt."],
      ]],
      ["Raster", [
        ["Sæt raster på", "Nulstil, og slå 12:1 til. Hvad sker der med kontrast, CNR, mAs og dosis? Hvad er Bucky-faktoren?", "Kontrasten og CNR stiger meget. mAs og dosis stiger med Bucky-faktoren, cirka 4,6 her."],
        ["Lavt eller højt skaktforhold", "Sammenlign 6:1 og 16:1. Hvad får du mere af, og hvad koster det?", "16:1 fjerner mere spredning og giver højere kontrast, men Bucky-faktoren og dosis er højere, og et højt skaktforhold kræver mere præcis opstilling."],
        ["Betaler det sig?", "Sæt tykkelsen til 8 cm og kV til 60. Sammenlign uden raster og med 8:1.", "SPR er lavt. Rasteret giver lidt mere kontrast, men mere end fordobler dosis. Under ca. 10 cm og 60 kV betaler raster sig sjældent."],
      ]],
      ["Luftspalte", [
        ["Luftspalte i stedet", "Fjern rasteret og sæt luftspalten til 15 cm. Sammenlign med 8:1 raster. Hvad er prisen?", "Luftspalten fjerner en del af spredningen uden bly. Prisen er forstørrelse og geometrisk uskarphed, og i praksis øges afstand eller mAs ofte."],
      ]],
      ["Virtuelt raster", [
        ["Regn tågen væk", "Nulstil, og slå virtuelt raster til. Sammenlign kontrast og CNR med 12:1 raster.", "Kontrasten kommer næsten op på rasterets niveau uden ekstra dosis. Men CNR stiger ikke, fordi støjen fra de spredte fotoner bliver."],
        ["Begge dele?", "Slå både 12:1 og virtuelt raster til. Hvad sker der?", "Kontrasten stiger lidt mere, men CNR bestemmes af rasteret. Softwaren kan ikke fjerne støj, der allerede er i billedet."],
      ]],
      ["Det hele samlet", [
        ["Bækken", "Bækken, 22 cm, 80 kV. Find den opstilling, der giver den bedste CNR for den laveste dosis. Begrund dit valg.", "Indblænd først. Brug så et raster på 8:1 til 12:1. Et virtuelt raster alene giver god kontrast med lav dosis, men dårligere CNR. Diskutér, hvornår det er godt nok."],
      ]],
      ["Formler", [
        ["Bucky-faktoren i hånden", "Nulstil, slå 12:1 til. Regn Bucky-faktoren ud med $B = (1 + \\text{SPR})/(T_p + T_s \\cdot \\text{SPR})$, og tjek tallet.", "Med SPR 3,74: $B = 4{,}74 / (0{,}65 + 0{,}374) \\approx 4{,}6$."],
        ["Kontrasten", "Uden raster: brug $C = C_0/(1 + \\text{SPR})$. Passer det med simulatoren?", "Ja. $C/C_0 = 1/(1 + 3{,}74) \\approx 21\\ \\%$."],
      ], "deep"],
    ],
  },
  en: {
    title: "Scatter", sub: "Videos 3a, 3b and 3c on the fog over the image, and a simulator where you can change field size, thickness, kV, grid, air gap and virtual grid.",
    simTitle: "Simulator: Scatter and grids",
    grund: "Basic", deep: "Deeper level", back: "← Learn",
    parts: ["1 Scatter", "2 The grid", "3 Other ways"],
    partNote: "Watch the three parts in order. Each is about five to eight minutes.",
    geo: "Set-up, seen from the side", prof: "Signal on the detector", image: "What the detector saw",
    profNote: "Cyan: primary photons. Red: scattered photons that reached the detector.",
    imgNote: "Synthetic phantom: soft tissue, bone and a small lesion. The noise is computed from the number of photons.",
    tasks: "Tasks", answer: "Show answer", of: "of", prev: "Previous task", next: "Next task",
    model: "How the model works", foot: "© 2026 Oliver Brage. All rights reserved.", privacy: "Privacy",
    ctl: { field: "Field (collimation)", thick: "Patient thickness", kv: "Kilovoltage", grid: "Grid", gap: "Air gap",
           virt: "Virtual grid", none: "None", on: "On", off: "Off", reset: "Reset" },
    help: { field: "The width of the irradiated field.", thick: "The thickness of tissue the beam passes through.",
            kv: "Higher kV: more gets through, but less difference between bone and soft tissue.",
            grid: "The grid ratio. Higher catches more scatter, but costs more mAs.",
            gap: "Distance between patient and detector.", virt: "Software that estimates the fog and subtracts it." },
    k: { spr: "SPR, scatter / primary", contrast: "Contrast", cnr: "Contrast-to-noise (CNR)", mas: "mAs",
         dose: "Dose", bucky: "Bucky factor", mag: "Magnification", blur: "Focal spot blur" },
    f: { spr: v => v < 0.5 ? "little scatter" : v < 1 ? "less scatter than primary" : "more scatter than primary",
         contrast: "of the contrast without scatter", cnr: "relative to no grid, 43 cm field, 20 cm, 80 kV",
         mas: "chosen so the detector gets the same number of photons", dose: "relative to the same reference", bucky: "times more mAs",
         mag: "the image is magnified", blur: "penumbra with a 1.2 mm focal spot", nobucky: "no grid" },
    dec: ".",
    modelText: `<p>The model is simple on purpose, so you can work it out yourself. The numbers are the size of those in Bushong.</p>
<p>Primary through the patient: $P = \\text{mAs} \\cdot (kV/70)^2 \\cdot e^{-\\mu t}$, with $\\mu = 0.2 \\cdot (70/kV)^{0.6}$ per cm.</p>
<p>Scatter relative to primary: $\\text{SPR} = 0.18 \\cdot t \\cdot \\sqrt{\\text{field}/43} \\cdot (1 + (kV-70)/250) \\cdot e^{-\\text{gap}/10}$.</p>
<p>The grid lets a fraction $T_p$ of the primary and $T_s$ of the scatter through (6:1: 0.75 and 0.25 · 8:1: 0.70 and 0.17 · 12:1: 0.65 and 0.10 · 16:1: 0.60 and 0.07).
The Bucky factor is then $B = (1 + \\text{SPR}) / (T_p + T_s \\cdot \\text{SPR})$.</p>
<p>Bone contrast without scatter is $C_0 = 0.35 \\cdot (70/kV)^{1.5}$, and with scatter $C = C_0 \\cdot P/(P+S)$. Noise is $\\sqrt{P+S}$, so $\\text{CNR} \\propto C_0 P/\\sqrt{P+S}$.</p>
<p>The mAs is chosen so the detector always gets the same number of photons, as the exposure is set in practice. Dose is mAs times $(kV/70)^2$, relative to the reference.
The virtual grid subtracts 85 % of the fog's average, but not its noise.</p>`,
    groups: [
      ["The fog", [
        ["How much is scatter?", "Reset. What is the SPR? What does the number mean?", "The SPR is about 3.7. Almost four times as many scattered as primary photons reach the detector. That is typical for the abdomen without a grid."],
        ["Thinner patient", "Change the thickness from 20 to 10 cm. What happens to the SPR and the contrast?", "The SPR roughly halves, because there is half as much tissue to scatter in, and the contrast rises."],
        ["Where is the fog?", "Look at the red layer on the signal curve. Is it even?", "No. It is a soft hill, highest in the middle. That is why the fog cannot be removed by simply adjusting the brightness."],
      ]],
      ["Collimation", [
        ["Smaller field", "Go from a 43 to a 15 cm field. What happens to the SPR, contrast and dose?", "The SPR falls, contrast and CNR rise. The dose per cm² stays the same, but a smaller area is irradiated. Collimation is the only tool that gives both a better image and less radiation to the patient."],
      ]],
      ["Kilovoltage", [
        ["Higher kV", "Turn the kV from 60 to 110. What happens to contrast, mAs and dose?", "mAs and dose fall, because more gets through. But the contrast falls too, both because bone and soft tissue look more alike, and because the SPR rises a little."],
      ]],
      ["Grid", [
        ["Add a grid", "Reset, and switch on 12:1. What happens to contrast, CNR, mAs and dose? What is the Bucky factor?", "Contrast and CNR rise a lot. mAs and dose rise with the Bucky factor, about 4.6 here."],
        ["Low or high grid ratio", "Compare 6:1 and 16:1. What do you get more of, and what does it cost?", "16:1 removes more scatter and gives higher contrast, but the Bucky factor and dose are higher, and a high grid ratio needs a more precise set-up."],
        ["Is it worth it?", "Set the thickness to 8 cm and the kV to 60. Compare no grid and 8:1.", "The SPR is low. The grid gives a little more contrast but more than doubles the dose. Below about 10 cm and 60 kV a grid is rarely worth it."],
      ]],
      ["Air gap", [
        ["An air gap instead", "Remove the grid and set the air gap to 15 cm. Compare with an 8:1 grid. What is the price?", "The air gap removes some of the scatter without lead. The price is magnification and focal spot blur, and in practice the distance or the mAs is often increased."],
      ]],
      ["Virtual grid", [
        ["Calculate the fog away", "Reset, and switch on the virtual grid. Compare contrast and CNR with a 12:1 grid.", "The contrast comes close to the grid's without extra dose. But the CNR does not rise, because the noise from the scattered photons stays."],
        ["Both?", "Switch on both 12:1 and the virtual grid. What happens?", "The contrast rises a little more, but the CNR is set by the grid. Software cannot remove noise that is already in the image."],
      ]],
      ["All together", [
        ["Pelvis", "Pelvis, 22 cm, 80 kV. Find the set-up with the best CNR for the lowest dose. Explain your choice.", "Collimate first. Then use an 8:1 to 12:1 grid. A virtual grid alone gives good contrast at low dose, but a lower CNR. Discuss when that is good enough."],
      ]],
      ["Formulas", [
        ["The Bucky factor by hand", "Reset, switch on 12:1. Work out the Bucky factor with $B = (1 + \\text{SPR})/(T_p + T_s \\cdot \\text{SPR})$, and check it.", "With SPR 3.74: $B = 4.74 / (0.65 + 0.374) \\approx 4.6$."],
        ["The contrast", "Without a grid: use $C = C_0/(1 + \\text{SPR})$. Does it match the simulator?", "Yes. $C/C_0 = 1/(1 + 3.74) \\approx 21\\ \\%$."],
      ], "deep"],
    ],
  },
};

// ---- the model -------------------------------------------------------------------
function model(s) {
  const mu = 0.2 * Math.pow(70 / s.kv, 0.6);
  const perMas = Math.pow(s.kv / 70, 2) * Math.exp(-mu * s.thick) * 400;     // primary photons per mAs, arbitrary unit
  const spr0 = 0.18 * s.thick * Math.sqrt(s.field / 43) * (1 + (s.kv - 70) / 250) * Math.exp(-s.gap / 10);
  const [tp, ts] = GRIDS[s.grid];
  const mas = TARGET / (perMas * (tp + ts * spr0));          // the exposure that gives the detector TARGET photons
  const P = perMas * mas * tp, S = perMas * mas * spr0 * ts;
  const c0 = 0.35 * Math.pow(70 / s.kv, 1.5);
  const sRes = s.virt === "on" ? 0.15 * S : S;               // what is left of the fog's average after the software
  const contrast = c0 * P / (P + sRes);
  const cnr = c0 * P / Math.sqrt(P + S);
  const oid = s.gap + s.thick / 2, mag = SID / (SID - oid), blur = FOCAL * oid / (SID - oid);
  const dose = mas * Math.pow(s.kv / 70, 2);
  const bucky = s.grid === "none" ? null : (1 + spr0) / (tp + ts * spr0);
  return { P, S, spr: S / P, c0, contrast, rel: contrast / c0, cnr, mas, dose, bucky, mag, blur, sRes };
}
const REF = model(REFS);

// ---- state ---------------------------------------------------------------------
const START = { field: 43, thick: 20, kv: 80, grid: "none", gap: 0, virt: "off" };
const S = { lang: "da", level: "grund", part: 0, ...START };
let M = model(S);
const css = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
const fmt = (v, d = 1) => v.toFixed(d).replace(".", T[S.lang].dec);

function fit(cv) {
  const r = cv.getBoundingClientRect(), dpr = window.devicePixelRatio || 1;
  cv.width = Math.max(1, Math.round(r.width * dpr)); cv.height = Math.max(1, Math.round(r.height * dpr));
  const ctx = cv.getContext("2d"); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return [ctx, r.width, r.height];
}
function text(ctx, s, x, y, color, align = "left", size = 12) {
  ctx.fillStyle = color; ctx.font = `${size}px ${css("--body")}`; ctx.textAlign = align; ctx.fillText(s, x, y);
}
// a small seeded random, so the drawn rays stay put while nothing changes
function rng(seed) { let a = seed >>> 0; return () => { a = (a * 1664525 + 1013904223) >>> 0; return a / 4294967296; }; }

// ---- drawing: the set-up from the side -------------------------------------------
function drawGeo() {
  const [ctx, W, H] = fit(document.getElementById("geo"));
  if (W < 10) return;
  const L = T[S.lang], cx = W / 2, top = 18, bottom = H - 18;
  const cm = (bottom - top) / 125;                       // 125 cm of height on screen
  const cmx = (W * 0.84) / 50;                            // across: a 50 cm wide patient fills the box (not to scale with height)
  const fy = top, detY = top + SID * cm, gridY = detY - S.gap * cm - 4;
  const patBot = gridY - 6, patTop = patBot - S.thick * cm;
  const half = y => (S.field / 2) * cmx * (y - fy) / (detY - fy);  // half-width of the beam at height y
  // patient
  ctx.fillStyle = "rgba(90,95,107,.45)"; ctx.fillRect(cx - W * 0.42, patTop, W * 0.84, patBot - patTop);
  text(ctx, L.ctl.thick.toLowerCase(), cx - W * 0.42 + 4, patTop + 14, css("--muted"), "left", 11);
  // beam
  ctx.strokeStyle = "rgba(230,233,240,.35)"; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(cx, fy); ctx.lineTo(cx - half(detY), detY); ctx.moveTo(cx, fy); ctx.lineTo(cx + half(detY), detY); ctx.stroke();
  ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(cx, fy, 3.5, 0, 7); ctx.fill();
  // grid
  if (S.grid !== "none") {
    ctx.fillStyle = "#24304A"; ctx.fillRect(cx - W * 0.42, gridY - 3, W * 0.84, 6);
    ctx.strokeStyle = "#9AA0AE"; ctx.lineWidth = 1;
    for (let x = cx - W * 0.42; x < cx + W * 0.42; x += 5) { ctx.beginPath(); ctx.moveTo(x, gridY - 3); ctx.lineTo(x, gridY + 3); ctx.stroke(); }
    text(ctx, `${L.ctl.grid} ${S.grid}:1`, cx + W * 0.42, gridY - 6, css("--amber"), "right", 11);
  }
  // detector
  const detHalf = 21.5 * cmx;                              // a 43 cm detector
  ctx.fillStyle = "rgba(230,233,240,.3)"; ctx.fillRect(cx - detHalf, detY, detHalf * 2, 5);
  if (S.gap > 0) text(ctx, `${L.ctl.gap} ${S.gap} cm`, cx + detHalf, (patBot + detY) / 2, css("--amber"), "right", 11);
  // primary rays
  ctx.strokeStyle = css("--signal"); ctx.globalAlpha = 0.55;
  for (let k = -4; k <= 4; k++) {
    const x = cx + half(detY) * k / 4.6;
    ctx.beginPath(); ctx.moveTo(cx, fy); ctx.lineTo(x, detY); ctx.stroke();
  }
  // scattered rays: from inside the irradiated tissue, in random directions
  const r = rng(7 + S.field + S.thick * 3), n = Math.min(40, Math.round(6 * M.spr / Math.max(GRIDS[S.grid][1], 0.07) * 0.35 + 4));
  const maxAng = S.grid === "none" ? 9 : Math.atan(1 / +S.grid);
  ctx.strokeStyle = css("--hot"); ctx.globalAlpha = 0.6;
  for (let i = 0; i < n; i++) {
    const y0 = patTop + r() * (patBot - patTop), x0 = cx + (r() * 2 - 1) * half(y0) * 0.95;
    const ang = (r() * 2 - 1) * 1.25;                      // radians from straight down
    if (Math.abs(ang) > 1.2) continue;
    const dy = gridY - y0, x1 = x0 + Math.tan(ang) * dy;
    if (S.grid !== "none" && Math.abs(ang) > maxAng) {      // stopped by the lead
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, gridY); ctx.stroke();
      ctx.fillStyle = css("--hot"); ctx.fillRect(x1 - 1.5, gridY - 1.5, 3, 3);
      continue;
    }
    const x2 = x0 + Math.tan(ang) * (detY - y0);
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x2, detY); ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

// ---- drawing: the signal across the detector ---------------------------------------
function profile(u) {      // u from −1 to 1 across the detector; returns [primary, scatter] per pixel
  const inField = Math.abs(u) <= S.field / 43;
  if (!inField) return [0, 0];
  const bone = Math.abs(u) < 0.22, p = M.P * (bone ? 1 - M.c0 : 1);
  const hill = 1.15 - 0.3 * u * u;                         // a soft hill, highest in the middle, mean about 1
  return [p, M.S * hill];
}
function drawProf() {
  const [ctx, W, H] = fit(document.getElementById("prof"));
  if (W < 10) return;
  const base = H - 14, top = 8, scale = (base - top) / 1300, n = 120;
  for (let i = 0; i < n; i++) {
    const u = -1 + (i + 0.5) / n * 2, [p, s] = profile(u), x = i / n * W, w = W / n + 0.5;
    ctx.fillStyle = css("--signal"); ctx.fillRect(x, base - p * scale, w, p * scale);
    ctx.fillStyle = css("--hot"); ctx.globalAlpha = 0.75; ctx.fillRect(x, base - (p + s) * scale, w, s * scale); ctx.globalAlpha = 1;
  }
  ctx.strokeStyle = css("--line"); ctx.beginPath(); ctx.moveTo(0, base); ctx.lineTo(W, base); ctx.stroke();
}

// ---- drawing: what the detector saw -------------------------------------------------
const N = 120, off = document.createElement("canvas"); off.width = off.height = N;
function drawImg() {
  const [ctx, W, H] = fit(document.getElementById("img"));
  if (W < 10) return;
  const octx = off.getContext("2d"), img = octx.createImageData(N, N), r = rng(99);
  const gauss = () => { let a = 0; for (let k = 0; k < 6; k++) a += r(); return (a - 3) / Math.sqrt(0.5); };
  const k = 0.5;                                            // photons per pixel per unit: sets how grainy the image is
  const field = S.field / 43, vals = new Float32Array(N * N);
  let lo = Infinity, hi = -Infinity;
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const u = (i + 0.5) / N * 2 - 1, v = (j + 0.5) / N * 2 - 1, idx = j * N + i;
    if (Math.abs(u) > field || Math.abs(v) > field) { vals[idx] = NaN; continue; }
    const bone = u * u + v * v < 0.22 * 0.22, lesion = (u - 0.45) ** 2 + (v + 0.4) ** 2 < 0.07 * 0.07;
    let p = M.P * (bone ? 1 - M.c0 : lesion ? 1 - 0.25 * M.c0 : 1);
    const hill = 1.15 - 0.15 * (u * u + v * v);
    const s = M.S * hill, n = (p + s) * k;
    let val = n + Math.sqrt(n) * gauss();                   // quantum noise
    if (S.virt === "on") val -= (M.S - M.sRes) * hill * k;   // the software's estimate of the fog's average
    vals[idx] = val;
    if (!bone) { lo = Math.min(lo, val); hi = Math.max(hi, val); }
  }
  // the system's own rescaling: soft tissue fills the grey scale, so only contrast and noise differ
  const boneVal = (M.P * (1 - M.c0) + (S.virt === "on" ? M.sRes : M.S)) * k, top = Math.max(...[hi]);
  const lo2 = Math.min(lo, boneVal - 3 * Math.sqrt(boneVal));
  for (let idx = 0; idx < N * N; idx++) {
    const v = vals[idx];
    const g = Number.isNaN(v) ? 245 : Math.round(20 + 215 * Math.min(1, Math.max(0, (top - v) / (top - lo2))));
    img.data.set([g, g, g - 2, 255], idx * 4);
  }
  octx.putImageData(img, 0, 0);
  const sz = Math.min(W, H);
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(off, (W - sz) / 2, (H - sz) / 2, sz, sz);
}

// ---- readouts --------------------------------------------------------------------
function readouts() {
  const L = T[S.lang], deep = S.level === "deep";
  const row = (cls, key, value, foot) =>
    `<div class="metric ${cls}"><div class="k">${L.k[key]}</div><div class="v">${value}</div><div class="f">${foot}</div></div>`;
  let h = row(M.spr > 1 ? "err" : "ok", "spr", fmt(M.spr, 2), L.f.spr(M.spr)) +
          row("mag", "contrast", `${Math.round(M.rel * 100)} %`, L.f.contrast) +
          row("ok", "cnr", `×${fmt(M.cnr / REF.cnr, 2)}`, L.f.cnr) +
          row("err", "dose", `×${fmt(M.dose / REF.dose, 2)}`, L.f.dose) +
          row("", "mas", `×${fmt(M.mas / REF.mas, 2)}`, L.f.mas) +
          row("", "bucky", M.bucky ? fmt(M.bucky, 1) : "–", M.bucky ? L.f.bucky : L.f.nobucky);
  if (S.gap > 0 || deep) h += row("", "mag", `×${fmt(M.mag, 2)}`, L.f.mag) + row("err", "blur", `${fmt(M.blur, 2)} mm`, L.f.blur);
  document.getElementById("readout").innerHTML = h;
}

// ---- controls --------------------------------------------------------------------
const SLIDERS = [["field", 10, 43, 1, v => `${v} cm`], ["thick", 5, 35, 1, v => `${v} cm`],
                 ["kv", 50, 120, 5, v => `${v} kV`], ["gap", 0, 20, 1, v => `${v} cm`]];
function buildControls() {
  const L = T[S.lang].ctl, box = document.getElementById("controls");
  const help = k => S.level === "grund" ? `<p class="help">${T[S.lang].help[k]}</p>` : "";
  const seg = (key, opts) => `<div class="ctl"><label><span>${L[key]}</span><span></span></label><div class="seg">` +
    opts.map(([val, lbl]) => `<button data-k="${key}" data-v="${val}" aria-pressed="${String(S[key]) === val}">${lbl}</button>`).join("") +
    `</div>${help(key)}</div>`;
  const slider = ([k, mn, mx, st, f]) =>
    `<div class="ctl"><label for="s-${k}"><span>${L[k]}</span><span id="o-${k}">${f(S[k])}</span></label>` +
    `<input type="range" id="s-${k}" min="${mn}" max="${mx}" step="${st}" value="${S[k]}">${help(k)}</div>`;
  box.innerHTML = slider(SLIDERS[0]) + slider(SLIDERS[1]) + slider(SLIDERS[2]) +
    seg("grid", [["none", L.none], ["6", "6:1"], ["8", "8:1"], ["12", "12:1"], ["16", "16:1"]]) +
    slider(SLIDERS[3]) + seg("virt", [["off", L.off], ["on", L.on]]) +
    `<div class="ctl"><button class="reset" id="reset">${L.reset}</button></div>`;
  box.querySelectorAll("button[data-k]").forEach(b => b.onclick = () => { S[b.dataset.k] = b.dataset.v; buildControls(); update(); });
  SLIDERS.forEach(([k, , , , f]) => {
    const el = document.getElementById(`s-${k}`);
    el.oninput = () => { S[k] = +el.value; document.getElementById(`o-${k}`).textContent = f(S[k]); update(); };
  });
  document.getElementById("reset").onclick = () => { Object.assign(S, START); buildControls(); update(); };
}

// ---- text, tasks, video -----------------------------------------------------------
const PART_FILES = ["spredt", "raster3b", "tage3c"];
const groups = () => T[S.lang].groups.filter(g => g[2] !== "deep" || S.level === "deep");
let task = 0;
function buildCard() {
  const L = T[S.lang], flat = groups().flatMap(([g, items]) => items.map((it, k) => [g, k + 1, items.length, ...it]));
  task = Math.min(task, flat.length - 1);
  const [g, k, n, h, q, a] = flat[task];
  document.getElementById("taskcard").innerHTML =
    `<div class="tc-head"><span>${g} · ${k} ${L.of} ${n}</span>` +
    `<span class="seg"><button id="tc-prev" aria-label="${L.prev}">‹</button><button id="tc-next" aria-label="${L.next}">›</button></span></div>` +
    `<h4>${h}</h4><p class="q">${withMath(q)}</p>` +
    `<details class="answer"><summary>${L.answer}</summary><p class="a">${withMath(a)}</p></details>`;
  const go = d => { task = (task + d + flat.length) % flat.length; buildCard(); };
  document.getElementById("tc-prev").onclick = () => go(-1);
  document.getElementById("tc-next").onclick = () => go(1);
}
function buildVideo() {
  const L = T[S.lang];
  document.getElementById("parts").innerHTML = L.parts.map((p, i) => `<button data-p="${i}" aria-pressed="${S.part === i}">${p}</button>`).join("");
  document.querySelectorAll("#parts button").forEach(b => b.onclick = () => { S.part = +b.dataset.p; buildVideo(); });
  document.getElementById("t-partnote").textContent = L.partNote;
  const vid = document.getElementById("vid"), file = `video/${PART_FILES[S.part]}_${S.lang}_${S.level === "deep" ? "fordybelse" : "grund"}.mp4`;
  if (vid.getAttribute("src") !== file) { vid.poster = `video/poster_${PART_FILES[S.part]}_${S.lang}.jpg`; vid.src = file; }
}
function buildText() {
  const L = T[S.lang], set = (id, s) => { document.getElementById(id).textContent = s; };
  document.documentElement.lang = S.lang;
  document.title = L.title + " | Oliver Brage";
  for (const k of ["title", "sub", "geo", "prof", "image", "tasks", "model", "foot", "privacy"]) set("t-" + k, L[k]);
  set("t-back", L.back); set("t-simtitle", L.simTitle); set("t-profnote", L.profNote); set("t-imgnote", L.imgNote);
  document.getElementById("t-back").href = "../../?lang=" + S.lang;
  set("lvl-grund", L.grund); set("lvl-deep", L.deep);
  document.getElementById("model-text").innerHTML = withMath(L.modelText);
  document.getElementById("task-list").innerHTML = groups().map(([g, items]) =>
    `<h4 class="tgroup">${g}</h4>` + items.map(([h, q, a]) =>
      `<details><summary>${h}</summary><p class="q">${withMath(q)}</p><details class="answer">` +
      `<summary>${L.answer}</summary><p class="a">${withMath(a)}</p></details></details>`).join("")).join("");
  buildCard(); buildVideo();
}
function setPressed() {
  for (const [id, on] of [["lang-da", S.lang === "da"], ["lang-en", S.lang === "en"],
                          ["lvl-grund", S.level === "grund"], ["lvl-deep", S.level === "deep"]])
    document.getElementById(id).setAttribute("aria-pressed", on);
}
function render() { drawGeo(); drawProf(); drawImg(); readouts(); }
function update() { M = model(S); render(); }
function all() { setPressed(); buildText(); buildControls(); update(); }
function save() {
  const q = new URLSearchParams(location.search);
  q.set("lang", S.lang); S.level === "deep" ? q.set("level", "deep") : q.delete("level");
  history.replaceState(null, "", "?" + q + location.hash);
}
document.getElementById("lang-da").onclick = () => { S.lang = "da"; save(); all(); };
document.getElementById("lang-en").onclick = () => { S.lang = "en"; save(); all(); };
document.getElementById("lvl-grund").onclick = () => { S.level = "grund"; save(); all(); };
document.getElementById("lvl-deep").onclick = () => { S.level = "deep"; save(); all(); };
{
  const q = new URLSearchParams(location.search), l = q.get("lang");
  S.lang = l === "da" || l === "en" ? l : (navigator.language || "").toLowerCase().startsWith("da") ? "da" : "en";
  if (q.get("level") === "deep") S.level = "deep";
}
window.addEventListener("resize", render);
if (document.fonts && document.fonts.ready) document.fonts.ready.then(render);
all();
