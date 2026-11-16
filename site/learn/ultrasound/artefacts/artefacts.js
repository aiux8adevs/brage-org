// Artefact simulator (ultrasound U5): the page. The scenes and the artefact physics live in model.js (AR).
// Like the knobology simulator, the image is made in two steps:
//   1. scan(): on the grid of beams (one column per beam, one row per depth step) the tissue's echo level times fixed
//      random scatterers, plus the coherent mirror-like reflectors, get side lobes, the beam's blur and the pulse's
//      blur; then attenuation down and back, reverberation copies and electronic noise. Redone when something moves.
//   2. drawImg(): scan lines are picked from the grid, gain is added, and the lines are drawn as a fan (convex probe)
//      or side by side (linear probe).

const MAXN = Math.max(...Object.values(AR.SCENES).map(P => P.nr * P.nc));
const GB0 = AR.GB;
const START = {
  scene: "abdomen", harm: false, gain: 0, truth: false, names: false,
  abdomen: { move: "cyst", cyst: true, cystX: -2.6, cystY: 8.8, cystR: 0.6, stone: true,
             stoneX: +(GB0.x + 0.5 * GB0.c - 0.8 * GB0.s).toFixed(2), stoneY: +(GB0.y + 0.5 * GB0.s + 0.8 * GB0.c).toFixed(2),
             gas: true, gasX: 5.2, gasY: 4.4, fatty: false },
  surface: { move: "needle", cyst: true, cystX: 0.9, cystY: 1.7, cystR: 0.25, needle: true, needleA: 20, needleX: -0.9, needleY: 1.2, tendonA: 0 },
};
const clone = o => JSON.parse(JSON.stringify(o));
const S = { lang: "da", level: "grund", ...clone(START) };
const cur = () => ({ scene: S.scene, harm: S.harm, gain: S.gain, ...S[S.scene] });

