// Doppler and safety simulator (ultrasound U6): the page. The flow, the Doppler maths and the safety indices live in
// model.js (DP). Here:
//   - the B-mode image: the tissue's echo level (model) plus fixed speckle, output power and gain, drawn 4 x 4 cm;
//   - the colour (or power) overlay inside the colour box at the chosen moment of the heartbeat;
//   - the graph: the spectrum in Spectral mode, otherwise the speed along the beam through the gate (long)
//     or the vessels' height against the probe pressure (across);
//   - the numbers, the "what you can see" line, the tasks and the model text.

const START = {
  scene: "long", mode: "color", tilt: 0, steer: -20, out: 0, bgain: 0, prf: 6000, f0: 5, base: 0, wf: 100, dgain: 0,
  corr: 0, gate: 1.5, gx: 0.5, gz: 1.6, sten: false, clot: "none", press: 0, t: 0.12, names: true,
};
const clone = o => JSON.parse(JSON.stringify(o));
const S = { lang: "da", level: "grund", ...clone(START) };

const T = {
  da: {
    title: "Doppler og sikkerhed", sub: "Simulator: farve-, power- og spektraldoppler i lysken, kompression af venen ved mistanke om DVT, og hvad MI og TI fortæller.",
    simTitle: "Simulator: Doppler og sikkerhed", grund: "Grund", deep: "Fordybelse", back: "← Ultralyd",
    image: "Billedet", graph: { spec: "Spektret i gaten", prof: "Fart langs strålen gennem gaten", comp: "Karrenes højde mod trykket" },
    note: { spec: "Tid hen ad (4 sekunder), fart op og ned. Over den vandrette linje (baseline) løber blodet mod proben. Farten er vinkelkorrigeret med den vinkel, du har sat. Den lodrette streg er øjeblikket i farvebilledet.",
            prof: "Langs den stiplede linje gennem gaten, fra toppen af farveboksen og ned. Stiplet grå: blodets sande fart langs strålen. Fuldt optrukket: hvad skanneren måler. De orange linjer er grænsen, skalaen kan måle. Det grå bånd er vægfilteret.",
            comp: "Højden af venen (blå) og arterien (rød) i forhold til uden tryk. Prikkerne viser, hvor du er nu." },
    imgNote: "Simuleret billede, ikke et rigtigt skannerbillede. Langs: klik i billedet for at flytte gaten.",
    tasks: "Opgaver", answer: "Vis svar", of: "af", prev: "Forrige opgave", next: "Næste opgave",
    model: "Sådan virker modellen", foot: "© 2026 Oliver Brage. Alle rettigheder forbeholdes.", privacy: "Privatliv",
    seen: "Det kan du se:", pin: "Gem tallene", unpin: "Fjern de gemte", saved: "gemt",
    grp: { scene: "Scene og tilstand", probe: "Proben", dop: "Doppler", patient: "Patienten", time: "Tid" },
    ctl: { scene: "Scene", long: "Langs", trans: "Tværs", mode: "Tilstand", b: "B", color: "Farve", power: "Power", spec: "Spektral",
           tilt: "Vip proben (hæl-tå)", steer: "Styring af strålen", out: "Udgangseffekt", bgain: "Gain (B-billede)",
           prf: "Skala (PRF)", base: "Baseline", wf: "Vægfilter", dgain: "Dopplergain", f0: "Dopplerfrekvens", corr: "Vinkelkorrektion",
           align: "Ret ind efter karret", gate: "Gatens længde", sten: "Forsnævring i arterien", clot: "Trombe i venen", none: "Ingen",
           fresh: "Frisk", old: "Ældre", press: "Tryk med proben", t: "Øjeblik", names: "Vis navne", on: "Til", off: "Fra", reset: "Nulstil alt" },
    help: { scene: "Langs: arterie og vene i lysken på langs. Tværs: samme kar på tværs, til kompression.",
            mode: "B: kun gråtoner. Farve: retning og fart. Power: kun at der er flow. Spektral: farten over tid i gaten.",
            tilt: "Tryk med hælen eller tåen af proben, så karret står skråt i billedet.",
            steer: "Skanneren sender dopplerstrålen skråt. Farveboksen og gaten følger med.",
            out: "Hvor kraftigt proben sender. Påvirker patienten: MI og TI.",
            bgain: "Forstærker ekkoerne efter de er kommet tilbage. Påvirker ikke patienten.",
            prf: "Hvor mange pulser pr. sekund. Bestemmer den største fart, der kan måles.",
            base: "Flytter nul-linjen, så der er mere plads til den ene retning.",
            wf: "Fjerner de mindste skift (langsom bevægelse).", dgain: "Forstærker dopplersignalet.",
            f0: "Lavere frekvens giver mindre skift for samme fart.",
            corr: "Sæt stregen i gaten parallelt med karret. Skanneren regner farten ud fra den vinkel.",
            gate: "Hvor lang en strækning af strålen, der måles i.",
            press: "Hvor hårdt du trykker. Ved 100 % er arterien også lidt presset.",
            t: "Hvornår i hjerteslaget (og vejrtrækningen) farvebilledet er taget." },
    k: { angle: "Dopplervinkel", scale: "Skala", shift: "Dopplerskift", speed: "Målt topfart", mi: "MI", ti: "TI",
         veinH: "Venens højde", artH: "Arteriens højde", press: "Tryk", area: "Venens areal" },
    f: { angle: a => a <= 60 ? "60° eller mindre: god" : "over 60°: stor fejl", scale: p => `PRF ${p} kHz, langs strålen`,
         shift: "toppen i gaten", speedTrue: v => `sand: ${v} cm/s`, speedAlias: "aliasing: toppen er skåret af", speedNo: "vælg Spektral",
         gateOut: "gaten er uden for karret", mi: "mekanisk indeks", ti: "termisk indeks, blødt væv",
         veinH: h => h < 0.05 ? "helt sammen" : "i forhold til uden tryk", artH: "i forhold til uden tryk", press: "fra proben", area: "på tværs" },
    see: {
      perp: "Strålen står næsten vinkelret på karrene: næsten intet dopplerskift. Det lidt rødt og blåt, der er, er ikke flow, der vender.",
      dir: "Arterien er {a} og venen {v}: de løber hver sin vej, og farven viser retningen i forhold til strålen.",
      alias: "Midt i arterien slår farven om fra gul til blå: aliasing. Skiftet er større, end skalaen kan måle.",
      mosaic: "Efter forsnævringen er farverne blandede (mosaik): uroligt flow.",
      wf: "Venen er næsten tom for farve: vægfilteret fjerner det langsomme flow.",
      lowscale: "Skalaen er høj i forhold til venens fart: venen bliver mørk og svær at se.",
      noise: "Dopplergain er så højt, at der kommer farvestøj uden for karrene.",
      weak: "Farven fylder ikke karret: for lidt signal. Skru dopplergain op.",
      corr: "Vinkelkorrektionen passer ikke med karret: den målte fart er forkert.",
      gateOut: "Gaten ligger uden for karret: intet signal i spektret.",
      specAlias: "Toppen er skåret af og kommer op fra bunden: aliasing i spektret.",
      broad: "Den lange gate tager både hurtigt og langsomt blod med: spektret er fyldt helt ned (spektral udvidelse).",
      tri: "Arterien: hurtig top, kort tilbageløb og lidt fremad igen i hvert hjerteslag (trifasisk).",
      phasic: "Venen: jævnt flow mod hjertet, der går op og ned med vejrtrækningen.",
      reverse: "Lige nu løber blodet i arterien kort tilbage: derfor skifter den farve.",
      ti: "TI er over 1: hold tiden kort (ALARA).",
      comp: "Venen er trykket helt sammen: ingen trombe her.",
      press0: "Tryk med proben, og se om venen klapper sammen.",
      fresh: "Venen giver ikke efter, selv om arterien bliver presset: tegn på trombe. Den friske trombe er næsten lige så mørk som blod.",
      freshLook: "Venen er lidt større end normalt og næsten sort indeni. Den friske trombe ses dårligt: tryk.",
      old: "Venen er lille med tyk væg og lyst indhold og giver kun lidt efter: ældre trombe.",
      half: "Venen er presset, men ikke helt sammen. Tryk mere.",
      noflow: "Ingen farve i venen: intet flow.",
      base: "Flyt gaten, styr strålen eller vip proben, og se hvad der sker med farven og spektret.",
    },
    labels: { a: "arterie", v: "vene", plaque: "plak", head: "← hoved", feet: "fødder →", lat: "lateralt", med: "medialt", gate: "gate" },
    dec: ",",
    colorWord: { red: "rød", blue: "blå" },
    modelText: `<p><b>Det hele er simuleret.</b> Billederne er regnet ud fra en enkel model. Der er ikke brugt rigtige ultralydsbilleder. Scenen er lysken med en lineær probe: arteria og vena femoralis communis, 4 cm bredt og 4 cm dybt. Arterien har en radius på 3,2 mm, venen 4,5 mm.</p>
<p><b>Flowet.</b> I arterien er farven i midten af karret en fast kurve over et hjerteslag (1 sekund): op til 100 cm/s i systolen, kort tilbage (−22 cm/s) og lidt frem igen (trifasisk, som i benets arterier i hvile). I venen er farten $16 + 6 \\sin(2\\pi t/4)$ cm/s mod hjertet, så den går op og ned med en vejrtrækning på 4 sekunder. Hen over karret er profilen parabolsk: $v(r) = v_0 (1 - r^2/R^2)$. I forsnævringen er radius 40 % mindre, så arealet er $0,6^2 = 0,36$ af før, og farten 2,8 gange større (det samme blod skal igennem). Efter forsnævringen er flowet uroligt: farten svinger tilfældigt op til ±35 %.</p>
<p><b>Dopplerskiftet.</b> $$f_D = \\frac{2 f_0 v \\cos\\theta}{c}$$ med $c$ = 1540 m/s og vinklen $\\theta$ mellem strålen og blodet. Vinklen er $90° - |\\text{vip} + \\text{styring}|$. Rødt er mod proben, blåt væk fra den. Nær 90° giver strålens bredde et lille skift begge veje (±9 % af farten), som ses som blandet rødt og blåt.</p>
<p><b>Aliasing.</b> Skanneren måler med $PRF$ pulser pr. sekund og kan kun skelne skift op til $PRF/2$. Den største fart langs strålen er $$v_{max} = \\frac{c \\cdot PRF}{4 f_0}$$ Over den slås farten om til den modsatte side. Baseline flytter grænsen: nul-linjen rykkes, så den ene retning får mere plads og den anden mindre. Vægfilteret fjerner skift under den valgte grænse i Hz.</p>
<p><b>Spektret.</b> Gaten er en strækning af strålen (1,5 mm). For hvert øjeblik tælles skiftene fra blodet i gaten. Hvert skift bredes lidt ud (strålens bredde), mere jo hurtigere blodet går. Skanneren viser farten $f_D c / (2 f_0 \\cos\\theta_k)$, hvor $\\theta_k$ er den vinkel, du har sat med vinkelkorrektionen. Er den forkert, bliver farten forkert.</p>
<p><b>Kompression.</b> En normal vene klapper helt sammen ved 45 % tryk. En frisk trombe gør venen 15 % større og næsten sort (−21 dB i forhold til muskel), og venen giver kun 4 % efter. En ældre trombe gør venen mindre, væggen tykkere og indholdet lysere, og venen giver op til 30 % efter. Arterien giver højst 8 % efter. På tværs er proben tænkt vippet 20° mod hovedet, så dopplervinklen er 70°.</p>
<p><b>MI og TI.</b> Ved fuld udgangseffekt, 5 MHz og 4 kHz: B-billede MI 1,2 og TI 0,4; farve og power MI 1,0 og TI 0,6; spektral MI 0,8 og TI 1,0. MI følger trykket i pulsen: $MI = p_r / \\sqrt{f}$, så det falder med 20 log (−6 dB halverer MI) og stiger ved lavere frekvens. TI følger den energi, der sendes ind: det falder med 10 log (−6 dB giver en fjerdedel) og stiger med PRF i farve og spektral. Rigtige skannere regner MI og TI ud fra målinger på den enkelte probe.</p>
<p><b>Det er ikke med.</b> Dæmpning og dybdeforstærkning (billedet er jævnt), farveboksens størrelse og billedfrekvens, blooming, spejlbilleder af kar, TI for knogle og kranie, opvarmning over tid, kontraststof og hjertets eller vejrtrækningens bevægelse af vævet. Tallene er typiske lærebogsværdier, ikke tal fra en bestemt skanner.</p>
<p>Kilder: Hoskins, Martin og Thrush, Diagnostic Ultrasound: Physics and Equipment, 3. udg. (2019). Gibbs, Cole og Sassano, Ultrasound Physics and Technology (2009). BMUS, Guidelines for the safe use of diagnostic ultrasound equipment (2010). Needleman m.fl., Ultrasound for lower extremity deep venous thrombosis, Circulation 2018;137:1505–1515.</p>`,
    groups: [
      ["Farve og retning", [
        ["Vinkelret", "Tryk Nulstil alt, og sæt Styring af strålen til 0°. Hvorfor er der næsten ingen farve i karrene?", "Strålen går lodret ned, og blodet løber vandret. Vinklen er 90°, og $\\cos 90° = 0$, så der er intet dopplerskift. Det lille, der er, er blandet rødt og blåt, fordi strålen ikke er uendelig smal. Det er ikke flow, der vender."],
        ["Styr strålen", "Sæt Styring til −20° og så til +20°. Hvad sker der med farven i arterien og i venen?", "Ved −20° er arterien rød og venen blå. Ved +20° bytter de. Farven viser retningen i forhold til strålen: rød er mod proben, blå er væk fra den. Den siger ikke, om det er en arterie eller en vene."],
        ["Hvilken vej?", "Styring −20°. Hovedet er til venstre i billedet. Hvilken vej løber blodet i arterien og i venen, og passer det med farverne?", "Arterien løber mod fødderne (til højre). Strålen peger skråt ned mod venstre, så blodet i arterien løber mod proben: rødt. Venen løber mod hjertet (til venstre), væk fra proben: blåt."],
        ["Rød er ikke arterie", "En kollega siger: \"Det røde er arterien.\" Hvorfor er det ikke en sikker regel?", "Farven afhænger af, hvordan strålen er styret, og farveskalaen kan vendes på skanneren. Brug spektret (arterien pulserer) og anatomien til at skelne. I lysken ligger venen medialt for arterien."],
      ]],
      ["Vinklen", [
        ["Vip proben", "Tryk Nulstil alt. Vip proben til −10°. Hvad bliver dopplervinklen, og hvad sker der med farven i arterien?", "Vinklen går fra 70° til 60°. Strålen ligger mere langs med blodet, så skiftet bliver større, og farven lysere. Midt i arterien slår farven om til blå i systolen. Det er aliasing, som du ser på i de næste opgaver."],
        ["Vinkelkorrektion", "Tryk Nulstil alt, og vælg Spektral. Gaten sidder i arterien, og topfarten er 100 cm/s. Hvad viser skanneren med vinkelkorrektion 0°? Tryk så Ret ind efter karret.", "Med 0° viser den 34 cm/s, kun den del af farten, der går langs strålen ($100 \\cdot \\cos 70°$). Efter Ret ind regner den med 70° og viser 100 cm/s. Sæt altid stregen parallelt med karret."],
        ["5 grader forkert", "Ret ind ved 70° (vip 0°). Sæt så vinkelkorrektionen 5° for højt (75°). Hvor meget for høj bliver topfarten? Gør det samme ved 50° (vip −20°, og skalaen op på 12 kHz, så toppen ikke aliaser): sæt 55°.", "Ved 70° viser den 132 cm/s: 32 % for højt. Ved 50° bliver den 12 % for høj ($\\cos 50° / \\cos 55° = 1,12$). Jo større vinklen er, jo mere betyder en lille fejl."],
        ["Under 60°", "Hvorfor skal dopplervinklen være 60° eller mindre, når du måler fart?", "Cosinus falder stejlt mod 90°. Ved 60° giver 5° fejl 18 % forkert fart, ved 70° 32 %, og nær 90° bliver fejlen meget stor. Derfor vipper man proben og styrer strålen, så vinklen kommer under 60°."],
      ]],
      ["Skala og aliasing", [
        ["Forsnævringen", "Tryk Nulstil alt, og tænd Forsnævring i arterien. Hvorfor er der gult og blåt midt i det røde lige efter plakken?", "I forsnævringen går blodet 2,8 gange hurtigere, cirka 270 cm/s i midten. Langs strålen er det cirka 92 cm/s, men skalaen kan kun måle 46. Over grænsen slår farven om til den modsatte: aliasing. Længere fremme er farverne blandede (mosaik), fordi flowet er uroligt."],
        ["Fjern aliasing", "Hvilke knapper fjerner aliasing i forsnævringen? Prøv skala, baseline og dopplerfrekvens.", "Højere skala (PRF) hæver grænsen: ved 12 kHz er den 92 cm/s. Lavere dopplerfrekvens giver mindre skift: 4 MHz og 12 kHz giver 115 cm/s, og næsten al aliasingen i forsnævringen er væk. Flyt baseline (+50 %), så er resten også væk. Efter forsnævringen er farven stadig uens, fordi flowet er uroligt. Baseline flytter grænsen, så den positive side får mere plads. En større vinkel hjælper også, men gør målingen mere usikker."],
        ["Aliasing i spektret", "Vælg Spektral, og klik med gaten midt i forsnævringen. Tryk Ret ind efter karret. Hvordan ser aliasing ud i spektret?", "Toppen bliver skåret af og kommer op fra bunden af spektret, så det ser ud, som om blodet løber den anden vej. Hæv skalaen eller sænk baseline, til hele toppen er over baseline."],
        ["Skala til venen", "Sluk forsnævringen. Sæt skalaen til 0,5 kHz og så til 12 kHz. Hvad sker der med venen?", "Ved 0,5 kHz er grænsen kun 3,9 cm/s, så både arterie og vene aliaser. Ved 12 kHz er venen næsten sort, fordi dens fart er lille i forhold til skalaen. Skalaen skal passe til den fart, du vil se: lav til vener, høj til arterier."],
        ["Vægfilteret", "Tryk Nulstil alt. Skru vægfilteret op til 400 Hz. Hvad sker der med venen?", "Venen bliver næsten tom for farve. Vægfilteret skal fjerne de små skift fra karvæggen, der bevæger sig, men for højt filter fjerner også langsomt blod. Så kan en åben vene se tom ud, som ved en trombe. Brug lavt vægfilter til vener."],
      ]],
      ["Spektret", [
        ["Arterie og vene", "Tryk Nulstil alt, og vælg Spektral. Se på arteriens spektrum. Klik så gaten ned i venen. Beskriv de to kurver.", "Arterien: en hurtig top hvert sekund, så et kort tilbageløb under baseline og lidt frem igen (trifasisk). Venen: jævnt flow under baseline (væk fra proben), der går langsomt op og ned med vejrtrækningen."],
        ["Øjeblikket", "Vælg Farve, og stil Øjeblik på 0,28 s. Hvorfor bliver arterien blå?", "Ved 0,28 s løber blodet kort tilbage i arterien (det er tilbageløbet i spektret). Det er normalt i benets arterier i hvile. Farven skifter, fordi retningen skifter."],
        ["Dopplergain", "Skru dopplergain op til +15 og så ned til −15. Hvad sker der i farvebilledet og i spektret?", "For højt: farvestøj uden for karrene og grå støj i hele spektret. For lavt: farven fylder ikke karret, og spektret bliver svagt. Skru op, til der kommer støj, og så lidt ned igen."],
        ["Gatens længde", "Fordybelse: vælg Spektral, og gør gaten 6 mm lang i arterien. Hvad sker der med vinduet under toppen?", "Det fyldes op. En lang gate tager både det hurtige blod i midten og det langsomme ved væggen med, så spektret bliver bredt (spektral udvidelse). En kort gate i midten giver en smal kurve med et rent vindue under.", { deep: true }],
      ]],
      ["Kompression og DVT", [
        ["Tryk på venen", "Vælg scenen Tværs, og tryk langsomt fra 0 til 60 %. Hvad sker der med venen og arterien?", "Venen klapper helt sammen ved cirka 45 %, mens arterien næsten ikke ændrer sig. En vene, der kan trykkes helt sammen, har ingen trombe på det sted."],
        ["Frisk trombe", "Vælg Trombe i venen: Frisk, med Tryk på 0. Kan du se tromben? Tryk så op til 60 %.", "Næsten ikke: den friske trombe er næsten lige så sort som blod. Venen er lidt større end normalt. Når du trykker, giver venen ikke efter, selv om arterien bliver presset lidt. Det er kompressionen, der afslører tromben, ikke billedet."],
        ["Ældre trombe", "Vælg Trombe: Ældre. Hvordan ser venen ud, og hvordan opfører den sig, når du trykker?", "Venen er mindre, væggen tykkere og indholdet lysere. Den giver kun lidt efter. Det ligner en ældre trombe, der er ved at blive til arvæv."],
        ["Farve på tværs", "Vælg Farve på Tværs, først uden trombe og så med frisk trombe. Hvad viser farven?", "Uden trombe er der farve i både arterie og vene. Med trombe er venen uden farve. Farve kan støtte diagnosen, men kompression er hovedtesten. Brug lav skala og lavt vægfilter, ellers kan langsomt venøst flow se ud som ingenting."],
      ]],
      ["Sikkerhed", [
        ["MI og TI", "Tryk Nulstil alt. Skift mellem B, Farve og Spektral. Hvor er MI højest, og hvor er TI højest?", "MI er højest i B-billedet (1,2), TI er højest i Spektral (1,5). MI handler om trykket i den enkelte puls (mekanisk virkning). TI handler om opvarmning: i Spektral sendes mange pulser ned ad den samme linje, så energien samles ét sted."],
        ["ALARA", "Vælg B. Sæt udgangseffekten ned til −6 dB, og skru gain op med 6 dB. Hvad sker der med billedet, MI og TI?", "Billedet ser næsten ens ud. MI halveres (1,2 til 0,6), og TI bliver en fjerdedel (0,4 til 0,1). Gain virker kun på det, der kommer tilbage, og påvirker ikke patienten. Brug derfor gain før udgangseffekt: så lavt som rimeligt muligt (ALARA)."],
        ["Skalaen koster", "Vælg Spektral. Sæt skalaen fra 6 til 12 kHz. Hvad sker der med TI?", "TI fordobles, fra 1,5 til 3,0. Flere pulser pr. sekund sender mere energi ind. Brug ikke højere skala end nødvendigt, og hold tiden med spektral kort, især ved foster."],
        ["Grænserne", "Hvornår skal du være ekstra varsom med MI og TI?", "Ved foster og nyfødte og ved øjet. Hold TI lavt (under 0,7 ved foster), og begræns tiden, jo højere TI er. Ved kontraststof med gasbobler kan MI over 0,7 få boblerne til at sprænge. Brug kun Doppler på et tidligt foster, hvis der er en klinisk grund."],
        ["Probehygiejne", "Proben har været brugt på en patient med et sår i lysken. Hvad gør du, før den næste patient?", "Tør gelen af, rengør og desinficer proben efter afdelingens retningslinje. Ved sår, slimhinder eller sterile procedurer bruges probeovertræk og steril gel, og proben højniveau-desinficeres bagefter. Gelflasker kan også smitte."],
      ]],
    ],
  },
  en: {
    title: "Doppler and safety", sub: "Simulator: colour, power and spectral Doppler in the groin, compressing the vein when DVT is suspected, and what MI and TI tell you.",
    simTitle: "Simulator: Doppler and safety", grund: "Basic", deep: "Deeper level", back: "← Ultrasound",
    image: "The image", graph: { spec: "The spectrum in the gate", prof: "Speed along the beam through the gate", comp: "The vessels' height against the pressure" },
    note: { spec: "Time across (4 seconds), speed up and down. Above the horizontal line (baseline) the blood flows towards the probe. The speed is angle corrected with the angle you have set. The vertical line is the moment shown in the colour image.",
            prof: "Along the dashed line through the gate, from the top of the colour box down. Dashed grey: the true speed of the blood along the beam. Solid: what the scanner measures. The orange lines are the limit the scale can measure. The grey band is the wall filter.",
            comp: "The height of the vein (blue) and the artery (red) compared with no pressure. The dots show where you are now." },
    imgNote: "Simulated image, not a real scanner image. Long: click in the image to move the gate.",
    tasks: "Tasks", answer: "Show answer", of: "of", prev: "Previous task", next: "Next task",
    model: "How the model works", foot: "© 2026 Oliver Brage. All rights reserved.", privacy: "Privacy",
    seen: "What you can see:", pin: "Save the numbers", unpin: "Remove saved", saved: "saved",
    grp: { scene: "Scene and mode", probe: "The probe", dop: "Doppler", patient: "The patient", time: "Time" },
    ctl: { scene: "Scene", long: "Long", trans: "Across", mode: "Mode", b: "B", color: "Colour", power: "Power", spec: "Spectral",
           tilt: "Tilt the probe (heel-toe)", steer: "Beam steering", out: "Output power", bgain: "Gain (B-mode)",
           prf: "Scale (PRF)", base: "Baseline", wf: "Wall filter", dgain: "Doppler gain", f0: "Doppler frequency", corr: "Angle correction",
           align: "Align with the vessel", gate: "Gate length", sten: "Stenosis in the artery", clot: "Clot in the vein", none: "None",
           fresh: "Fresh", old: "Older", press: "Probe pressure", t: "Moment", names: "Show names", on: "On", off: "Off", reset: "Reset all" },
    help: { scene: "Long: artery and vein in the groin, lengthwise. Across: the same vessels across, for compression.",
            mode: "B: grey scale only. Colour: direction and speed. Power: only that there is flow. Spectral: the speed over time in the gate.",
            tilt: "Press with the heel or the toe of the probe, so the vessel slopes in the image.",
            steer: "The scanner sends the Doppler beam at a slant. The colour box and the gate follow.",
            out: "How strongly the probe transmits. Affects the patient: MI and TI.",
            bgain: "Amplifies the echoes after they have come back. Does not affect the patient.",
            prf: "How many pulses per second. Sets the highest speed that can be measured.",
            base: "Moves the zero line, so there is more room for one direction.",
            wf: "Removes the smallest shifts (slow movement).", dgain: "Amplifies the Doppler signal.",
            f0: "A lower frequency gives a smaller shift for the same speed.",
            corr: "Set the line in the gate parallel to the vessel. The scanner works out the speed from that angle.",
            gate: "How long a stretch of the beam is measured.",
            press: "How hard you press. At 100 % the artery is pressed a little too.",
            t: "When in the heartbeat (and the breath) the colour image is taken." },
    k: { angle: "Doppler angle", scale: "Scale", shift: "Doppler shift", speed: "Measured peak speed", mi: "MI", ti: "TI",
         veinH: "Vein height", artH: "Artery height", press: "Pressure", area: "Vein area" },
    f: { angle: a => a <= 60 ? "60° or less: good" : "over 60°: large error", scale: p => `PRF ${p} kHz, along the beam`,
         shift: "the peak in the gate", speedTrue: v => `true: ${v} cm/s`, speedAlias: "aliasing: the peak is cut off", speedNo: "choose Spectral",
         gateOut: "the gate is outside the vessel", mi: "mechanical index", ti: "thermal index, soft tissue",
         veinH: h => h < 0.05 ? "fully closed" : "compared with no pressure", artH: "compared with no pressure", press: "from the probe", area: "across" },
    see: {
      perp: "The beam is almost at right angles to the vessels: almost no Doppler shift. The little red and blue there is, is not flow changing direction.",
      dir: "The artery is {a} and the vein {v}: they flow opposite ways, and the colour shows the direction relative to the beam.",
      alias: "In the middle of the artery the colour flips from yellow to blue: aliasing. The shift is larger than the scale can measure.",
      mosaic: "After the stenosis the colours are mixed (mosaic): disturbed flow.",
      wf: "The vein is almost empty of colour: the wall filter removes the slow flow.",
      lowscale: "The scale is high compared with the vein's speed: the vein turns dark and is hard to see.",
      noise: "The Doppler gain is so high that colour noise appears outside the vessels.",
      weak: "The colour does not fill the vessel: too little signal. Turn the Doppler gain up.",
      corr: "The angle correction does not match the vessel: the measured speed is wrong.",
      gateOut: "The gate is outside the vessel: no signal in the spectrum.",
      specAlias: "The peak is cut off and comes up from the bottom: aliasing in the spectrum.",
      broad: "The long gate takes in both fast and slow blood: the spectrum is filled all the way down (spectral broadening).",
      tri: "The artery: a fast peak, a short reverse and a little forward again in every heartbeat (triphasic).",
      phasic: "The vein: steady flow towards the heart that rises and falls with breathing.",
      reverse: "Right now the blood in the artery flows briefly backwards: that is why it changes colour.",
      ti: "TI is over 1: keep the time short (ALARA).",
      comp: "The vein is pressed fully closed: no clot here.",
      press0: "Press with the probe, and see whether the vein collapses.",
      fresh: "The vein does not give, even though the artery is pressed: a sign of a clot. The fresh clot is almost as dark as blood.",
      freshLook: "The vein is a little larger than normal and almost black inside. The fresh clot is hard to see: press.",
      old: "The vein is small with a thick wall and bright content and gives only a little: an older clot.",
      half: "The vein is pressed, but not fully closed. Press harder.",
      noflow: "No colour in the vein: no flow.",
      base: "Move the gate, steer the beam or tilt the probe, and see what happens to the colour and the spectrum.",
    },
    labels: { a: "artery", v: "vein", plaque: "plaque", head: "← head", feet: "feet →", lat: "lateral", med: "medial", gate: "gate" },
    dec: ".",
    colorWord: { red: "red", blue: "blue" },
    modelText: `<p><b>Everything is simulated.</b> The images are worked out from a simple model. No real ultrasound images are used. The scene is the groin with a linear probe: the common femoral artery and vein, 4 cm wide and 4 cm deep. The artery has a radius of 3.2 mm, the vein 4.5 mm.</p>
<p><b>The flow.</b> In the artery the speed in the middle of the vessel follows a fixed curve over one heartbeat (1 second): up to 100 cm/s in systole, briefly backwards (−22 cm/s) and a little forward again (triphasic, as in the leg arteries at rest). In the vein the speed is $16 + 6 \\sin(2\\pi t/4)$ cm/s towards the heart, so it rises and falls with a breath of 4 seconds. Across the vessel the profile is parabolic: $v(r) = v_0 (1 - r^2/R^2)$. In the stenosis the radius is 40 % smaller, so the area is $0.6^2 = 0.36$ of before, and the speed 2.8 times higher (the same blood has to get through). After the stenosis the flow is disturbed: the speed varies at random by up to ±35 %.</p>
<p><b>The Doppler shift.</b> $$f_D = \\frac{2 f_0 v \\cos\\theta}{c}$$ with $c$ = 1540 m/s and the angle $\\theta$ between the beam and the blood. The angle is $90° - |\\text{tilt} + \\text{steering}|$. Red is towards the probe, blue away from it. Near 90° the width of the beam gives a small shift both ways (±9 % of the speed), seen as mixed red and blue.</p>
<p><b>Aliasing.</b> The scanner measures with $PRF$ pulses per second and can only tell shifts up to $PRF/2$. The highest speed along the beam is $$v_{max} = \\frac{c \\cdot PRF}{4 f_0}$$ Above it the speed wraps to the opposite side. The baseline moves the limit: the zero line is moved, so one direction gets more room and the other less. The wall filter removes shifts below the chosen limit in Hz.</p>
<p><b>The spectrum.</b> The gate is a stretch of the beam (1.5 mm). For each moment the shifts from the blood in the gate are counted. Each shift is spread a little (the width of the beam), more the faster the blood moves. The scanner shows the speed $f_D c / (2 f_0 \\cos\\theta_k)$, where $\\theta_k$ is the angle you have set with the angle correction. If it is wrong, the speed is wrong.</p>
<p><b>Compression.</b> A normal vein collapses fully at 45 % pressure. A fresh clot makes the vein 15 % larger and almost black (−21 dB relative to muscle), and the vein gives only 4 %. An older clot makes the vein smaller, the wall thicker and the content brighter, and the vein gives up to 30 %. The artery gives at most 8 %. Across, the probe is assumed tilted 20° towards the head, so the Doppler angle is 70°.</p>
<p><b>MI and TI.</b> At full output power, 5 MHz and 4 kHz: B-mode MI 1.2 and TI 0.4; colour and power MI 1.0 and TI 0.6; spectral MI 0.8 and TI 1.0. MI follows the pressure in the pulse: $MI = p_r / \\sqrt{f}$, so it falls with 20 log (−6 dB halves MI) and rises at a lower frequency. TI follows the energy sent in: it falls with 10 log (−6 dB gives a quarter) and rises with the PRF in colour and spectral. Real scanners work out MI and TI from measurements on each probe.</p>
<p><b>Not included.</b> Attenuation and time gain compensation (the image is even), the size of the colour box and the frame rate, blooming, mirror images of vessels, TI for bone and skull, heating over time, contrast agents and movement of the tissue by the heart or breathing. The numbers are typical textbook values, not numbers from a particular scanner.</p>
<p>Sources: Hoskins, Martin and Thrush, Diagnostic Ultrasound: Physics and Equipment, 3rd ed. (2019). Gibbs, Cole and Sassano, Ultrasound Physics and Technology (2009). BMUS, Guidelines for the safe use of diagnostic ultrasound equipment (2010). Needleman et al., Ultrasound for lower extremity deep venous thrombosis, Circulation 2018;137:1505–1515.</p>`,
    groups: [
      ["Colour and direction", [
        ["At right angles", "Press Reset all, and set Beam steering to 0°. Why is there almost no colour in the vessels?", "The beam goes straight down, and the blood flows sideways. The angle is 90°, and $\\cos 90° = 0$, so there is no Doppler shift. The little there is, is mixed red and blue, because the beam is not infinitely narrow. It is not flow changing direction."],
        ["Steer the beam", "Set Steering to −20° and then to +20°. What happens to the colour in the artery and the vein?", "At −20° the artery is red and the vein blue. At +20° they swap. The colour shows the direction relative to the beam: red is towards the probe, blue away from it. It does not say whether it is an artery or a vein."],
        ["Which way?", "Steering −20°. The head is on the left of the image. Which way does the blood flow in the artery and in the vein, and does it match the colours?", "The artery flows towards the feet (to the right). The beam points down and to the left, so the blood in the artery flows towards the probe: red. The vein flows towards the heart (to the left), away from the probe: blue."],
        ["Red is not artery", "A colleague says: \"The red one is the artery.\" Why is that not a safe rule?", "The colour depends on how the beam is steered, and the colour scale can be inverted on the scanner. Use the spectrum (the artery pulsates) and the anatomy to tell them apart. In the groin the vein lies medial to the artery."],
      ]],
      ["The angle", [
        ["Tilt the probe", "Press Reset all. Tilt the probe to −10°. What is the Doppler angle now, and what happens to the colour in the artery?", "The angle goes from 70° to 60°. The beam lies more along the blood, so the shift is larger and the colour brighter. In the middle of the artery the colour flips to blue in systole. That is aliasing, which the next tasks look at."],
        ["Angle correction", "Press Reset all, and choose Spectral. The gate is in the artery, and the peak speed is 100 cm/s. What does the scanner show with angle correction 0°? Then press Align with the vessel.", "With 0° it shows 34 cm/s, only the part of the speed along the beam ($100 \\cdot \\cos 70°$). After aligning it uses 70° and shows 100 cm/s. Always set the line parallel to the vessel."],
        ["5 degrees off", "Align at 70° (tilt 0°). Then set the angle correction 5° too high (75°). How much too high is the peak speed? Do the same at 50° (tilt −20°, and the scale up to 12 kHz so the peak does not alias): set 55°.", "At 70° it shows 132 cm/s: 32 % too high. At 50° it is 12 % too high ($\\cos 50° / \\cos 55° = 1.12$). The larger the angle, the more a small error matters."],
        ["Under 60°", "Why should the Doppler angle be 60° or less when you measure speed?", "The cosine falls steeply towards 90°. At 60° an error of 5° gives a speed 18 % wrong, at 70° 32 %, and near 90° the error becomes very large. That is why you tilt the probe and steer the beam to get the angle under 60°."],
      ]],
      ["Scale and aliasing", [
        ["The stenosis", "Press Reset all, and turn on Stenosis in the artery. Why is there yellow and blue in the middle of the red just after the plaque?", "In the stenosis the blood moves 2.8 times faster, about 270 cm/s in the middle. Along the beam that is about 92 cm/s, but the scale can only measure 46. Above the limit the colour flips to the opposite: aliasing. Further on the colours are mixed (mosaic), because the flow is disturbed."],
        ["Remove aliasing", "Which knobs remove the aliasing in the stenosis? Try scale, baseline and Doppler frequency.", "A higher scale (PRF) raises the limit: at 12 kHz it is 92 cm/s. A lower Doppler frequency gives a smaller shift: 4 MHz and 12 kHz give 115 cm/s, and almost all the aliasing in the stenosis is gone. Move the baseline (+50 %), and the rest goes too. After the stenosis the colour is still uneven, because the flow is disturbed. The baseline moves the limit, so the positive side gets more room. A larger angle helps too, but makes the measurement less certain."],
        ["Aliasing in the spectrum", "Choose Spectral, and click the gate into the middle of the stenosis. Press Align with the vessel. What does aliasing look like in the spectrum?", "The peak is cut off and comes up from the bottom of the spectrum, so it looks as if the blood flows the other way. Raise the scale or lower the baseline until the whole peak is above the baseline."],
        ["Scale for the vein", "Turn off the stenosis. Set the scale to 0.5 kHz and then to 12 kHz. What happens to the vein?", "At 0.5 kHz the limit is only 3.9 cm/s, so both artery and vein alias. At 12 kHz the vein is almost black, because its speed is small compared with the scale. The scale must suit the speed you want to see: low for veins, high for arteries."],
        ["The wall filter", "Press Reset all. Turn the wall filter up to 400 Hz. What happens to the vein?", "The vein becomes almost empty of colour. The wall filter is there to remove the small shifts from the moving vessel wall, but too high a filter also removes slow blood. An open vein can then look empty, as with a clot. Use a low wall filter for veins."],
      ]],
      ["The spectrum", [
        ["Artery and vein", "Press Reset all, and choose Spectral. Look at the artery's spectrum. Then click the gate down into the vein. Describe the two curves.", "The artery: a fast peak every second, then a short reverse below the baseline and a little forward again (triphasic). The vein: steady flow below the baseline (away from the probe) that slowly rises and falls with breathing."],
        ["The moment", "Choose Colour, and set Moment to 0.28 s. Why does the artery turn blue?", "At 0.28 s the blood in the artery flows briefly backwards (that is the reverse in the spectrum). It is normal in the leg arteries at rest. The colour changes because the direction changes."],
        ["Doppler gain", "Turn the Doppler gain up to +15 and then down to −15. What happens in the colour image and in the spectrum?", "Too high: colour noise outside the vessels and grey noise all over the spectrum. Too low: the colour does not fill the vessel, and the spectrum gets faint. Turn it up until noise appears, then down a little."],
        ["Gate length", "Deeper level: choose Spectral, and make the gate 6 mm long in the artery. What happens to the window under the peak?", "It fills up. A long gate takes in both the fast blood in the middle and the slow blood at the wall, so the spectrum gets broad (spectral broadening). A short gate in the middle gives a narrow curve with a clear window underneath.", { deep: true }],
      ]],
      ["Compression and DVT", [
        ["Press on the vein", "Choose the scene Across, and press slowly from 0 to 60 %. What happens to the vein and the artery?", "The vein collapses fully at about 45 %, while the artery hardly changes. A vein that can be pressed fully closed has no clot at that spot."],
        ["Fresh clot", "Choose Clot in the vein: Fresh, with the pressure at 0. Can you see the clot? Then press up to 60 %.", "Hardly: the fresh clot is almost as black as blood. The vein is a little larger than normal. When you press, the vein does not give, even though the artery is pressed a little. It is the compression that reveals the clot, not the image."],
        ["Older clot", "Choose Clot: Older. What does the vein look like, and how does it behave when you press?", "The vein is smaller, the wall thicker and the content brighter. It gives only a little. It looks like an older clot that is turning into scar tissue."],
        ["Colour across", "Choose Colour in Across, first without a clot and then with a fresh clot. What does the colour show?", "Without a clot there is colour in both artery and vein. With a clot the vein has no colour. Colour can support the diagnosis, but compression is the main test. Use a low scale and a low wall filter, or slow venous flow can look like nothing."],
      ]],
      ["Safety", [
        ["MI and TI", "Press Reset all. Switch between B, Colour and Spectral. Where is MI highest, and where is TI highest?", "MI is highest in B-mode (1.2), TI is highest in Spectral (1.5). MI is about the pressure in each pulse (mechanical effect). TI is about heating: in Spectral many pulses are sent down the same line, so the energy gathers in one place."],
        ["ALARA", "Choose B. Turn the output power down to −6 dB, and turn the gain up by 6 dB. What happens to the image, MI and TI?", "The image looks almost the same. MI is halved (1.2 to 0.6), and TI falls to a quarter (0.4 to 0.1). Gain only acts on what comes back and does not affect the patient. So use gain before output power: as low as reasonably achievable (ALARA)."],
        ["The scale costs", "Choose Spectral. Set the scale from 6 to 12 kHz. What happens to TI?", "TI doubles, from 1.5 to 3.0. More pulses per second send more energy in. Do not use a higher scale than you need, and keep the time with spectral short, especially for a fetus."],
        ["The limits", "When should you take extra care with MI and TI?", "With a fetus or a newborn, and at the eye. Keep TI low (under 0.7 for a fetus), and limit the time the higher TI is. With contrast agents containing gas bubbles, an MI over 0.7 can make the bubbles burst. Use Doppler on an early fetus only when there is a clinical reason."],
        ["Probe hygiene", "The probe has been used on a patient with a wound in the groin. What do you do before the next patient?", "Wipe off the gel, clean and disinfect the probe following the department's guideline. With wounds, mucous membranes or sterile procedures, use a probe cover and sterile gel, and give the probe high-level disinfection afterwards. Gel bottles can spread infection too."],
      ]],
    ],
  },
};

