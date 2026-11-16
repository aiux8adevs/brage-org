// Noise simulator: dose (mAs), kV, pixel size, detector and a noise filter, on a contrast-detail phantom.
// The model, written out in the "How the model works" box:
//
//   radiation at the detector   X = (mAs/10) · (kV/70)² · e^(−(μ(kV) − μ(70))·20 cm), relative to the starting point
//   photons used per pixel      N = 900 · X · (pixel/150 µm)² · DQE/0.65
//   noise                       σ = √N, so SNR = N/σ = √N: double the dose gives only √2 better SNR
//   contrast of a disk          C = C_70 · (70/kV)^0.8,   CNR per pixel = C · √N
//   visible?                    Rose: C · √(photons over the disk) ≥ 5, and the disk at least 3 pixels wide (5 with the filter)
//   REX                         follows the radiation that reached the detector: 220 at 10 mAs, 70 kV
// Only quantum noise: no electronic noise, no structure noise and no scatter (scatter is not noise; it has its own simulator).
// The image is shown with the detector's own pixels and rescaled like a DR system does, so a low dose looks grainy, not dark.

const DQE = { csi: 0.65, gos: 0.35 };
const SIZES = [4, 2, 1, 0.5];            // disk diameter in mm, columns
const CONTRASTS = [0.08, 0.04, 0.02, 0.01];   // at 70 kV, rows
const FIELD_MM = 60;                     // the phantom is 6 cm across
const POS = k => 9 + k * 14;             // mm: the centre of column or row k
const LINE_ROW = 1;                      // the line profile runs through the row with 4 % contrast
const REX_LOW = 125, REX_HIGH = 400;     // the teaching rules of thumb, the same as on the histogram page