const T = {
  da: {
    title: "Artefakter i klinikken", sub: "Simulator: ting i billedet, der ikke er der, og ting, der er der, men ikke ses. Flyt sten, gas, cyste og kanyle, og se hvorfor artefakterne opstår.",
    simTitle: "Simulator: Artefakter i klinikken", grund: "Grund", deep: "Fordybelse", back: "← Ultralyd",
    image: "Billedet", aline: "En linje gennem billedet",
    alineNote: "Ekkoet langs den stiplede linje i billedet, fra huden (venstre) og ned. Linjen går gennem det, du flytter. Det lyse bånd er de ekkoer, der vises som grå toner. Ved genlyd står toppene med lige store afstande.",
    imgNote: "Simuleret billede, ikke et rigtigt skannerbillede. Klik i billedet for at flytte det valgte. Vis det ægte tegner, hvad der faktisk er der (orange streg).",
    tasks: "Opgaver", answer: "Vis svar", of: "af", prev: "Forrige opgave", next: "Næste opgave",
    model: "Sådan virker modellen", foot: "© 2026 Oliver Brage. Alle rettigheder forbeholdes.", privacy: "Privatliv",
    seen: "Det kan du se:", pin: "Gem tallene", unpin: "Fjern de gemte", saved: "gemt",
    scene: { abdomen: "Abdomen", surface: "Overflade" }, sceneShort: { abdomen: "Abdomen · konveks", surface: "Overflade · lineær" },
    grp: { scene: "Scene", image: "Billedet", things: "Ting i billedet", move: "Klik i billedet flytter" },
    ctl: { scene: "Scene", gain: "Gain", harm: "Harmonisk billede", truth: "Vis det ægte", names: "Vis navne", on: "Til", off: "Fra",
           cyst: "Cyste", cystR: "Cystens radius", stone: "Sten i galdeblæren", gas: "Tarmgas", fatty: "Fedtlever",
           needle: "Kanyle", needleA: "Kanylens vinkel", needleY: "Spidsens dybde", tendonA: "Senens vinkel", move: "Flyt", reset: "Nulstil alt",
           mv: { cyst: "Cyste", stone: "Sten", gas: "Tarmgas", needle: "Kanylespids" } },
    help: { scene: "Abdomen: konveks probe, 3,5 MHz. Overflade: lineær probe, 10 MHz.",
            gain: "Forstærker alle ekkoer, også støjen.",
            harm: "Skanneren lytter efter den dobbelte frekvens: færre sidelapper og mindre genlyd.",
            truth: "Tegner med orange, hvad der faktisk er i vævet.", names: "Skriver navnene på det, du ser.",
            cystR: "En lille cyste fylder ikke hele snittets tykkelse.", fatty: "Leveren bliver lysere og dæmper mere.",
            needleA: "Vinklen mellem kanylen og huden. Spidsen bliver, hvor den er.", needleY: "Hvor dybt spidsen er.",
            tendonA: "Hvor skævt strålen rammer senens fibre.", move: "Vælg, hvad et klik i billedet flytter." },
    k: { slice: "Snittykkelse ved cysten", cystLvl: "Cystens ekko", rev: "Genlyd", hr: "Lever mod nyrebark", side: "Sidelapper", pen: "Indtrængning",
         tendon: "Senens ekko", needle: "Kanylens skaft", angle: "Kanylens vinkel", comet: "Comet tail" },
    f: { slice: r => `cysten er ${r} mm bred`, cystLvl: v => v < -40 ? "i forhold til lever: sort" : "i forhold til lever: grå",
         rev: d => `kopier ved ${d[0]} og ${d[1]} cm`, revOff: "ingen tarmgas", hr: v => v > 8 ? "meget lysere: fedtlever" : "lidt lysere: normalt",
         side: h => h ? "harmonisk: svage" : "i forhold til hovedstrålen", pen: "i lever",
         tendon: "i forhold til vinkelret", needle: v => v > 12 ? "over musklen: ses" : "over musklen: forsvinder", angle: "mellem kanyle og hud",
         comet: "mellem stregerne = kanylens hulrum" },
    see: {
      stone: "Stenen kaster en ren, sort skygge: lyden kastes tilbage eller dæmpes i stenen.",
      gas: "Bag tarmgassen er skyggen grå og stribet: genlyd med kopier ved {a} og {b} cm.",
      enh: "Bag galdeblæren er leveren lysere: galde dæmper næsten ingen lyd (forstærkning).",
      edge: "Fra galdeblærens ender går tynde mørke striber nedad: kantskygger.",
      mirror: "Bag diafragma ses leveren igen, selv om der er lunge: spejlbillede.",
      side: "Galdeblærens ende nær gassen er ikke helt sort: sidelapper fanger ekkoet fra gassen.",
      harm: "Harmonisk billede: færre sidelapper og svagere genlyd.",
      slice: "Cysten er {c} mm, men snittet er {e} mm tykt: vævet ved siden af gør cysten grå (snittykkelse).",
      fatty: "Fedtlever: leveren er meget lysere end nyrebarken, og dybden er mørkere, fordi lyden dæmpes mere.",
      tendon: "Senen er vippet {a}°: ekkoet går forbi proben, og senen ser mørk ud (anisotropi). Det kan ligne en skade.",
      steep: "Kanylen står stejlt ({a}°): skaftet kaster lyden væk fra proben, så næsten kun spidsen ses.",
      flat: "Kanylen ses tydeligt, og under den står tætte streger: comet tail fra lyd, der går frem og tilbage inde i kanylen.",
      bone: "Under knoglen er der skygge: knogle kaster lyden tilbage og dæmper resten.",
      base: "Flyt noget i billedet, og se hvad der sker bagved.",
    },
    graph: { depth: "dybde (cm)", grey: "vises som grå toner", white: "hvidt", black: "sort", echo: "ekko", copy: "×" },
    dec: ",",
    modelText: `<p><b>Det hele er simuleret.</b> Billederne er regnet ud fra en enkel model af væv og lyd. Der er ikke brugt rigtige ultralydsbilleder. Grundmodellen er den samme som i simulatoren Knapper og orientering: hvert væv har et ekkoniveau i dB i forhold til lever, ekkoerne får korn (speckle) af strålens og pulsens bredde, lyden dæmpes med $2 \\cdot \\alpha \\cdot f \\cdot d$ dB, og skanneren lægger selv $0,8 \\cdot f \\cdot d$ dB til (højst 40). Abdomen: konveks probe, 3,5 MHz, 16 cm. Overflade: lineær probe, 10 MHz, 4 cm.</p>
<p><b>Skygge og forstærkning.</b> De kommer af dæmpningen alene. Galde og cystevæske dæmper 0,002 dB/cm/MHz, lever 0,5, fedtlever 0,9, sten 30, knogle 20 og gas 100. Stenens og gassens forside kaster det meste af lyden tilbage og ses som en lys bue.</p>
<p><b>Genlyd.</b> Et stærkt ekko fra dybden $d_0$ kastes tilbage fra proben og går en tur til. Skanneren tegner det i dybden $2d_0$, så $3d_0$ og så videre. Hver ekstra tur koster dæmpningen i vævet og 10 dB ved proben og reflektoren (20 dB med harmonisk billede). Inde i en kanyle går lyden frem og tilbage mellem væggene: ekkoerne kommer for hver 0,8 mm (kanylens indre diameter) og bliver 4 dB svagere hver gang. Det er comet tail.</p>
<p><b>Spejlbillede.</b> Hvor strålen rammer diafragma med lunge bag, kastes den tilbage ind i leveren som fra et spejl. Ekkoerne derfra tegnes på den lige linje bag diafragma, 4 dB svagere. Derfor ses leveren igen, hvor lungen er.</p>
<p><b>Kantskygge.</b> Hvor strålen rammer væggen af en rund væskefyldt struktur skævt (mindre end cirka 17° fra at strejfe den), bøjes og spredes lyden væk. Det er her regnet som ekstra dæmpning (3 dB/cm/MHz) i de dele af væggen.</p>
<p><b>Sidelapper.</b> Proben sender også svage stråler ud til siden: 0,2 radianer (cirka 11°) til hver side, 28 dB svagere end hovedstrålen. De er kun med i Abdomen; i Overflade er de udeladt, så kanylen står klart. Ekkoer fra dem tegnes, som om de kom fra hovedstrålen. Med harmonisk billede er de 45 dB svagere, strålen er 30 % smallere, og genlyden 10 dB svagere pr. tur. Prisen er lidt mindre indtrængning (støjen 6 dB højere).</p>
<p><b>Snittykkelse.</b> Strålen er også bred på tværs af billedet, i elevationsretningen: $$e(d) = e_0 \\sqrt{1 + \\left(\\frac{d - d_e}{z_e}\\right)^2}$$ med $e_0$ = 4 mm, $d_e$ = 7 cm og $z_e$ = 3 cm for den konvekse probe og 1 mm, 1,5 cm og 0,7 cm for den lineære. En kugleformet cyste med radius $r$ fylder andelen $f = \\min(1, 2r/e)$ af snittet i midten. Ekkoet bliver blandingen $(1-f) \\cdot$ vævet ved siden af $+ f \\cdot$ væsken.</p>
<p><b>Anisotropi og kanyle.</b> Senens fibre og kanylens skaft kaster lyden tilbage som spejle. Senens ekko er $8 + 20 \\log_{10}\\left(e^{-(\\theta/6°)^2}\\right)$ dB, højst 24 dB svagere, hvor $\\theta$ er vinklen. Kanylens skaft er $30 + 20 \\log_{10}\\left(e^{-(\\beta/14°)^2}\\right)$ dB, højst 40 dB svagere, så et stejlt skaft ikke er lysere end musklen. Spidsen er ru og giver altid mindst +15 dB.</p>
<p><b>Det er ikke med.</b> Brydning, der flytter ting sidelæns (fx dobbeltbilleder bag rectusmusklen), hastighedsfejl, ringdown fra små gasbobler, bevægelse og Doppler-artefakter. Hastighedsfejl er med i U1 Lyd og ekko. Tallene er typiske lærebogsværdier, ikke tal fra en bestemt skanner.</p>
<p>Kilder: Gibbs, Cole og Sassano, Ultrasound Physics and Technology (2009), kapitlet om artefakter. Hoskins, Martin og Thrush, Diagnostic Ultrasound: Physics and Equipment, 3. udg. (2019). Kremkau, Sonography Principles and Instruments. Feldman, Katyal og Blackwood, US Artifacts, RadioGraphics 2009;29:1179–1189.</p>`,
    groups: [
      ["Skygge og forstærkning", [
        ["Stenen", "Abdomen, tryk Nulstil alt. Se på stenen i galdeblæren. Hvad ses bag den, og hvorfor?", "En sort skygge helt ned. Stenens forside kaster det meste af lyden tilbage (den lyse bue), og resten dæmpes næsten helt inde i stenen. Bag den kommer der kun støj. Skyggen viser, at det er en sten og ikke en polyp."],
        ["Bag galdeblæren", "Se på leveren lige bag galdeblæren. Er den lysere eller mørkere end leveren ved siden af? Hvorfor?", "Lysere. Galde dæmper næsten ingen lyd, så ekkoerne bag galdeblæren er stærkere end ved siden af, hvor lyden har gået gennem lever. Det hedder forstærkning (enhancement), og det viser, at det er væske."],
        ["Ren eller snavset", "Sammenlign skyggen bag stenen med skyggen bag tarmgassen. Hvad er forskellen?", "Bag stenen er skyggen ren og sort. Bag gassen er den grå og stribet (snavset), fordi gassen kaster næsten al lyden tilbage, og ekkoet går frem og tilbage mellem gassen og proben: genlyd."],
      ]],
      ["Genlyd og comet tail", [
        ["Kopierne", "Vælg Flyt: Tarmgas, og se grafen En linje gennem billedet. Hvor ligger de lyse toppe bag gassen?", "Ved 2 og 3 gange gassens dybde. Gassens forside ligger cirka 5 cm nede, så kopierne kommer ved cirka 10 og 15 cm. Lyden har bare gået frem og tilbage flere gange. Der er intet væv dér."],
        ["Flyt gassen dybere", "Klik længere nede i billedet, så gassen flytter. Hvad sker der med afstanden mellem kopierne?", "Den vokser. Afstanden er altid lig gassens dybde, og det er sådan, du kender genlyd: lige store afstande, der bliver svagere."],
        ["Comet tail", "Skift til Overflade. Se under kanylen. Hvad er de tætte lyse streger?", "Lyden går frem og tilbage inde i kanylen, mellem dens vægge. Hver tur giver et ekko 0,8 mm længere nede, så der bliver en hale af tætte streger, der bliver svagere. Halen kan hjælpe dig med at finde kanylen."],
      ]],
      ["Spejlbillede", [
        ["Lever bag diafragma", "Abdomen, slå Vis navne til. Hvad ses bag diafragma, hvor der skulle være lunge?", "Leveren igen. Diafragma med luften i lungen bag kaster lyden tilbage som et spejl. Lyden går ind i leveren og samme vej tilbage, men skanneren tror, den gik lige ud, og tegner ekkoerne bag diafragma. Slå Vis det ægte til: der er kun lunge."],
        ["Et nyttigt spejl", "Hvorfor er spejlbilledet en god ting at se i klinikken?", "Spejlbilledet kræver luft i lungen lige bag diafragma. Er der væske i lungehulen (pleuravæske), forsvinder spejlbilledet, og man ser i stedet en sort væskebræmme. Et manglende spejlbillede er et tegn, man leder efter."],
      ]],
      ["Kantskygge", [
        ["Striberne", "Slå sten og tarmgas fra. Se under galdeblærens to ender. Hvad er de tynde mørke striber?", "Kantskygger. Hvor strålen rammer den runde væg skævt, bøjes og spredes lyden væk, så der kommer mindre lyd tilbage bagfra. Striberne starter ved kanten og går lige ned."],
        ["Ikke en sten", "Hvordan kan du se forskel på en kantskygge og skyggen fra en sten?", "Stenens skygge starter bag en lys struktur midt i galdeblæren og er lige så bred som stenen. Kantskyggen starter ved kanten af en rund væskefyldt struktur, er smal, og der er ingen lys struktur foran den."],
      ]],
      ["Sidelapper og harmonisk billede", [
        ["Slør i galdeblæren", "Tryk Nulstil alt. Se på galdeblærens højre ende tæt på tarmgassen. Hvorfor er den ikke helt sort?", "Sidelapper. Proben sender også svage stråler ud til siden, her 28 dB svagere. Når en af dem rammer den stærke gas, kommer der et ekko, som tegnes, som om det kom inde fra galdeblæren. Det kan ligne slam (sludge)."],
        ["Harmonisk billede", "Slå Harmonisk billede til. Hvad sker der med sløret, genlyden og billedet i det hele taget?", "Sidelapperne falder til 45 dB under hovedstrålen, så galdeblæren bliver renere sort, og genlyden bag gassen bliver svagere. Strålen er smallere, så kornet er finere. Prisen er lidt mindre indtrængning: 18 i stedet for 20 cm."],
      ]],
      ["Snittykkelse", [
        ["Lille cyste", "Tryk Nulstil alt, og gør cysten lille: radius 1,5 mm. Hvorfor er den ikke sort mere?", "Strålen er ikke tynd på tværs af billedet: ved cysten er snittet 4,8 mm tykt. En cyste på 3 mm fylder kun en del af snittet, og leveren ved siden af kommer med i ekkoet. Den bliver grå (4 dB under leveren) og kan forveksles med en fast knude."],
        ["Flyt den op", "Behold den lille cyste. Vælg Flyt: Cyste, og klik først ved cirka 7 cm og så ved cirka 3 cm. Hvor er den mørkest?", "Ved 7 cm, hvor snittet er tyndest (4 mm): cystens ekko er 6 dB under leveren. Ved 3 cm er snittet over 6 mm tykt, og cysten er kun 3 dB mørkere end leveren. Snittykkelsen har sit eget fokus i probens linse, som du ikke kan flytte."],
        ["Stor cyste", "Gør cysten stor igen. Hvorfor er kanterne skarpe nu, mens den lille cyste var udvisket?", "En stor cyste fylder hele snittets tykkelse næsten helt ud til kanten. Kun yderst bliver den tyndere end snittet. Jo mindre cysten er, jo større en del af den er kant."],
      ]],
      ["Fedtlever", [
        ["Lever mod nyre", "Abdomen. Sammenlign leveren med nyrebarken nederst til højre. Slå så Fedtlever til. Hvad sker der?", "Normalt er leveren lidt lysere end nyrebarken (4 dB her). Med fedtlever er den meget lysere (12 dB). Det er et af tegnene på fedtlever."],
        ["Mørk dybde", "Med fedtlever: se på den dybe del af leveren og på diafragma. Hvorfor er de mørkere?", "Fedtleveren dæmper mere: 0,9 i stedet for 0,5 dB/cm/MHz. Der kommer mindre lyd ned i dybden, så diafragma og de dybe kar bliver utydelige. Mere gain løfter også støjen."],
      ]],
      ["Anisotropi", [
        ["Vip senen", "Skift til Overflade. Sæt senens vinkel til 5° og så til 10°. Hvad sker der?", "Ved 5° er senens ekko 6 dB svagere, ved 10° 24 dB, og senen bliver mørk. Fibrene kaster lyden tilbage som et spejl, så strålen skal ramme dem vinkelret. En mørk sene kan ligne en skade: vip proben, før du konkluderer."],
      ]],
      ["Kanylen", [
        ["Flad eller stejl", "Overflade. Prøv kanylens vinkel 10°, 20° og 30°. Hvornår ses skaftet?", "Ved 10° er skaftet meget lyst (36 dB over musklen), ved 20° stadig tydeligt (22 dB), og ved 30° kan det næsten ikke skelnes fra musklen. Kun spidsen ses. Skaftet er et spejl: jo stejlere, jo mere lyd går forbi proben."],
        ["Find spidsen", "Kanylen står stejlt. Hvordan kan du stadig følge den?", "Spidsen er ru og kaster lyd tilbage i alle retninger, så den ses. Gør vinklen fladere, hvis det kan lade sig gøre (stik længere fra proben), eller brug en kanyle med ru overflade eller strålestyring på skanneren. Før aldrig kanylen frem uden at se spidsen."],
      ]],
      ["Ekstra", [
        ["Hvorfor svagere?", "Hvorfor er hver kopi i genlyden svagere end den forrige?", "Hver ekstra tur går gennem vævet igen og mister dæmpningen dér, og ved proben og gassen tabes 10 dB pr. tur (20 dB med harmonisk billede). Derfor ses som regel kun et par kopier."],
        ["Spejlbilledets afstand", "Hvorfor ligger spejlbilledet af leveren lige så langt bag diafragma, som leveren ligger foran?", "Lyden går fra diafragma ind i leveren og tilbage igen. Tiden for den ekstra vej lægges til, som om lyden fortsatte lige ud bag diafragma. En ting 3 cm foran diafragma (målt langs den spejlede stråle) tegnes 3 cm bag den."],
      ], "deep"],
    ],
  },
  en: {
    title: "Artefacts in the clinic", sub: "Simulator: things in the image that are not there, and things that are there but cannot be seen. Move stone, gas, cyst and needle, and see why the artefacts arise.",
    simTitle: "Simulator: Artefacts in the clinic", grund: "Basic", deep: "Deeper level", back: "← Ultrasound",
    image: "The image", aline: "A line through the image",
    alineNote: "The echo along the dashed line in the image, from the skin (left) downwards. The line passes through what you move. The light band is the echoes shown as shades of grey. With reverberation the peaks are equally spaced.",
    imgNote: "A simulated image, not a real scanner image. Click in the image to move the chosen object. Show what is real draws what is actually there (orange line).",
    tasks: "Tasks", answer: "Show answer", of: "of", prev: "Previous task", next: "Next task",
    model: "How the model works", foot: "© 2026 Oliver Brage. All rights reserved.", privacy: "Privacy",
    seen: "What you can see:", pin: "Save the numbers", unpin: "Remove saved", saved: "saved",
    scene: { abdomen: "Abdomen", surface: "Surface" }, sceneShort: { abdomen: "Abdomen · convex", surface: "Surface · linear" },
    grp: { scene: "Scene", image: "The image", things: "Things in the image", move: "A click in the image moves" },
    ctl: { scene: "Scene", gain: "Gain", harm: "Harmonic imaging", truth: "Show what is real", names: "Show names", on: "On", off: "Off",
           cyst: "Cyst", cystR: "Cyst radius", stone: "Stone in the gallbladder", gas: "Bowel gas", fatty: "Fatty liver",
           needle: "Needle", needleA: "Needle angle", needleY: "Tip depth", tendonA: "Tendon angle", move: "Move", reset: "Reset all",
           mv: { cyst: "Cyst", stone: "Stone", gas: "Bowel gas", needle: "Needle tip" } },
    help: { scene: "Abdomen: convex probe, 3.5 MHz. Surface: linear probe, 10 MHz.",
            gain: "Amplifies all echoes, the noise too.",
            harm: "The scanner listens for twice the frequency: fewer side lobes and less reverberation.",
            truth: "Draws in orange what is actually in the tissue.", names: "Writes the names of what you see.",
            cystR: "A small cyst does not fill the whole thickness of the slice.", fatty: "The liver gets brighter and attenuates more.",
            needleA: "The angle between needle and skin. The tip stays where it is.", needleY: "How deep the tip is.",
            tendonA: "How obliquely the beam meets the tendon's fibres.", move: "Choose what a click in the image moves." },
    k: { slice: "Slice thickness at the cyst", cystLvl: "Cyst echo", rev: "Reverberation", hr: "Liver against renal cortex", side: "Side lobes", pen: "Penetration",
         tendon: "Tendon echo", needle: "Needle shaft", angle: "Needle angle", comet: "Comet tail" },
    f: { slice: r => `the cyst is ${r} mm across`, cystLvl: v => v < -40 ? "relative to liver: black" : "relative to liver: grey",
         rev: d => `copies at ${d[0]} and ${d[1]} cm`, revOff: "no bowel gas", hr: v => v > 8 ? "much brighter: fatty liver" : "a little brighter: normal",
         side: h => h ? "harmonic: weak" : "relative to the main beam", pen: "in liver",
         tendon: "relative to perpendicular", needle: v => v > 12 ? "above the muscle: visible" : "above the muscle: disappears", angle: "between needle and skin",
         comet: "between the lines = the needle's bore" },
    see: {
      stone: "The stone casts a clean black shadow: the sound is sent back or absorbed in the stone.",
      gas: "Behind the bowel gas the shadow is grey and streaked: reverberation with copies at {a} and {b} cm.",
      enh: "Behind the gallbladder the liver is brighter: bile hardly attenuates sound (enhancement).",
      edge: "From the ends of the gallbladder thin dark streaks run down: edge shadows.",
      mirror: "Behind the diaphragm the liver appears again although there is lung: a mirror image.",
      side: "The end of the gallbladder near the gas is not quite black: side lobes pick up the echo from the gas.",
      harm: "Harmonic imaging: fewer side lobes and weaker reverberation.",
      slice: "The cyst is {c} mm, but the slice is {e} mm thick: tissue beside it turns the cyst grey (slice thickness).",
      fatty: "Fatty liver: the liver is much brighter than the renal cortex, and the depth is darker because the sound is attenuated more.",
      tendon: "The tendon is tilted {a}°: the echo misses the probe, and the tendon looks dark (anisotropy). It can look like an injury.",
      steep: "The needle is steep ({a}°): the shaft sends the sound away from the probe, so almost only the tip is seen.",
      flat: "The needle is clearly seen, with close lines under it: a comet tail from sound bouncing inside the needle.",
      bone: "Below the bone there is a shadow: bone sends the sound back and absorbs the rest.",
      base: "Move something in the image and see what happens behind it.",
    },
    graph: { depth: "depth (cm)", grey: "shown as grey", white: "white", black: "black", echo: "echo", copy: "×" },
    dec: ".",
    modelText: `<p><b>Everything is simulated.</b> The images are computed from a simple model of tissue and sound. No real ultrasound images are used. The basic model is the same as in the simulator Knobs and orientation: each tissue has an echo level in dB relative to liver, the echoes get a grain (speckle) from the width of the beam and the pulse, the sound is attenuated by $2 \\cdot \\alpha \\cdot f \\cdot d$ dB, and the scanner itself adds $0.8 \\cdot f \\cdot d$ dB (at most 40). Abdomen: convex probe, 3.5 MHz, 16 cm. Surface: linear probe, 10 MHz, 4 cm.</p>
<p><b>Shadow and enhancement.</b> These come from attenuation alone. Bile and cyst fluid attenuate 0.002 dB/cm/MHz, liver 0.5, fatty liver 0.9, stone 30, bone 20 and gas 100. The front of the stone and the gas sends most of the sound back and shows as a bright arc.</p>
<p><b>Reverberation.</b> A strong echo from depth $d_0$ is sent back from the probe and makes another trip. The scanner draws it at depth $2d_0$, then $3d_0$ and so on. Each extra trip costs the attenuation in the tissue and 10 dB at the probe and the reflector (20 dB with harmonic imaging). Inside a needle the sound bounces between the walls: echoes come every 0.8 mm (the needle's inner diameter) and get 4 dB weaker each time. That is the comet tail.</p>
<p><b>Mirror image.</b> Where the beam meets the diaphragm with lung behind it, it is reflected back into the liver as from a mirror. Echoes from there are drawn on the straight line behind the diaphragm, 4 dB weaker. That is why the liver appears again where the lung is.</p>
<p><b>Edge shadow.</b> Where the beam meets the wall of a round fluid structure obliquely (less than about 17° from grazing it), the sound is bent and spread away. Here it is modelled as extra attenuation (3 dB/cm/MHz) in those parts of the wall.</p>
<p><b>Side lobes.</b> The probe also sends weak beams to the side: 0.2 radians (about 11°) to each side, 28 dB weaker than the main beam. They are only included in Abdomen; in Surface they are left out so the needle stays clear. Echoes from them are drawn as if they came from the main beam. With harmonic imaging they are 45 dB weaker, the beam is 30 % narrower, and reverberation is 10 dB weaker per trip. The price is a little less penetration (the noise 6 dB higher).</p>
<p><b>Slice thickness.</b> The beam is also wide across the image, in the elevation direction: $$e(d) = e_0 \\sqrt{1 + \\left(\\frac{d - d_e}{z_e}\\right)^2}$$ with $e_0$ = 4 mm, $d_e$ = 7 cm and $z_e$ = 3 cm for the convex probe, and 1 mm, 1.5 cm and 0.7 cm for the linear one. A spherical cyst with radius $r$ fills the fraction $f = \\min(1, 2r/e)$ of the slice at its centre. The echo becomes the mix $(1-f) \\cdot$ the tissue beside it $+ f \\cdot$ the fluid.</p>
<p><b>Anisotropy and needle.</b> The tendon's fibres and the needle's shaft send sound back like mirrors. The tendon's echo is $8 + 20 \\log_{10}\\left(e^{-(\\theta/6°)^2}\\right)$ dB, at most 24 dB weaker, where $\\theta$ is the angle. The needle shaft is $30 + 20 \\log_{10}\\left(e^{-(\\beta/14°)^2}\\right)$ dB, at most 40 dB weaker, so a steep shaft is no brighter than the muscle. The tip is rough and always gives at least +15 dB.</p>
<p><b>Not included.</b> Refraction that shifts things sideways (double images behind the rectus muscle, for example), speed errors, ring-down from small gas bubbles, motion and Doppler artefacts. Speed error is in U1 Sound and echo. The numbers are typical textbook values, not those of a particular scanner.</p>
<p>Sources: Gibbs, Cole and Sassano, Ultrasound Physics and Technology (2009), the chapter on artefacts. Hoskins, Martin and Thrush, Diagnostic Ultrasound: Physics and Equipment, 3rd ed. (2019). Kremkau, Sonography Principles and Instruments. Feldman, Katyal and Blackwood, US Artifacts, RadioGraphics 2009;29:1179–1189.</p>`,
    groups: [
      ["Shadow and enhancement", [
        ["The stone", "Abdomen, press Reset all. Look at the stone in the gallbladder. What is behind it, and why?", "A black shadow all the way down. The front of the stone sends most of the sound back (the bright arc), and the rest is almost entirely absorbed in the stone. Behind it there is only noise. The shadow shows that it is a stone and not a polyp."],
        ["Behind the gallbladder", "Look at the liver just behind the gallbladder. Is it brighter or darker than the liver beside it? Why?", "Brighter. Bile hardly attenuates sound, so the echoes behind the gallbladder are stronger than beside it, where the sound has passed through liver. This is called enhancement, and it shows that this is fluid."],
        ["Clean or dirty", "Compare the shadow behind the stone with the shadow behind the bowel gas. What is the difference?", "Behind the stone the shadow is clean and black. Behind the gas it is grey and streaked (dirty), because the gas sends almost all the sound back, and the echo bounces between the gas and the probe: reverberation."],
      ]],
      ["Reverberation and comet tail", [
        ["The copies", "Choose Move: Bowel gas, and look at the graph A line through the image. Where are the bright peaks behind the gas?", "At 2 and 3 times the depth of the gas. The front of the gas is about 5 cm down, so the copies come at about 10 and 15 cm. The sound has simply gone back and forth several times. There is no tissue there."],
        ["Move the gas deeper", "Click lower in the image so the gas moves. What happens to the distance between the copies?", "It grows. The distance always equals the depth of the gas, and that is how you recognise reverberation: equal spacing, getting weaker."],
        ["Comet tail", "Switch to Surface. Look below the needle. What are the close bright lines?", "The sound bounces back and forth inside the needle, between its walls. Each trip gives an echo 0.8 mm further down, so there is a tail of close lines getting weaker. The tail can help you find the needle."],
      ]],
      ["Mirror image", [
        ["Liver behind the diaphragm", "Abdomen, turn on Show names. What is seen behind the diaphragm, where there should be lung?", "The liver again. The diaphragm with air in the lung behind it sends the sound back like a mirror. The sound goes into the liver and back the same way, but the scanner thinks it went straight on and draws the echoes behind the diaphragm. Turn on Show what is real: there is only lung."],
        ["A useful mirror", "Why is the mirror image a good thing to see in the clinic?", "The mirror image needs air in the lung right behind the diaphragm. If there is fluid in the pleural space, the mirror image disappears and you see a black rim of fluid instead. A missing mirror image is a sign you look for."],
      ]],
      ["Edge shadow", [
        ["The streaks", "Turn off stone and bowel gas. Look below the two ends of the gallbladder. What are the thin dark streaks?", "Edge shadows. Where the beam meets the round wall obliquely, the sound is bent and spread away, so less sound comes back from behind. The streaks start at the edge and run straight down."],
        ["Not a stone", "How can you tell an edge shadow from the shadow of a stone?", "The stone's shadow starts behind a bright structure inside the gallbladder and is as wide as the stone. The edge shadow starts at the edge of a round fluid-filled structure, is narrow, and there is no bright structure in front of it."],
      ]],
      ["Side lobes and harmonic imaging", [
        ["Haze in the gallbladder", "Press Reset all. Look at the right end of the gallbladder, close to the bowel gas. Why is it not quite black?", "Side lobes. The probe also sends weak beams to the side, here 28 dB weaker. When one of them hits the strong gas, an echo comes back and is drawn as if it came from inside the gallbladder. It can look like sludge."],
        ["Harmonic imaging", "Turn on Harmonic imaging. What happens to the haze, the reverberation and the image as a whole?", "The side lobes drop to 45 dB below the main beam, so the gallbladder turns a cleaner black, and the reverberation behind the gas gets weaker. The beam is narrower, so the grain is finer. The price is a little less penetration: 18 instead of 20 cm."],
      ]],
      ["Slice thickness", [
        ["Small cyst", "Press Reset all and make the cyst small: radius 1.5 mm. Why is it no longer black?", "The beam is not thin across the image: at the cyst the slice is 4.8 mm thick. A 3 mm cyst fills only part of the slice, and the liver beside it is included in the echo. It turns grey (4 dB below the liver) and can be mistaken for a solid nodule."],
        ["Move it up", "Keep the small cyst. Choose Move: Cyst, and click first at about 7 cm and then at about 3 cm. Where is it darkest?", "At 7 cm, where the slice is thinnest (4 mm): the cyst's echo is 6 dB below the liver. At 3 cm the slice is more than 6 mm thick, and the cyst is only 3 dB darker than the liver. The slice thickness has its own focus in the probe's lens, which you cannot move."],
        ["Large cyst", "Make the cyst large again. Why are its edges sharp now, while the small cyst was blurred?", "A large cyst fills the whole thickness of the slice almost out to its edge. Only at the very rim is it thinner than the slice. The smaller the cyst, the larger the part of it that is rim."],
      ]],
      ["Fatty liver", [
        ["Liver against kidney", "Abdomen. Compare the liver with the renal cortex at the bottom right. Then turn on Fatty liver. What happens?", "Normally the liver is a little brighter than the renal cortex (4 dB here). With fatty liver it is much brighter (12 dB). That is one of the signs of fatty liver."],
        ["Dark depth", "With fatty liver: look at the deep part of the liver and at the diaphragm. Why are they darker?", "The fatty liver attenuates more: 0.9 instead of 0.5 dB/cm/MHz. Less sound reaches the depth, so the diaphragm and the deep vessels become unclear. More gain lifts the noise too."],
      ]],
      ["Anisotropy", [
        ["Tilt the tendon", "Switch to Surface. Set the tendon angle to 5° and then to 10°. What happens?", "At 5° the tendon's echo is 6 dB weaker, at 10° 24 dB, and the tendon turns dark. The fibres send the sound back like a mirror, so the beam has to meet them at a right angle. A dark tendon can look like an injury: tilt the probe before you conclude."],
      ]],
      ["The needle", [
        ["Flat or steep", "Surface. Try needle angles of 10°, 20° and 30°. When is the shaft seen?", "At 10° the shaft is very bright (36 dB above the muscle), at 20° still clear (22 dB), and at 30° it can hardly be told from the muscle. Only the tip is seen. The shaft is a mirror: the steeper it is, the more sound misses the probe."],
        ["Find the tip", "The needle is steep. How can you still follow it?", "The tip is rough and sends sound back in all directions, so it is seen. Make the angle flatter if you can (insert further from the probe), or use a needle with a rough surface or beam steering on the scanner. Never advance the needle without seeing the tip."],
      ]],
      ["Extra", [
        ["Why weaker?", "Why is each copy in the reverberation weaker than the one before?", "Each extra trip passes through the tissue again and loses the attenuation there, and at the probe and the gas 10 dB is lost per trip (20 dB with harmonic imaging). That is why usually only a few copies are seen."],
        ["The mirror image's distance", "Why does the mirror image of the liver lie as far behind the diaphragm as the liver lies in front?", "The sound goes from the diaphragm into the liver and back again. The time for the extra path is added as if the sound went straight on behind the diaphragm. Something 3 cm in front of the diaphragm (along the reflected beam) is drawn 3 cm behind it."],
      ], "deep"],
    ],
  },
};

