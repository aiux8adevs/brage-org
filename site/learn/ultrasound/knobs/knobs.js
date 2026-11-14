// Knobology simulator (ultrasound U4): the page. The physics lives in model.js (US).
// The image is built in two steps:
//   1. scan(): on a polar grid (one column per beam angle, one row per 0.2 mm of depth) the tissue's echo level times
//      fixed random scatterers is blurred by the beam (sideways) and the pulse (along the beam), attenuated on the
//      way down and up, and electronic noise is added. Only redone when plane, frequency or focus change.
//   2. drawImg(): the scan lines are picked from that grid, gain + built-in compensation + TGC are added, the dynamic
//      range turns dB into grey, and the lines are drawn as a fan (scan conversion). Cheap, so gain and TGC feel live.

const DD = 0.02, NR = Math.round(US.DEPTH_MAX / DD);      // 0.2 mm per row, down to 18 cm
const DTH = 0.0015, HALF = 427, NTH = 2 * HALF + 1;        // beam angles, ±0.64 rad (the widest sector is ±35°)
const N = NR * NTH;
const TGC_N = 8;

const T = {
  da: {
    title: "Knapper og orientering", sub: "Simulator: en højre nyre set gennem leveren med en konveks probe. Skru på gain, TGC, dybde, frekvens, fokus og resten, og se hvad hver knap gør ved billedet.",
    simTitle: "Simulator: Knapper og orientering", grund: "Grund", deep: "Fordybelse", back: "← Ultralyd",
    image: "Billedet", beam: "Strålen", gaincv: "Ekko og forstærkning gennem dybden",
    beamNote: "Strålen set fra siden, med proben til venstre. Det farvede bånd er strålens bredde: smallest ved fokus (orange trekant). To ting, der ligger tættere sidelæns end båndets bredde, smelter sammen. Den stiplede linje er afstanden mellem to skanlinjer. Det grå felt er nyren.",
    gainNote: "Hvor stærkt ekkoet fra leverlignende væv er i hver dybde, efter forstærkning. Det lyse bånd er de ekkoer, der vises som grå toner: over båndet bliver det hvidt, under bliver det sort. Den hvide linje skal helst ligge vandret midt i båndet. Den stiplede er støjen: når den kommer op i båndet, kan du se den i billedet.",
    gainNoteDeep: "Den røde linje er ekkoet fra leverlignende væv, før maskinen forstærker det: det falder 2 · α · f dB pr. cm. Den orange er den samlede forstærkning (gain, maskinens egen dybdekompensation og TGC). Summen er den hvide linje. Det lyse bånd er dynamikområdet: det, der vises som grå toner. Den stiplede er støjen efter forstærkning.",
    imgNote: "Simuleret billede, ikke et rigtigt skannerbillede. Prikken øverst til venstre svarer til mærket på proben. Skalaen til højre er dybden i cm, og den orange trekant er fokus. Klik i billedet for at vælge, hvor du zoomer ind.",
    tasks: "Opgaver", answer: "Vis svar", of: "af", prev: "Forrige opgave", next: "Næste opgave",
    model: "Sådan virker modellen", foot: "© 2026 Oliver Brage. Alle rettigheder forbeholdes.", privacy: "Privatliv",
    seen: "Det kan du se:", pin: "Gem tallene", unpin: "Fjern de gemte", saved: "gemt", task: "Opgave",
    grp: { orient: "Orientering", bright: "Lysstyrke og kontrast", field: "Dybde og billedfelt", detail: "Detaljer og billedfrekvens" },
    plane: { long: "Langsgående", trans: "Tværgående" }, planeShort: { long: "Langs", trans: "Tværs" },
    ctl: { plane: "Snitplan", flip: "Proben", normal: "Normal", flipped: "Vendt", gain: "Gain", tgc: "TGC", depth: "Dybde", f: "Frekvens",
           focus: "Fokus", zones: "Fokuszoner", dr: "Dynamikområde", sector: "Sektorbredde", density: "Linjetæthed",
           low: "Lav", mid: "Mellem", high: "Høj", zoom: "Zoom", names: "Vis navne", on: "Til", off: "Fra", reset: "Nulstil alt", tgcReset: "TGC til 0" },
    help: { plane: "Langs: proben ligger på langs af kroppen. Tværs: på tværs.",
            flip: "Mærket på proben skal pege mod hovedet (langs) eller patientens højre side (tværs).",
            gain: "Forstærker alle ekkoer lige meget, i hele dybden. Støjen forstærkes også.",
            tgc: "Forstærkning for hver dybde, øverst til nederst. Bruges til at gøre billedet lige lyst hele vejen ned.",
            depth: "Hvor dybt billedet går. Mindre dybde: større billede og højere billedfrekvens.",
            f: "Høj frekvens: finere detaljer, men lyden når ikke så dybt.",
            focus: "Hvor strålen er smallest. Læg det ved det, du vil se.",
            zones: "Flere fokuszoner: smal stråle over et længere stykke, men lavere billedfrekvens.",
            dr: "Hvor mange dB der fordeles fra sort til hvid. Lavt: hård kontrast. Højt: blødt og gråt.",
            sector: "Hvor bredt billedet er. Smallere: færre linjer og højere billedfrekvens.",
            density: "Linjer pr. grad. Flere linjer: finere sidelæns, men lavere billedfrekvens.",
            zoom: "Forstørrer billedet. Klik i billedet for at vælge stedet.", names: "Skriver navnene på det, du ser." },
    k: { frame: "Billedfrekvens", axial: "Aksial opløsning", lat: "Lateral opløsning ved nyren", pen: "Indtrængning", lines: "Linjer pr. billede", line: "Tid pr. linje" },
    f: { frame: v => v < 15 ? "bevægelse vil hakke" : v < 25 ? "nok til rolige organer" : "flydende",
         axial: "langs strålen, bedre ved høj frekvens", lat: (b, sp) => `størst af stråle ${b} og linjeafstand ${sp} mm`,
         penShort: "når ikke om bag nyren", penOk: "i lever; når om bag nyren", lines: (n, deg) => `${n} pr. grad · ${deg}°`, line: "ned og op: 2 · dybde / c" },
    see: {
      flip: "Proben er vendt: billedet er spejlet, men prikken på skærmen står stadig til venstre. {side} ligger nu i skærmens højre side.",
      flipSide: { long: "Hovedet", trans: "Patientens højre side" },
      pen: "Under cirka {p} cm drukner ekkoerne i støj: frekvensen er for høj til den dybde.",
      cut: "Nyrens bagside er skåret af. Gør dybden større.",
      noise: { long: "Forstærkningen er så høj, at støjen ses: cysten i nyrens øvre pol er ikke længere sort.", trans: "Forstærkningen er så høj, at støjen ses: blodet i vena cava er ikke længere sort." },
      dark: "Billedet er for mørkt ved nyren: svage ekkoer forsvinder.",
      bright: "Billedet er for lyst: lyse strukturer bliver hvide uden detaljer.",
      darker: "Billedet bliver mørkere nedad. Løft de dybe TGC-skydere.",
      lighter: "Billedet bliver lysere nedad. Sænk de dybe TGC-skydere.",
      deep: "Der er {x} cm under nyren. Mindre dybde gør nyren større og billedfrekvensen højere.",
      focus: "Fokus ligger ved {z} cm, langt fra nyrens midte ({k} cm). Nyren bliver mere udtværet sidelæns.",
      slow: "Billedfrekvensen er {fr} Hz: bevægelse vil hakke.",
      drLow: "Lavt dynamikområde: hård kontrast, svage ekkoer bliver sorte.",
      drHigh: "Højt dynamikområde: blødt, gråt billede med mange grå toner.",
      lowLines: "Få linjer: billedet bliver grovere sidelæns, men billedfrekvensen stiger.",
      zoom: "Zoom forstørrer billedet, men gør det ikke skarpere.",
      base: "Billedet er jævnt, og nyren er i fokus. Prøv at ændre én knap ad gangen.",
    },
    graph: { depth: "dybde (cm)", mm: "bredde (mm)", width: "strålens bredde", space: "afstand mellem linjer", kidney: "nyren",
             grey: "vises som grå toner", white: "hvidt", black: "sort", echo: "ekko efter", noise: "støj", gain: "forstærkning", raw: "ekko før" },
    dec: ",",
    modelText: `<p><b>Det hele er simuleret.</b> Billedet er regnet ud fra en enkel model af væv og lyd. Der er ikke brugt rigtige ultralydsbilleder. Anatomien er forenklet: en højre nyre (cirka 11 cm lang) med en cyste i øvre pol, set gennem leveren fra forsiden af en patient, der ligger på ryggen. I tværsnittet ses nyrens hilus, nyrevenen, vena cava, psoas og en hvirvel. Størrelser og dybder er typiske for en voksen, men ikke målt på en bestemt person.</p>
<p><b>Bølgelængde og aksial opløsning.</b> $$\\lambda = \\frac{c}{f}, \\quad c = 1540 \\text{ m/s}$$ Pulsen er 2 svingninger lang. To ting langs strålen kan skilles ad, når de ligger mindst en halv pulslængde fra hinanden: $2\\lambda/2 = \\lambda$. Ved 3,5 MHz er det 0,44 mm.</p>
<p><b>Strålen.</b> Sendestrålen er fokuseret i den valgte fokusdybde $z_f$. Bredden i fokus er $\\lambda \\cdot F$, hvor $F = z_f / D$ og aperturen $D$ er 2,4 cm (mindst 1,5). Væk fra fokus bliver den bredere, og jo smallere fokus er, desto hurtigere sker det. Modtagestrålen er fokuseret i alle dybder (dynamisk fokus) med $F = d/D$, mindst 2. Den samlede bredde er de to tilsammen. Med flere fokuszoner bruges den smalleste sendestråle i hver dybde, men hver linje skal sendes én gang pr. zone. Der, hvor sendestrålen er smal, er energien samlet, og ekkoerne bliver op til 3 dB stærkere (højst 4 dB svagere langt fra fokus). Tallet Lateral opløsning er det største af to: strålens bredde ved nyren og afstanden mellem to skanlinjer samme sted.</p>
<p><b>Speckle.</b> Vævet består af mange små spredere, der ligger tilfældigt. Hvert ekko er summen af alle spredere inden for strålens bredde og en halv pulslængde. Derfor får billedet et korn, hvis størrelse følger opløsningen, ikke vævets egen struktur. Hvert væv har sit eget ekkoniveau i dB i forhold til lever: fx sinus +7, fedtet omkring nyren +3, nyrebark −4, pyramider −12, muskel −9, fedt under huden −14, væske −60.</p>
<p><b>Dæmpning.</b> Lyden dæmpes på vej ned og op igen: $$A = 2 \\cdot \\alpha \\cdot f \\cdot d \\text{ dB}$$ med $\\alpha$ = 0,5 dB/cm/MHz i lever og det meste bløde væv, 0,6 i fedtet under huden, 0,7 i muskel, 0,002 i væske og 20 i knogle. Derfor er der lyst bag cysten og sort bag hvirvlen.</p>
<p><b>Forstærkning.</b> Maskinen lægger selv $0,8 \\cdot f \\cdot d$ dB til (højst 40 dB). Resten klarer gain (det samme i alle dybder) og TGC: 8 skydere fordelt over den viste dybde, med rette linjer imellem.</p>
<p><b>Støj og indtrængning.</b> Elektronisk støj ligger 70 dB under ekkoet fra lever ved huden. Støjen forstærkes af gain og TGC præcis som ekkoerne. Ekkoet fra lever drukner i støjen, når $2 \\cdot 0,5 \\cdot f \\cdot d = 70$, altså ved $d = 70/f$ cm.</p>
<p><b>Visning.</b> Ekkoerne vises i dB (logaritmisk kompression). Dynamikområdet er det antal dB, der fordeles fra sort til hvid omkring en fast mellemgrå. Billedet tegnes som en vifte af skanlinjer, og mellem to linjer udfyldes der ved at blande dem.</p>
<p><b>Billedfrekvens.</b> Hver linje skal vente på ekkoerne fra bunden: $$t_{linje} = \\frac{2 \\cdot d_{max}}{c}, \\quad \\text{billedfrekvens} = \\frac{1}{n_{linjer} \\cdot n_{zoner} \\cdot t_{linje}}$$ Linjetætheden er 1, 2 eller 3 linjer pr. grad. Zoom er her en læsezoom: den forstørrer kun det færdige billede.</p>
<p><b>Det er ikke med.</b> Snittykkelsen (strålens bredde på den anden led), harmonisk billeddannelse, compound imaging, filtre, bevægelse og Doppler. De fleste artefakter er udeladt, fx genlyd (reverberation), spejlbilledet bag diafragma og luft i tarmen. De får deres eget emne. Tallene er typiske lærebogsværdier, ikke tal fra en bestemt skanner.</p>
<p>Kilder: Gibbs, Cole og Sassano, Ultrasound Physics and Technology (2009). Hoskins, Martin og Thrush, Diagnostic Ultrasound: Physics and Equipment, 3. udg. (2019). Kremkau, Sonography Principles and Instruments. Bushberg m.fl., The Essential Physics of Medical Imaging, kapitlet om ultralyd (dæmpning, opløsning, billedfrekvens).</p>`,
    groups: [
      ["Orientering", [
        ["Hvor er hovedet?", "Langsgående snit, proben holdt normalt. Hvilken side af skærmen vender mod patientens hoved? Find to ting i billedet, der viser det.", "Venstre side, der hvor prikken står. Til venstre ses diafragma (den lyse bue) og lungen bag den, og nyrens øvre pol ligger dér, dybere end den nedre. Leveren bliver tyndere mod højre og ender over tarmen."],
        ["Vend proben", "Tryk på Vendt. Hvad ændrer sig i billedet, og hvad gør prikken på skærmen?", "Billedet spejles: hovedet kommer i højre side. Prikken bliver stående til venstre, for den hører til skærmen. Nu passer mærket på proben ikke med prikken. Tjek det, før du skanner: rør ved den ene ende af probens flade, og se hvilken side af skærmen der reagerer. Ellers kan hoved og fødder (eller højre og venstre) blive byttet om."],
        ["Tværsnit", "Skift til Tværgående, proben holdt normalt (mærket mod patientens højre side). Hvilken side af skærmen er patientens højre? Hvor vender nyrens hilus?", "Patientens højre er til venstre på skærmen, som når du står over for patienten (som på CT). Hilus vender mod højre på skærmen, ind mod midtlinjen, hvor nyrevenen løber over til vena cava. Hvirvlen ligger i kroppens midtlinje og ses derfor længst til højre, lige bag vena cava."],
        ["Skyggen bag hvirvlen", "Tværsnit: under hvirvlen er der en sort stribe helt ned til bunden. Hvorfor? Kan gain hjælpe?", "Knogle kaster næsten al lyden tilbage og dæmper resten kraftigt (20 dB/cm/MHz mod 0,5 i lever). Der kommer ingen ekkoer bagfra, så der bliver sort: akustisk skygge. Mere gain hjælper ikke: der er kun støj at forstærke, så skyggen bliver bare grå. Artefakter får deres eget emne.", { deep: true }],
      ]],
      ["Gain og TGC", [
        ["For meget gain", "Tryk på Nulstil alt (langsgående snit). Skru gain op til +30 dB. Hvad sker der med cysten i nyrens øvre pol? Får du mere information?", "Cysten bliver grå i stedet for sort, fordi støjen nu forstærkes så meget, at den kan ses. Sinus og andre lyse strukturer bliver hvide uden detaljer. Gain forstærker ekko og støj lige meget, så der kommer ingen ny information, kun et lysere billede."],
        ["For lidt gain", "Skru gain ned til −15 dB. Hvad forsvinder først?", "De svage ekkoer: pyramiderne, fedtet under huden og vævet dybt nede bliver sorte. Faren er, at en mørk, fast forandring ligner en cyste, eller at noget overses."],
        ["Mørkere i dybden", "Tryk på Nulstil alt. Sammenlign leveren øverst med vævet under nyren. Hvorfor bliver billedet mørkere nedad?", "Lyden dæmpes på vej ned og på vej op igen, i lever 0,5 dB pr. cm pr. MHz hver vej. Ved 3,5 MHz og 16 cm er det 56 dB. Maskinen retter selv en del, men højst 40 dB. Resten skal du klare med TGC."],
        ["Gør billedet jævnt", "Brug TGC-skyderne, så vævet har samme grå tone hele vejen ned. Hvilke skydere skal op? Se grafen Ekko og forstærkning.", "Skyderne fra cirka 6 cm og nedefter skal op, de nederste mest: omkring +4 dB ved 6 cm, +8 til +10 ved nyren og op mod +20 nederst. Den hvide linje i grafen bliver vandret. Gain ville gøre det hele lysere, også toppen, som allerede var fin."],
        ["Bag cysten", "Se på vævet lige bag cysten. Hvorfor er det lysere end vævet ved siden af? Skal du rette det med TGC?", "Væske dæmper næsten ingen lyd, så ekkoerne bag cysten er stærkere end ved siden af. TGC virker i hele billedets bredde, så den kan ikke fjerne en lys stribe ét sted. Det skal den heller ikke: striben viser, at det er væske.", { deep: true }],
      ]],
      ["Dybde og zoom", [
        ["Den rigtige dybde", "Tryk på Nulstil alt, så dybden er 18 cm. Gør dybden mindre, så nyren fylder billedet, men du stadig kan se lidt under den. Hvilken dybde, og hvad sker der med billedfrekvensen?", "Cirka 13 cm: nyrens bagside ligger ved 11 cm på midterlinjen. Billedfrekvensen stiger fra 31 til 42 Hz, fordi lyden har kortere vej ned og op for hver linje."],
        ["For lidt dybde", "Prøv 9 cm. Hvad mangler nu?", "Nyrens bageste del og alt bag den. Fx væske bag nyren ses ikke. Start derfor dybt, se hele området igennem, og gør så dybden mindre."],
        ["Zoom", "Sæt dybden til 13 cm, vælg zoom 2×, og klik på cysten. Bliver billedet skarpere?", "Nej. Cysten bliver større, men kornet og kanterne bliver lige så meget større. Zoom forstørrer kun det billede, der allerede er lavet. Billedfrekvensen er den samme. Detaljerne afgøres af frekvens, fokus og linjetæthed."],
        ["Dybde eller zoom", "Hvorfor er det bedre at gøre dybden mindre end at zoome, når det, du vil se, ligger højt i billedet?", "Mindre dybde giver også højere billedfrekvens og udnytter hele skærmen. Zoom ændrer kun visningen. Mange skannere har også skrivezoom, der kun skanner det udvalgte område og kan lægge flere linjer dér. Den er ikke med i simulatoren.", { deep: true }],
      ]],
      ["Frekvens", [
        ["Høj frekvens", "Tryk på Nulstil alt (dybde 18 cm). Gå fra 3,5 til 6 MHz. Hvad sker der øverst, og hvad sker der dybt nede?", "Øverst bliver kornet finere, og den aksiale opløsning går fra 0,44 til 0,26 mm. Men høj frekvens dæmpes mere: indtrængningen falder fra 20 til 12 cm. Dybere end cirka 12 cm er der mest støj, og nyrens bagside drukner."],
        ["Lav frekvens", "Prøv 2 MHz. Hvad vinder du, og hvad taber du?", "Lyden når hele vejen ned (indtrængning 35 cm). Men kornet bliver groft, den aksiale opløsning er 0,77 mm, og strålen er bredere: 2,6 mm ved nyren."],
        ["Den bedste frekvens", "Dybde 13 cm og fokus 8,5 cm. Find den højeste frekvens, hvor nyrens bagside (cirka 11 cm) stadig er tydelig. Du må gerne løfte dybden med TGC.", "Omkring 5 MHz, hvor indtrængningen er 14 cm. Ved 6 MHz (indtrængning 12 cm) bliver cysten og nyrens bageste del grå af støj, og TGC hjælper ikke, for den løfter støjen lige så meget som ekkoerne. Vælg den højeste frekvens, der stadig når dybt nok."],
      ]],
      ["Fokus", [
        ["Flyt fokus", "Tryk på Nulstil alt: fokus står på 4 cm. Flyt det til nyrens midte (cirka 8,5 cm). Hvad sker der med strålens bredde ved nyren? Se grafen Strålen og tallet Lateral opløsning.", "Strålen ved nyren går fra 1,6 til 1,1 mm. Kanter og pyramider bliver skarpere sidelæns, og nyren bliver lidt lysere, fordi energien er samlet dér. Den laterale opløsning viser nu 1,2 mm, for nu er det afstanden mellem linjerne, der begrænser. Læg fokus ved eller lige under det, du vil se."],
        ["Flere fokuszoner", "Lad fokus stå på 8,5 cm og dybden på 18 cm. Vælg 3 fokuszoner. Hvad bliver bedre, og hvad koster det?", "Strålen er smal over et længere stykke, men hver linje skal sendes tre gange: billedfrekvensen falder fra 31 til 10 Hz. Det duer ikke til noget, der bevæger sig, fx når patienten trækker vejret."],
      ]],
      ["Billedfelt og billedfrekvens", [
        ["Sektorbredde", "Tryk på Nulstil alt. Gør sektoren smallere, fra 70 til 40 grader. Hvad sker der med billedfrekvensen, og hvorfor?", "Den stiger fra 31 til 54 Hz, fordi der skal færre linjer til (80 i stedet for 140). Til gengæld ser du mindre i siderne."],
        ["Linjetæthed", "Sæt sektoren til 70° igen og fokus på 8,5 cm. Prøv lav og høj linjetæthed. Se på den laterale opløsning ved nyren og på billedfrekvensen.", "Lav: 70 linjer, 2,4 mm mellem linjerne ved nyren og 61 Hz, men billedet bliver grovere sidelæns. Høj: 210 linjer med 0,8 mm imellem, men kun 20 Hz, og den laterale opløsning standser ved strålens 1,1 mm. Den kan aldrig blive bedre end strålens bredde eller afstanden mellem linjerne."],
        ["Det bedste billede", "Lav det bedste billede af nyren, du kan, med mindst 25 Hz. Gem tallene først, så du kan sammenligne med udgangspunktet.", "Fx dybde 13 cm, 5 MHz, fokus 8,5 cm, én fokuszone, høj linjetæthed, sektor 60° og TGC, så dybden er jævn. Det giver 33 Hz og 0,8 mm lateral opløsning mod 1,6 mm ved start, og den aksiale opløsning går fra 0,44 til 0,31 mm."],
      ]],
      ["Dynamikområde", [
        ["Lavt", "Tryk på Nulstil alt. Sæt dynamikområdet til 35 dB. Hvad sker der med billedet?", "Det bliver hårdt: sort og hvidt med få grå toner. Pyramiderne bliver mørkere, sinus lysere, og cysten står skarpt. Men svage forskelle i vævet forsvinder, og fedtet under huden bliver sort."],
        ["Højt", "Sæt det til 80 dB. Hvad vinder du, og hvad taber du?", "Billedet bliver blødt og gråt: flere grå toner, så små forskelle kan ses, men kontrasten mellem fx bark og pyramide bliver mindre."],
      ]],
      ["Formler", [
        ["Bølgelængde", "Lyden går 1540 m/s i blødt væv. Regn bølgelængden ved 3,5 og 6 MHz. Pulsen er 2 svingninger lang. Hvad er den aksiale opløsning?", "$\\lambda = \\frac{1540}{3,5 \\cdot 10^6} = 0,44$ mm og $\\frac{1540}{6 \\cdot 10^6} = 0,26$ mm. Den aksiale opløsning er en halv pulslængde: $\\frac{2\\lambda}{2} = \\lambda$, altså 0,44 og 0,26 mm. Tjek tallene i simulatoren."],
        ["Tid og dybde", "Et ekko kommer tilbage 130 µs efter pulsen. Hvor dybt ligger det, der kastede det tilbage?", "Lyden skal ned og op igen: $d = \\frac{c \\cdot t}{2} = \\frac{1540 \\cdot 130 \\cdot 10^{-6}}{2} = 0,10$ m, altså 10 cm."],
        ["Indtrængning", "Lever dæmper 0,5 dB/cm/MHz hver vej. Maskinen kan høre ekkoer ned til 70 dB under ekkoet fra huden. Hvor dybt når du ved 5 MHz?", "$2 \\cdot 0,5 \\cdot 5 \\cdot d = 70$ giver $d = 14$ cm. Tjek Indtrængning i simulatoren."],
        ["TGC i tal", "Ved 3,5 MHz: hvor meget er ekkoet fra 10 cm dæmpet i alt? Maskinen retter selv 0,8 dB/cm/MHz. Hvor meget mangler?", "Dæmpning: $2 \\cdot 0,5 \\cdot 3,5 \\cdot 10 = 35$ dB. Maskinen: $0,8 \\cdot 3,5 \\cdot 10 = 28$ dB. Der mangler 7 dB, som TGC skal give."],
        ["Billedfrekvens", "Dybde 13 cm, 140 linjer og én fokuszone. Regn billedfrekvensen. Hvad bliver den med 3 fokuszoner?", "Én linje: $\\frac{2 \\cdot 0,13}{1540} = 169$ µs. Et billede: $140 \\cdot 169$ µs $= 23,6$ ms, altså 42 Hz. Med 3 zoner tager det tre gange så lang tid: 14 Hz."],
      ], "deep"],
    ],
  },
  en: {
    title: "Knobs and orientation", sub: "Simulator: a right kidney seen through the liver with a curved probe. Change gain, TGC, depth, frequency, focus and the rest, and see what each knob does to the image.",
    simTitle: "Simulator: Knobs and orientation", grund: "Basic", deep: "Deeper level", back: "← Ultrasound",
    image: "The image", beam: "The beam", gaincv: "Echo and gain through the depth",
    beamNote: "The beam seen from the side, with the probe on the left. The coloured band is the beam's width: narrowest at the focus (orange triangle). Two things closer together sideways than the band is wide merge into one. The dashed line is the distance between two scan lines. The grey field is the kidney.",
    gainNote: "How strong the echo from liver-like tissue is at each depth, after gain. The light band is the echoes shown as shades of grey: above the band is white, below it is black. The white line should lie flat in the middle of the band. The dashed line is the noise: once it rises into the band, you can see it in the image.",
    gainNoteDeep: "The red line is the echo from liver-like tissue before the machine amplifies it: it falls by 2 · α · f dB per cm. The orange line is the total gain (gain, the machine's own depth compensation and TGC). Their sum is the white line. The light band is the dynamic range: what is shown as shades of grey. The dashed line is the noise after gain.",
    imgNote: "A simulated image, not a real scanner image. The dot at the top left matches the marker on the probe. The scale on the right is the depth in cm, and the orange triangle is the focus. Click in the image to choose where to zoom.",
    tasks: "Tasks", answer: "Show answer", of: "of", prev: "Previous task", next: "Next task",
    model: "How the model works", foot: "© 2026 Oliver Brage. All rights reserved.", privacy: "Privacy",
    seen: "What you can see:", pin: "Save the numbers", unpin: "Remove saved", saved: "saved", task: "Task",
    grp: { orient: "Orientation", bright: "Brightness and contrast", field: "Depth and field of view", detail: "Detail and frame rate" },
    plane: { long: "Longitudinal", trans: "Transverse" }, planeShort: { long: "Long", trans: "Trans" },
    ctl: { plane: "Scan plane", flip: "Probe", normal: "Normal", flipped: "Reversed", gain: "Gain", tgc: "TGC", depth: "Depth", f: "Frequency",
           focus: "Focus", zones: "Focal zones", dr: "Dynamic range", sector: "Sector width", density: "Line density",
           low: "Low", mid: "Medium", high: "High", zoom: "Zoom", names: "Show names", on: "On", off: "Off", reset: "Reset all", tgcReset: "TGC to 0" },
    help: { plane: "Long: the probe lies along the body. Trans: across it.",
            flip: "The probe's marker should point to the head (long) or the patient's right side (trans).",
            gain: "Amplifies all echoes equally, at every depth. The noise is amplified too.",
            tgc: "Gain for each depth, top to bottom. Used to make the image equally bright all the way down.",
            depth: "How deep the image goes. Less depth: a bigger image and a higher frame rate.",
            f: "High frequency: finer detail, but the sound does not reach as deep.",
            focus: "Where the beam is narrowest. Put it at what you want to see.",
            zones: "More focal zones: a narrow beam over a longer stretch, but a lower frame rate.",
            dr: "How many dB are spread from black to white. Low: hard contrast. High: soft and grey.",
            sector: "How wide the image is. Narrower: fewer lines and a higher frame rate.",
            density: "Lines per degree. More lines: finer sideways, but a lower frame rate.",
            zoom: "Enlarges the image. Click in the image to choose the spot.", names: "Writes the names of what you see." },
    k: { frame: "Frame rate", axial: "Axial resolution", lat: "Lateral resolution at the kidney", pen: "Penetration", lines: "Lines per frame", line: "Time per line" },
    f: { frame: v => v < 15 ? "motion will judder" : v < 25 ? "enough for still organs" : "smooth",
         axial: "along the beam, better at high frequency", lat: (b, sp) => `larger of beam ${b} and line spacing ${sp} mm`,
         penShort: "does not reach behind the kidney", penOk: "in liver; reaches behind the kidney", lines: (n, deg) => `${n} per degree · ${deg}°`, line: "down and back: 2 · depth / c" },
    see: {
      flip: "The probe is reversed: the image is mirrored, but the dot on the screen is still on the left. {side} is now on the right of the screen.",
      flipSide: { long: "The head", trans: "The patient's right side" },
      pen: "Below about {p} cm the echoes drown in noise: the frequency is too high for that depth.",
      cut: "The back of the kidney is cut off. Increase the depth.",
      noise: { long: "The amplification is so high that the noise shows: the cyst in the kidney's upper pole is no longer black.", trans: "The amplification is so high that the noise shows: the blood in the vena cava is no longer black." },
      dark: "The image is too dark at the kidney: weak echoes disappear.",
      bright: "The image is too bright: bright structures turn white without detail.",
      darker: "The image gets darker downwards. Raise the deep TGC sliders.",
      lighter: "The image gets brighter downwards. Lower the deep TGC sliders.",
      deep: "There are {x} cm below the kidney. Less depth makes the kidney bigger and the frame rate higher.",
      focus: "The focus is at {z} cm, far from the middle of the kidney ({k} cm). The kidney is more smeared sideways.",
      slow: "The frame rate is {fr} Hz: motion will judder.",
      drLow: "Low dynamic range: hard contrast, weak echoes turn black.",
      drHigh: "High dynamic range: a soft, grey image with many shades.",
      lowLines: "Few lines: the image gets coarser sideways, but the frame rate goes up.",
      zoom: "Zoom enlarges the image but does not make it sharper.",
      base: "The image is even and the kidney is in focus. Try changing one knob at a time.",
    },
    graph: { depth: "depth (cm)", mm: "width (mm)", width: "beam width", space: "line spacing", kidney: "kidney",
             grey: "shown as grey", white: "white", black: "black", echo: "echo after", noise: "noise", gain: "gain", raw: "echo before" },
    dec: ".",
    modelText: `<p><b>Everything is simulated.</b> The image is computed from a simple model of tissue and sound. No real ultrasound images are used. The anatomy is simplified: a right kidney (about 11 cm long) with a cyst in the upper pole, seen through the liver from the front of a patient lying on their back. The transverse plane shows the kidney's hilum, the renal vein, the vena cava, the psoas and a vertebra. Sizes and depths are typical of an adult, but not measured on a particular person.</p>
<p><b>Wavelength and axial resolution.</b> $$\\lambda = \\frac{c}{f}, \\quad c = 1540 \\text{ m/s}$$ The pulse is 2 cycles long. Two things along the beam can be told apart when they are at least half a pulse length apart: $2\\lambda/2 = \\lambda$. At 3.5 MHz that is 0.44 mm.</p>
<p><b>The beam.</b> The transmit beam is focused at the chosen focal depth $z_f$. Its width at the focus is $\\lambda \\cdot F$, where $F = z_f / D$ and the aperture $D$ is 2.4 cm (at least 1.5). Away from the focus it widens, and the narrower the focus, the faster it does so. The receive beam is focused at every depth (dynamic focusing) with $F = d/D$, at least 2. The total width combines the two. With more focal zones, the narrowest transmit beam is used at each depth, but every line has to be sent once per zone. Where the transmit beam is narrow the energy is concentrated, and echoes get up to 3 dB stronger (at most 4 dB weaker far from the focus). The number Lateral resolution is the larger of two: the beam's width at the kidney and the distance between two scan lines at the same place.</p>
<p><b>Speckle.</b> Tissue is made of many small scatterers placed at random. Each echo is the sum of all scatterers within the beam's width and half a pulse length. That is why the image has a grain whose size follows the resolution, not the tissue's own structure. Each tissue has its own echo level in dB relative to liver: for example sinus +7, the fat around the kidney +3, cortex −4, pyramids −12, muscle −9, fat under the skin −14, fluid −60.</p>
<p><b>Attenuation.</b> The sound is attenuated on the way down and back up: $$A = 2 \\cdot \\alpha \\cdot f \\cdot d \\text{ dB}$$ with $\\alpha$ = 0.5 dB/cm/MHz in liver and most soft tissue, 0.6 in the fat under the skin, 0.7 in muscle, 0.002 in fluid and 20 in bone. That is why it is bright behind the cyst and black behind the vertebra.</p>
<p><b>Gain.</b> The machine itself adds $0.8 \\cdot f \\cdot d$ dB (at most 40 dB). Gain (the same at all depths) and TGC handle the rest: 8 sliders spread over the depth shown, joined by straight lines.</p>
<p><b>Noise and penetration.</b> Electronic noise lies 70 dB below the liver echo at the skin. Gain and TGC amplify the noise exactly as they amplify the echoes. The liver echo drowns in the noise when $2 \\cdot 0.5 \\cdot f \\cdot d = 70$, so at $d = 70/f$ cm.</p>
<p><b>Display.</b> Echoes are shown in dB (log compression). The dynamic range is the number of dB spread from black to white around a fixed mid grey. The image is drawn as a fan of scan lines, and the space between two lines is filled by blending them.</p>
<p><b>Frame rate.</b> Each line has to wait for the echoes from the bottom: $$t_{line} = \\frac{2 \\cdot d_{max}}{c}, \\quad \\text{frame rate} = \\frac{1}{n_{lines} \\cdot n_{zones} \\cdot t_{line}}$$ Line density is 1, 2 or 3 lines per degree. Zoom here is a read zoom: it only enlarges the finished image.</p>
<p><b>Not included.</b> The slice thickness (the beam's width in the other direction), harmonic imaging, compound imaging, filters, motion and Doppler. Most artefacts are left out, for example reverberation, the mirror image behind the diaphragm and gas in the bowel. They get a topic of their own. The numbers are typical textbook values, not those of a particular scanner.</p>
<p>Sources: Gibbs, Cole and Sassano, Ultrasound Physics and Technology (2009). Hoskins, Martin and Thrush, Diagnostic Ultrasound: Physics and Equipment, 3rd ed. (2019). Kremkau, Sonography Principles and Instruments. Bushberg et al., The Essential Physics of Medical Imaging, the ultrasound chapter (attenuation, resolution, frame rate).</p>`,
    groups: [
      ["Orientation", [
        ["Where is the head?", "Longitudinal plane, probe held normally. Which side of the screen faces the patient's head? Find two things in the image that show it.", "The left side, where the dot is. On the left you see the diaphragm (the bright curve) with the lung behind it, and the kidney's upper pole lies there, deeper than the lower pole. The liver thins towards the right and ends above the bowel."],
        ["Reverse the probe", "Press Reversed. What changes in the image, and what does the dot on the screen do?", "The image is mirrored: the head moves to the right side. The dot stays on the left, because it belongs to the screen. Now the probe's marker no longer matches the dot. Check it before you scan: touch one end of the probe's face and see which side of the screen reacts. Otherwise head and feet (or right and left) can be swapped."],
        ["Transverse", "Switch to Transverse, probe held normally (marker towards the patient's right). Which side of the screen is the patient's right? Which way does the kidney's hilum face?", "The patient's right is on the left of the screen, as when you face the patient (as on CT). The hilum faces right on the screen, towards the midline, where the renal vein runs to the vena cava. The vertebra lies in the body's midline and is therefore seen furthest right, just behind the vena cava."],
        ["The shadow behind the vertebra", "Transverse: below the vertebra there is a black band all the way down. Why? Can gain help?", "Bone sends almost all the sound back and strongly attenuates the rest (20 dB/cm/MHz against 0.5 in liver). No echoes come from behind it, so it is black: an acoustic shadow. More gain does not help: there is only noise to amplify, so the shadow just turns grey. Artefacts get a topic of their own.", { deep: true }],
      ]],
      ["Gain and TGC", [
        ["Too much gain", "Press Reset all (longitudinal plane). Turn the gain up to +30 dB. What happens to the cyst in the kidney's upper pole? Do you get more information?", "The cyst turns grey instead of black, because the noise is now amplified enough to be seen. The sinus and other bright structures turn white without detail. Gain amplifies echoes and noise equally, so there is no new information, only a brighter image."],
        ["Too little gain", "Turn the gain down to −15 dB. What disappears first?", "The weak echoes: the pyramids, the fat under the skin and the deep tissue turn black. The danger is that a dark solid lesion looks like a cyst, or that something is missed."],
        ["Darker with depth", "Press Reset all. Compare the liver at the top with the tissue below the kidney. Why does the image get darker downwards?", "The sound is attenuated on the way down and on the way back up, in liver 0.5 dB per cm per MHz each way. At 3.5 MHz and 16 cm that is 56 dB. The machine corrects part of it, but at most 40 dB. You have to handle the rest with TGC."],
        ["Make the image even", "Use the TGC sliders so the tissue has the same grey all the way down. Which sliders go up? Look at the graph Echo and gain.", "The sliders from about 6 cm down go up, the lowest most: about +4 dB at 6 cm, +8 to +10 at the kidney and up towards +20 at the bottom. The white line in the graph turns flat. Gain would brighten everything, including the top, which was already fine."],
        ["Behind the cyst", "Look at the tissue just behind the cyst. Why is it brighter than the tissue beside it? Should you correct it with TGC?", "Fluid hardly attenuates sound, so the echoes behind the cyst are stronger than beside it. TGC acts across the whole width of the image, so it cannot remove a bright band in one place. Nor should it: the band shows that this is fluid.", { deep: true }],
      ]],
      ["Depth and zoom", [
        ["The right depth", "Press Reset all, so the depth is 18 cm. Reduce the depth so the kidney fills the image but you still see a little below it. Which depth, and what happens to the frame rate?", "About 13 cm: the back of the kidney lies at 11 cm on the centre line. The frame rate rises from 31 to 42 Hz, because the sound has a shorter way down and back for each line."],
        ["Too little depth", "Try 9 cm. What is missing now?", "The back of the kidney and everything behind it. Fluid behind the kidney, for example, is not seen. So start deep, look through the whole area, then reduce the depth."],
        ["Zoom", "Set the depth to 13 cm, choose zoom 2×, and click on the cyst. Does the image get sharper?", "No. The cyst gets bigger, but the grain and the edges get just as much bigger. Zoom only enlarges the image already made. The frame rate is the same. Detail is set by frequency, focus and line density."],
        ["Depth or zoom", "Why is it better to reduce the depth than to zoom, when what you want to see lies high in the image?", "Less depth also gives a higher frame rate and uses the whole screen. Zoom only changes the view. Many scanners also have a write zoom, which scans only the chosen area and can put more lines there. It is not in the simulator.", { deep: true }],
      ]],
      ["Frequency", [
        ["High frequency", "Press Reset all (depth 18 cm). Go from 3.5 to 6 MHz. What happens at the top, and what happens deep down?", "At the top the grain gets finer, and the axial resolution goes from 0.44 to 0.26 mm. But high frequency is attenuated more: the penetration falls from 20 to 12 cm. Deeper than about 12 cm it is mostly noise, and the back of the kidney drowns."],
        ["Low frequency", "Try 2 MHz. What do you gain, and what do you lose?", "The sound reaches all the way down (penetration 35 cm). But the grain gets coarse, the axial resolution is 0.77 mm, and the beam is wider: 2.6 mm at the kidney."],
        ["The best frequency", "Depth 13 cm and focus 8.5 cm. Find the highest frequency at which the back of the kidney (about 11 cm) is still clear. You may lift the depth with TGC.", "About 5 MHz, where the penetration is 14 cm. At 6 MHz (penetration 12 cm) the cyst and the back part of the kidney turn grey with noise, and TGC does not help, because it lifts the noise as much as the echoes. Choose the highest frequency that still reaches deep enough."],
      ]],
      ["Focus", [
        ["Move the focus", "Press Reset all: the focus is at 4 cm. Move it to the middle of the kidney (about 8.5 cm). What happens to the beam's width at the kidney? Look at the graph The beam and the number Lateral resolution.", "The beam at the kidney goes from 1.6 to 1.1 mm. Edges and pyramids get sharper sideways, and the kidney gets a little brighter, because the energy is concentrated there. The lateral resolution now shows 1.2 mm, because the distance between the lines is now what limits it. Put the focus at or just below what you want to see."],
        ["More focal zones", "Leave the focus at 8.5 cm and the depth at 18 cm. Choose 3 focal zones. What gets better, and what does it cost?", "The beam is narrow over a longer stretch, but every line has to be sent three times: the frame rate falls from 31 to 10 Hz. That is no good for anything that moves, such as when the patient breathes."],
      ]],
      ["Field of view and frame rate", [
        ["Sector width", "Press Reset all. Make the sector narrower, from 70 to 40 degrees. What happens to the frame rate, and why?", "It rises from 31 to 54 Hz, because fewer lines are needed (80 instead of 140). In return you see less at the sides."],
        ["Line density", "Set the sector to 70° again and the focus to 8.5 cm. Try low and high line density. Look at the lateral resolution at the kidney and at the frame rate.", "Low: 70 lines, 2.4 mm between lines at the kidney and 61 Hz, but the image gets coarser sideways. High: 210 lines 0.8 mm apart, but only 20 Hz, and the lateral resolution stops at the beam's 1.1 mm. It can never be better than the beam's width or the line spacing."],
        ["The best image", "Make the best image of the kidney you can, with at least 25 Hz. Save the numbers first so you can compare with the starting point.", "For example depth 13 cm, 5 MHz, focus 8.5 cm, one focal zone, high line density, sector 60° and TGC so the depth is even. That gives 33 Hz and 0.8 mm lateral resolution against 1.6 mm at the start, and the axial resolution goes from 0.44 to 0.31 mm."],
      ]],
      ["Dynamic range", [
        ["Low", "Press Reset all. Set the dynamic range to 35 dB. What happens to the image?", "It turns hard: black and white with few shades of grey. The pyramids get darker, the sinus brighter, and the cyst stands out sharply. But faint differences in the tissue disappear, and the fat under the skin turns black."],
        ["High", "Set it to 80 dB. What do you gain, and what do you lose?", "The image turns soft and grey: more shades, so small differences can be seen, but the contrast between, say, cortex and pyramid gets smaller."],
      ]],
      ["Formulas", [
        ["Wavelength", "Sound travels at 1540 m/s in soft tissue. Work out the wavelength at 3.5 and 6 MHz. The pulse is 2 cycles long. What is the axial resolution?", "$\\lambda = \\frac{1540}{3.5 \\cdot 10^6} = 0.44$ mm and $\\frac{1540}{6 \\cdot 10^6} = 0.26$ mm. The axial resolution is half a pulse length: $\\frac{2\\lambda}{2} = \\lambda$, so 0.44 and 0.26 mm. Check the numbers in the simulator."],
        ["Time and depth", "An echo comes back 130 µs after the pulse. How deep is what sent it back?", "The sound goes down and back up: $d = \\frac{c \\cdot t}{2} = \\frac{1540 \\cdot 130 \\cdot 10^{-6}}{2} = 0.10$ m, so 10 cm."],
        ["Penetration", "Liver attenuates 0.5 dB/cm/MHz each way. The machine can hear echoes down to 70 dB below the echo from the skin. How deep do you reach at 5 MHz?", "$2 \\cdot 0.5 \\cdot 5 \\cdot d = 70$ gives $d = 14$ cm. Check Penetration in the simulator."],
        ["TGC in numbers", "At 3.5 MHz: how much is the echo from 10 cm attenuated in all? The machine corrects 0.8 dB/cm/MHz itself. How much is missing?", "Attenuation: $2 \\cdot 0.5 \\cdot 3.5 \\cdot 10 = 35$ dB. The machine: $0.8 \\cdot 3.5 \\cdot 10 = 28$ dB. 7 dB is missing, which the TGC has to give."],
        ["Frame rate", "Depth 13 cm, 140 lines and one focal zone. Work out the frame rate. What is it with 3 focal zones?", "One line: $\\frac{2 \\cdot 0.13}{1540} = 169$ µs. One frame: $140 \\cdot 169$ µs $= 23.6$ ms, so 42 Hz. With 3 zones it takes three times as long: 14 Hz."],
      ], "deep"],
    ],
  },
};