const T = {
  da: {
    title: "Støj, SNR og CNR", sub: "Kvantestøj, SNR og CNR. En video, og en simulator hvor du selv skruer på dosis, kV, pixelstørrelse og detektor og ser, hvilke detaljer der forsvinder i støjen.",
    videoNote: "Se videoen først, og prøv så selv i simulatoren. Cirka seks minutter (fordybelsen otte).",
    simTitle: "Simulator: Støj, SNR og CNR", grund: "Grund", deep: "Fordybelse", back: "← Læring",
    curve: "SNR og dosis", prof: "En linje gennem rækken med 4 % kontrast", image: "Det detektoren så",
    curveNote: "Kurven viser SNR for alle mAs med dine indstillinger. Den grå kurve er udgangspunktet (70 kV, 150 µm, CsI). Den orange prik er din mAs, og trappen viser, hvad dobbelt dosis giver: SNR bliver kun 1,41 gange bedre, ikke dobbelt så god. Derfor flader kurven ud.",
    profNote: "Grafen viser én vandret linje gennem rækken med 4 % kontrast (orange mærker i billedet; hold musen over grafen for at se hele linjen). Den tynde cyan linje er hver enkelt pixel. Den hopper op og ned hele vejen, også hvor der ingen skive er: det er støjen. Hvor linjen krydser en skive (de lyse felter), når færre fotoner igennem, og grafen får et dyk. Den tykke hvide linje er gennemsnittet af 7 pixel ved siden af hinanden; her træder dykkene frem. En skive kan kun ses, når dens dyk er tydeligt større end støjens hop.",
    profUp: "flere fotoner", profDown: "færre fotoner", profPx: "hver pixel", profAvg: "gennemsnit af 7 pixel",
    imgNote: "Kontrast-detalje-fantom: skiverne bliver mindre mod højre og svagere nedad. De dæmper strålen og vises lyse, ligesom knogle. En cyan prik under en skive betyder, at den kan ses efter modellens regel. Billedet skaleres som på et DR-anlæg, så lav dosis ser kornet ud, ikke mørk.",
    imgNoteDeep: "Kontrast-detalje-fantom: skiverne bliver mindre mod højre og svagere nedad. De dæmper strålen og vises lyse, ligesom knogle. Tallet under hver skive er kontrasten gange kvadratroden af alle fotoner over skiven (Rose). Ved 5 eller mere regnes skiven som synlig, og tallet er cyan. Billedet skaleres som på et DR-anlæg, så lav dosis ser kornet ud, ikke mørk.",
    tasks: "Opgaver", answer: "Vis svar", of: "af", prev: "Forrige opgave", next: "Næste opgave",
    model: "Sådan virker modellen", foot: "© 2026 Oliver Brage. Alle rettigheder forbeholdes.", privacy: "Privatliv",
    seen: "Det kan du se:", pin: "Gem tallene", unpin: "Fjern de gemte", saved: "gemt",
    ctl: { mas: "mAs", kv: "Kilovolt", px: "Pixelstørrelse", det: "Detektor", filter: "Støjfilter", csi: "CsI (nåle)", gos: "GOS (pulver)",
           on: "Til", off: "Fra", reset: "Nulstil", shot: "Ny optagelse" },
    help: { mas: "Strålemængden. Dobbelt mAs giver dobbelt så mange fotoner og dobbelt dosis.",
            kv: "Højere kV: flere fotoner når igennem patienten, men kontrasten falder.",
            px: "En større pixel samler flere fotoner, men viser færre detaljer.", det: "Hvor stor en del af fotonerne detektoren udnytter (DQE).",
            filter: "Glatter støjen ud, men udvisker også små detaljer.",
            shot: "Ny optagelse: samme indstillinger, nye fotoner. Kornet falder et nyt sted." },
    k: { n: "Fotoner pr. pixel", snr: "SNR = √N", cnr: "CNR, skiverne med 4 %", dose: "Patientdosis", rex: "REX", seen: "Synlige skiver" },
    f: { n: "N, dem detektoren udnytter", snr: "signal i forhold til støj", cnr: "kontrast i forhold til støj, pr. pixel", dose: "i forhold til 10 mAs, 70 kV",
         rex: r => r < REX_LOW ? "for meget støj" : r <= REX_HIGH ? "i orden" : "for høj dosis",
         seen: "af 16 (cyan prik under skiven)", seenDeep: "af 16 (Rose-tallet ≥ 5)" },
    see: {
      low: "REX {r} er under 125: der når for få fotoner frem til detektoren. Billedet er lige så lyst som før, men kornet.",
      high: "REX {r} er over 400: billedet ser flot ud, men patienten får mere dosis, end billedet har brug for.",
      filter: "Støjfilteret gør billedet roligere, men de mindste skiver bliver udvisket.",
      gos: "GOS udnytter færre af fotonerne end CsI, så støjen er større ved samme dosis.",
      kvUp: "Ved {kv} kV når flere fotoner igennem, men skivernes kontrast er faldet til {c} % af kontrasten ved 70 kV.",
      kvDown: "Ved {kv} kV når færre fotoner igennem, men skivernes kontrast er steget til {c} % af kontrasten ved 70 kV.",
      pxUp: "Større pixel: flere fotoner i hver pixel og højere SNR, men skiven på 0,5 mm fylder for få pixel til at blive tegnet.",
      pxDown: "Mindre pixel: færre fotoner i hver pixel og lavere SNR, men fotonerne over hver skive er de samme.",
      mas: "Dosis er ×{d} i forhold til udgangspunktet, og SNR er ×{s}: SNR følger kvadratroden af dosis.",
      base: "Udgangspunktet: 900 fotoner pr. pixel giver SNR 30, og 10 af 16 skiver kan ses. Prøv at ændre mAs.",
    },
    curveLbl: { x: "mAs", y: "SNR", double: "dobbelt dosis: SNR × 1,41", saved: "gemt" },
    dec: ",",
    modelText: `<p><b>Fotoner.</b> Strålingen ved detektoren, i forhold til udgangspunktet (10 mAs, 70 kV): $$X = \\frac{\\text{mAs}}{10} \\cdot \\left(\\frac{kV}{70}\\right)^2 \\cdot e^{-(\\mu - \\mu_{70}) \\cdot 20}$$ Rørets udbytte følger cirka kV i anden, og strålen dæmpes gennem 20 cm væv med $\\mu = 0,2 \\cdot (70/kV)^{0,6}$ pr. cm. Fotoner pr. pixel, som detektoren udnytter: $$N = 900 \\cdot X \\cdot \\left(\\frac{a}{150}\\right)^2 \\cdot \\frac{\\text{DQE}}{0,65}$$ hvor $a$ er pixlens sidelængde i µm. DQE er sat til 0,65 for CsI og 0,35 for GOS (typiske værdier). Strengt taget er $N$ det antal fotoner, en perfekt detektor skulle bruge for at give den samme støj.</p>
<p><b>Støj.</b> Antallet i hver pixel er tilfældigt (Poisson-fordelt) og svinger typisk med $\\sigma = \\sqrt{N}$, så $\\text{SNR} = N/\\sigma = \\sqrt{N}$. I billedet er støjen trukket fra en normalfordeling med samme $\\sigma$. Det passer godt, når $N$ er over cirka 20.</p>
<p><b>Kontrast og CNR.</b> En skive fjerner andelen $C = C_{70} \\cdot (70/kV)^{0,8}$ af fotonerne, hvor $C_{70}$ er 8, 4, 2 og 1 % ved 70 kV. Forskellen er altså $C \\cdot N$ fotoner, og $\\text{CNR} = C \\cdot N/\\sigma = C \\cdot \\sqrt{N}$ pr. pixel.</p>
<p><b>Synlig eller ej.</b> Rose-kriteriet: en skive regnes som synlig, når $C \\cdot \\sqrt{N_{skive}} \\ge 5$, hvor $N_{skive}$ er alle fotoner over skivens areal. Desuden skal skiven være mindst 3 pixel bred (5 med støjfilter). Det er en tommelfingerregel; dit øje kan se lidt mere eller lidt mindre.</p>
<p><b>Billedet.</b> Fantomet er 6 × 6 cm og vises med detektorens egne pixel. Gråtonerne skaleres efter signalet, som på et DR-anlæg: vinduet dækker 16 % til hver side af baggrunden og bliver bredere, når støjen er større end det. Støjfilteret er et gennemsnit over 3 × 3 pixel. Ny optagelse trækker nye tilfældige tal.</p>
<p><b>Dosis og REX.</b> Patientdosis er indgangsdosis i forhold til udgangspunktet: $(\\text{mAs}/10) \\cdot (kV/70)^2$. REX følger strålingen ved detektoren: $220 \\cdot X$. Grænserne 125 og 400 er undervisningens tommelfingerregler for Canon-anlæg, ikke fabrikantens tal.</p>
<p><b>Det er ikke med.</b> Modellen har kun kvantestøj. Elektronisk støj (ses kun ved meget lav dosis) og strukturstøj (rettes væk ved kalibrering) er udeladt. Spredt stråling er heller ikke med. Den er ikke støj, men rigtige fotoner, der lander det forkerte sted og sænker kontrasten, og den har sin egen simulator. Detektoren regnes som helt skarp, strålen har én energi ad gangen i stedet for et spektrum, og DQE er den samme for alle detaljestørrelser og alle kV.</p>
<p>Kilder: Bushong, Radiologic Science for Technologists (kvantestøj, SNR, CNR, DQE, eksponeringsindeks). Rose, Vision: Human and Electronic (1973), om Rose-kriteriet. Bushberg m.fl., The Essential Physics of Medical Imaging (Poisson-statistik, Rose-kriteriet, DQE). IEC 62494-1 om eksponeringsindeks.</p>`,
    groups: [
      ["Fotoner er tilfældige", [
        ["Ny optagelse", "Tryk på Ny optagelse nogle gange uden at ændre andet. Hvad ændrer sig i billedet, og hvad bliver, som det var?", "Kornet falder et nyt sted hver gang, fordi fotonerne kommer tilfældigt. Skiverne ligger samme sted, og tallene N og SNR er de samme. De beskriver gennemsnittet, ikke den enkelte optagelse."],
        ["Støjen i grafen", "Se på den tynde cyan linje mellem skiverne, hvor fantomet er helt ens. Hvorfor er linjen ikke flad?", "Hver pixel har fået et tilfældigt antal fotoner. Gennemsnittet er 900, men den enkelte pixel ligger typisk 30 over eller under. Det er kvantestøj, og den er der, selvom objektet er helt ens."],
      ]],
      ["Flere fotoner, mindre korn", [
        ["Halvér dosis", "Gå fra 10 til 5 mAs. Hvad sker der med N og med SNR?", "N halveres fra 900 til 450, men SNR falder kun fra 30 til 21, altså med en faktor 1,41 (kvadratroden af 2). Billedet bliver mere kornet."],
        ["Dobbelt så god", "Hvor meget skal mAs op fra 10, for at SNR bliver dobbelt så stor? Prøv.", "Fire gange. 40 mAs giver N = 3600 og SNR 60. Patientdosis bliver også fire gange så stor."],
        ["Kurven", "Se på kurven. Hvorfor bliver den fladere mod højre?", "Fordi SNR følger kvadratroden af N. Fra 1 til 10 mAs stiger SNR fra 9,5 til 30. Fra 30 til 40 mAs stiger den kun fra 52 til 60. Den sidste dosis køber mindst billedkvalitet."],
      ]],
      ["Hvornår ses en detalje?", [
        ["Synlige skiver", "Tæl, hvor mange skiver du selv kan se ved 10 mAs. Passer det med tallet under billedet?", "Modellen siger 10 af 16. De små og svage forsvinder først. Dit øje kan godt se en mere eller en mindre end modellens regel."],
        ["Dyk og hop", "Se på grafen ved 10 mAs. Ved hvilke skiver kan du se et dyk i den hvide linje? Og i den tynde cyan?", "Den hvide linje har et tydeligt dyk ved skiven på 4 mm og mindre dyk ved 2 og 1 mm. Skiven på 0,5 mm er smallere end de 7 pixel og jævnes næsten væk. I den cyan linje er dykket (4 % af 900, altså 36 fotoner) kun lidt større end støjens hop (30), så det drukner næsten. CNR er 1,2."],
        ["Stor eller lille", "Skiverne i rækken med 2 % har samme kontrast. Hvorfor kan de to store ses, men ikke de to små?", "CNR pr. pixel er den samme for alle fire. Men en stor skive dækker mange pixel, og øjet lægger dem sammen, så støjen jævnes ud. En lille skive har for få fotoner at skille sig ud med."],
        ["Den svageste", "Find den laveste mAs, hvor den store skive med 1 % kontrast stadig regnes som synlig.", "5 mAs. Ved 4,5 mAs forsvinder den, sammen med tre andre skiver, der er lige så svære at se. Store, svage detaljer kræver fotoner nok, ikke små pixel."],
      ]],
      ["Hvad bestemmer støjen?", [
        ["CsI eller GOS", "Skift til GOS ved 10 mAs. Hvad sker der med N og SNR? Hvor mange mAs skal der til for at få SNR 30 igen?", "N falder fra 900 til 485 og SNR fra 30 til 22, fordi GOS udnytter færre af fotonerne (lavere DQE). Der skal cirka 18,5 mAs til for at nå SNR 30 igen, altså næsten dobbelt dosis."],
        ["Større pixel", "Gå fra 150 til 200 µm. Hvad sker der med SNR og med de mindste skiver?", "SNR stiger fra 30 til 40, fordi hver pixel samler flere fotoner. Men skiven på 0,5 mm fylder nu kun 2,5 pixel og kan ikke tegnes ordentligt: der er 9 synlige skiver i stedet for 10."],
        ["Mindre pixel", "Gå fra 150 til 100 µm. SNR falder fra 30 til 20, men der er stadig 10 synlige skiver. Hvorfor?", "Fotonerne over hver skive er de samme. De er bare fordelt på flere og mindre pixel. Det er antallet af fotoner over hele detaljen, der afgør, om den kan ses."],
        ["Højere kV", "Gå fra 70 til 100 kV ved 10 mAs. Hvad sker der med N, CNR, patientdosis og REX?", "N stiger fra 900 til cirka 3970, fordi røret giver mere, og flere fotoner når igennem. CNR stiger til 1,89, selvom skivernes kontrast falder til 75 %. Men patientdosis er fordoblet, og REX er 970: alt for høj dosis."],
        ["Samme REX ved 100 kV", "Bliv på 100 kV, og skru mAs ned, til REX igen er tæt på 220. Sammenlign patientdosis og CNR med udgangspunktet.", "Ved 2,5 mAs er REX 243. Patientdosis er halveret (×0,51), men CNR er faldet fra 1,20 til 0,95, fordi kontrasten er lavere. Det er afvejningen: høj kV sparer dosis, men koster kontrast."],
        ["Støjfilter", "Slå støjfilteret til ved 10 mAs. Hvad vinder du, og hvad mister du?", "Billedet ser roligere ud, og den cyan linje hopper mindre. Men den mindste skive bliver udvisket: 9 synlige skiver i stedet for 10. Et filter kan ikke skabe information, der ikke blev målt."],
        ["Tre ting adskilt", "Simulatoren viser kun kvantestøj. Hvad ville spredt stråling gøre ved billedet, og hvorfor kalder vi det ikke støj?", "Spredt stråling er rigtige fotoner, der lander det forkerte sted. De lægger en tåge over billedet, så kontrasten falder. Tågen fjernes med indblænding, kompression, raster og luftspalte, ikke med mere dosis. De spredte fotoner kommer også tilfældigt og har derfor deres egen kvantestøj, men det er et punkt for sig. Elektronisk støj er noget tredje: den kommer fra elektronikken og ses kun ved meget lav dosis."],
      ]],
      ["Billedet lyver om dosis", [
        ["Lyst eller kornet", "Gå fra 10 til 2 mAs. Bliver billedet mørkere?", "Nej. Systemet retter selv lysheden, så baggrunden er lige grå. Men billedet er tydeligt mere kornet, og kun 6 skiver kan ses."],
        ["For lav dosis", "Find den mAs, hvor REX kommer under 125. Hvad sker der med skiverne lige derunder?", "Ved 5,5 mAs er REX 121. Lysheden er den samme, men ved 4,5 mAs falder de synlige skiver fra 10 til 6. Det er REX, ikke lysheden, der advarer dig."],
        ["For høj dosis", "Find den mAs, hvor REX kommer over 400. Advarer billedet dig?", "Ved 18,5 mAs er REX 407. Billedet ser bare lidt roligere ud, og der er stadig 10 synlige skiver. Patienten har fået næsten dobbelt dosis, uden at du kan se mere."],
        ["Dosis-krybning", "Sammenlign 20 og 40 mAs. Kan du se forskel på billederne? Hvad betyder det for vanerne på en afdeling?", "Næsten ingen forskel: 13 synlige skiver begge steder, men dobbelt dosis. Fordi et overeksponeret billede ser godt ud, kan doserne snige sig op over tid, uden at nogen opdager det. Derfor skal REX følges.", { deep: true }],
      ]],
      ["Formler", [
        ["SNR og CNR i hånden", "Ved 10 mAs er $N = 900$. Regn støjen, SNR og CNR for skiverne med 4 % ud.", "$\\sigma = \\sqrt{900} = 30$, $\\text{SNR} = \\frac{900}{30} = 30$ og $\\text{CNR} = 0,04 \\cdot 30 = 1,2$ pr. pixel."],
        ["Rose", "Den store skive er 4 mm i diameter, og pixlen er 150 µm. Hvor mange pixel dækker skiven? Er skiven med 1 % synlig ved 10 mAs? Tjek med tallet under skiven.", "Arealet er $\\pi \\cdot 2^2 \\approx 12,6$ mm², og en pixel er $0,15^2 = 0,0225$ mm², altså cirka 560 pixel og $560 \\cdot 900 \\approx 500\\,000$ fotoner. $0,01 \\cdot \\sqrt{500\\,000} \\approx 7,1 \\ge 5$: synlig."],
        ["DQE og dosis", "CsI har DQE 0,65 og GOS 0,35. Hvor mange mAs skal GOS have for at give samme SNR som CsI ved 10 mAs?", "$N$ skal være den samme, så $\\text{mAs} = 10 \\cdot \\frac{0,65}{0,35} \\approx 18,6$. Næsten dobbelt dosis for det samme billede."],
        ["Hvor meget dosis kræver en skive?", "Skiven på 1 mm med 2 % kontrast dækker cirka 35 pixel. Hvor mange fotoner pr. pixel skal der til, før den er synlig efter Rose? Hvilken mAs svarer det til?", "$0,02 \\cdot \\sqrt{35 \\cdot N} \\ge 5$ giver $N \\ge \\frac{(5/0,02)^2}{35} \\approx 1790$. Med 90 fotoner pr. mAs er det 20 mAs. Tjek i simulatoren: ved 19,5 mAs er skiven ikke synlig."],
      ], "deep"],
    ],
  },
  en: {
    title: "Noise, SNR and CNR", sub: "Quantum noise, SNR and CNR. A video, and a simulator where you change dose, kV, pixel size and detector yourself and see which details disappear in the noise.",
    videoNote: "Watch the video first, then try it yourself in the simulator. About six minutes (the deeper level eight).",
    simTitle: "Simulator: Noise, SNR and CNR", grund: "Basic", deep: "Deeper level", back: "← Learn",
    curve: "SNR and dose", prof: "A line through the row with 4 % contrast", image: "What the detector saw",
    curveNote: "The curve shows the SNR for every mAs with your settings. The grey curve is the starting point (70 kV, 150 µm, CsI). The orange dot is your mAs, and the step shows what double the dose gives: the SNR gets only 1.41 times better, not twice as good. That is why the curve flattens.",
    profNote: "The graph shows one horizontal line through the row with 4 % contrast (orange marks in the image; hover over the graph to see the whole line). The thin cyan line is each single pixel. It jumps up and down all the way, also where there is no disk: that is the noise. Where the line crosses a disk (the light bands), fewer photons get through and the graph dips. The thick white line is the average of 7 neighbouring pixels; here the dips stand out. A disk can only be seen when its dip is clearly larger than the jumps of the noise.",
    profUp: "more photons", profDown: "fewer photons", profPx: "each pixel", profAvg: "average of 7 pixels",
    imgNote: "Contrast-detail phantom: the disks get smaller to the right and fainter downwards. They attenuate the beam and show light, like bone. A cyan dot below a disk means it can be seen by the model's rule. The image is rescaled as on a DR system, so a low dose looks grainy, not dark.",
    imgNoteDeep: "Contrast-detail phantom: the disks get smaller to the right and fainter downwards. They attenuate the beam and show light, like bone. The number below each disk is the contrast times the square root of all photons over the disk (Rose). At 5 or more the disk counts as visible, and the number is cyan. The image is rescaled as on a DR system, so a low dose looks grainy, not dark.",
    tasks: "Tasks", answer: "Show answer", of: "of", prev: "Previous task", next: "Next task",
    model: "How the model works", foot: "© 2026 Oliver Brage. All rights reserved.", privacy: "Privacy",
    seen: "What you can see:", pin: "Save the numbers", unpin: "Remove saved", saved: "saved",
    ctl: { mas: "mAs", kv: "Kilovoltage", px: "Pixel size", det: "Detector", filter: "Noise filter", csi: "CsI (needles)", gos: "GOS (powder)",
           on: "On", off: "Off", reset: "Reset", shot: "New exposure" },
    help: { mas: "The amount of radiation. Double the mAs gives twice as many photons and twice the dose.",
            kv: "Higher kV: more photons get through the patient, but the contrast falls.",
            px: "A larger pixel collects more photons, but shows less detail.", det: "How large a share of the photons the detector uses (DQE).",
            filter: "Smooths the noise, but also blurs small details.",
            shot: "New exposure: the same settings, new photons. The grain falls in a new place." },
    k: { n: "Photons per pixel", snr: "SNR = √N", cnr: "CNR, the 4 % disks", dose: "Patient dose", rex: "REX", seen: "Visible disks" },
    f: { n: "N, those the detector uses", snr: "signal relative to noise", cnr: "contrast relative to noise, per pixel", dose: "relative to 10 mAs, 70 kV",
         rex: r => r < REX_LOW ? "too noisy" : r <= REX_HIGH ? "fine" : "dose too high",
         seen: "of 16 (cyan dot below the disk)", seenDeep: "of 16 (Rose number ≥ 5)" },
    see: {
      low: "REX {r} is below 125: too few photons reach the detector. The image is just as bright as before, but grainy.",
      high: "REX {r} is above 400: the image looks great, but the patient gets more dose than the image needs.",
      filter: "The noise filter makes the image calmer, but the smallest disks are blurred.",
      gos: "GOS uses fewer of the photons than CsI, so the noise is larger at the same dose.",
      kvUp: "At {kv} kV more photons get through, but the disks' contrast has fallen to {c} % of the contrast at 70 kV.",
      kvDown: "At {kv} kV fewer photons get through, but the disks' contrast has risen to {c} % of the contrast at 70 kV.",
      pxUp: "Larger pixels: more photons in each pixel and a higher SNR, but the 0.5 mm disk covers too few pixels to be drawn.",
      pxDown: "Smaller pixels: fewer photons in each pixel and a lower SNR, but the photons over each disk are the same.",
      mas: "The dose is ×{d} relative to the starting point, and the SNR is ×{s}: SNR follows the square root of the dose.",
      base: "The starting point: 900 photons per pixel give SNR 30, and 10 of 16 disks can be seen. Try changing the mAs.",
    },
    curveLbl: { x: "mAs", y: "SNR", double: "double the dose: SNR × 1.41", saved: "saved" },
    dec: ".",
    modelText: `<p><b>Photons.</b> The radiation at the detector, relative to the starting point (10 mAs, 70 kV): $$X = \\frac{\\text{mAs}}{10} \\cdot \\left(\\frac{kV}{70}\\right)^2 \\cdot e^{-(\\mu - \\mu_{70}) \\cdot 20}$$ The tube's output follows roughly kV squared, and the beam is attenuated through 20 cm of tissue with $\\mu = 0.2 \\cdot (70/kV)^{0.6}$ per cm. Photons per pixel that the detector uses: $$N = 900 \\cdot X \\cdot \\left(\\frac{a}{150}\\right)^2 \\cdot \\frac{\\text{DQE}}{0.65}$$ where $a$ is the side of the pixel in µm. DQE is set to 0.65 for CsI and 0.35 for GOS (typical values). Strictly speaking, $N$ is the number of photons a perfect detector would need to give the same noise.</p>
<p><b>Noise.</b> The count in each pixel is random (Poisson distributed) and typically varies by $\\sigma = \\sqrt{N}$, so $\\text{SNR} = N/\\sigma = \\sqrt{N}$. In the image the noise is drawn from a normal distribution with the same $\\sigma$. That fits well when $N$ is above about 20.</p>
<p><b>Contrast and CNR.</b> A disk removes the fraction $C = C_{70} \\cdot (70/kV)^{0.8}$ of the photons, where $C_{70}$ is 8, 4, 2 and 1 % at 70 kV. So the difference is $C \\cdot N$ photons, and $\\text{CNR} = C \\cdot N/\\sigma = C \\cdot \\sqrt{N}$ per pixel.</p>
<p><b>Visible or not.</b> The Rose criterion: a disk counts as visible when $C \\cdot \\sqrt{N_{disk}} \\ge 5$, where $N_{disk}$ is all photons over the disk's area. The disk must also be at least 3 pixels wide (5 with the noise filter). It is a rule of thumb; your eye may see a little more or a little less.</p>
<p><b>The image.</b> The phantom is 6 × 6 cm and is shown with the detector's own pixels. The grey scale follows the signal, as on a DR system: the window covers 16 % to each side of the background and gets wider when the noise is larger than that. The noise filter is an average over 3 × 3 pixels. New exposure draws new random numbers.</p>
<p><b>Dose and REX.</b> Patient dose is the entrance dose relative to the starting point: $(\\text{mAs}/10) \\cdot (kV/70)^2$. REX follows the radiation at the detector: $220 \\cdot X$. The limits 125 and 400 are the course's rules of thumb for Canon systems, not the manufacturer's figures.</p>
<p><b>What is left out.</b> The model has quantum noise only. Electronic noise (seen only at very low dose) and structure noise (removed by calibration) are left out. Scatter is not included either. It is not noise, but real photons that land in the wrong place and lower the contrast, and it has its own simulator. The detector is taken to be perfectly sharp, the beam has one energy at a time instead of a spectrum, and DQE is the same for all detail sizes and all kV.</p>
<p>Sources: Bushong, Radiologic Science for Technologists (quantum noise, SNR, CNR, DQE, exposure index). Rose, Vision: Human and Electronic (1973), on the Rose criterion. Bushberg et al., The Essential Physics of Medical Imaging (Poisson statistics, the Rose criterion, DQE). IEC 62494-1 on the exposure index.</p>`,
    groups: [
      ["Photons are random", [
        ["New exposure", "Press New exposure a few times without changing anything else. What changes in the image, and what stays as it was?", "The grain falls in a new place every time, because the photons arrive at random. The disks stay where they are, and the numbers N and SNR are the same. They describe the average, not the single exposure."],
        ["The noise in the graph", "Look at the thin cyan line between the disks, where the phantom is completely uniform. Why is the line not flat?", "Each pixel has received a random number of photons. The average is 900, but a single pixel is typically 30 above or below. That is quantum noise, and it is there even though the object is uniform."],
      ]],
      ["More photons, less grain", [
        ["Halve the dose", "Go from 10 to 5 mAs. What happens to N and to the SNR?", "N is halved from 900 to 450, but the SNR only falls from 30 to 21, a factor of 1.41 (the square root of 2). The image gets grainier."],
        ["Twice as good", "How much must the mAs go up from 10 for the SNR to double? Try it.", "Four times. 40 mAs gives N = 3600 and SNR 60. The patient dose is four times as large too."],
        ["The curve", "Look at the curve. Why does it flatten towards the right?", "Because the SNR follows the square root of N. From 1 to 10 mAs the SNR rises from 9.5 to 30. From 30 to 40 mAs it only rises from 52 to 60. The last bit of dose buys the least image quality."],
      ]],
      ["When can a detail be seen?", [
        ["Visible disks", "Count how many disks you can see yourself at 10 mAs. Does it match the number below the image?", "The model says 10 of 16. The small, faint ones disappear first. Your eye may well see one more or one fewer than the model's rule."],
        ["Dips and jumps", "Look at the graph at 10 mAs. At which disks can you see a dip in the white line? And in the thin cyan one?", "The white line has a clear dip at the 4 mm disk and smaller dips at 2 and 1 mm. The 0.5 mm disk is narrower than the 7 pixels and is almost evened out. In the cyan line the dip (4 % of 900, so 36 photons) is only a little larger than the jumps of the noise (30), so it almost drowns. The CNR is 1.2."],
        ["Large or small", "The disks in the 2 % row have the same contrast. Why can the two large ones be seen, but not the two small ones?", "The CNR per pixel is the same for all four. But a large disk covers many pixels, and the eye adds them together, so the noise evens out. A small disk has too few photons to stand out with."],
        ["The faintest", "Find the lowest mAs at which the large disk with 1 % contrast still counts as visible.", "5 mAs. At 4.5 mAs it disappears, together with three other disks that are just as hard to see. Large, faint details need enough photons, not small pixels."],
      ]],
      ["What sets the noise?", [
        ["CsI or GOS", "Switch to GOS at 10 mAs. What happens to N and the SNR? How many mAs does it take to get SNR 30 again?", "N falls from 900 to 485 and the SNR from 30 to 22, because GOS uses fewer of the photons (lower DQE). It takes about 18.5 mAs to reach SNR 30 again, almost twice the dose."],
        ["Larger pixels", "Go from 150 to 200 µm. What happens to the SNR and to the smallest disks?", "The SNR rises from 30 to 40, because each pixel collects more photons. But the 0.5 mm disk now covers only 2.5 pixels and cannot be drawn properly: there are 9 visible disks instead of 10."],
        ["Smaller pixels", "Go from 150 to 100 µm. The SNR falls from 30 to 20, but there are still 10 visible disks. Why?", "The photons over each disk are the same. They are just shared between more and smaller pixels. It is the number of photons over the whole detail that decides whether it can be seen."],
        ["Higher kV", "Go from 70 to 100 kV at 10 mAs. What happens to N, the CNR, the patient dose and REX?", "N rises from 900 to about 3970, because the tube gives more and more photons get through. The CNR rises to 1.89, even though the disks' contrast falls to 75 %. But the patient dose has doubled, and REX is 970: far too high a dose."],
        ["The same REX at 100 kV", "Stay at 100 kV and turn the mAs down until REX is close to 220 again. Compare the patient dose and the CNR with the starting point.", "At 2.5 mAs REX is 243. The patient dose is halved (×0.51), but the CNR has fallen from 1.20 to 0.95, because the contrast is lower. That is the trade-off: high kV saves dose, but costs contrast."],
        ["Noise filter", "Switch on the noise filter at 10 mAs. What do you gain, and what do you lose?", "The image looks calmer, and the cyan line jumps less. But the smallest disk is blurred: 9 visible disks instead of 10. A filter cannot create information that was never measured."],
        ["Three things kept apart", "The simulator shows quantum noise only. What would scatter do to the image, and why do we not call it noise?", "Scatter is real photons that land in the wrong place. They lay a fog over the image, so the contrast falls. The fog is removed with collimation, compression, a grid and an air gap, not with more dose. The scattered photons also arrive at random and so have their own quantum noise, but that is a separate point. Electronic noise is a third thing: it comes from the electronics and only shows at very low dose."],
      ]],
      ["The image lies about dose", [
        ["Bright or grainy", "Go from 10 to 2 mAs. Does the image get darker?", "No. The system corrects the brightness itself, so the background is the same grey. But the image is clearly grainier, and only 6 disks can be seen."],
        ["Too low a dose", "Find the mAs where REX falls below 125. What happens to the disks just below that?", "At 5.5 mAs REX is 121. The brightness is the same, but at 4.5 mAs the visible disks fall from 10 to 6. It is REX, not the brightness, that warns you."],
        ["Too high a dose", "Find the mAs where REX rises above 400. Does the image warn you?", "At 18.5 mAs REX is 407. The image just looks a little calmer, and there are still 10 visible disks. The patient has had almost twice the dose, and you cannot see any more."],
        ["Dose creep", "Compare 20 and 40 mAs. Can you see a difference between the images? What does that mean for the habits of a department?", "Hardly any difference: 13 visible disks in both, but twice the dose. Because an overexposed image looks good, doses can creep up over time without anyone noticing. That is why REX must be followed.", { deep: true }],
      ]],
      ["Formulas", [
        ["SNR and CNR by hand", "At 10 mAs, $N = 900$. Work out the noise, the SNR and the CNR for the 4 % disks.", "$\\sigma = \\sqrt{900} = 30$, $\\text{SNR} = \\frac{900}{30} = 30$ and $\\text{CNR} = 0.04 \\cdot 30 = 1.2$ per pixel."],
        ["Rose", "The large disk is 4 mm across, and the pixel is 150 µm. How many pixels does the disk cover? Is the 1 % disk visible at 10 mAs? Check with the number below the disk.", "The area is $\\pi \\cdot 2^2 \\approx 12.6$ mm², and a pixel is $0.15^2 = 0.0225$ mm², so about 560 pixels and $560 \\cdot 900 \\approx 500\\,000$ photons. $0.01 \\cdot \\sqrt{500\\,000} \\approx 7.1 \\ge 5$: visible."],
        ["DQE and dose", "CsI has DQE 0.65 and GOS 0.35. How many mAs does GOS need to give the same SNR as CsI at 10 mAs?", "$N$ must be the same, so $\\text{mAs} = 10 \\cdot \\frac{0.65}{0.35} \\approx 18.6$. Almost twice the dose for the same image."],
        ["How much dose does a disk need?", "The 1 mm disk with 2 % contrast covers about 35 pixels. How many photons per pixel does it take before it is visible by Rose? Which mAs is that?", "$0.02 \\cdot \\sqrt{35 \\cdot N} \\ge 5$ gives $N \\ge \\frac{(5/0.02)^2}{35} \\approx 1790$. With 90 photons per mAs that is 20 mAs. Check in the simulator: at 19.5 mAs the disk is not visible."],
      ], "deep"],
    ],
  },
};