const $ = id => document.getElementById(id);
let M = AR.model(cur());
let PIN = null;
const CSS = {}, css = n => CSS[n] || (CSS[n] = getComputedStyle(document.documentElement).getPropertyValue(n).trim());
const fmt = (v, d = 1) => v.toFixed(d).replace(".", T[S.lang].dec);
const INK = "rgba(10,14,24,.85)";
const math = s => withMath(s).replace(/<mi>alpha<\/mi>/g, "<mi>α</mi>").replace(/<mi>theta<\/mi>/g, "<mi>θ</mi>").replace(/<mi>beta<\/mi>/g, "<mi>β</mi>");
function fit(cv) {
  const r = cv.getBoundingClientRect(), dpr = window.devicePixelRatio || 1;
  const w = Math.max(1, Math.round(r.width * dpr)), h = Math.max(1, Math.round(r.height * dpr));
  if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
  const ctx = cv.getContext("2d"); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, r.width, r.height);
  return [ctx, r.width, r.height];
}
function text(ctx, s, x, y, color, align = "left", size = 12, font = "--body") {
  ctx.fillStyle = color; ctx.font = `${size}px ${css(font)}`; ctx.textAlign = align; ctx.fillText(s, x, y);
}

// ---- fixed random scatterers, shared by both scenes ----
const GRE = new Float32Array(MAXN), GIM = new Float32Array(MAXN);
{
  let a = 20261114 >>> 0;
  const r = () => { a = (a * 1664525 + 1013904223) >>> 0; return (a + 0.5) / 4294967296; };
  for (let k = 0; k < MAXN; k++) { const m = Math.sqrt(-Math.log(r())), t = 2 * Math.PI * r(); GRE[k] = m * Math.cos(t); GIM[k] = m * Math.sin(t); }
}
const SRE = new Float32Array(MAXN), SIM = new Float32Array(MAXN), ARE = new Float32Array(MAXN), AIM = new Float32Array(MAXN), ENV = new Float32Array(MAXN), REV = new Float32Array(MAXN);
let MAP = null, MAPKEY = "", SCANKEY = "";
const NORM = {};
function boxNorm(r) {
  if (NORM[r]) return NORM[r];
  let k = [1];
  for (let p = 0; p < 3; p++) {
    const out = new Array(k.length + 2 * r).fill(0);
    k.forEach((v, i) => { for (let j = 0; j <= 2 * r; j++) out[i + j] += v / (2 * r + 1); });
    k = out;
  }
  return (NORM[r] = 1 / Math.sqrt(k.reduce((s, v) => s + v * v, 0)));
}
function boxPass(a, o, n, r, row) {
  let sum = 0;
  for (let i = -r; i <= r; i++) sum += a[o + Math.min(n - 1, Math.max(0, i))];
  const w = 1 / (2 * r + 1);
  for (let i = 0; i < n; i++) { row[i] = sum * w; sum += a[o + Math.min(n - 1, i + r + 1)] - a[o + Math.max(0, i - r)]; }
  for (let i = 0; i < n; i++) a[o + i] = row[i];
}
function scan() {
  const s = cur(), mapKey = JSON.stringify(S[S.scene]) + S.scene;
  if (mapKey !== MAPKEY) { MAP = AR.buildMap(s); MAPKEY = mapKey; }
  const key = mapKey + S.harm;
  if (key === SCANKEY) return;
  SCANKEY = key;
  const { P, amp, alpha, spec, rev } = MAP, nr = P.nr, nc = P.nc, N = nr * nc;
  // scatterers, plus the mirror-like reflectors as a steady (coherent) echo
  for (let k = 0; k < N; k++) { SRE[k] = amp[k] * GRE[k] + spec[k]; SIM[k] = amp[k] * GIM[k]; }
  // side lobes: the same depth, a fixed angle (convex) or distance (linear) to each side
  const sl = P.kind === "convex" ? 10 ** (M.side / 20) : 0, off = P.kind === "convex" ? Math.round(0.2 / P.dth) : 1;   // left out on the linear probe, so the needle stays clear
  for (let i = 0; i < nr; i++) {
    const o = i * nc;
    for (let j = 0; j < nc; j++) {
      let re = SRE[o + j], im = SIM[o + j];
      if (j - off >= 0) { re += sl * SRE[o + j - off]; im += sl * SIM[o + j - off]; }
      if (j + off < nc) { re += sl * SRE[o + j + off]; im += sl * SIM[o + j + off]; }
      ARE[o + j] = re; AIM[o + j] = im;
    }
  }
  // sideways blur: the beam's width at each depth
  const W = AR.beamWidth(P, S.harm), row = new Float32Array(nc);
  for (let i = 0; i < nr; i++) {
    const d = (i + 0.5) * P.dd, sig = W(d) / 2.355 / AR.colWidth(P, d), r = Math.round((Math.sqrt(4 * sig * sig + 1) - 1) / 2);
    if (r < 1) continue;
    const o = i * nc, g = boxNorm(r);
    for (let p = 0; p < 3; p++) { boxPass(ARE, o, nc, r, row); boxPass(AIM, o, nc, r, row); }
    for (let j = 0; j < nc; j++) { ARE[o + j] *= g; AIM[o + j] *= g; }
  }
  // along the beam: half a pulse length (2 cycles) as a Gaussian
  const lam = AR.C / (P.f * 1e6), sa = lam / 2.355 / P.dd, taps = Math.max(1, Math.ceil(3 * sa)), ker = [];
  for (let t = -taps; t <= taps; t++) ker.push(Math.exp(-0.5 * (t / sa) ** 2));
  const ks = ker.reduce((a, v) => a + v, 0), kq = Math.sqrt(ker.reduce((a, v) => a + (v / ks) ** 2, 0));
  for (let i = 0; i < ker.length; i++) ker[i] /= ks * kq;
  SRE.fill(0, 0, N); SIM.fill(0, 0, N);
  for (let i = 0; i < nr; i++) {
    const o = i * nc;
    for (let t = -taps; t <= taps; t++) {
      const src = Math.min(nr - 1, Math.max(0, i + t)) * nc, w = ker[t + taps];
      for (let j = 0; j < nc; j++) { SRE[o + j] += w * ARE[src + j]; SIM[o + j] += w * AIM[src + j]; }
    }
  }
  // reverberation copies: placed where the scanner draws them, as strong as they arrive, then given the beam's width
  const c = Math.LN10 / 20, bounce = M.bounce, gapRows = AR.NEEDLE_GAP / P.dd;
  REV.fill(0, 0, N);
  for (let j = 0; j < nc; j++) {
    const R = rev[j]; if (!R) continue;
    let att = 0;                                    // attenuation down to the reflector and back
    for (let i = 0; i < R.i; i++) att += 2 * alpha[i * nc + j] * P.f * P.dd;
    const put = (row, a) => { for (const [dr, w] of [[-1, 0.5], [0, 1], [1, 0.5]]) { const r = Math.round(row) + dr; if (r > R.i && r < nr) REV[r * nc + j] += a * w; } };
    if (R.kind === 1) {                             // gas: copies at 2·d0, 3·d0 …
      for (let n = 2; n * R.i < nr; n++) put(n * R.i, R.a * Math.exp(-(n * att + (n - 1) * bounce) * c));
    } else {                                        // needle: a comet tail every 0.8 mm, and one copy at 2·d0
      for (let m = 1; m <= 12; m++) put(R.i + m * gapRows, R.a * Math.exp(-(att + m * (S.harm ? 8 : 4)) * c));
      put(2 * R.i, R.a * Math.exp(-(2 * att + bounce + 2) * c));
    }
  }
  for (let i = 0; i < nr; i++) {
    const d = (i + 0.5) * P.dd, sig = W(d) / 2.355 / AR.colWidth(P, d), r = Math.round((Math.sqrt(4 * sig * sig + 1) - 1) / 2);
    if (r < 1) continue;
    const o = i * nc, g = boxNorm(r);
    let any = false; for (let j = 0; j < nc; j++) if (REV[o + j]) { any = true; break; }
    if (!any) continue;
    for (let p = 0; p < 3; p++) boxPass(REV, o, nc, r, row);
    for (let j = 0; j < nc; j++) REV[o + j] *= g;
  }
  // attenuation down and back, noise, envelope in dB
  const att = new Float32Array(nc), OFF = 123457, nz = 10 ** ((AR.NOISE_DB + (S.harm ? 6 : 0)) / 20);
  for (let i = 0; i < nr; i++) {
    const o = i * nc;
    for (let j = 0; j < nc; j++) {
      const k = o + j, a2 = 2 * alpha[k] * P.f * P.dd;
      att[j] += a2 / 2;
      const a = Math.exp(-att[j] * c);
      att[j] += a2 / 2;
      const m = (k + OFF) % MAXN, re = SRE[k] * a + REV[k] + nz * GIM[m], im = SIM[k] * a + nz * GRE[m];
      ENV[k] = 4.342944819 * Math.log(re * re + im * im + 1e-30);
    }
  }
}