// ---- state ----
const START = { plane: "long", flip: false, gain: 0, tgc: Array(TGC_N).fill(0), depth: 18, f: 3.5, focus: 4, zones: 1, dr: 60,
                sector: 70, density: "mid", zoom: 1, names: false };
const S = { lang: "da", level: "grund", ...START, tgc: [...START.tgc] };
const $ = id => document.getElementById(id);
let M = US.model(S);
let PIN = null;          // the numbers saved with the compare button
let ZC = null;           // where to zoom, in cm on the screen (before any mirroring)
const CSS = {}, css = n => CSS[n] || (CSS[n] = getComputedStyle(document.documentElement).getPropertyValue(n).trim());
const fmt = (v, d = 1) => v.toFixed(d).replace(".", T[S.lang].dec);
const INK = "rgba(10,14,24,.85)";
// the shared formula converter does not know these Greek letters
const math = s => withMath(s).replace(/<mi>lambda<\/mi>/g, "<mi>λ</mi>").replace(/<mi>alpha<\/mi>/g, "<mi>α</mi>");
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

// ---- step 0: fixed random scatterers, and the tissue on the polar grid for each plane ----
const GRE = new Float32Array(N), GIM = new Float32Array(N);
{
  let a = 20261114 >>> 0;
  const r = () => { a = (a * 1664525 + 1013904223) >>> 0; return (a + 0.5) / 4294967296; };
  for (let k = 0; k < N; k++) {                        // Box-Muller: two normal numbers, each with variance 1/2
    const m = Math.sqrt(-Math.log(r())), t = 2 * Math.PI * r();
    GRE[k] = m * Math.cos(t); GIM[k] = m * Math.sin(t);
  }
}
const PLANES = {};
function planeMaps(p) {
  if (PLANES[p]) return PLANES[p];
  const tis = new Uint8Array(N), amp = new Float32Array(N);
  for (let ir = 0; ir < NR; ir++) {
    const d = (ir + 0.5) * DD, R = US.RC + d;
    for (let j = 0; j < NTH; j++) {
      const th = (j - HALF) * DTH, x = R * Math.sin(th), y = R * Math.cos(th) - US.RC, [t, mod] = US.anatomy(p, x, y, d), k = ir * NTH + j;
      tis[k] = t; amp[k] = Math.pow(10, (US.LEVEL[t] + mod) / 20);
    }
  }
  return (PLANES[p] = { tis, amp });
}