// ---- the model ---------------------------------------------------------------------
const mu = kv => 0.2 * Math.pow(70 / kv, 0.6);
function model(s) {
  const trans = Math.exp(-(mu(s.kv) - mu(70)) * 20);
  const exposure = (s.mas / 10) * Math.pow(s.kv / 70, 2) * trans;          // radiation at the detector, relative
  const N = 900 * exposure * Math.pow(s.px / 150, 2) * DQE[s.det] / 0.65;
  const cScale = Math.pow(70 / s.kv, 0.8);
  const pxmm = s.px / 1000;
  let seen = 0;
  const rose = CONTRASTS.map(c0 => SIZES.map(d => c0 * cScale * Math.sqrt(N * Math.PI * (d / 2) ** 2 / (pxmm * pxmm))));   // contrast × √(photons over the disk)
  const visible = rose.map(r => r.map((v, col) => {
    const ok = v >= 5 && SIZES[col] / pxmm >= (s.filter === "on" ? 5 : 3);   // a disk must span a few pixels; the 3 × 3 filter needs more
    if (ok) seen++;
    return ok;
  }));
  return { N, snr: Math.sqrt(N), cScale, cnr: CONTRASTS[LINE_ROW] * cScale * Math.sqrt(N), dose: (s.mas / 10) * Math.pow(s.kv / 70, 2),
           rex: 220 * exposure, seen, rose, visible };
}