// ---- the image ----
function layout(W, H) {
  const P = M.P, mT = 24, mB = 8, mL = 8, mR = 40, aw = W - mL - mR, ah = H - mT - mB;
  let xmin, xmax, ytop, ybot = P.depth;
  if (P.kind === "convex") { xmax = (P.rc + P.depth) * Math.sin(P.half); xmin = -xmax; ytop = P.rc * (Math.cos(P.half) - 1); }
  else { xmin = -P.width / 2; xmax = P.width / 2; ytop = 0; }
  const sc = Math.min(aw / (xmax - xmin), ah / (ybot - ytop));
  return { sc, ox: mL + aw / 2 - (xmin + xmax) / 2 * sc, oy: mT + ah / 2 - (ytop + ybot) / 2 * sc, mT, mR, mL };
}
let IMGBUF = null;
function drawImg() {
  const [ctx, W, H] = fit($("img"));
  if (W < 10) return;
  const P = M.P, V = layout(W, H), dpr = window.devicePixelRatio || 1;
  const ow = Math.min(Math.round(W * dpr), 760), oh = Math.round(ow * H / W);
  if (!IMGBUF || IMGBUF.w !== ow || IMGBUF.h !== oh) {
    const off = document.createElement("canvas"); off.width = ow; off.height = oh;
    const octx = off.getContext("2d"), img = octx.createImageData(ow, oh);
    IMGBUF = { w: ow, h: oh, off, octx, img, px: new Uint32Array(img.data.buffer) };
  }
  const L = P.lines, nc = P.nc, nr = P.nr, lc = new Int32Array(L);
  for (let j = 0; j < L; j++) lc[j] = P.kind === "convex" ? Math.round((-P.half + (j + 0.5) * 2 * P.half / L) / P.dth) + P.nhalf
                                                          : Math.min(nc - 1, Math.round(((j + 0.5) / L) * nc - 0.5));
  const gt = new Float32Array(nr);
  for (let i = 0; i < nr; i++) gt[i] = S.gain + Math.min(AR.BUILT_IN * P.f * (i + 0.5) * P.dd, AR.BUILT_MAX);
  const q = 255 / AR.DR, base = 127.5 - AR.MID * q, px = IMGBUF.px, sx = W / ow, sy = H / oh;
  for (let i = 0; i < oh; i++) {
    const y = ((i + 0.5) * sy - V.oy) / V.sc;
    for (let j = 0; j < ow; j++) {
      const x = ((j + 0.5) * sx - V.ox) / V.sc;
      let d, t;
      if (P.kind === "convex") { const yr = y + P.rc; d = Math.hypot(x, yr) - P.rc; const th = Math.atan2(x, yr); t = (th + P.half) / (2 * P.half) * L - 0.5; if (th < -P.half || th > P.half) d = -1; }
      else { d = y; t = (x + P.width / 2) / P.width * L - 0.5; if (x < -P.width / 2 || x > P.width / 2) d = -1; }
      if (d < 0 || d > P.depth) { px[i * ow + j] = 0xFF000000; continue; }
      let j0 = Math.floor(t);
      if (j0 < 0) { j0 = 0; t = 0; } else if (j0 > L - 2) { j0 = L - 2; t = L - 1; }
      const ft = t - j0, rr = Math.min(nr - 1, d / P.dd - 0.5), r0 = Math.max(0, Math.floor(rr)), r1 = Math.min(nr - 1, r0 + 1), fr = Math.max(0, rr - r0);
      const c0 = lc[j0], c1 = lc[j0 + 1];
      const a = ENV[r0 * nc + c0] * (1 - fr) + ENV[r1 * nc + c0] * fr, b = ENV[r0 * nc + c1] * (1 - fr) + ENV[r1 * nc + c1] * fr;
      let g = base + (a * (1 - ft) + b * ft + gt[r0]) * q;
      g = g < 0 ? 0 : g > 255 ? 255 : g | 0;
      px[i * ow + j] = 0xFF000000 | (g << 16) | (g << 8) | g;
    }
  }
  IMGBUF.octx.putImageData(IMGBUF.img, 0, 0);
  ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H);
  ctx.drawImage(IMGBUF.off, 0, 0, W, H);
  overlays(ctx, W, H, V);
}
// the line through the object that moves: the beam (convex) or column (linear) through its centre
function lineColumn() {
  const s = cur(), P = M.P, mv = s.move;
  const [x, y] = mv === "needle" ? AR.needleTip(s) : [s[mv + "X"], s[mv + "Y"]];
  if (P.kind === "convex") return { x, y, j: Math.max(0, Math.min(P.nc - 1, Math.round(Math.atan2(x, y + P.rc) / P.dth) + P.nhalf)) };
  return { x, y, j: Math.max(0, Math.min(P.nc - 1, Math.round((x + P.width / 2) / P.dx - 0.5))) };
}
function overlays(ctx, W, H, V) {
  const L = T[S.lang], P = M.P, X = x => V.ox + x * V.sc, Y = y => V.oy + y * V.sc, s = cur();
  // the marker dot and the settings line
  const mx = P.kind === "convex" ? X(-P.rc * Math.sin(P.half)) - 10 : X(-P.width / 2) + 6, my = P.kind === "convex" ? Y(P.rc * (Math.cos(P.half) - 1)) - 2 : V.mT - 10;
  ctx.fillStyle = css("--signal"); ctx.beginPath(); ctx.arc(mx, my, 5, 0, 7); ctx.fill();
  text(ctx, `${L.sceneShort[S.scene]} · ${fmt(P.f, P.f % 1 ? 1 : 0)} MHz${S.harm ? " · HAR" : ""} · G ${S.gain > 0 ? "+" : ""}${S.gain} dB`, W - 6, 14, css("--muted"), "right", 11, "--mono");
  // depth scale
  const sxp = W - V.mR + 14, step = P.depth > 6 ? 2 : 1, minor = P.depth > 6 ? 1 : 0.5;
  ctx.strokeStyle = css("--muted"); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(sxp, Y(0)); ctx.lineTo(sxp, Y(P.depth)); ctx.stroke();
  for (let d = 0; d <= P.depth + 0.01; d += minor) {
    const y = Y(d), big = Math.abs(d / step - Math.round(d / step)) < 0.01;
    ctx.beginPath(); ctx.moveTo(sxp, y); ctx.lineTo(sxp + (big ? 7 : 4), y); ctx.stroke();
    if (big) text(ctx, String(d), sxp + 10, y + 4, css("--muted"), "left", 10, "--mono");
  }
  // the dashed line through what moves
  const lcn = lineColumn(), o = AR.ray(P, lcn.j);
  ctx.strokeStyle = css("--amber"); ctx.globalAlpha = 0.6; ctx.setLineDash([5, 5]); ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(X(o[0]), Y(o[1])); ctx.lineTo(X(o[0] + P.depth * o[2]), Y(o[1] + P.depth * o[3])); ctx.stroke();
  ctx.setLineDash([]); ctx.globalAlpha = 1;
  // what is really there
  if (S.truth) {
    ctx.strokeStyle = css("--amber"); ctx.lineWidth = 2;
    for (const t of AR.truth(s)) {
      ctx.beginPath();
      if (t.type === "circle") ctx.arc(X(t.x), Y(t.y), t.r * V.sc, 0, 7);
      else if (t.type === "ellipse") ctx.ellipse(X(t.x), Y(t.y), t.a * V.sc, t.b * V.sc, t.phi, 0, 7);
      else if (t.type === "line") { ctx.moveTo(X(t.x0), Y(t.y0)); ctx.lineTo(X(t.x1), Y(t.y1)); }
      else if (t.type === "arc") {                      // the diaphragm, and "lung" behind it
        let first = true;
        for (let a = 0; a <= Math.PI * 2; a += 0.01) {
          const x = t.x + t.r * Math.cos(a), y = t.y + t.r * Math.sin(a);
          if (x > t.xmax || y < 2.3 || y > 13) { first = true; continue; }
          first ? ctx.moveTo(X(x), Y(y)) : ctx.lineTo(X(x), Y(y)); first = false;
        }
        ctx.stroke(); ctx.beginPath();
        text(ctx, S.lang === "da" ? "lunge" : "lung", X(t.x - t.r - 0.3), Y(t.y + 1.5), css("--amber"), "right", 12);
      }
      ctx.stroke();
    }
    ctx.lineWidth = 1;
  }
  if (S.names) {
    ctx.font = `12px ${css("--body")}`; ctx.textAlign = "center";
    for (const [x, y, da, en] of AR.labels(s)) {
      const nm = S.lang === "da" ? da : en, w = ctx.measureText(nm).width + 8, px = X(x), py = Y(y);
      if (px < 0 || px > W - V.mR || py < V.mT || py > H) continue;
      ctx.fillStyle = INK; ctx.fillRect(px - w / 2, py - 9, w, 17);
      ctx.fillStyle = css("--fg"); ctx.fillText(nm, px, py + 4);
    }
  }
}
$("img").addEventListener("click", e => {
  const r = $("img").getBoundingClientRect(), V = layout(r.width, r.height), o = S[S.scene], P = M.P;
  let x = (e.clientX - r.left - V.ox) / V.sc, y = (e.clientY - r.top - V.oy) / V.sc;
  const lim = P.kind === "convex" ? [2.6, P.depth - 1] : [0.3, P.depth - 0.6];
  y = Math.max(lim[0], Math.min(lim[1], y));
  if (P.kind === "linear") x = Math.max(-P.width / 2 + 0.2, Math.min(P.width / 2 - 0.2, x));
  if (o.move === "needle") {                            // the tip goes where you click; the angle follows if it must
    o.needleX = +x.toFixed(2); o.needleY = +Math.min(2.6, y).toFixed(2);
  } else { o[o.move + "X"] = +x.toFixed(2); o[o.move + "Y"] = +y.toFixed(2); }
  buildControls(); update();
});