const $ = id => document.getElementById(id);
let M = DP.model(S);
let PIN = null;
const CSS = {}, css = n => CSS[n] || (CSS[n] = getComputedStyle(document.documentElement).getPropertyValue(n).trim());
const fmt = (v, d = 1) => v.toFixed(d).replace(".", T[S.lang].dec);
const math = s => withMath(s);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
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

// ---- fixed speckle: random complex scatterers blurred by the beam (sideways) and the pulse (downwards) ----
const NX = DP.NX, NZ = DP.NZ, SPK = new Float32Array(NX * NZ), NOISE = new Float32Array(NX * NZ);
{
  let seed = 7;
  const rnd = () => { seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t ^= t + Math.imul(t ^ t >>> 7, 61 | t); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const re = new Float32Array(NX * NZ), im = new Float32Array(NX * NZ);
  for (let i = 0; i < NX * NZ; i++) {
    const r = Math.sqrt(-2 * Math.log(rnd() + 1e-9)), a = 2 * Math.PI * rnd();
    re[i] = r * Math.cos(a); im[i] = r * Math.sin(a); NOISE[i] = -Math.log(rnd() + 1e-9);
  }
  const blur = (a, rx, rz) => {
    const tmp = new Float32Array(a.length);
    for (let z = 0; z < NZ; z++) for (let x = 0; x < NX; x++) {
      let s = 0; for (let k = -rx; k <= rx; k++) s += a[z * NX + clamp(x + k, 0, NX - 1)]; tmp[z * NX + x] = s;
    }
    for (let z = 0; z < NZ; z++) for (let x = 0; x < NX; x++) {
      let s = 0; for (let k = -rz; k <= rz; k++) s += tmp[clamp(z + k, 0, NZ - 1) * NX + x]; a[z * NX + x] = s;
    }
  };
  blur(re, 2, 1); blur(im, 2, 1);
  let mean = 0; for (let i = 0; i < NX * NZ; i++) mean += re[i] * re[i] + im[i] * im[i];
  mean /= NX * NZ;
  for (let i = 0; i < NX * NZ; i++) SPK[i] = 10 * Math.log10((re[i] * re[i] + im[i] * im[i]) / mean + 1e-6);
}
const cellX = i => -DP.W / 2 + (i + 0.5) * DP.W / NX, cellZ = j => (j + 0.5) * DP.D / NZ;

// tissue levels are only worked out again when the anatomy changes
const LV = new Float32Array(NX * NZ);
let LVKEY = "";
function tissueMap() {
  const key = [S.scene, S.tilt, S.sten, S.clot, S.press].join("|");
  if (key === LVKEY) return;
  LVKEY = key;
  for (let j = 0; j < NZ; j++) for (let i = 0; i < NX; i++) LV[j * NX + i] = DP.tissue(cellX(i), cellZ(j), M.G, S);
}

// ---- the colour box and the colour/power overlay ----
const BOX = { long: { x: 1.3, z0: 0.9, z1: 3.4 }, trans: { x: 1.4, z0: 1.0, z1: 3.0 } };
function inBox(x, z) {
  const B = BOX[S.scene];
  if (z < B.z0 || z > B.z1) return false;
  const xb = S.scene === "long" ? x - (z - B.z0) * Math.tan(DP.rad(S.steer)) : x;
  return Math.abs(xb) <= B.x;
}
const CXN = 100, CZN = 100;                                  // colour cells: 0.4 mm
const COL = new Uint8ClampedArray(CXN * CZN * 4);
let COLSTAT = {};
function colourMap(u) {                                      // u in [-1, 1]: towards (red to yellow) or away (blue to cyan)
  const a = Math.min(1, Math.abs(u));
  if (u >= 0) return [110 + 145 * Math.min(1, a * 1.6), 235 * Math.max(0, (a - 0.55) / 0.45), 20];
  return [20, 200 * Math.max(0, (a - 0.55) / 0.45), 120 + 135 * Math.min(1, a * 1.6)];
}
function colourOverlay() {
  COL.fill(0);
  COLSTAT = { alias: 0, mosaic: false, vein: 0, veinCells: 0, art: 0, artSign: 0, veinSign: 0, noise: 0, weak: false };
  if (S.mode !== "color" && S.mode !== "power") return;
  const n = M.nyq, wv = M.wallV, det = S.out + S.dgain + (S.mode === "power" ? 6 : 0);
  const tk = Math.round(S.t * 50);
  let artFound = 0, artDet = 0;
  for (let j = 0; j < CZN; j++) for (let i = 0; i < CXN; i++) {
    const x = -DP.W / 2 + (i + 0.5) * DP.W / CXN, z = (j + 0.5) * DP.D / CZN;
    if (!inBox(x, z)) continue;
    const o = (j * CXN + i) * 4, h1 = DP.hash(i + 0.37 * tk, j), h2 = DP.hash(j + 13.1, i + tk), h3 = DP.hash(i * 3.3 + tk, j * 1.7);
    const F = DP.flow(x, z, M.G, S, S.t);
    if (F) {
      const L = DP.lumen(x, z, M.G, S);
      if (F.id === "v") COLSTAT.veinCells++;
      // the beam's width spreads the angle a little; disturbed flow adds random speed
      let vt = F.toward + 0.09 * F.v * (2 * h3 - 1) + (F.turb ? F.turb * Math.abs(F.toward) * (2 * h2 - 1) * 1.6 : 0);
      if (F.turb > 0.15) COLSTAT.mosaic = true;
      const pf = clamp((det + 14) / 14 - 0.5 * L.rn * L.rn, 0, 1);
      if (F.id === "a") artFound++;
      if (h1 > pf) continue;
      if (F.id === "a") artDet++;
      if (S.mode === "power") {
        if (Math.abs(vt) < wv) continue;
        const k = (0.45 + 0.55 * Math.sqrt(Math.max(0, 1 - L.rn * L.rn))) * (0.85 + 0.15 * h2);
        COL.set([255 * k, 150 * k * k, 40 * k, 235], o);
        if (F.id === "v") COLSTAT.vein++;
        continue;
      }
      const vm = DP.wrap(vt, S);
      if (Math.abs(vm) < wv) continue;
      if (Math.sign(vm) !== Math.sign(vt) && Math.abs(vt) > wv) COLSTAT.alias++;
      const u = vm >= 0 ? vm / ((1 + S.base) * n) : vm / ((1 - S.base) * n);
      const [r, g, b] = colourMap(u);
      COL.set([r, g, b, 235], o);
      if (F.id === "v") { COLSTAT.vein++; COLSTAT.veinSign += Math.sign(vm); }
      if (F.id === "a") { COLSTAT.art++; COLSTAT.artSign += Math.sign(vm); }
    } else {
      // colour noise in the tissue when the Doppler gain is too high
      const pn = clamp((det - 8) / 25, 0, 0.5);
      if (h1 < pn) {
        if (S.mode === "power") COL.set([200, 110, 30, 200], o);
        else { const [r, g, b] = colourMap(2 * h2 - 1); COL.set([r, g, b, 210], o); }
        COLSTAT.noise++;
      }
    }
  }
  COLSTAT.weak = artFound > 20 && artDet < 0.7 * artFound;
}

// ---- drawing the image ----
let BUF = null, CBUF = null;
const MID = 4, DR = 55, NOISEDB = -50;
function imgRect(W, H) {
  const side = Math.min(W - 76, H - 10);
  return { x0: (W - side) / 2 + 4, y0: 5, side };
}
function drawImg() {
  const cv = $("img"), [ctx, W, H] = fit(cv);
  ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H);
  tissueMap();
  if (!BUF) { BUF = document.createElement("canvas"); BUF.width = NX; BUF.height = NZ; }
  const bx = BUF.getContext("2d"), id = bx.createImageData(NX, NZ), d = id.data;
  const nz = 10 ** ((NOISEDB + S.bgain) / 10);
  for (let k = 0; k < NX * NZ; k++) {
    const lin = 10 ** ((LV[k] + SPK[k] + S.out + S.bgain) / 10) + nz * NOISE[k];
    const v = clamp(0.5 + (10 * Math.log10(lin) - MID) / DR, 0, 1) * 255;
    d[4 * k] = v; d[4 * k + 1] = v; d[4 * k + 2] = v; d[4 * k + 3] = 255;
  }
  bx.putImageData(id, 0, 0);
  const R = imgRect(W, H);
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(BUF, R.x0, R.y0, R.side, R.side);
  colourOverlay();
  if (S.mode === "color" || S.mode === "power") {
    if (!CBUF) { CBUF = document.createElement("canvas"); CBUF.width = CXN; CBUF.height = CZN; }
    const cx = CBUF.getContext("2d"), ci = cx.createImageData(CXN, CZN); ci.data.set(COL); cx.putImageData(ci, 0, 0);
    ctx.drawImage(CBUF, R.x0, R.y0, R.side, R.side);
  }
  overlays(ctx, W, H, R);
}
function overlays(ctx, W, H, R) {
  const L = T[S.lang], sc = R.side / DP.W, P = (x, z) => [R.x0 + (x + DP.W / 2) * sc, R.y0 + z * sc];
  const ink = "rgba(255,255,255,.85)", amber = css("--amber") || "#f0b450";
  // depth scale on the right, 0.5 cm steps
  ctx.strokeStyle = ink; ctx.lineWidth = 1;
  for (let z = 0; z <= DP.D + 1e-9; z += 0.5) {
    const [, y] = P(DP.W / 2, z), long = Math.abs(z - Math.round(z)) < 1e-6;
    ctx.beginPath(); ctx.moveTo(R.x0 + R.side + 3, y); ctx.lineTo(R.x0 + R.side + (long ? 10 : 6), y); ctx.stroke();
    if (long) text(ctx, String(z), R.x0 + R.side + 13, y + 4, ink, "left", 11, "--mono");
  }
  text(ctx, "cm", R.x0 + R.side + 13, R.y0 + 0.27 * sc, ink, "left", 10, "--mono");
  // the marker dot on the left, top
  ctx.fillStyle = amber; ctx.beginPath(); ctx.arc(R.x0 - 9, R.y0 + 6, 4, 0, 2 * Math.PI); ctx.fill();
  // MI and TI as a scanner shows them
  text(ctx, `MI ${fmt(M.mi, 1)}  TIs ${fmt(M.ti, 1)}`, R.x0 + R.side - 6, R.y0 + 14, ink, "right", 11, "--mono");
  text(ctx, `L ${S.mode === "b" ? "9" : fmt(S.f0, 0)} MHz`, R.x0 + 6, R.y0 + 14, ink, "left", 11, "--mono");
  // colour box
  if (S.mode === "color" || S.mode === "power") {
    const B = BOX[S.scene], tb = S.scene === "long" ? Math.tan(DP.rad(S.steer)) : 0, dz = B.z1 - B.z0;
    ctx.setLineDash([4, 3]); ctx.strokeStyle = "rgba(255,255,255,.6)"; ctx.beginPath();
    [[-B.x, B.z0], [B.x, B.z0], [B.x + dz * tb, B.z1], [-B.x + dz * tb, B.z1]].forEach(([x, z], i) => { const [px, py] = P(x, z); i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); });
    ctx.closePath(); ctx.stroke(); ctx.setLineDash([]);
    // colour bar on the left
    const top = R.y0 + 24, hgt = R.side * 0.42, x = R.x0 - 18, mid = top + hgt * (1 + S.base) / 2;
    for (let k = 0; k < hgt; k++) {
      const y = top + k, u = y < mid ? (mid - y) / (mid - top) : -(y - mid) / (top + hgt - mid);
      const [r, g, b] = S.mode === "power" ? [255 * (1 - k / hgt * 0.6), 150 * (1 - k / hgt) ** 2, 40] : colourMap(u);
      ctx.fillStyle = `rgb(${r | 0},${g | 0},${b | 0})`; ctx.fillRect(x, y, 9, 1);
    }
    if (S.mode === "color") {
      const n = M.nyq;
      text(ctx, `+${fmt((1 + S.base) * n, 0)}`, x + 4, top - 5, ink, "center", 10, "--mono");
      text(ctx, `−${fmt((1 - S.base) * n, 0)}`, x + 4, top + hgt + 12, ink, "center", 10, "--mono");
      text(ctx, "cm/s", x + 4, top + hgt + 23, ink, "center", 9, "--mono");
    }
  }
  // the gate (long only): two short bars across the beam, the beam line in Spectral, the angle line
  if (S.scene === "long" && S.mode !== "b") {
    const b = DP.rad(S.steer), bx = Math.sin(b), bz = Math.cos(b), half = S.gate / 20;
    const [gx, gz] = P(S.gx, S.gz);
    if (S.mode === "spec") {
      ctx.setLineDash([2, 4]); ctx.strokeStyle = "rgba(255,255,255,.55)"; ctx.beginPath();
      ctx.moveTo(gx - bx * S.gz / bz * sc, R.y0); ctx.lineTo(gx + bx * 0.6 * sc, gz + bz * 0.6 * sc); ctx.stroke(); ctx.setLineDash([]);
    }
    ctx.strokeStyle = "#fff"; ctx.lineWidth = 2;
    for (const s of [-1, 1]) {
      const cx = gx + s * bx * half * sc, cz = gz + s * bz * half * sc;
      ctx.beginPath(); ctx.moveTo(cx - bz * 7, cz + bx * 7); ctx.lineTo(cx + bz * 7, cz - bx * 7); ctx.stroke();
    }
    if (S.mode === "spec") {
      // angle-correction line: at the set angle from the beam, on the side of the vessel
      const ba = Math.atan2(bz, bx), va = DP.rad(S.tilt);
      const opts = [ba + DP.rad(S.corr), ba - DP.rad(S.corr)];
      const diff = a => { let d = Math.abs(((a - va) % Math.PI + Math.PI) % Math.PI); return Math.min(d, Math.PI - d); };
      const a = diff(opts[0]) < diff(opts[1]) ? opts[0] : opts[1];
      ctx.strokeStyle = amber; ctx.lineWidth = 2; ctx.beginPath();
      ctx.moveTo(gx - Math.cos(a) * 22, gz - Math.sin(a) * 22); ctx.lineTo(gx + Math.cos(a) * 22, gz + Math.sin(a) * 22); ctx.stroke();
    }
    ctx.lineWidth = 1;
  }
  if (!S.names) return;
  const lab = (s, x, z, align = "left") => { const [px, py] = P(x, z); ctx.font = `12px ${css("--body")}`; ctx.lineWidth = 3; ctx.strokeStyle = "rgba(0,0,0,.7)"; ctx.textAlign = align; ctx.strokeText(s, px, py); text(ctx, s, px, py, ink, align, 12); };
  if (S.scene === "long") {
    const t = Math.tan(DP.rad(S.tilt));
    lab(L.labels.a, -1.85, DP.LONG.a.z - DP.LONG.a.R - 0.12 - 1.85 * t);
    lab(L.labels.v, -1.85, DP.LONG.v.z + DP.LONG.v.R + 0.3 - 1.85 * t);
    if (S.sten) lab(L.labels.plaque, DP.STEN.s, DP.LONG.a.z - DP.LONG.a.R - 0.12 + DP.STEN.s * t, "center");
    lab(L.labels.head, -1.9, 3.9); lab(L.labels.feet, 1.9, 3.9, "right");
  } else {
    const G = M.G;
    lab(L.labels.a, G.a.x, G.a.zb - 2 * G.a.R * G.a.h - 0.12, "center");
    lab(L.labels.v, G.v.x, G.v.zb + 0.3, "center");
    lab(L.labels.lat, -1.9, 3.9); lab(L.labels.med, 1.9, 3.9, "right");
  }
}