// ---- the page (everything below needs a browser) -------------------------------------
const START = { mas: 10, kv: 70, px: 150, det: "csi", filter: "off" };
const S = { lang: "da", level: "grund", ...START };
const $ = id => document.getElementById(id);
let M = model(S);
let PIN = null;    // the numbers saved with the compare button
let SHOT = 1;      // which exposure this is: a new one draws new random numbers
// the page's colours and font never change, so each is read from the stylesheet only once
const CSS = {}, css = n => CSS[n] || (CSS[n] = getComputedStyle(document.documentElement).getPropertyValue(n).trim());
const fmt = (v, d = 1) => v.toFixed(d).replace(".", T[S.lang].dec);
// the shared formula converter does not know this Greek letter
const math = s => withMath(s).replace(/<mi>pi<\/mi>/g, "<mi>π</mi>");
const INK = "rgba(10,14,24,.85)";
function fit(cv) {
  const r = cv.getBoundingClientRect(), dpr = window.devicePixelRatio || 1;
  const w = Math.max(1, Math.round(r.width * dpr)), h = Math.max(1, Math.round(r.height * dpr));
  if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
  const ctx = cv.getContext("2d"); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, r.width, r.height);
  return [ctx, r.width, r.height];
}
function text(ctx, s, x, y, color, align = "left", size = 12) {
  ctx.fillStyle = color; ctx.font = `${size}px ${css("--body")}`; ctx.textAlign = align; ctx.fillText(s, x, y);
}
const mm = d => `${fmt(d, d < 1 ? 1 : 0)} mm`;