// ---- the A-line: the echo along the dashed line ----
function drawAline() {
  const [ctx, W, H] = fit($("aline"));
  if (W < 10) return;
  const G = T[S.lang].graph, P = M.P, x0 = 30, x1 = W - 8, y0 = H - 32, y1 = 18, lo = -60, hi = 40;
  const X = d => x0 + d / P.depth * (x1 - x0), Y = v => y0 - (Math.max(lo, Math.min(hi, v)) - lo) / (hi - lo) * (y0 - y1);
  const top = AR.MID + AR.DR / 2, bot = AR.MID - AR.DR / 2;
  ctx.fillStyle = "rgba(230,233,240,.10)"; ctx.fillRect(x0, Y(top), x1 - x0, Y(bot) - Y(top));
  text(ctx, G.white, x1 - 4, Y(top) - 4, css("--muted"), "right", 10);
  text(ctx, G.black, x1 - 4, Y(bot) + 12, css("--muted"), "right", 10);
  ctx.strokeStyle = css("--line"); ctx.beginPath(); ctx.moveTo(x0, y1); ctx.lineTo(x0, y0); ctx.lineTo(x1, y0); ctx.stroke();
  for (let v = -60; v <= 40; v += 20) text(ctx, String(v), x0 - 5, Y(v) + 3, css("--muted"), "right", 10);
  text(ctx, "dB", 2, 11, css("--muted"), "left", 10);
  const step = P.depth > 6 ? 2 : 1;
  for (let d = 0; d <= P.depth; d += step) text(ctx, String(d), X(d), y0 + 13, css("--muted"), "center", 10);
  text(ctx, G.depth, x1, y0 + 26, css("--muted"), "right", 10);
  // the echo, smoothed over a few samples so the grain does not hide the peaks
  const { j } = lineColumn(), nc = P.nc, nr = P.nr, sm = Math.max(1, Math.round(0.06 * P.depth / 4 / P.dd));
  ctx.strokeStyle = css("--fg"); ctx.lineWidth = 1.4; ctx.beginPath();
  for (let i = 0; i < nr; i += 1) {
    let p = 0, n = 0;
    for (let k = Math.max(0, i - sm); k <= Math.min(nr - 1, i + sm); k++) { p += 10 ** (ENV[k * nc + j] / 10); n++; }
    const d = (i + 0.5) * P.dd, v = 10 * Math.log10(p / n) + S.gain + Math.min(AR.BUILT_IN * P.f * d, AR.BUILT_MAX);
    i ? ctx.lineTo(X(d), Y(v)) : ctx.moveTo(X(d), Y(v));
  }
  ctx.stroke(); ctx.lineWidth = 1;
  // where reverberation copies belong: 2× and 3× the gas depth
  const s = cur();
  if (S.scene === "abdomen" && s.gas && s.move === "gas") {
    const d0 = M.gasDepth;
    ctx.setLineDash([3, 4]); ctx.strokeStyle = css("--amber");
    for (const n of [1, 2, 3]) {
      if (n * d0 > P.depth) break;
      ctx.beginPath(); ctx.moveTo(X(n * d0), y1); ctx.lineTo(X(n * d0), y0); ctx.stroke();
      text(ctx, n === 1 ? fmt(d0, 1) + " cm" : `${n}${G.copy}`, X(n * d0) + 3, y1 + 9, css("--amber"), "left", 10);
    }
    ctx.setLineDash([]);
  }
}