// ---- step 1: the scan ----
const SRE = new Float32Array(N), SIM = new Float32Array(N), ARE = new Float32Array(N), AIM = new Float32Array(N), ENV = new Float32Array(N);
const ROW = new Float32Array(NTH);
const NORM = {};
function boxNorm(r) {           // three box passes of radius r: the factor that keeps the speckle's mean power
  if (NORM[r]) return NORM[r];
  let k = [1];
  for (let p = 0; p < 3; p++) {
    const out = new Array(k.length + 2 * r).fill(0);
    k.forEach((v, i) => { for (let j = 0; j <= 2 * r; j++) out[i + j] += v / (2 * r + 1); });
    k = out;
  }
  return (NORM[r] = 1 / Math.sqrt(k.reduce((s, v) => s + v * v, 0)));
}
function boxPass(a, o, r) {     // moving average of radius r over one row, edges held
  let sum = 0;
  for (let i = -r; i <= r; i++) sum += a[o + Math.min(NTH - 1, Math.max(0, i))];
  const w = 1 / (2 * r + 1);
  for (let i = 0; i < NTH; i++) {
    ROW[i] = sum * w;
    sum += a[o + Math.min(NTH - 1, i + r + 1)] - a[o + Math.max(0, i - r)];
  }
  a.set(ROW, o);
}
let SCANNED = "";
function scan() {
  const key = [S.plane, S.f, S.focus, S.zones].join();
  if (key === SCANNED) return;
  SCANNED = key;
  const P = planeMaps(S.plane), B = M.B;
  for (let k = 0; k < N; k++) { SRE[k] = P.amp[k] * GRE[k]; SIM[k] = P.amp[k] * GIM[k]; }
  // sideways: the two-way beam width, turned into a number of grid columns at this depth
  for (let ir = 0; ir < NR; ir++) {
    const d = (ir + 0.5) * DD, sig = B.w(d) / 2.355 / ((US.RC + d) * DTH);
    const r = Math.round((Math.sqrt(4 * sig * sig + 1) - 1) / 2);
    if (r < 1) continue;
    const o = ir * NTH, g = boxNorm(r);
    for (let p = 0; p < 3; p++) { boxPass(SRE, o, r); boxPass(SIM, o, r); }
    for (let j = 0; j < NTH; j++) { SRE[o + j] *= g; SIM[o + j] *= g; }
  }
  // along the beam: half a pulse length (= the axial resolution) as a Gaussian
  const sa = M.axial / 2.355 / DD, taps = Math.max(1, Math.ceil(3 * sa)), ker = [];
  for (let t = -taps; t <= taps; t++) ker.push(Math.exp(-0.5 * (t / sa) ** 2));
  const ks = ker.reduce((s, v) => s + v, 0), kq = Math.sqrt(ker.reduce((s, v) => s + (v / ks) ** 2, 0));
  for (let i = 0; i < ker.length; i++) ker[i] /= ks * kq;
  ARE.fill(0); AIM.fill(0);
  for (let ir = 0; ir < NR; ir++) {
    const o = ir * NTH;
    for (let t = -taps; t <= taps; t++) {
      const src = Math.min(NR - 1, Math.max(0, ir + t)) * NTH, w = ker[t + taps];
      for (let j = 0; j < NTH; j++) { ARE[o + j] += w * SRE[src + j]; AIM[o + j] += w * SIM[src + j]; }
    }
  }
  // attenuation down and back up, the focus' extra energy, electronic noise, and the envelope in dB
  const att = new Float32Array(NTH), nz = Math.pow(10, US.NOISE_DB / 20), c = Math.LN10 / 20, OFF = 123457;
  for (let ir = 0; ir < NR; ir++) {
    const o = ir * NTH, fg = B.fg((ir + 0.5) * DD);
    for (let j = 0; j < NTH; j++) {
      const k = o + j, a2 = 2 * US.ALPHA[P.tis[k]] * S.f * DD;
      att[j] += a2 / 2;
      const amp = Math.exp((fg - att[j]) * c), m = (k + OFF) % N;
      att[j] += a2 / 2;
      const re = ARE[k] * amp + nz * GIM[m], im = AIM[k] * amp + nz * GRE[m];
      ENV[k] = 4.342944819 * Math.log(re * re + im * im + 1e-30);
    }
  }
}