// ---- the graph ----
let SPEC = null, SPECKEY = "", SBUF = null;
function drawGraph() {
  const cv = $("graph"), [ctx, W, H] = fit(cv), L = T[S.lang];
  const mut = css("--muted") || "#8a93a6", fg = css("--fg") || "#e8ecf3", amber = css("--amber") || "#f0b450", line = css("--line") || "#2a3142";
  const red = "#e0504a", blue = "#4a8fe0";
  if (S.scene === "trans") {
    // the vessels' height against pressure, for the chosen clot
    const x0 = 40, x1 = W - 12, y0 = 12, y1 = H - 30, X = p => x0 + p / 100 * (x1 - x0), Y = h => y1 - h * (y1 - y0);
    ctx.strokeStyle = line; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0, y1); ctx.lineTo(x1, y1); ctx.stroke();
    for (const h of [0, 0.5, 1]) text(ctx, `${h * 100} %`, x0 - 5, Y(h) + 4, mut, "right", 10, "--mono");
    for (const p of [0, 50, 100]) text(ctx, `${p} %`, X(p), y1 + 14, mut, "center", 10, "--mono");
    text(ctx, L.ctl.press, (x0 + x1) / 2, y1 + 27, mut, "center", 11);
    for (const [id, col] of [["v", blue], ["a", red]]) {
      ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.beginPath();
      for (let p = 0; p <= 100; p += 2) { const h = DP.geom({ ...S, press: p })[id].h; p ? ctx.lineTo(X(p), Y(h)) : ctx.moveTo(X(p), Y(h)); }
      ctx.stroke();
      ctx.fillStyle = col; ctx.beginPath(); ctx.arc(X(S.press), Y(M.G[id].h), 5, 0, 2 * Math.PI); ctx.fill();
    }
    ctx.lineWidth = 1;
    text(ctx, L.labels.v, X(100) - 4, Y(DP.geom({ ...S, press: 100 }).v.h) - 8, blue, "right", 11);
    text(ctx, L.labels.a, X(100) - 4, Y(DP.geom({ ...S, press: 100 }).a.h) + 16, red, "right", 11);
    return;
  }
  if (S.mode === "spec") {
    const key = ["spec", S.tilt, S.steer, S.prf, S.f0, S.base, S.wf, S.gate, S.gx, S.gz, S.sten, S.clot].join("|");
    if (key !== SPECKEY) { SPEC = DP.spectrum(S); SPECKEY = key; }
    const x0 = 46, x1 = W - 8, y0 = 8, y1 = H - 22, nt = SPEC.nt, nb = SPEC.nb;
    if (!SBUF) { SBUF = document.createElement("canvas"); }
    SBUF.width = nt; SBUF.height = nb;
    const sx = SBUF.getContext("2d"), id = sx.createImageData(nt, nb), d = id.data;
    const g0 = S.dgain + S.out;
    for (let b = 0; b < nb; b++) for (let t = 0; t < nt; t++) {
      const v = SPEC.data[t * nb + b], nn = -Math.log(DP.hash(t * 0.71, b * 1.3) + 1e-6);
      const db = 10 * Math.log10(v / 15 + 0.0005 * nn * 10 ** (-S.out / 10) + 1e-9) + g0;     // noise does not follow the output power
      const gr = clamp(1 + db / 38, 0, 1) * 255, o = ((nb - 1 - b) * nt + t) * 4;
      d[o] = gr; d[o + 1] = gr; d[o + 2] = gr; d[o + 3] = 255;
    }
    sx.putImageData(id, 0, 0);
    ctx.fillStyle = "#000"; ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
    ctx.imageSmoothingEnabled = true; ctx.drawImage(SBUF, x0, y0, x1 - x0, y1 - y0);
    // baseline and speed ticks (angle corrected)
    const fmax = SPEC.fmin + S.prf, Yf = f => y0 + (fmax - f) / S.prf * (y1 - y0);
    ctx.strokeStyle = "rgba(255,255,255,.7)"; ctx.beginPath(); ctx.moveTo(x0, Yf(0)); ctx.lineTo(x1, Yf(0)); ctx.stroke();
    const cc = Math.cos(DP.rad(S.corr)), toV = f => f * DP.C / (2 * S.f0 * 1e6 * cc);
    const vTop = toV(fmax), vBot = toV(SPEC.fmin), span = vTop - vBot;
    const step = [5, 10, 20, 25, 50, 100, 200, 250, 500, 1000].find(s => span / s <= 6) || 1000;
    for (let v = Math.ceil(vBot / step) * step; v <= vTop; v += step) {
      const y = Yf(v * 2 * S.f0 * 1e6 * cc / DP.C);
      ctx.strokeStyle = mut; ctx.beginPath(); ctx.moveTo(x0 - 4, y); ctx.lineTo(x0, y); ctx.stroke();
      text(ctx, String(Math.round(v)), x0 - 6, y + 4, mut, "right", 10, "--mono");
    }
    text(ctx, "cm/s", x0 - 6, y0 + 9, mut, "right", 9, "--mono");
    for (let t = 0; t <= DP.WINDOW; t++) text(ctx, `${t} s`, x0 + t / DP.WINDOW * (x1 - x0), y1 + 14, mut, t === 0 ? "left" : t === DP.WINDOW ? "right" : "center", 10, "--mono");
    const xt = x0 + S.t / DP.WINDOW * (x1 - x0);
    ctx.strokeStyle = amber; ctx.beginPath(); ctx.moveTo(xt, y0); ctx.lineTo(xt, y1); ctx.stroke();
    return;
  }
  // speed along the beam through the gate, top of the colour box to the bottom
  const B = BOX.long, x0 = 46, x1 = W - 10, y0 = 10, y1 = H - 30, n = M.nyq, wv = M.wallV;
  const pts = [], b = DP.rad(S.steer);
  for (let k = 0; k <= 240; k++) {
    const z = B.z0 + (B.z1 - B.z0) * k / 240, x = S.gx + (z - S.gz) * Math.tan(b);
    const F = DP.flow(x, z, M.G, S, S.t);
    pts.push([z, F ? F.toward : null]);
  }
  const vmax = Math.max(1.6 * n, ...pts.map(p => Math.abs(p[1] || 0))) * 1.05;
  const X = z => x0 + (z - B.z0) / (B.z1 - B.z0) * (x1 - x0), Y = v => (y0 + y1) / 2 - v / vmax * (y1 - y0) / 2;
  ctx.fillStyle = "rgba(140,150,170,.18)"; ctx.fillRect(x0, Y(wv), x1 - x0, Y(-wv) - Y(wv));
  ctx.strokeStyle = line; ctx.beginPath(); ctx.moveTo(x0, Y(0)); ctx.lineTo(x1, Y(0)); ctx.moveTo(x0, y0); ctx.lineTo(x0, y1); ctx.stroke();
  ctx.setLineDash([5, 4]); ctx.strokeStyle = amber;
  for (const v of [(1 + S.base) * n, -(1 - S.base) * n]) { ctx.beginPath(); ctx.moveTo(x0, Y(v)); ctx.lineTo(x1, Y(v)); ctx.stroke(); }
  ctx.strokeStyle = mut; ctx.beginPath(); let on = false;
  for (const [z, v] of pts) { if (v === null) { on = false; continue; } on ? ctx.lineTo(X(z), Y(v)) : ctx.moveTo(X(z), Y(v)); on = true; }
  ctx.stroke(); ctx.setLineDash([]);
  ctx.lineWidth = 2; let prev = null;
  for (const [z, v] of pts) {
    if (v === null || (S.mode === "power" && false)) { prev = null; continue; }
    const vm = S.mode === "power" ? v : DP.wrap(v, S), show = Math.abs(vm) >= wv;
    if (prev && show && Math.abs(vm - prev[1]) < n) { ctx.strokeStyle = vm >= 0 ? red : blue; ctx.beginPath(); ctx.moveTo(X(prev[0]), Y(prev[1])); ctx.lineTo(X(z), Y(vm)); ctx.stroke(); }
    prev = show ? [z, vm] : null;
  }
  ctx.lineWidth = 1;
  const ticks = [0, Math.round(n), -Math.round(n)];
  for (const v of ticks) text(ctx, String(v), x0 - 6, Y(v) + 4, mut, "right", 10, "--mono");
  text(ctx, "cm/s", x0 - 6, y0 + 4, mut, "right", 9, "--mono");
  for (let z = 1; z <= 3; z++) text(ctx, `${z}`, X(z), y1 + 14, mut, "center", 10, "--mono");
  text(ctx, S.lang === "da" ? "dybde (cm)" : "depth (cm)", (x0 + x1) / 2, y1 + 27, mut, "center", 11);
}