// ---- readouts and what you can see ----
function metrics() {
  const L = T[S.lang], s = cur(), r2 = fmt(2 * s.cystR * 10, 0);
  const cyst = [["", "slice", `${fmt(M.slice * 10, 1)} mm`, L.f.slice(r2)],
                [M.cystLevel < -40 ? "ok" : "mag", "cystLvl", `${fmt(M.cystLevel, M.cystLevel < -40 ? 0 : 1)} dB`, L.f.cystLvl(M.cystLevel)]];
  if (S.scene === "abdomen") {
    const d0 = M.gasDepth;
    return [...cyst,
      ["", "rev", s.gas ? `${fmt(d0, 1)} cm` : "–", s.gas ? L.f.rev([fmt(2 * d0, 1), fmt(3 * d0, 1)]) : L.f.revOff],
      [M.hepatorenal > 8 ? "err" : "ok", "hr", `+${M.hepatorenal} dB`, L.f.hr(M.hepatorenal)],
      [S.harm ? "ok" : "mag", "side", `${M.side} dB`, L.f.side(S.harm)],
      ["", "pen", `${fmt(M.pen, 0)} cm`, L.f.pen]];
  }
  const nv = M.needle + 10;
  return [...cyst,
    [M.tendon < -3 ? "err" : "ok", "tendon", `${fmt(M.tendon, 0)} dB`, L.f.tendon],
    [nv > 12 ? "ok" : "err", "needle", s.needle ? `${nv > 0 ? "+" : ""}${fmt(nv, 0)} dB` : "–", L.f.needle(nv)],
    ["mag", "angle", `${s.needleA}°`, L.f.angle],
    ["", "comet", `${fmt(AR.NEEDLE_GAP * 10, 1)} mm`, L.f.comet]];
}
function observations() {
  const L = T[S.lang].see, s = cur(), out = [];
  const add = (on, t) => { if (on) out.push(t); };
  if (S.scene === "abdomen") {
    add(s.cyst && M.fill < 1 && M.cystLevel > -20, L.slice.replace("{c}", fmt(2 * s.cystR * 10, 0)).replace("{e}", fmt(M.slice * 10, 1)));
    add(s.fatty, L.fatty);
    add(S.harm, L.harm);
    add(s.gas, L.gas.replace("{a}", fmt(2 * M.gasDepth, 1)).replace("{b}", fmt(3 * M.gasDepth, 1)));
    add(s.stone, L.stone);
    add(s.gas && !S.harm && s.gasX > 3.5 && s.gasY < 6, L.side);
    add(true, L.mirror); add(true, L.enh); add(!s.stone && !s.gas, L.edge);
  } else {
    add(s.tendonA >= 3, L.tendon.replace("{a}", s.tendonA));
    add(s.needle && s.needleA >= 27, L.steep.replace("{a}", s.needleA));
    add(s.needle && s.needleA < 27, L.flat);
    add(s.cyst && M.fill < 1 && M.cystLevel > -20, L.slice.replace("{c}", fmt(2 * s.cystR * 10, 1)).replace("{e}", fmt(M.slice * 10, 1)));
    add(S.harm, L.harm); add(true, L.bone);
  }
  return out.length ? out.slice(0, 2) : [L.base];
}
function readouts() {
  const L = T[S.lang], pinned = PIN && PIN.scene === S.scene ? PIN.vals : null;
  $("readout").innerHTML = metrics().map(([cls, key, value, foot]) =>
    `<div class="metric ${cls}"><div class="k">${L.k[key]}</div><div class="v">${value}</div><div class="f">${foot}</div>` +
    (pinned ? `<div class="p">${L.saved}: ${pinned[key]}</div>` : "") + `</div>`).join("");
  $("t-seen").textContent = L.seen; $("seen").textContent = observations().join(" ");
  $("pin").textContent = pinned ? L.unpin : L.pin;
}
$("pin").onclick = () => {
  PIN = PIN && PIN.scene === S.scene ? null : { scene: S.scene, vals: Object.fromEntries(metrics().map(([, key, value]) => [key, value])) };
  readouts();
};