// ---- step 2: the image on the screen ----
function layout(W, H) {
  const th = S.sector / 2 * Math.PI / 180, D = S.depth;
  const xmax = (US.RC + D) * Math.sin(th), ytop = US.RC * (Math.cos(th) - 1);
  const mT = 24, mB = 8, mL = 8, mR = 40, aw = W - mL - mR, ah = H - mT - mB;
  const sc = Math.min(aw / (2 * xmax), ah / (D - ytop)) * S.zoom;
  let cx = 0, cy = (ytop + D) / 2;
  if (S.zoom > 1 && ZC) {
    const hw = aw / 2 / sc, hh = ah / 2 / sc;          // keep the view inside the fan
    cx = Math.max(-xmax + hw, Math.min(xmax - hw, ZC[0]));
    cy = Math.max(ytop + hh, Math.min(D - hh, ZC[1]));
  }
  return { th, D, sc, ox: mL + aw / 2 - cx * sc, oy: mT + ah / 2 - cy * sc, mT, mR, xmax, ytop };
}
let IMGBUF = null;
function drawImg() {
  const cv = $("img"), [ctx, W, H] = fit(cv);
  if (W < 10) return;
  const V = layout(W, H), L = M.L, dpr = window.devicePixelRatio || 1;
  const ow = Math.min(Math.round(W * dpr), 760), oh = Math.round(ow * H / W);
  if (!IMGBUF || IMGBUF.w !== ow || IMGBUF.h !== oh) {
    const off = document.createElement("canvas"); off.width = ow; off.height = oh;
    const octx = off.getContext("2d"), img = octx.createImageData(ow, oh);
    IMGBUF = { w: ow, h: oh, off, octx, img, px: new Uint32Array(img.data.buffer) };
  }
  // where each scan line sits on the polar grid, and the gain at each depth
  const lc = new Int32Array(L);
  for (let j = 0; j < L; j++) lc[j] = Math.round((-V.th + (j + 0.5) * 2 * V.th / L) / DTH) + HALF;
  const gt = new Float32Array(NR);
  for (let ir = 0; ir < NR; ir++) gt[ir] = US.gainAt(S, (ir + 0.5) * DD);
  const q = 255 / S.dr, base = 127.5 - US.MID * q, px = IMGBUF.px, sx = W / ow, sy = H / oh, flip = S.flip ? -1 : 1;
  const nrMax = Math.min(NR - 1, Math.round(S.depth / DD));
  for (let i = 0; i < oh; i++) {
    const y = ((i + 0.5) * sy - V.oy) / V.sc, yr = y + US.RC;
    for (let j = 0; j < ow; j++) {
      const x = flip * ((j + 0.5) * sx - V.ox) / V.sc, R = Math.hypot(x, yr), th = Math.atan2(x, yr), d = R - US.RC;
      if (d < 0 || d > S.depth || th < -V.th || th > V.th) { px[i * ow + j] = 0xFF000000; continue; }
      let t = (th + V.th) / (2 * V.th) * L - 0.5, j0 = Math.floor(t);
      if (j0 < 0) { j0 = 0; t = 0; } else if (j0 > L - 2) { j0 = L - 2; t = L - 1; }
      const ft = t - j0, rr = Math.min(nrMax, d / DD - 0.5), r0 = Math.max(0, Math.floor(rr)), r1 = Math.min(nrMax, r0 + 1), fr = Math.max(0, rr - r0);
      const c0 = lc[j0], c1 = lc[j0 + 1];
      const a = ENV[r0 * NTH + c0] * (1 - fr) + ENV[r1 * NTH + c0] * fr;
      const b = ENV[r0 * NTH + c1] * (1 - fr) + ENV[r1 * NTH + c1] * fr;
      let g = base + (a * (1 - ft) + b * ft + gt[r0]) * q;
      g = g < 0 ? 0 : g > 255 ? 255 : g | 0;
      px[i * ow + j] = 0xFF000000 | (g << 16) | (g << 8) | g;
    }
  }
  IMGBUF.octx.putImageData(IMGBUF.img, 0, 0);
  ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H);
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(IMGBUF.off, 0, 0, W, H);
  ctx.fillStyle = "#000"; ctx.fillRect(W - V.mR, 0, V.mR, H); ctx.fillRect(0, 0, W, V.mT - 4);   // the scale and the settings line get their own strips
  overlays(ctx, W, H, V);
}
function overlays(ctx, W, H, V) {
  const L = T[S.lang], X = x => V.ox + (S.flip ? -x : x) * V.sc, Y = y => V.oy + y * V.sc, mono = "--mono";
  // the marker dot: belongs to the screen, so it stays on the left
  const zoomed = S.zoom > 1, mx = zoomed ? 12 : V.ox - US.RC * Math.sin(V.th) * V.sc - 10, my = zoomed ? 10 : Math.max(10, Y(US.RC * (Math.cos(V.th) - 1)) - 2);
  ctx.fillStyle = css("--signal"); ctx.beginPath(); ctx.arc(mx, my, 5, 0, 7); ctx.fill();
  // the settings line, as on a scanner
  const parts = [L.planeShort[S.plane], `${fmt(S.f, 1)} MHz`, `${Math.round(M.frame)} Hz`, `G ${S.gain > 0 ? "+" : ""}${S.gain} dB`, `DR ${S.dr}`];
  if (S.zoom > 1) parts.push(`zoom ${fmt(S.zoom, S.zoom % 1 ? 1 : 0)}×`);
  ctx.font = `11px ${css(mono)}`;
  while (parts.length > 1 && ctx.measureText(parts.join(" · ")).width > W - 34) parts.shift();   // a narrow screen: keep the dot clear
  text(ctx, parts.join(" · "), W - 6, 14, css("--muted"), "right", 11, mono);
  // depth scale on the right, measured along the centre line
  const sxp = W - V.mR + 14;
  ctx.strokeStyle = css("--muted"); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(sxp, Math.max(V.mT, Y(0))); ctx.lineTo(sxp, Math.min(H, Y(S.depth))); ctx.stroke();
  for (let d = 0; d <= S.depth + 0.01; d++) {
    const y = Y(d); if (y < V.mT - 2 || y > H) continue;
    const big = d % 2 === 0;
    ctx.beginPath(); ctx.moveTo(sxp, y); ctx.lineTo(sxp + (big ? 7 : 4), y); ctx.stroke();
    if (big) text(ctx, String(d), sxp + 10, y + 4, css("--muted"), "left", 10, mono);
  }
  // the focal zones: orange triangles beside the scale
  ctx.fillStyle = css("--amber");
  for (const z of M.B.zs) {
    if (z > S.depth) continue;
    const y = Y(z); ctx.beginPath(); ctx.moveTo(sxp - 2, y); ctx.lineTo(sxp - 10, y - 5); ctx.lineTo(sxp - 10, y + 5); ctx.fill();
  }
  // names
  if (S.names) {
    ctx.font = `12px ${css("--body")}`; ctx.textAlign = "center";
    for (const [x, y, da, en] of US.labels(S.plane)) {
      const R = Math.hypot(x, y + US.RC), th = Math.atan2(x, y + US.RC);
      if (R - US.RC > S.depth - 0.3 || Math.abs(th) > V.th) continue;
      const s = S.lang === "da" ? da : en, w = ctx.measureText(s).width + 8, px = X(x), py = Y(y);
      if (px < 0 || px > W || py < V.mT || py > H) continue;
      ctx.fillStyle = INK; ctx.fillRect(px - w / 2, py - 9, w, 17);
      ctx.fillStyle = css("--fg"); ctx.fillText(s, px, py + 4);
    }
  }
}
$("img").addEventListener("click", e => {
  const r = $("img").getBoundingClientRect(), V = layout(r.width, r.height);
  ZC = [(e.clientX - r.left - V.ox) / V.sc, (e.clientY - r.top - V.oy) / V.sc];
  if (S.zoom > 1) drawImg();
});