// ---- numbers and what you can see ----
function metrics() {
  const L = T[S.lang];
  const safety = [["", "mi", fmt(M.mi, 1), L.f.mi], [M.ti > 1 ? "err" : M.ti > 0.7 ? "mag" : "ok", "ti", fmt(M.ti, 1), L.f.ti]];
  if (S.scene === "trans") {
    return [[M.veinH < 0.05 ? "ok" : "", "veinH", `${fmt(M.veinH * 100, 0)} %`, L.f.veinH(M.veinH)],
            ["", "artH", `${fmt(M.artH * 100, 0)} %`, L.f.artH], ["mag", "press", `${S.press} %`, L.f.press],
            ["", "area", `${fmt(M.veinArea, 0)} mm²`, L.f.area], ...safety];
  }
  const P = M.peak, inGate = DP.lumen(S.gx, S.gz, M.G, S), flowing = P.vTrue > 0.5;
  let speed = ["", "speed", "–", L.f.speedNo];
  if (S.mode === "spec") {
    if (!flowing) speed = ["err", "speed", "–", L.f.gateOut];
    else speed = [P.aliased ? "err" : Math.abs(P.shown - P.vTrue) / P.vTrue > 0.1 ? "err" : "ok", "speed",
                  P.aliased ? "?" : `${fmt(P.shown, 0)} cm/s`, P.aliased ? L.f.speedAlias : L.f.speedTrue(fmt(P.vTrue, 0))];
  }
  return [[M.angle <= 60 ? "ok" : "err", "angle", `${M.angle}°`, L.f.angle(M.angle)],
          ["mag", "scale", `±${fmt(M.nyq, 1)} cm/s`, L.f.scale(fmt(S.prf / 1000, 1))],
          [P.aliased ? "err" : "", "shift", flowing ? `${fmt(Math.abs(P.fPk) / 1000, 2)} kHz` : "–", flowing ? L.f.shift : L.f.gateOut],
          speed, ...safety];
}
function observations() {
  const L = T[S.lang].see, out = [], add = (on, t) => { if (on) out.push(t); };
  add(M.ti > 1, L.ti);
  if (S.scene === "trans") {
    if (S.clot === "none") { add(M.veinH < 0.05, L.comp); add(M.veinH >= 0.05 && S.press > 0, L.half); add(S.press === 0, L.press0); }
    if (S.clot === "fresh") { add(S.press > 25, L.fresh); add(S.press <= 25, L.freshLook); }
    add(S.clot === "old", L.old);
    add((S.mode === "color" || S.mode === "power") && S.clot !== "none", L.noflow);
    return out.slice(0, 2);
  }
  if (S.mode === "spec") {
    const P = M.peak;
    add(P.vTrue < 0.5, L.gateOut);
    add(P.vTrue >= 0.5 && P.aliased, L.specAlias);
    add(P.vTrue >= 0.5 && Math.abs(S.corr - M.angle) > 3, L.corr);
    add(S.gate >= 4 && P.vTrue >= 0.5, L.broad);
    const where = DP.lumen(S.gx, S.gz, M.G, S);
    add(where && where.id === "a", L.tri); add(where && where.id === "v", L.phasic);
  } else if (S.mode !== "b") {
    add(M.angle >= 85, L.perp);
    add(COLSTAT.alias >= 8 && M.angle < 85, L.alias);
    add(COLSTAT.mosaic && S.sten, L.mosaic);
    add(DP.artery(S.t) < -5 && M.angle < 85, L.reverse);
    add(COLSTAT.noise > 40, L.noise);
    add(COLSTAT.weak, L.weak);
    add(S.clot === "none" && COLSTAT.veinCells > 50 && COLSTAT.vein < 0.45 * COLSTAT.veinCells && M.wallV > 2.5, L.wf);
    add(S.clot === "none" && COLSTAT.veinCells > 50 && COLSTAT.vein > 30 && M.nyq > 80 && S.mode === "color", L.lowscale);
    if (S.mode === "color" && M.angle < 85 && COLSTAT.art > 30 && COLSTAT.vein > 30 && Math.sign(COLSTAT.artSign) !== Math.sign(COLSTAT.veinSign)) {
      const w = T[S.lang].colorWord, c = s => s > 0 ? w.red : w.blue;
      add(true, L.dir.replace("{a}", c(COLSTAT.artSign)).replace("{v}", c(COLSTAT.veinSign)));
    }
    add(S.clot !== "none", L.noflow);
  }
  return out.length ? out.slice(0, 2) : [L.base];
}
function readouts() {
  const L = T[S.lang], pinned = PIN && PIN.scene === S.scene ? PIN.vals : null;
  $("readout").innerHTML = metrics().map(([cls, key, value, foot]) =>
    `<div class="metric ${cls}"><div class="k">${L.k[key]}</div><div class="v">${value}</div><div class="f">${foot}</div>` +
    (pinned && pinned[key] !== undefined ? `<div class="p">${L.saved}: ${pinned[key]}</div>` : "") + `</div>`).join("");
  $("t-seen").textContent = L.seen; $("seen").textContent = observations().join(" ");
  $("pin").textContent = pinned ? L.unpin : L.pin;
}
$("pin").onclick = () => {
  PIN = PIN && PIN.scene === S.scene ? null : { scene: S.scene, vals: Object.fromEntries(metrics().map(([, key, value]) => [key, value])) };
  readouts();
};