// ---- controls ----
const SLIDERS = {
  gain: [-20, 20, 1, v => `${v > 0 ? "+" : ""}${v} dB`, null],
  cystR: [0.1, 1.5, 0.05, v => `${fmt(v * 10, 1)} mm`, "abdomen"],
  cystRs: [0.05, 0.5, 0.05, v => `${fmt(v * 10, 1)} mm`, "surface"],
  needleA: [5, 60, 1, v => `${v}°`, "surface"], needleY: [0.3, 2.6, 0.1, v => `${fmt(v, 1)} cm`, "surface"], tendonA: [0, 15, 1, v => `${v}°`, "surface"],
};
const key = k => k === "cystRs" ? "cystR" : k;
const holder = k => SLIDERS[k][4] ? S[S.scene] : S;
function buildControls() {
  const L = T[S.lang], C = L.ctl, box = $("controls"), o = S[S.scene];
  const help = k => S.level === "grund" && L.help[k] ? `<p class="help">${L.help[k]}</p>` : "";
  const seg = (k, opts, obj = S) => `<div class="ctl"><label><span>${C[k]}</span><span></span></label><div class="seg">` +
    opts.map(([val, lbl]) => `<button data-k="${k}" data-o="${obj === S ? "" : "1"}" data-v="${val}" aria-pressed="${String(obj[k]) === String(val)}">${lbl}</button>`).join("") +
    `</div>${help(k)}</div>`;
  const onoff = (k, obj) => seg(k, [["false", C.off], ["true", C.on]], obj);
  const slider = k => {
    const [mn, mx, st, f] = SLIDERS[k], v = holder(k)[key(k)];
    return `<div class="ctl"><label for="s-${k}"><span>${C[key(k)]}</span><span id="o-${k}">${f(v)}</span></label>` +
      `<input type="range" id="s-${k}" min="${mn}" max="${mx}" step="${st}" value="${v}">${help(key(k))}</div>`;
  };
  const grp = k => `<h3 class="grp">${L.grp[k]}</h3>`;
  const movers = S.scene === "abdomen" ? ["cyst", "stone", "gas"] : ["needle", "cyst"];
  let things;
  if (S.scene === "abdomen") things = onoff("cyst", o) + (o.cyst ? slider("cystR") : "") + onoff("stone", o) + onoff("gas", o) + onoff("fatty", o);
  else things = onoff("needle", o) + (o.needle ? slider("needleA") + slider("needleY") : "") + slider("tendonA") + onoff("cyst", o) + (o.cyst ? slider("cystRs") : "");
  box.innerHTML = grp("scene") + seg("scene", [["abdomen", L.scene.abdomen], ["surface", L.scene.surface]]) +
    grp("image") + slider("gain") + onoff("harm", S) + onoff("truth", S) + onoff("names", S) +
    grp("things") + things +
    grp("move") + `<div class="ctl"><div class="seg">` + movers.map(m =>
      `<button data-k="move" data-o="1" data-v="${m}" aria-pressed="${o.move === m}" ${o[m] ? "" : "disabled"}>${C.mv[m]}</button>`).join("") + `</div>${help("move")}</div>` +
    `<div class="ctl last"><button class="reset" id="reset">${C.reset}</button></div>`;
  box.querySelectorAll("button[data-k]").forEach(b => b.onclick = () => {
    const k = b.dataset.k, v = b.dataset.v, obj = b.dataset.o ? o : S;
    obj[k] = v === "true" ? true : v === "false" ? false : v;
    if (k === "scene") PIN = null;
    if (obj === o && (k === "cyst" || k === "stone" || k === "gas" || k === "needle") && obj[k] === false && o.move === k)
      o.move = movers.find(m => o[m]) || o.move;
    if (obj === o && obj[k] === true && movers.includes(k)) o.move = k;
    buildControls(); update();
  });
  for (const k of Object.keys(SLIDERS)) {
    const el = $(`s-${k}`); if (!el) continue;
    el.oninput = () => { holder(k)[key(k)] = +el.value; $(`o-${k}`).textContent = SLIDERS[k][3](+el.value); updateSoon(); };
  }
  $("reset").onclick = () => { const keep = { lang: S.lang, level: S.level, scene: S.scene }; Object.assign(S, clone(START), keep); PIN = null; buildControls(); update(); };
}