// ---- the two graphs ----
function axes(ctx, x0, y0, x1, y1) {
  ctx.strokeStyle = css("--line"); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x0, y1); ctx.lineTo(x0, y0); ctx.lineTo(x1, y0); ctx.stroke();
}
function depthTicks(ctx, X, y0, label, x1) {
  const step = S.depth > 10 ? 2 : 1;
  for (let d = 0; d <= S.depth; d += step) text(ctx, String(d), X(d), y0 + 13, css("--muted"), "center", 10);
  text(ctx, label, x1, y0 + 26, css("--muted"), "right", 10);
}
function drawBeam() {
  const [ctx, W, H] = fit($("beam"));
  if (W < 10) return;
  const G = T[S.lang].graph, B = M.B, x0 = 30, x1 = W - 8, y0 = H - 32, y1 = 30, ym = (y0 + y1) / 2;
  const X = d => x0 + d / S.depth * (x1 - x0);
  let wmax = 0;
  for (let d = 0.2; d <= S.depth; d += 0.1) wmax = Math.max(wmax, B.w(d), US.spacing(S, d));
  const half = Math.min(6, Math.max(1.5, wmax * 10 / 2 * 1.1)), Y = mm => ym - mm / half * (ym - y1);
  // the kidney
  ctx.fillStyle = "rgba(230,233,240,.08)";
  const kf = Math.min(S.depth, M.K.front), kb = Math.min(S.depth, M.K.back);
  ctx.fillRect(X(kf), y1, X(kb) - X(kf), y0 - y1);
  text(ctx, G.kidney, (X(kf) + X(kb)) / 2, y0 - 6, css("--muted"), "center", 10);
  axes(ctx, x0, y0, x1, y1);
  ctx.strokeStyle = css("--line"); ctx.beginPath(); ctx.moveTo(x0, ym); ctx.lineTo(x1, ym); ctx.stroke();
  // the beam: a band of ± half the width
  ctx.beginPath();
  for (let d = 0; d <= S.depth; d += 0.05) ctx.lineTo(X(d), Y(B.w(Math.max(0.1, d)) * 10 / 2));
  for (let d = S.depth; d >= 0; d -= 0.05) ctx.lineTo(X(d), Y(-B.w(Math.max(0.1, d)) * 10 / 2));
  ctx.closePath(); ctx.fillStyle = "rgba(94,231,223,.28)"; ctx.fill(); ctx.strokeStyle = css("--signal"); ctx.lineWidth = 1.5; ctx.stroke();
  // the line spacing, dashed
  ctx.setLineDash([4, 4]); ctx.strokeStyle = css("--muted"); ctx.lineWidth = 1.2;
  for (const sgn of [1, -1]) {
    ctx.beginPath();
    for (let d = 0; d <= S.depth; d += 0.1) ctx.lineTo(X(d), Y(sgn * US.spacing(S, d) * 10 / 2));
    ctx.stroke();
  }
  ctx.setLineDash([]); ctx.lineWidth = 1;
  // the focal zones
  ctx.fillStyle = css("--amber");
  for (const z of B.zs) if (z <= S.depth) { ctx.beginPath(); ctx.moveTo(X(z), y1 + 2); ctx.lineTo(X(z) - 5, y1 - 7); ctx.lineTo(X(z) + 5, y1 - 7); ctx.fill(); }
  // scale and legend
  for (const v of [-Math.floor(half), 0, Math.floor(half)]) text(ctx, String(v), x0 - 5, Y(v) + 3, css("--muted"), "right", 10);
  text(ctx, G.mm, 2, y0 + 26, css("--muted"), "left", 10);
  depthTicks(ctx, X, y0, G.depth, x1);
  let lx = x1;
  for (const [name, col, dash] of [[G.space, css("--muted"), true], [G.width, css("--signal"), false]]) {
    text(ctx, name, lx, 11, css("--muted"), "right", 10);
    lx -= ctx.measureText(name).width + 6;
    ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.setLineDash(dash ? [4, 3] : []);
    ctx.beginPath(); ctx.moveTo(lx - 16, 7.5); ctx.lineTo(lx, 7.5); ctx.stroke(); ctx.setLineDash([]);
    lx -= 28;
  }
  ctx.lineWidth = 1;
}
function drawGain() {
  const [ctx, W, H] = fit($("gaincv"));
  if (W < 10) return;
  const G = T[S.lang].graph, deep = S.level === "deep", x0 = 30, x1 = W - 8, y0 = H - 32, y1 = 18;
  const lo = -80, hi = 45, X = d => x0 + d / S.depth * (x1 - x0), Y = v => y0 - (Math.max(lo, Math.min(hi, v)) - lo) / (hi - lo) * (y0 - y1);
  // the dynamic range: what is shown as grey
  const top = US.MID + S.dr / 2, bot = US.MID - S.dr / 2;
  const grad = ctx.createLinearGradient(0, Y(top), 0, Y(bot));
  grad.addColorStop(0, "rgba(230,233,240,.22)"); grad.addColorStop(1, "rgba(230,233,240,.03)");
  ctx.fillStyle = grad; ctx.fillRect(x0, Y(top), x1 - x0, Y(bot) - Y(top));
  text(ctx, G.white, x1 - 4, Y(top) - 4, css("--muted"), "right", 10);
  text(ctx, G.grey, x1 - 4, Y(top) + 12, css("--muted"), "right", 10);
  text(ctx, G.black, x1 - 4, Y(bot) + 12, css("--muted"), "right", 10);
  axes(ctx, x0, y0, x1, y1);
  for (let v = -80; v <= 40; v += 20) text(ctx, String(v), x0 - 5, Y(v) + 3, css("--muted"), "right", 10);
  text(ctx, "dB", 2, y0 + 26, css("--muted"), "left", 10);
  const curve = (fn, col, w, dash) => {
    ctx.strokeStyle = col; ctx.lineWidth = w; ctx.setLineDash(dash || []); ctx.beginPath();
    for (let d = 0.2; d <= S.depth; d += 0.1) ctx.lineTo(X(d), Y(fn(US.levels(S, d, M.B))));
    ctx.stroke(); ctx.setLineDash([]); ctx.lineWidth = 1;
  };
  if (deep) curve(l => l.echo - l.G, css("--hot"), 1.5);
  curve(l => l.G, css("--amber"), 1.5);
  curve(l => l.noise, css("--muted"), 1.5, [4, 3]);
  curve(l => l.echo, css("--fg"), 2.4);
  depthTicks(ctx, X, y0, G.depth, x1);
  let lx = x1;
  const items = [[G.echo, css("--fg"), false], [G.noise, css("--muted"), true], [G.gain, css("--amber"), false]];
  if (deep) items.push([G.raw, css("--hot"), false]);
  for (const [name, col, dash] of items) {
    text(ctx, name, lx, 11, css("--muted"), "right", 10);
    lx -= ctx.measureText(name).width + 6;
    ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.setLineDash(dash ? [4, 3] : []);
    ctx.beginPath(); ctx.moveTo(lx - 14, 7.5); ctx.lineTo(lx, 7.5); ctx.stroke(); ctx.setLineDash([]);
    lx -= 24;
  }
  ctx.lineWidth = 1;
}