// ---- the phantom image: computed once per setting, used by the image and the line profile ----
// What does not change with the sliders is kept: where the disks are (per pixel size) and the random
// numbers of this exposure. A slider move then only scales and adds them.
const FIELDS = {};
function field(n) {
  let f = FIELDS[n];
  if (!f) {
    const pxmm = FIELD_MM / n, disk = new Uint8Array(n * n);            // 0: background, 1–4: a disk in that row
    for (let row = 0; row < 4; row++) for (let col = 0; col < 4; col++) {
      const cx = POS(col), cy = POS(row), rad = SIZES[col] / 2;
      const i0 = Math.max(0, Math.floor((cx - rad) / pxmm)), i1 = Math.min(n - 1, Math.ceil((cx + rad) / pxmm));
      const j0 = Math.max(0, Math.floor((cy - rad) / pxmm)), j1 = Math.min(n - 1, Math.ceil((cy + rad) / pxmm));
      for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++)
        if (((i + 0.5) * pxmm - cx) ** 2 + ((j + 0.5) * pxmm - cy) ** 2 <= rad * rad) disk[j * n + i] = row + 1;
    }
    const off = document.createElement("canvas"); off.width = off.height = n;
    const octx = off.getContext("2d"), img = octx.createImageData(n, n);
    f = FIELDS[n] = { disk, shot: 0, g: new Float32Array(n * n), v: new Float32Array(n * n), tmp: new Float32Array(n * n),
                      off, octx, img, rgba: new Uint32Array(img.data.buffer) };
  }
  if (f.shot !== SHOT) {                                                // new random numbers: a standard normal value per pixel
    let a = (SHOT * 2654435761 + n) >>> 0;
    const r = () => { a = (a * 1664525 + 1013904223) >>> 0; return a / 4294967296; };
    const g = f.g;
    for (let k = 0; k < g.length; k++) g[k] = (r() + r() + r() + r() + r() + r() - 3) * 1.4142135623730951;
    f.shot = SHOT;
  }
  return f;
}
let IMG = null;
function makeImage() {
  const n = Math.round(FIELD_MM / (S.px / 1000));             // one shown pixel is one detector pixel
  const f = field(n), { disk, g, v, tmp } = f, N = M.N, sd = Math.sqrt(N);
  const mean = [N, ...CONTRASTS.map(c => N * (1 - c * M.cScale))];
  for (let k = 0; k < v.length; k++) v[k] = mean[disk[k]] + sd * g[k];
  if (S.filter === "on") {                                    // 3 × 3 average: three across, then three down
    for (let j = 0; j < n; j++) for (let i = 0, o = j * n; i < n; i++)
      tmp[o + i] = (v[o + (i ? i - 1 : 0)] + v[o + i] + v[o + (i < n - 1 ? i + 1 : i)]) / 3;
    for (let j = 0; j < n; j++) {
      const a = (j ? j - 1 : 0) * n, b = j * n, c = (j < n - 1 ? j + 1 : j) * n;
      for (let i = 0; i < n; i++) v[b + i] = (tmp[a + i] + tmp[b + i] + tmp[c + i]) / 3;
    }
  }
  IMG = { n, f, N };
}