// ---- tasks and text (same pattern as the other simulators) ----
function taskList() {
  const out = [];
  T[S.lang].groups.forEach(([g, items, lvl], gi) => {
    if (lvl === "deep" && S.level !== "deep") return;
    const vis = items.map((it, ii) => [it, ii]).filter(([it]) => S.level === "deep" || !(it[3] && it[3].deep));
    vis.forEach(([it, ii], k) => out.push({ id: gi + ":" + ii, g, k: k + 1, n: vis.length, h: it[0], q: it[1], a: it[2] }));
  });
  return out;
}
let taskId = "0:0";
// paging the card opens the same task in the list below and closes the one the card showed before (other tasks the
// reader opened stay open; the page does not scroll)
function cardToList(from, to) {
  const at = id => document.querySelector(`#task-list details[data-id="${id}"]`);
  if (from !== to && at(from)) at(from).open = false;
  if (at(to)) at(to).open = true;
}
// opening a task in the list below shows the same task in the card beside the simulator
document.getElementById("task-list").addEventListener("toggle", e => {
  const d = e.target;
  if (d.open && d.dataset.id) { taskId = d.dataset.id; buildCard(); }
}, true);
function buildCard() {
  const L = T[S.lang], flat = taskList(), i = Math.max(0, flat.findIndex(t => t.id === taskId)), t = flat[i];
  taskId = t.id;
  $("taskcard").innerHTML =
    `<div class="tc-head"><span><b>${t.g}</b> · ${t.k} ${L.of} ${t.n}</span>` +
    `<span class="seg"><button id="tc-prev" aria-label="${L.prev}">‹</button><button id="tc-next" aria-label="${L.next}">›</button></span></div>` +
    `<h4>${t.h}</h4><p class="q">${math(t.q)}</p>` +
    `<details class="answer"><summary>${L.answer}</summary><p class="a">${math(t.a)}</p></details>`;
  const go = d => { const from = taskId; taskId = flat[(i + d + flat.length) % flat.length].id; buildCard(); cardToList(from, taskId); };
  $("tc-prev").onclick = () => go(-1);
  $("tc-next").onclick = () => go(1);
}
function buildText() {
  const L = T[S.lang], set = (id, s) => { $(id).textContent = s; };
  document.documentElement.lang = S.lang;
  document.title = L.title + " | Oliver Brage";
  for (const k of ["title", "sub", "image", "aline", "tasks", "model", "foot", "privacy"]) set("t-" + k, L[k]);
  set("t-back", L.back); set("t-simtitle", L.simTitle); set("t-alinenote", L.alineNote); set("t-imgnote", L.imgNote);
  $("t-back").href = "../?lang=" + S.lang;
  set("lvl-grund", L.grund); set("lvl-deep", L.deep);
  $("model-text").innerHTML = math(L.modelText);
  let last = "";
  $("task-list").innerHTML = taskList().map(t => {
    const head = t.g === last ? "" : `<h4 class="tgroup">${t.g}</h4>`; last = t.g;
    return head + `<details data-id="${t.id}"><summary>${t.h}</summary><p class="q">${math(t.q)}</p><details class="answer">` +
      `<summary>${L.answer}</summary><p class="a">${math(t.a)}</p></details></details>`; }).join("");
  buildCard();
}
function setPressed() {
  for (const [id, on] of [["lang-da", S.lang === "da"], ["lang-en", S.lang === "en"], ["lvl-grund", S.level === "grund"], ["lvl-deep", S.level === "deep"]])
    $(id).setAttribute("aria-pressed", on);
}
function render() {
  readouts();
  if (!$("img").getClientRects().length) return;
  drawImg(); drawAline();
}
function update() { M = AR.model(cur()); scan(); render(); }
let pending = false;
function updateSoon() { if (!pending) { pending = true; requestAnimationFrame(() => { pending = false; update(); }); } }
function all() { setPressed(); buildText(); buildControls(); update(); }
function save() {
  const q = new URLSearchParams(location.search);
  q.set("lang", S.lang); S.level === "deep" ? q.set("level", "deep") : q.delete("level");
  history.replaceState(null, "", "?" + q + location.hash);
}
$("lang-da").onclick = () => { S.lang = "da"; save(); all(); };
$("lang-en").onclick = () => { S.lang = "en"; save(); all(); };
$("lvl-grund").onclick = () => { S.level = "grund"; save(); all(); };
$("lvl-deep").onclick = () => { S.level = "deep"; save(); all(); };
{
  const q = new URLSearchParams(location.search), l = q.get("lang");
  S.lang = l === "da" || l === "en" ? l : (navigator.language || "").toLowerCase().startsWith("da") ? "da" : "en";
  if (q.get("level") === "deep") S.level = "deep";
}
window.addEventListener("resize", render);
if (document.fonts && document.fonts.ready) document.fonts.ready.then(render);
all();