// ---- the numbers, what you can see, and the saved numbers ----
function metrics() {
  const L = T[S.lang], fr = M.frame;
  return [[fr < 15 ? "err" : fr < 25 ? "mag" : "ok", "frame", `${Math.round(fr)} Hz`, L.f.frame(fr)],
          ["", "axial", `${fmt(M.axial * 10, 2)} mm`, L.f.axial],
          ["mag", "lat", `${fmt(M.lat * 10, 1)} mm`, L.f.lat(fmt(M.beamK * 10, 1), fmt(M.spaceK * 10, 1))],
          [M.pen < M.K.back + 1 ? "err" : "ok", "pen", `${fmt(M.pen, 0)} cm`, M.pen < M.K.back + 1 ? L.f.penShort : L.f.penOk],
          ["", "lines", String(M.L), L.f.lines(US.DENSITY[S.density], S.sector)],
          ["", "line", `${Math.round(2 * S.depth / US.C * 1e6)} µs`, L.f.line]];
}
function observations() {
  const L = T[S.lang].see, K = M.K, lv = d => US.levels(S, d, M.B);
  const kd = lv(K.mid), top = lv(3);
  const range = [];
  for (let d = 2.5; d <= Math.min(S.depth, 15); d += 0.5) range.push(lv(d).grey);
  const drop = range.length > 1 ? range[0] - range[range.length - 1] : 0;
  const nearest = Math.min(...M.B.zs.map(z => Math.abs(z - K.mid)));
  const found = [
    [S.flip, L.flip.replace("{side}", L.flipSide[S.plane])],
    [M.pen < Math.min(S.depth, K.back + 1), L.pen.replace("{p}", fmt(M.pen, 0))],
    [S.depth < K.back + 0.2, L.cut],
    [M.frame < 15, L.slow.replace("{fr}", Math.round(M.frame))],
    [kd.noiseGrey > 0.12, L.noise[S.plane]],
    [kd.grey < 0.2, L.dark],
    [top.grey > 0.8 || kd.grey > 0.78, L.bright],
    [S.dr < 45, L.drLow], [S.dr > 70, L.drHigh],
    [S.density === "low", L.lowLines], [S.zoom > 1, L.zoom],
    [drop > 0.15, L.darker], [drop < -0.15, L.lighter],
    [nearest > 2.5, L.focus.replace("{z}", fmt(S.focus, 1)).replace("{k}", fmt(K.mid, 1))],
    [S.depth > K.back + 3.5, L.deep.replace("{x}", fmt(S.depth - K.back, 0))],
  ].filter(([on]) => on).slice(0, 2).map(([, t]) => t);
  return found.length ? found : [L.base];
}
function readouts() {
  const L = T[S.lang], pinned = PIN ? PIN.vals : null;
  $("readout").innerHTML = metrics().map(([cls, key, value, foot]) =>
    `<div class="metric ${cls}"><div class="k">${L.k[key]}</div><div class="v">${value}</div><div class="f">${foot}</div>` +
    (pinned ? `<div class="p">${L.saved}: ${pinned[key]}</div>` : "") + `</div>`).join("");
  $("t-seen").textContent = L.seen; $("seen").textContent = observations().join(" ");
  $("pin").textContent = pinned ? L.unpin : L.pin;
}
$("pin").onclick = () => {
  PIN = PIN ? null : { vals: Object.fromEntries(metrics().map(([, key, value]) => [key, value])) };
  readouts();
};