let profHover = false;
for (const [ev, on] of [["mouseenter", true], ["mouseleave", false], ["touchstart", true], ["touchend", false]])
  $("prof").addEventListener(ev, () => { profHover = on; drawImg(); }, { passive: true });

function drawImg() {
  const [ctx, W, H] = fit($("img"));
  if (W < 10) return;
  const { n, f, N } = IMG, { v, rgba, off, octx, img } = f, deep = S.level === "deep";
  // DR-style rescaling: the background always lands on the same grey. The window is 16 % of the signal to
  // each side, wider when the noise is larger than that, so a very low dose is grainy rather than clipped.
  const sd = Math.sqrt(N) * (S.filter === "on" ? 1 / 3 : 1), span = Math.max(0.16 * N, 3 * sd), q = 120 / span;
  for (let k = 0; k < v.length; k++) {
    let g = 150 - q * (v[k] - N);
    g = g < 0 ? 0 : g > 255 ? 255 : g | 0;
    rgba[k] = 0xFF000000 | (g << 16) | (g << 8) | g;
  }
  octx.putImageData(img, 0, 0);
  // room for the row labels on the left and the column labels below
  const mL = 30, mB = 18, sz = Math.max(10, Math.min(W - mL, H - mB)), x0 = mL + (W - mL - sz) / 2, y0 = 0, u = sz / FIELD_MM;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(off, x0, y0, sz, sz);
  // the disks counted as visible: a dot below the disk, or at the deeper level the Rose number itself
  for (let row = 0; row < 4; row++) for (let col = 0; col < 4; col++) {
    const ok = M.visible[row][col], cx = x0 + POS(col) * u, below = y0 + (POS(row) + SIZES[col] / 2) * u;
    if (deep) {
      const s = fmt(M.rose[row][col], M.rose[row][col] < 10 ? 1 : 0);
      ctx.font = `11px ${css("--mono")}`;
      const w = ctx.measureText(s).width + 8;
      ctx.fillStyle = INK; ctx.fillRect(cx - w / 2, below + 7, w, 15);
      ctx.fillStyle = ok ? css("--signal") : css("--muted"); ctx.textAlign = "center"; ctx.fillText(s, cx, below + 18);
    } else if (ok) {
      ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(cx, below + 11, 4.5, 0, 7); ctx.fill();
      ctx.fillStyle = css("--signal"); ctx.beginPath(); ctx.arc(cx, below + 11, 3, 0, 7); ctx.fill();
    }
  }
  // orange marks at both edges: the row the line profile runs through; the whole line while the graph is hovered
  const ry = y0 + POS(LINE_ROW) * u;
  ctx.strokeStyle = css("--amber"); ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(x0, ry); ctx.lineTo(x0 + 12, ry); ctx.moveTo(x0 + sz - 12, ry); ctx.lineTo(x0 + sz, ry); ctx.stroke();
  if (profHover) {
    ctx.lineWidth = 2; ctx.setLineDash([6, 4]);
    ctx.beginPath(); ctx.moveTo(x0, ry); ctx.lineTo(x0 + sz, ry); ctx.stroke(); ctx.setLineDash([]);
  }
  ctx.lineWidth = 1;
  SIZES.forEach((d, col) => text(ctx, mm(d), x0 + POS(col) * u, y0 + sz + 14, css("--muted"), "center", 11));
  CONTRASTS.forEach((c, row) => text(ctx, `${Math.round(c * 100)} %`, x0 - 6, y0 + POS(row) * u + 4, row === LINE_ROW ? css("--amber") : css("--muted"), "right", 11));
}