// ---- controls ----
// key: [min, max, step, label, which scene (null = both), only on the deeper level]
const SLIDERS = {
  tilt: [-20, 20, 1, v => `${v}°`, "long"],
  out: [-20, 0, 1, v => `${v} dB`, null],
  bgain: [-10, 20, 1, v => `${v > 0 ? "+" : ""}${v} dB`, null],
  prf: [500, 12000, 250, v => `${fmt(v / 1000, 1)} kHz`, null],
  base: [-0.8, 0.8, 0.05, v => `${v > 0 ? "+" : ""}${fmt(v * 100, 0)} %`, null],
  wf: [25, 800, 25, v => `${v} Hz`, null],
  dgain: [-20, 20, 1, v => `${v > 0 ? "+" : ""}${v} dB`, null],
  corr: [0, 85, 1, v => `${v}°`, "long"],
  gate: [0.5, 8, 0.5, v => `${fmt(v, 1)} mm`, "long", true],
  press: [0, 100, 1, v => `${v} %`, "trans"],
  t: [0, 3.98, 0.02, v => `${fmt(v, 2)} s`, null],
};
function buildControls() {
  const L = T[S.lang], C = L.ctl, box = $("controls");
  const help = k => S.level === "grund" && L.help[k] ? `<p class="help">${L.help[k]}</p>` : "";
  const seg = (k, opts, dis = []) => `<div class="ctl"><label><span>${C[k]}</span><span></span></label><div class="seg">` +
    opts.map(([val, lbl]) => `<button data-k="${k}" data-v="${val}" aria-pressed="${String(S[k]) === String(val)}" ${dis.includes(val) ? "disabled" : ""}>${lbl}</button>`).join("") +
    `</div>${help(k)}</div>`;
  const onoff = k => seg(k, [["false", C.off], ["true", C.on]]);
  const slider = k => {
    const [mn, mx, st, f, scene, deep] = SLIDERS[k];
    if (scene && scene !== S.scene) return "";
    if (deep && S.level !== "deep") return "";
    return `<div class="ctl"><label for="s-${k}"><span>${C[k]}</span><span id="o-${k}">${f(S[k])}</span></label>` +
      `<input type="range" id="s-${k}" min="${mn}" max="${mx}" step="${st}" value="${S[k]}">${help(k)}</div>`;
  };
  const grp = k => `<h3 class="grp">${L.grp[k]}</h3>`;
  const long = S.scene === "long", dop = S.mode !== "b";
  box.innerHTML = grp("scene") + seg("scene", [["long", C.long], ["trans", C.trans]]) +
    seg("mode", [["b", C.b], ["color", C.color], ["power", C.power], ["spec", C.spec]], long ? [] : ["spec"]) + onoff("names") +
    grp("probe") + slider("tilt") + (long ? seg("steer", [["-20", "−20°"], ["0", "0°"], ["20", "+20°"]]) : "") + slider("out") + slider("bgain") +
    (dop ? grp("dop") + slider("prf") + slider("base") + slider("wf") + slider("dgain") + seg("f0", [["4", "4 MHz"], ["5", "5 MHz"], ["6", "6 MHz"]]) +
      (long && S.mode === "spec" ? slider("corr") + `<div class="ctl"><button class="mini" id="align">${C.align}</button></div>` + slider("gate") : "") : "") +
    grp("patient") + (long ? onoff("sten") : "") + seg("clot", [["none", C.none], ["fresh", C.fresh], ["old", C.old]]) + slider("press") +
    (dop ? grp("time") + slider("t") : "") +
    `<div class="ctl last"><button class="reset" id="reset">${C.reset}</button></div>`;
  box.querySelectorAll("button[data-k]").forEach(b => b.onclick = () => {
    const k = b.dataset.k, v = b.dataset.v;
    S[k] = v === "true" ? true : v === "false" ? false : (k === "steer" || k === "f0") ? +v : v;
    if (k === "scene") { PIN = null; if (S.scene === "trans" && S.mode === "spec") S.mode = "color"; }
    buildControls(); update();
  });
  for (const k of Object.keys(SLIDERS)) {
    const el = $(`s-${k}`); if (!el) continue;
    el.oninput = () => { S[k] = +el.value; $(`o-${k}`).textContent = SLIDERS[k][3](+el.value); updateSoon(); };
  }
  if ($("align")) $("align").onclick = () => { S.corr = M.angle; buildControls(); update(); };
  $("reset").onclick = () => { const keep = { lang: S.lang, level: S.level, scene: S.scene }; Object.assign(S, clone(START), keep); PIN = null; buildControls(); update(); };
}
// click in the long image moves the gate
$("img").addEventListener("click", e => {
  if (S.scene !== "long") return;
  const r = $("img").getBoundingClientRect(), R = imgRect(r.width, r.height), sc = R.side / DP.W;
  const x = (e.clientX - r.left - R.x0) / sc - DP.W / 2, z = (e.clientY - r.top - R.y0) / sc;
  if (x < -DP.W / 2 || x > DP.W / 2 || z < 0.2 || z > DP.D - 0.2) return;
  S.gx = +x.toFixed(2); S.gz = +z.toFixed(2); update();
});

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
function graphText() {
  const L = T[S.lang], k = S.scene === "trans" ? "comp" : S.mode === "spec" ? "spec" : "prof";
  $("t-graph").textContent = L.graph[k]; $("t-graphnote").textContent = L.note[k];
}
function buildText() {
  const L = T[S.lang], set = (id, s) => { $(id).textContent = s; };
  document.documentElement.lang = S.lang;
  document.title = L.title + " | Oliver Brage";
  for (const k of ["title", "sub", "image", "tasks", "model", "foot", "privacy"]) set("t-" + k, L[k]);
  set("t-back", L.back); set("t-simtitle", L.simTitle); set("t-imgnote", L.imgNote);
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
  if ($("img").getClientRects().length) { drawImg(); drawGraph(); }
  graphText(); readouts();
}
function update() { M = DP.model(S); render(); }
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