// ---- the probe on the patient: a small drawing, so the marker's direction is easy to check ----
function drawProbe() {
  const cv = $("probe"); if (!cv) return;
  const [ctx, W, H] = fit(cv);
  if (W < 10) return;
  const L = T[S.lang], cx = W / 2, mute = css("--muted");
  // seen from the front: the patient's right is on our left
  ctx.strokeStyle = mute; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(cx, 16, 10, 0, 7); ctx.stroke();
  ctx.beginPath(); ctx.roundRect ? ctx.roundRect(cx - 26, 30, 52, 74, 10) : ctx.rect(cx - 26, 30, 52, 74); ctx.stroke();
  text(ctx, S.lang === "da" ? "H" : "R", cx - 34, 70, mute, "right", 11);
  text(ctx, S.lang === "da" ? "V" : "L", cx + 34, 70, mute, "left", 11);
  // the probe under the right ribs: on our left
  const px = cx - 12, py = 60, long = S.plane === "long", len = 22;
  ctx.strokeStyle = css("--fg"); ctx.lineWidth = 5; ctx.lineCap = "round"; ctx.beginPath();
  long ? (ctx.moveTo(px, py - len / 2), ctx.lineTo(px, py + len / 2)) : (ctx.moveTo(px - len / 2, py), ctx.lineTo(px + len / 2, py));
  ctx.stroke(); ctx.lineCap = "butt"; ctx.lineWidth = 1;
  // the marker: towards the head (long) or the patient's right (trans); turned, the other way
  const s = S.flip ? 1 : -1, mx = long ? px : px + s * len / 2, my = long ? py + s * len / 2 : py;
  ctx.fillStyle = css("--signal"); ctx.beginPath(); ctx.arc(mx, my, 4, 0, 7); ctx.fill();
}