function drawProf() {
  const [ctx, W, H] = fit($("prof"));
  if (W < 10) return;
  const { n, f, N } = IMG, v = f.v, o = Math.floor(POS(LINE_ROW) / FIELD_MM * n) * n;
  const top = 18, bot = H - 26, mid = (top + bot) / 2, half = (bot - top) / 2;
  const span = Math.max(5 * Math.sqrt(N), 0.15 * N);
  const X = i => (i + 0.5) / n * W, Y = p => Math.min(H, Math.max(0, mid + (N - p) / span * half));   // fewer photons: lower
  // where the line crosses the disks
  ctx.fillStyle = "rgba(230,233,240,.07)";
  SIZES.forEach((d, col) => ctx.fillRect((POS(col) - d / 2) / FIELD_MM * W, top, d / FIELD_MM * W, bot - top - 12));
  ctx.strokeStyle = css("--line"); ctx.beginPath(); ctx.moveTo(0, mid); ctx.lineTo(W, mid); ctx.stroke();
  ctx.strokeStyle = css("--signal"); ctx.lineWidth = 1; ctx.globalAlpha = 0.85; ctx.beginPath();
  for (let i = 0; i < n; i++) i ? ctx.lineTo(X(i), Y(v[o + i])) : ctx.moveTo(X(i), Y(v[o + i]));
  ctx.stroke(); ctx.globalAlpha = 1;
  // the same line, averaged over 7 pixels: the disks stand out as dips once the noise is smoothed
  ctx.strokeStyle = css("--fg"); ctx.lineWidth = 2.4; ctx.beginPath();
  let a = 0; for (let k = 0; k < 7; k++) a += v[o + k];
  for (let i = 3; i < n - 3; i++) {
    i === 3 ? ctx.moveTo(X(i), Y(a / 7)) : ctx.lineTo(X(i), Y(a / 7));
    a += v[o + i + 4] - v[o + i - 3];
  }
  ctx.stroke(); ctx.lineWidth = 1;
  // which line is which, and which way is which
  const L = T[S.lang], m = css("--muted");
  SIZES.forEach((d, col) => text(ctx, mm(d), POS(col) / FIELD_MM * W, H - 4, m, "center", 10));
  text(ctx, `↑ ${L.profUp}`, 2, 11, m, "left", 10);
  text(ctx, `↓ ${L.profDown}`, 2, bot + 1, m, "left", 10);
  let x = W - 2;
  for (const [name, color, w] of [[L.profAvg, css("--fg"), 2.4], [L.profPx, css("--signal"), 1]]) {
    text(ctx, name, x, 11, m, "right", 10);
    x -= ctx.measureText(name).width + 6;
    ctx.strokeStyle = color; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(x - 16, 7.5); ctx.lineTo(x, 7.5); ctx.stroke();
    x -= 28;
  }
  ctx.lineWidth = 1;
}

function drawCurve() {
  const [ctx, W, H] = fit($("curve"));
  if (W < 10) return;
  const L = T[S.lang].curveLbl, x0 = 34, y0 = H - 24, x1 = W - 10, y1 = 22;
  const per = M.N / S.mas, perRef = 90;                       // photons per pixel per mAs: now, and at the starting point
  const smax = Math.max(Math.sqrt(Math.max(per, perRef) * 40), PIN ? PIN.snr : 0) * 1.08;
  const X = m => x0 + (m / 40) * (x1 - x0), Y = s => y0 - (s / smax) * (y0 - y1);
  ctx.strokeStyle = css("--line"); ctx.beginPath(); ctx.moveTo(x0, y1 - 6); ctx.lineTo(x0, y0); ctx.lineTo(x1, y0); ctx.stroke();
  text(ctx, L.x, x1, y0 - 6, css("--muted"), "right", 11); text(ctx, L.y, 4, 11, css("--muted"), "left", 11);
  for (const m of [10, 20, 30, 40]) text(ctx, String(m), X(m), y0 + 14, css("--muted"), "center", 10);
  const step = smax > 120 ? 40 : smax > 60 ? 20 : 10;
  for (let v = step; v < smax; v += step) text(ctx, String(v), x0 - 5, Y(v) + 3, css("--muted"), "right", 10);
  const curve = p => { ctx.beginPath(); for (let t = 0; t <= 80; t++) { const m = 40 * (t / 80) ** 2; t ? ctx.lineTo(X(m), Y(Math.sqrt(p * m))) : ctx.moveTo(X(0), Y(0)); } ctx.stroke(); };
  // the starting point, in grey, so a change of detector, pixel or kV shows as a different curve
  ctx.strokeStyle = css("--muted"); ctx.globalAlpha = 0.6; ctx.lineWidth = 1.5; curve(perRef); ctx.globalAlpha = 1;
  ctx.strokeStyle = css("--signal"); ctx.lineWidth = 2; curve(per); ctx.lineWidth = 1;
  // the saved setting, as an open ring
  if (PIN) {
    ctx.strokeStyle = css("--fg"); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(X(PIN.mas), Y(PIN.snr), 5, 0, 7); ctx.stroke(); ctx.lineWidth = 1;
    text(ctx, L.saved, X(PIN.mas) + 8, Y(PIN.snr) + 14, css("--fg"), X(PIN.mas) > W * 0.8 ? "right" : "left", 11);
  }
  // the current setting, and what doubling it would give
  const s = Math.sqrt(per * S.mas), d = Math.min(40, 2 * S.mas), sd = Math.sqrt(per * d);
  ctx.setLineDash([4, 4]); ctx.strokeStyle = css("--amber");
  ctx.beginPath(); ctx.moveTo(X(S.mas), Y(s)); ctx.lineTo(X(d), Y(s)); ctx.lineTo(X(d), Y(sd)); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = css("--amber"); ctx.beginPath(); ctx.arc(X(S.mas), Y(s), 5, 0, 7); ctx.fill();
  const lbl = `SNR ${fmt(s, 0)}`, left = X(S.mas) - 8 - ctx.measureText(lbl).width > x0 + 4;
  text(ctx, lbl, X(S.mas) + (left ? -8 : 8), Y(s) + (left ? -8 : 17), css("--amber"), left ? "right" : "left", 11);   // no room on the left: below the dot, clear of the step
  if (2 * S.mas <= 40) text(ctx, L.double, X(d) + (X(d) > W * 0.6 ? -6 : 6), (Y(s) + Y(sd)) / 2 + 4, css("--amber"), X(d) > W * 0.6 ? "right" : "left", 11);
}

// ---- the numbers, what you can see, and the saved numbers ----
function metrics() {
  const L = T[S.lang];
  return [["", "n", Math.round(M.N).toLocaleString(S.lang === "da" ? "da-DK" : "en-GB"), L.f.n],
          ["ok", "snr", fmt(M.snr, 1), L.f.snr], ["mag", "cnr", fmt(M.cnr, 2), L.f.cnr],
          ["err", "dose", `×${fmt(M.dose, 2)}`, L.f.dose],
          [M.rex < REX_LOW || M.rex > REX_HIGH ? "err" : "ok", "rex", String(Math.round(M.rex)), L.f.rex(M.rex)],
          ["", "seen", `${M.seen}`, S.level === "deep" ? L.f.seenDeep : L.f.seen]];
}
function observations() {
  const L = T[S.lang].see, r = String(Math.round(M.rex)), kv = t => t.replace("{kv}", S.kv).replace("{c}", Math.round(M.cScale * 100));
  const found = [[M.rex < REX_LOW, L.low.replace("{r}", r)], [M.rex > REX_HIGH, L.high.replace("{r}", r)],
                 [S.filter === "on", L.filter], [S.det === "gos", L.gos],
                 [S.kv > 70, kv(L.kvUp)], [S.kv < 70, kv(L.kvDown)], [S.px > 150, L.pxUp], [S.px < 150, L.pxDown],
                 [S.mas !== 10, L.mas.replace("{d}", fmt(M.dose, 2)).replace("{s}", fmt(Math.sqrt(S.mas / 10), 2))]]
    .filter(([on]) => on).slice(0, 2).map(([, t]) => t);
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
  PIN = PIN ? null : { vals: Object.fromEntries(metrics().map(([, key, value]) => [key, value])), mas: S.mas, snr: M.snr };
  render();
};

// ---- controls, text, tasks ----------------------------------------------------------
const SLIDERS = [["mas", 1, 40, 0.5, v => `${fmt(v, v % 1 ? 1 : 0)} mAs`], ["kv", 50, 120, 5, v => `${v} kV`]];
function buildControls() {
  const L = T[S.lang].ctl, box = $("controls");
  const help = k => S.level === "grund" ? `<p class="help">${T[S.lang].help[k]}</p>` : "";
  const seg = (key, opts) => `<div class="ctl"><label><span>${L[key]}</span><span></span></label><div class="seg">` +
    opts.map(([val, lbl]) => `<button data-k="${key}" data-v="${val}" aria-pressed="${String(S[key]) === String(val)}">${lbl}</button>`).join("") +
    `</div>${help(key)}</div>`;
  const slider = ([k, mn, mx, st, f]) =>
    `<div class="ctl"><label for="s-${k}"><span>${L[k]}</span><span id="o-${k}">${f(S[k])}</span></label>` +
    `<input type="range" id="s-${k}" min="${mn}" max="${mx}" step="${st}" value="${S[k]}">${help(k)}</div>`;
  box.innerHTML = slider(SLIDERS[0]) + slider(SLIDERS[1]) +
    seg("px", [[100, "100 µm"], [150, "150 µm"], [200, "200 µm"]]) +
    seg("det", [["csi", L.csi], ["gos", L.gos]]) + seg("filter", [["off", L.off], ["on", L.on]]) +
    `<div class="ctl buttons"><button class="reset shot" id="shot">${L.shot}</button><button class="reset" id="reset">${L.reset}</button>${help("shot")}</div>`;
  box.querySelectorAll("button[data-k]").forEach(b => b.onclick = () => {
    S[b.dataset.k] = b.dataset.k === "px" ? +b.dataset.v : b.dataset.v; buildControls(); update();
  });
  SLIDERS.forEach(([k, , , , f]) => {
    const el = $(`s-${k}`);
    el.oninput = () => { S[k] = +el.value; $(`o-${k}`).textContent = f(S[k]); updateSoon(); };
  });
  $("shot").onclick = () => { SHOT++; update(); };
  $("reset").onclick = () => { Object.assign(S, START); buildControls(); update(); };
}
// the tasks that are shown at this level
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
// opening a task in the list below shows the same task in the card beside the simulator
document.getElementById("task-list").addEventListener("toggle", e => {
  const d = e.target;
  if (d.open && d.dataset.id) { taskId = d.dataset.id; buildCard(); }
}, true);
function buildCard() {
  const L = T[S.lang], flat = taskList(), i = Math.max(0, flat.findIndex(t => t.id === taskId)), t = flat[i];
  taskId = t.id;
  $("taskcard").innerHTML =
    `<div class="tc-head"><span>${t.g} · ${t.k} ${L.of} ${t.n}</span>` +
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
  for (const k of ["title", "sub", "curve", "prof", "image", "tasks", "model", "foot", "privacy"]) set("t-" + k, L[k]);
  set("t-back", L.back); set("t-simtitle", L.simTitle); set("t-profnote", L.profNote); set("t-curvenote", L.curveNote);
  set("t-imgnote", S.level === "deep" ? L.imgNoteDeep : L.imgNote);
  $("t-back").href = "../../?lang=" + S.lang;
  set("lvl-grund", L.grund); set("lvl-deep", L.deep);
  $("model-text").innerHTML = math(L.modelText);
  let last = "";
  $("task-list").innerHTML = taskList().map(t => {
    const head = t.g === last ? "" : `<h4 class="tgroup">${t.g}</h4>`; last = t.g;
    return head + `<details data-id="${t.id}"><summary>${t.h}</summary><p class="q">${math(t.q)}</p><details class="answer">` +
      `<summary>${L.answer}</summary><p class="a">${math(t.a)}</p></details></details>`; }).join("");
  buildCard();
  // the video in the chosen language and level; only reloaded when that choice changes
  $("t-videonote").textContent = L.videoNote;
  const vid = $("vid"), file = `video/stoej_${S.lang}_${S.level === "deep" ? "fordybelse" : "grund"}.mp4`;
  if (vid.getAttribute("src") !== file) { vid.poster = `video/poster_${S.lang}.jpg`; vid.src = file; }
}
function setPressed() {
  for (const [id, on] of [["lang-da", S.lang === "da"], ["lang-en", S.lang === "en"],
                          ["lvl-grund", S.level === "grund"], ["lvl-deep", S.level === "deep"]])
    $(id).setAttribute("aria-pressed", on);
}
function render() {
  readouts();
  if (!$("curve").getClientRects().length) return;            // another tab is showing: nothing to draw
  drawCurve(); drawProf(); drawImg();
}
function update() { M = model(S); makeImage(); render(); }
// while a slider is dragged it fires many events; redraw at most once per screen frame so the thumb keeps up
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