// ---- controls, text, tasks ----
const SLIDERS = {
  gain: [-20, 30, 1, v => `${v > 0 ? "+" : ""}${v} dB`], depth: [4, 18, 1, v => `${v} cm`], f: [2, 6, 0.5, v => `${fmt(v, 1)} MHz`],
  focus: [1, 17, 0.5, v => `${fmt(v, 1)} cm`], dr: [30, 80, 5, v => `${v} dB`], sector: [30, 70, 5, v => `${v}°`],
};
function buildControls() {
  const L = T[S.lang], C = L.ctl, box = $("controls");
  const help = k => S.level === "grund" ? `<p class="help">${L.help[k]}</p>` : "";
  const seg = (key, opts, extra = "") => `<div class="ctl"><label><span>${C[key]}</span><span></span></label><div class="seg">` +
    opts.map(([val, lbl]) => `<button data-k="${key}" data-v="${val}" aria-pressed="${String(S[key]) === String(val)}">${lbl}</button>`).join("") +
    `</div>${extra}${help(key)}</div>`;
  const slider = k => {
    const [mn, mx, st, f] = SLIDERS[k];
    return `<div class="ctl"><label for="s-${k}"><span>${C[k]}</span><span id="o-${k}">${f(S[k])}</span></label>` +
      `<input type="range" id="s-${k}" min="${mn}" max="${mx}" step="${st}" value="${S[k]}">${help(k)}</div>`;
  };
  const tgc = `<div class="ctl tgc"><label><span>${C.tgc}</span><button class="mini" id="tgc0">${C.tgcReset}</button></label>` +
    S.tgc.map((v, i) => `<div class="tgcrow"><span>${fmt((i + 0.5) * S.depth / TGC_N, 0)} cm</span>` +
      `<input type="range" id="tgc-${i}" min="-20" max="20" step="1" value="${v}" aria-label="TGC ${i + 1}"><span id="o-tgc-${i}">${v > 0 ? "+" : ""}${v}</span></div>`).join("") +
    `${help("tgc")}</div>`;
  const grp = k => `<h3 class="grp">${L.grp[k]}</h3>`;
  box.innerHTML =
    grp("orient") + seg("plane", [["long", L.plane.long], ["trans", L.plane.trans]]) +
    seg("flip", [["false", C.normal], ["true", C.flipped]], `<canvas id="probe" aria-hidden="true"></canvas>`) +
    seg("names", [["false", C.off], ["true", C.on]]) +
    grp("bright") + slider("gain") + tgc + slider("dr") +
    grp("field") + slider("depth") + slider("sector") +
    seg("zoom", [[1, "1×"], [1.5, "1,5×".replace(",", T[S.lang].dec)], [2, "2×"], [3, "3×"]]) +
    grp("detail") + slider("f") + slider("focus") +
    seg("zones", [[1, "1"], [2, "2"], [3, "3"]]) +
    seg("density", [["low", C.low], ["mid", C.mid], ["high", C.high]]) +
    `<div class="ctl last"><button class="reset" id="reset">${C.reset}</button></div>`;
  box.querySelectorAll("button[data-k]").forEach(b => b.onclick = () => {
    const k = b.dataset.k, v = b.dataset.v;
    S[k] = v === "true" ? true : v === "false" ? false : ["zones", "zoom"].includes(k) ? +v : v;
    if (k === "plane") ZC = null;
    buildControls(); update();
  });
  for (const k of Object.keys(SLIDERS)) {
    const el = $(`s-${k}`);
    el.oninput = () => {
      S[k] = +el.value; $(`o-${k}`).textContent = SLIDERS[k][3](S[k]);
      if (k === "depth") S.tgc.forEach((_, i) => { el.closest(".ctls").querySelector(`#tgc-${i}`).previousElementSibling.textContent = `${fmt((i + 0.5) * S.depth / TGC_N, 0)} cm`; });
      updateSoon();
    };
  }
  S.tgc.forEach((_, i) => {
    const el = $(`tgc-${i}`);
    el.oninput = () => { S.tgc[i] = +el.value; $(`o-tgc-${i}`).textContent = `${S.tgc[i] > 0 ? "+" : ""}${S.tgc[i]}`; updateSoon(); };
  });
  $("tgc0").onclick = () => { S.tgc.fill(0); buildControls(); update(); };
  $("reset").onclick = () => { Object.assign(S, START, { tgc: [...START.tgc] }); ZC = null; buildControls(); update(); };
  drawProbe();
}
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
function buildCard() {
  const L = T[S.lang], flat = taskList(), i = Math.max(0, flat.findIndex(t => t.id === taskId)), t = flat[i];
  taskId = t.id;
  $("taskcard").innerHTML =
    `<div class="tc-head"><span><b>${L.task}</b> · ${t.g} · ${t.k} ${L.of} ${t.n}</span>` +
    `<span class="seg"><button id="tc-prev" aria-label="${L.prev}">‹</button><button id="tc-next" aria-label="${L.next}">›</button></span></div>` +
    `<h4>${t.h}</h4><p class="q">${math(t.q)}</p>` +
    `<details class="answer"><summary>${L.answer}</summary><p class="a">${math(t.a)}</p></details>`;
  const go = d => { taskId = flat[(i + d + flat.length) % flat.length].id; buildCard(); };
  $("tc-prev").onclick = () => go(-1);
  $("tc-next").onclick = () => go(1);
}
function buildText() {
  const L = T[S.lang], set = (id, s) => { $(id).textContent = s; };
  document.documentElement.lang = S.lang;
  document.title = L.title + " | Oliver Brage";
  for (const k of ["title", "sub", "image", "beam", "gaincv", "tasks", "model", "foot", "privacy"]) set("t-" + k, L[k]);
  set("t-back", L.back); set("t-simtitle", L.simTitle); set("t-beamnote", L.beamNote); set("t-imgnote", L.imgNote);
  set("t-gainnote", S.level === "deep" ? L.gainNoteDeep : L.gainNote);
  $("t-back").href = "../?lang=" + S.lang;
  set("lvl-grund", L.grund); set("lvl-deep", L.deep);
  $("model-text").innerHTML = math(L.modelText);
  let last = "";
  $("task-list").innerHTML = taskList().map(t => {
    const head = t.g === last ? "" : `<h4 class="tgroup">${t.g}</h4>`; last = t.g;
    return head + `<details><summary>${t.h}</summary><p class="q">${math(t.q)}</p><details class="answer">` +
      `<summary>${L.answer}</summary><p class="a">${math(t.a)}</p></details></details>`; }).join("");
  buildCard();
}
function setPressed() {
  for (const [id, on] of [["lang-da", S.lang === "da"], ["lang-en", S.lang === "en"],
                          ["lvl-grund", S.level === "grund"], ["lvl-deep", S.level === "deep"]])
    $(id).setAttribute("aria-pressed", on);
}
function render() {
  readouts();
  drawProbe();
  if (!$("img").getClientRects().length) return;
  drawImg(); drawBeam(); drawGain();
}
function update() { M = US.model(S); scan(); render(); }
let pending = false;
function updateSoon() { if (!pending) { pending = true; requestAnimationFrame(() => { pending = false; update(); }); } }
function all() { PIN = null; setPressed(); buildText(); buildControls(); update(); }
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
