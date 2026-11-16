// The probe and the beam simulator (ultrasound U3): the page. The probes, the beam and the phantom live in model.js
// (PM). Here:
//   - the echo field, worked out along the probe's own lines: the phantom's scatter and wires where each line meets
//     them, blurred by the pulse (along the line, with the phase) and by the beam (across the lines, as wide as the
//     beam is at that depth), plus a weak wide haze from the side lobes;
//   - the image: the lines drawn where they lie (a rectangle, a fan from a curve, or a fan from a point);
//   - the graph: the beam's width, the slice thickness and the axial resolution against depth;
//   - the numbers, the "what you can see" line, the tasks and the model text.

const START = { probe: "curved", f: 3.5, depth: 14, focus: 6, zones: 1, harm: false, mdepth: 6, mx: 0.25, beam: true, names: true };
const clone = o => JSON.parse(JSON.stringify(o));
const S = { lang: "da", level: "grund", ...clone(START) };

const T = {
  da: {
    title: "Proben og strålen", sub: "Simulator: tre slags prober, hvordan strålen samles i et fokus, og hvad der bestemmer, hvor små ting du kan se, og hvor hurtigt billedet opdateres.",
    simTitle: "Simulator: proben og strålen", grund: "Grund", deep: "Fordybelse", back: "← Ultralyd",
    image: "Billedet", graph: "Strålen og opløsningen, dybde hen ad", zoom: "Lupen: 2,6 × 2,6 cm omkring stedet, du klikkede",
    note: "Hvor små ting du kan skelne i hver dybde. Til siden: strålens bredde. Snittykkelse: strålens tykkelse på tværs af billedet. I dybden: en halv pulslængde, ens i hele billedet. Trekanterne er fokus.",
    imgNote: "Simuleret billede af et testfantom, ikke et rigtigt skannerbillede. Klik i billedet for at vælge måledybden.",
    tasks: "Opgaver", answer: "Vis svar", of: "af", prev: "Forrige opgave", next: "Næste opgave",
    model: "Sådan virker modellen", foot: "© 2026 Oliver Brage. Alle rettigheder forbeholdes.", privacy: "Privatliv",
    seen: "Det kan du se:", pin: "Gem tallene", unpin: "Fjern de gemte", saved: "gemt",
    grp: { probe: "Proben", image: "Billedet", focus: "Fokus", measure: "Måling" },
    ctl: { probe: "Probe", linear: "Lineær", curved: "Konveks", phased: "Sektor", f: "Frekvens", harm: "Harmoniske", on: "Til", off: "Fra",
           depth: "Dybde", names: "Vis navne", beam: "Vis strålen", focus: "Fokusdybde", zones: "Fokuszoner", mdepth: "Måledybde", reset: "Nulstil alt" },
    help: { probe: "Lineær: flad og bred, høj frekvens, til det, der ligger tæt på huden. Konveks: buet, lav frekvens, til abdomen. Sektor: lille, lav frekvens, ser mellem ribbenene.",
            f: "Højere frekvens: kortere puls og smallere stråle, men lyden når ikke så dybt.",
            harm: "Skanneren lytter efter det dobbelte af den frekvens, den sender.",
            depth: "Hvor dybt billedet går. Dybere billede: længere tid pr. linje.",
            beam: "Tegner den sendte stråle ned ad midten af billedet.",
            focus: "Hvor den sendte stråle er smallest.",
            zones: "Flere fokuszoner: smal stråle i et større område, men hver linje sendes flere gange.",
            mdepth: "Dybden, tallene gælder for. Du kan også klikke i billedet." },
    k: { axial: "I dybden", lateral: "Til siden", slice: "Snittykkelse", frame: "Billedhastighed", pen: "Rækkevidde", lam: "Bølgelængde" },
    f: { axial: "to ting skal ligge så langt fra hinanden", lateral: d => `strålens bredde i ${d} cm`, slice: d => `strålens tykkelse i ${d} cm`,
         frame: (l, z) => `${l} linjer × ${z} ${z === 1 ? "fokuszone" : "fokuszoner"}`, pen: (p, d) => p < d ? "billedet går dybere: støj forneden" : "når helt ned",
         lam: "c / f, med c = 1540 m/s" },
    unit: { fps: "billeder/s" },
    see: {
      noise: "Under cirka {p} cm er der kun støj: lyden er for svag ved {f} MHz{h}.",
      lat: "I {d} cm ses parrene med {yes} mm som to prikker{no}.",
      latNo: ", mens {no} mm smelter sammen til én",
      latNone: "I {d} cm smelter alle parrene ved siden af hinanden sammen: strålen er {w} mm bred.",
      ax: "Parrene oven over hinanden: {yes} mm ses som to{no}. Pulsen er {a} mm.",
      axNo: ", {no} mm smelter sammen",
      cyst: "Cysterne i {d} cm: snittet er {e} mm tykt, så den på 2 mm er {c2} og den på 4 mm {c4}. Vævet ved siden af fylder dem op.",
      dark: "sort", dim: "mørk", grey: "grå", light: "næsten som vævet",
      far: "Fokus ligger i {f} cm, langt fra måledybden: strålen er {w} mm bred her mod {w0} mm i fokus.",
      zones: "Med {z} fokuszoner sendes hver linje {z} gange: {fr} billeder pr. sekund.",
      harm: "Harmoniske: smallere stråle og færre sidesløjfer, så cysterne er mørkere. Men rækkevidden er kortere.",
      contrast: "Skiverne i 11 cm: den lyse (+6 dB) ses, den mørke (−3 dB) drukner næsten i kornene.",
      base: "Klik i billedet ved et par tråde eller cyster, og se, hvad der kan skelnes i den dybde.",
    },
    labels: { column: "en tråd pr. cm", axial: "par oven over hinanden", lateral: "par ved siden af hinanden", cysts: "cyster 2, 4, 6 mm",
              contrast: "−3 dB   +6 dB", beam: "den sendte stråle", focus: "fokus", white: "stærkt ekko", black: "intet ekko",
              lat: "til siden", slice: "snittykkelse", ax: "i dybden", tx: "sendt stråle", mm: "bredde (mm)", depthAx: "dybde" },
    dec: ",",
    modelText: `<p><b>Det hele er simuleret.</b> Billederne er regnet ud fra en enkel model af et testfantom: et gelagtigt materiale med tynde tråde og runde cyster. Der er ikke brugt rigtige ultralydsbilleder.</p>
<p><b>Proben.</b> I proben sidder en række små piezoelektriske elementer. En elektrisk spænding får dem til at svinge og sende lyd ud, og når ekkoet rammer dem, giver de en spænding tilbage. Den samme probe sender og lytter. En gruppe elementer (åbningen) bruges til hver linje. Modellens prober: lineær 4 cm bred med 1,5 cm åbning og 128 linjer, konveks med radius 5 cm og 60° felt, 2,4 cm åbning og 128 linjer, sektor med 2 cm flade, 90° felt og 96 linjer.</p>
<p><b>Opløsning i dybden (aksial).</b> Pulsen er 2 svingninger lang. To ting kan i princippet skelnes i dybden, når de ligger mindst en halv pulslængde fra hinanden, her en bølgelængde $\\lambda = c/f$: 0,44 mm ved 3,5 MHz, 0,15 mm ved 10 MHz. Den er ens i hele billedet. På den logaritmiske gråskala skal der lidt mere til: modellen kalder to tråde adskilt, når ekkoet mellem dem er 10 dB svagere end trådene, og det kræver cirka det dobbelte.</p>
<p><b>Fokus og opløsning til siden (lateral).</b> Elementerne sendes med små tidsforskydninger, så lyden samles i et fokus. Bredden ved fokus er cirka $\\lambda F$, hvor F-tallet $F$ er fokusdybden divideret med åbningen. Over og under fokus bliver strålen bredere. Ekkoerne fokuseres i alle dybder, når de kommer tilbage (dynamisk modtagefokus), så den samlede bredde er smallere end den sendte stråle. Flere fokuszoner: hver linje sendes én gang pr. zone. To tråde ses som to, når de ligger lidt mere end en strålebredde fra hinanden (samme regel om 10 dB).</p>
<p><b>Snittykkelse.</b> På tværs af billedet samles strålen af en fast linse på probens forside (lineær: fokus 1,8 cm, konveks: 6 cm, sektor: 7 cm). Fokus-knappen ændrer ikke snittykkelsen. En cyste, der er mindre end snittet, fyldes op af ekkoer fra vævet foran og bagved: modellen regner, hvor stor en del af snittet der ligger i cysten.</p>
<p><b>Kontrast.</b> Strålen har svage sidesløjfer (−30 dB, sektor −26 dB), der henter lidt ekko fra vævet ved siden af ind i mørke områder. Kornene (speckle) varierer mere end 3 dB, så små forskelle i ekko er svære at se.</p>
<p><b>Billedhastighed.</b> Hver linje venter, til ekkoet fra bunden er kommet tilbage: $2 \\cdot \\text{dybde}/c$. Et billede tager $\\text{linjer} \\cdot \\text{fokuszoner} \\cdot 2 \\cdot \\text{dybde}/c$.</p>
<p><b>Harmoniske.</b> Vævet forvrænger pulsen lidt på vejen, så ekkoet også indeholder den dobbelte frekvens. Skanneren lytter kun efter den. Modellen: 30 % smallere stråle, 25 % tyndere snit og sidesløjfer 12 dB lavere. Det harmoniske ekko er svagere, så rækkevidden er cirka to tredjedele.</p>
<p><b>Det er ikke med.</b> Strålens nærfelt tæt på proben er forenklet. Linjetætheden er fast (U4). Dæmpningen er 0,5 dB pr. cm pr. MHz, som i U1 og U2. Tallene er typiske lærebogsværdier, ikke tal fra en bestemt skanner.</p>
<p>Kilder: Hoskins, Martin og Thrush, Diagnostic Ultrasound: Physics and Equipment, 3. udg. (2019). Gibbs, Cole og Sassano, Ultrasound Physics and Technology (2009). Kremkau, Sonography Principles and Instruments. Bushberg m.fl., The Essential Physics of Medical Imaging, kapitlet om ultralyd.</p>`,
    groups: [
      ["Proben og billedet", [
        ["Tre prober", "Skift mellem Lineær, Konveks og Sektor. Hvordan ser billedet ud med hver probe, og hvad bruges de til?", "Lineær: et rektangulært billede, lige så bredt som proben, og høj frekvens (5–15 MHz). Til det, der ligger tæt på huden: kar, sener, muskler og skjoldbruskkirtel. Konveks: en buet flade, så billedet bliver bredere nedad, og lav frekvens (2–6 MHz). Til abdomen og bækken. Sektor: en lille flade, og linjerne styres ud fra ét punkt. Den kan se mellem ribbenene, fx på hjertet."],
        ["Frekvens og rækkevidde", "Lineær, 10 MHz, Dybde 10 cm. Hvor langt ned når lyden? Prøv så 5 MHz.", "Ved 10 MHz når lyden cirka 7 cm ned, og under det er der kun støj. Ved 5 MHz rækker den 14 cm. Derfor har prober til dybe organer lav frekvens og prober til det overfladiske høj frekvens."],
      ]],
      ["Opløsning i dybden", [
        ["Parrene oven over hinanden", "Tryk Nulstil alt (Konveks, 3,5 MHz). Klik ved parrene oven over hinanden i 2,5–3,7 cm, og se på dem i lupen. Der er 2, 1 og 0,5 mm mellem trådene. Hvilke ser du som to?", "Parrene med 2 og 1 mm ses som to, parret med 0,5 mm smelter sammen. Opløsningen i dybden er en halv pulslængde. Pulsen er 2 svingninger lang, så det er en bølgelængde: 0,44 mm ved 3,5 MHz. I billedet skal der lidt mere til, før der ses en mørk stribe mellem trådene."],
        ["Højere og lavere frekvens", "Skift til Lineær ved 10 MHz, og se på de samme par. Og med den konvekse probe ved 2 MHz?", "Ved 10 MHz er bølgelængden 0,15 mm, så alle tre par ses som to. Ved 2 MHz er den 0,77 mm, og kun parret med 2 mm ses som to. Højere frekvens giver en kortere puls og bedre opløsning i dybden."],
        ["Hjælper fokus?", "Flyt Fokusdybde op og ned. Ændrer det opløsningen i dybden?", "Nej. Opløsningen i dybden afhænger kun af pulsens længde, altså af frekvensen, og den er ens i hele billedet. Fokus ændrer strålens bredde: opløsningen til siden."],
      ]],
      ["Fokus og opløsning til siden", [
        ["Søjlen af tråde", "Nulstil alt. Se på søjlen af tråde til venstre. Hvor er trådene korte prikker, og hvor er de streger?", "Omkring fokus i 6 cm er trådene korte prikker. Over og især under fokus er de bredere streger, fordi strålen er bredere der. En tråd tegnes lige så bred som strålen. Den gule tegning viser den sendte stråle: smallest i fokus."],
        ["Fokus ved det, du vil se", "Klik ved de nederste par ved siden af hinanden, så Måledybde er 13 cm. Hvilke par ses som to? Flyt så Fokusdybde ned til 13 cm.", "Med fokus i 6 cm er strålen 2,3 mm bred i 13 cm, og ingen af parrene ses tydeligt som to. Med fokus i 13 cm er den 1,7 mm, og parret med 3 mm ses som to. Læg fokus ved det, du vil se, eller lige under."],
        ["Frekvens og bredde", "Konveks, Fokusdybde 6 cm, Måledybde 9 cm. Sammenlign 2 og 5 MHz.", "Ved 2 MHz er strålen 2,3 mm bred, og ingen af parrene ses som to. Ved 5 MHz er den 1,1 mm, og parrene med 3 og 2 mm ses som to. Strålen kan samles smallere, når bølgelængden er kortere. Højere frekvens giver altså bedre opløsning både i dybden og til siden."],
        ["Sektorproben", "Skift til Sektor (2,5 MHz), og sæt Måledybde til 13 cm. Hvor bred er strålen, og hvilke par ses som to?", "Strålen er 3,5 mm bred, og ingen af parrene ses som to, heller ikke 3 mm. Proben er lille, så strålen kan ikke samles så smalt i dybden. Det er prisen for at kunne se mellem ribbenene."],
      ]],
      ["Snittykkelse", [
        ["Små cyster", "Nulstil alt, og sæt Måledybde til 7 cm. Se på de tre cyster (2, 4 og 6 mm). Er de lige sorte?", "Nej. Cysten på 6 mm er sort, den på 4 mm er mørk, og den på 2 mm er næsten som vævet. Snittet er 2,3 mm tykt i 7 cm, så for den lille cyste ligger det meste af snittet i vævet foran og bagved. Ekkoerne derfra fylder cysten op."],
        ["Linsen", "Se på de øverste cyster i 1,6 cm, først med den konvekse probe og så med den lineære (10 MHz). Hvad er forskellen?", "Med den konvekse probe er snittet 3,3 mm tykt i 1,6 cm, så cysterne er fyldt med grå ekkoer. Den lineære probes linse samler snittet i cirka 2 cm, hvor det kun er 0,7 mm tykt: alle tre cyster er sorte. Snittykkelsen er fast for proben. Fokus-knappen ændrer den ikke."],
        ["I klinikken", "Hvorfor kan en lille cyste se ud som noget fast? Hvad kan du gøre?", "Er snittet tykkere end cysten, fylder ekkoer fra vævet ved siden af den op, så den ser grå ud. Brug den højeste frekvens, der når ned, læg cysten i den dybde, hvor snittet er tyndest, og drej proben 90°, så du ser den i begge snit. Harmoniske hjælper også."],
      ]],
      ["Kontrast", [
        ["Svage forskelle", "Nulstil alt, og sæt Måledybde til 11 cm. Kan du se de to skiver? Den venstre er 3 dB mørkere end vævet, den højre 6 dB lysere.", "Den lyse skive ses, den mørke er svær at skelne fra kornene. Kornene (speckle) varierer selv mere end 3 dB, så små forskelle i ekko drukner. Det kaldes kontrastopløsning. En smal stråle og få sidesløjfer hjælper, fx harmoniske."],
      ]],
      ["Billedhastighed", [
        ["Fokuszoner", "Nulstil alt. Sæt Fokuszoner til 1, 2 og 3. Hvad sker der med billedhastigheden og med søjlen af tråde?", "Billedhastigheden falder fra 43 til 21 og 14 billeder pr. sekund, fordi hver linje sendes én gang pr. fokuszone. Til gengæld er trådene korte prikker i et større område. Til det, der bevæger sig (hjerte, foster, kar), er én fokuszone ofte bedst."],
        ["Dybde", "Sæt Dybde til 7 cm og så til 14 cm. Hvad sker der med billedhastigheden?", "Ved 7 cm er den 86 billeder pr. sekund, ved 14 cm 43. Lyden skal nå ned og tilbage, før næste linje kan sendes, så dobbelt dybde giver halvt så mange billeder. Brug ikke mere dybde end nødvendigt."],
      ]],
      ["Harmoniske", [
        ["Harmoniske til", "Nulstil alt, og sæt Måledybde til 7 cm. Slå Harmoniske til. Hvad sker der med strålen, cysterne og rækkevidden?", "Strålen bliver smallere (1,0 → 0,7 mm i 7 cm), snittet tyndere, og cysterne mørkere, fordi der er færre sidesløjfer. Men rækkevidden falder fra 20 til 13 cm, fordi det harmoniske ekko er svagt. Harmoniske bruges meget i abdomen, fx ved galdeblære og cyster."],
        ["Sendt og modtaget", "Fordybelse: Se på grafen. Den tynde stiplede kurve er den sendte stråle, den fuldt optrukne er sendt og modtaget tilsammen. Hvorfor er den samlede smallere langt fra fokus?", "Når ekkoerne kommer tilbage, fokuserer skanneren dem i hver dybde for sig (dynamisk modtagefokus): den forsinker signalerne fra elementerne, så de passer til den dybde, ekkoet kommer fra. Den sendte stråle har kun ét fokus pr. zone. Derfor er den samlede stråle smallere end den sendte, især langt fra fokus.", { deep: true }],
        ["Dybe cyster", "Fordybelse: Nulstil alt, og sæt Måledybde til 15 cm. Sammenlign cysten på 6 mm med og uden harmoniske.", "Uden harmoniske er snittet 5,6 mm tykt i 15 cm, næsten som cysten, så den er grå (−7 dB). Med harmoniske er snittet 4,2 mm, og cysten er mørkere (−10 dB). I dybden er selv store cyster svære at se sorte. Læg fokus og den rette probe efter det, du leder efter.", { deep: true }],
      ]],
    ],
  },
  en: {
    title: "The probe and the beam", sub: "Simulator: three kinds of probe, how the beam is gathered into a focus, and what decides how small things you can see and how fast the image updates.",
    simTitle: "Simulator: the probe and the beam", grund: "Basic", deep: "Deeper level", back: "← Ultrasound",
    image: "The image", graph: "The beam and the resolution, depth across", zoom: "The magnifier: 2.6 × 2.6 cm around the place you clicked",
    note: "How small things you can tell apart at each depth. Lateral: the beam's width. Slice thickness: the beam's thickness across the image. Axial: half the pulse length, the same in the whole image. The triangles are the focus.",
    imgNote: "Simulated image of a test phantom, not a real scanner image. Click in the image to choose the measuring depth.",
    tasks: "Tasks", answer: "Show answer", of: "of", prev: "Previous task", next: "Next task",
    model: "How the model works", foot: "© 2026 Oliver Brage. All rights reserved.", privacy: "Privacy",
    seen: "What you can see:", pin: "Save the numbers", unpin: "Remove saved", saved: "saved",
    grp: { probe: "The probe", image: "The image", focus: "Focus", measure: "Measuring" },
    ctl: { probe: "Probe", linear: "Linear", curved: "Curved", phased: "Phased", f: "Frequency", harm: "Harmonics", on: "On", off: "Off",
           depth: "Depth", names: "Show names", beam: "Show the beam", focus: "Focus depth", zones: "Focal zones", mdepth: "Measuring depth", reset: "Reset all" },
    help: { probe: "Linear: flat and wide, high frequency, for what lies close to the skin. Curved: curved face, low frequency, for the abdomen. Phased: small, low frequency, sees between the ribs.",
            f: "Higher frequency: a shorter pulse and a narrower beam, but the sound does not reach as deep.",
            harm: "The scanner listens for twice the frequency it sends.",
            depth: "How deep the image goes. A deeper image: more time per line.",
            beam: "Draws the sent beam down the middle of the image.",
            focus: "Where the sent beam is narrowest.",
            zones: "More focal zones: a narrow beam over a larger area, but each line is sent several times.",
            mdepth: "The depth the numbers are for. You can also click in the image." },
    k: { axial: "Axial", lateral: "Lateral", slice: "Slice thickness", frame: "Frame rate", pen: "Reach", lam: "Wavelength" },
    f: { axial: "two things must be this far apart", lateral: d => `the beam's width at ${d} cm`, slice: d => `the beam's thickness at ${d} cm`,
         frame: (l, z) => `${l} lines × ${z} ${z === 1 ? "focal zone" : "focal zones"}`, pen: (p, d) => p < d ? "the image goes deeper: noise at the bottom" : "reaches all the way",
         lam: "c / f, with c = 1540 m/s" },
    unit: { fps: "frames/s" },
    see: {
      noise: "Below about {p} cm there is only noise: the sound is too weak at {f} MHz{h}.",
      lat: "At {d} cm the pairs {yes} mm apart show as two dots{no}.",
      latNo: ", while {no} mm merge into one",
      latNone: "At {d} cm all the side-by-side pairs merge: the beam is {w} mm wide.",
      ax: "The pairs one above the other: {yes} mm show as two{no}. The pulse is {a} mm.",
      axNo: ", {no} mm merge",
      cyst: "The cysts at {d} cm: the slice is {e} mm thick, so the 2 mm one is {c2} and the 4 mm one {c4}. The tissue beside them fills them in.",
      dark: "black", dim: "dark", grey: "grey", light: "almost like the tissue",
      far: "The focus is at {f} cm, far from the measuring depth: the beam is {w} mm wide here against {w0} mm at the focus.",
      zones: "With {z} focal zones each line is sent {z} times: {fr} frames per second.",
      harm: "Harmonics: a narrower beam and fewer side lobes, so the cysts are darker. But the reach is shorter.",
      contrast: "The discs at 11 cm: the bright one (+6 dB) shows, the dark one (−3 dB) almost drowns in the grain.",
      base: "Click in the image at a pair of wires or the cysts, and see what can be told apart at that depth.",
    },
    labels: { column: "one wire per cm", axial: "pairs one above the other", lateral: "pairs side by side", cysts: "cysts 2, 4, 6 mm",
              contrast: "−3 dB   +6 dB", beam: "the sent beam", focus: "focus", white: "strong echo", black: "no echo",
              lat: "lateral", slice: "slice thickness", ax: "axial", tx: "sent beam", mm: "width (mm)", depthAx: "depth" },
    dec: ".",
    modelText: `<p><b>Everything is simulated.</b> The images are worked out from a simple model of a test phantom: a gel-like material with thin wires and round cysts. No real ultrasound images are used.</p>
<p><b>The probe.</b> The probe holds a row of small piezoelectric elements. A voltage makes them vibrate and send out sound, and when the echo hits them, they give a voltage back. The same probe sends and listens. A group of elements (the aperture) is used for each line. The model's probes: linear 4 cm wide with a 1.5 cm aperture and 128 lines, curved with a 5 cm radius and a 60° field, a 2.4 cm aperture and 128 lines, phased with a 2 cm face, a 90° field and 96 lines.</p>
<p><b>Axial resolution.</b> The pulse is 2 cycles long. In principle two things can be told apart in depth when they are at least half a pulse length apart, here one wavelength $\\lambda = c/f$: 0.44 mm at 3.5 MHz, 0.15 mm at 10 MHz. It is the same in the whole image. On the logarithmic grey scale it takes a little more: the model calls two wires apart when the echo between them is 10 dB weaker than the wires, and that needs about twice as much.</p>
<p><b>Focus and lateral resolution.</b> The elements are fired with small time delays so the sound gathers in a focus. The width at the focus is about $\\lambda F$, where the F-number $F$ is the focus depth divided by the aperture. Above and below the focus the beam gets wider. The echoes are focused at every depth when they come back (dynamic receive focus), so the total width is narrower than the sent beam. More focal zones: each line is sent once per zone. Two wires show as two when they are a little more than one beam width apart (the same 10 dB rule).</p>
<p><b>Slice thickness.</b> Across the image the beam is gathered by a fixed lens on the probe face (linear: focus 1.8 cm, curved: 6 cm, phased: 7 cm). The focus knob does not change the slice thickness. A cyst smaller than the slice is filled in by echoes from the tissue in front and behind: the model works out how much of the slice lies in the cyst.</p>
<p><b>Contrast.</b> The beam has weak side lobes (−30 dB, phased −26 dB) that bring a little echo from the tissue beside into dark areas. The grain (speckle) varies more than 3 dB, so small differences in echo are hard to see.</p>
<p><b>Frame rate.</b> Each line waits until the echo from the bottom has come back: $2 \\cdot \\text{depth}/c$. A frame takes $\\text{lines} \\cdot \\text{focal zones} \\cdot 2 \\cdot \\text{depth}/c$.</p>
<p><b>Harmonics.</b> The tissue distorts the pulse a little on the way, so the echo also holds twice the frequency. The scanner listens only for that. The model: a 30 % narrower beam, a 25 % thinner slice and side lobes 12 dB lower. The harmonic echo is weaker, so the reach is about two thirds.</p>
<p><b>Not included.</b> The beam's near field close to the probe is simplified. The line density is fixed (U4). The attenuation is 0.5 dB per cm per MHz, as in U1 and U2. The numbers are typical textbook values, not numbers from a particular scanner.</p>
<p>Sources: Hoskins, Martin and Thrush, Diagnostic Ultrasound: Physics and Equipment, 3rd ed. (2019). Gibbs, Cole and Sassano, Ultrasound Physics and Technology (2009). Kremkau, Sonography Principles and Instruments. Bushberg et al., The Essential Physics of Medical Imaging, the ultrasound chapter.</p>`,
    groups: [
      ["The probe and the image", [
        ["Three probes", "Switch between Linear, Curved and Phased. What does the image look like with each probe, and what are they used for?", "Linear: a rectangular image, as wide as the probe, and a high frequency (5–15 MHz). For what lies close to the skin: vessels, tendons, muscles and the thyroid. Curved: a curved face, so the image gets wider downwards, and a low frequency (2–6 MHz). For the abdomen and pelvis. Phased: a small face, and the lines are steered out from one point. It can see between the ribs, for example the heart."],
        ["Frequency and reach", "Linear, 10 MHz, Depth 10 cm. How far down does the sound reach? Then try 5 MHz.", "At 10 MHz the sound reaches about 7 cm, and below that there is only noise. At 5 MHz it reaches 14 cm. That is why probes for deep organs have a low frequency and probes for superficial structures a high one."],
      ]],
      ["Axial resolution", [
        ["Pairs one above the other", "Press Reset all (Curved, 3.5 MHz). Click at the pairs one above the other at 2.5–3.7 cm, and look at them in the magnifier. There are 2, 1 and 0.5 mm between the wires. Which do you see as two?", "The pairs 2 and 1 mm apart show as two, the 0.5 mm pair merges. Axial resolution is half the pulse length. The pulse is 2 cycles long, so it is one wavelength: 0.44 mm at 3.5 MHz. In the image it takes a little more before a dark gap shows between the wires."],
        ["Higher and lower frequency", "Switch to Linear at 10 MHz, and look at the same pairs. And with the curved probe at 2 MHz?", "At 10 MHz the wavelength is 0.15 mm, so all three pairs show as two. At 2 MHz it is 0.77 mm, and only the 2 mm pair shows as two. A higher frequency gives a shorter pulse and better axial resolution."],
        ["Does focus help?", "Move the Focus depth up and down. Does it change the axial resolution?", "No. Axial resolution depends only on the pulse length, that is on the frequency, and it is the same in the whole image. Focus changes the beam's width: the lateral resolution."],
      ]],
      ["Focus and lateral resolution", [
        ["The column of wires", "Reset all. Look at the column of wires on the left. Where are the wires short dots, and where are they lines?", "Around the focus at 6 cm the wires are short dots. Above and especially below the focus they are wider lines, because the beam is wider there. A wire is drawn as wide as the beam. The yellow drawing shows the sent beam: narrowest at the focus."],
        ["Focus at what you want to see", "Click at the lowest side-by-side pairs, so the Measuring depth is 13 cm. Which pairs show as two? Then move the Focus depth down to 13 cm.", "With the focus at 6 cm the beam is 2.3 mm wide at 13 cm, and none of the pairs clearly shows as two. With the focus at 13 cm it is 1.7 mm, and the 3 mm pair shows as two. Put the focus at what you want to see, or just below."],
        ["Frequency and width", "Curved, Focus depth 6 cm, Measuring depth 9 cm. Compare 2 and 5 MHz.", "At 2 MHz the beam is 2.3 mm wide, and none of the pairs shows as two. At 5 MHz it is 1.1 mm, and the 3 and 2 mm pairs show as two. The beam can be gathered narrower when the wavelength is shorter. So a higher frequency gives better resolution both axially and laterally."],
        ["The phased probe", "Switch to Phased (2.5 MHz), and set the Measuring depth to 13 cm. How wide is the beam, and which pairs show as two?", "The beam is 3.5 mm wide, and none of the pairs show as two, not even 3 mm. The probe is small, so the beam cannot be gathered as narrow at depth. That is the price of being able to see between the ribs."],
      ]],
      ["Slice thickness", [
        ["Small cysts", "Reset all, and set the Measuring depth to 7 cm. Look at the three cysts (2, 4 and 6 mm). Are they equally black?", "No. The 6 mm cyst is black, the 4 mm one is dark, and the 2 mm one is almost like the tissue. The slice is 2.3 mm thick at 7 cm, so for the small cyst most of the slice lies in the tissue in front and behind. The echoes from there fill the cyst in."],
        ["The lens", "Look at the top cysts at 1.6 cm, first with the curved probe and then with the linear one (10 MHz). What is the difference?", "With the curved probe the slice is 3.3 mm thick at 1.6 cm, so the cysts are filled with grey echoes. The linear probe's lens gathers the slice at about 2 cm, where it is only 0.7 mm thick: all three cysts are black. The slice thickness is fixed for the probe. The focus knob does not change it."],
        ["In the clinic", "Why can a small cyst look like something solid? What can you do?", "If the slice is thicker than the cyst, echoes from the tissue beside it fill it in, so it looks grey. Use the highest frequency that reaches down, put the cyst at the depth where the slice is thinnest, and turn the probe 90° so you see it in both planes. Harmonics also help."],
      ]],
      ["Contrast", [
        ["Weak differences", "Reset all, and set the Measuring depth to 11 cm. Can you see the two discs? The left one is 3 dB darker than the tissue, the right one 6 dB brighter.", "The bright disc shows, the dark one is hard to tell from the grain. The grain (speckle) itself varies more than 3 dB, so small differences in echo drown. That is called contrast resolution. A narrow beam and few side lobes help, for example harmonics."],
      ]],
      ["Frame rate", [
        ["Focal zones", "Reset all. Set Focal zones to 1, 2 and 3. What happens to the frame rate and to the column of wires?", "The frame rate falls from 43 to 21 and 14 frames per second, because each line is sent once per focal zone. In return the wires are short dots over a larger area. For what moves (heart, foetus, vessels), one focal zone is often best."],
        ["Depth", "Set Depth to 7 cm and then to 14 cm. What happens to the frame rate?", "At 7 cm it is 86 frames per second, at 14 cm 43. The sound must reach down and back before the next line can be sent, so twice the depth gives half as many frames. Do not use more depth than you need."],
      ]],
      ["Harmonics", [
        ["Harmonics on", "Reset all, and set the Measuring depth to 7 cm. Turn Harmonics on. What happens to the beam, the cysts and the reach?", "The beam gets narrower (1.0 → 0.7 mm at 7 cm), the slice thinner, and the cysts darker, because there are fewer side lobes. But the reach falls from 20 to 13 cm, because the harmonic echo is weak. Harmonics are used a lot in the abdomen, for example for the gallbladder and cysts."],
        ["Sent and received", "Deeper level: Look at the graph. The thin dashed curve is the sent beam, the solid one is sent and received together. Why is the total narrower far from the focus?", "When the echoes come back, the scanner focuses them at each depth separately (dynamic receive focus): it delays the signals from the elements so they fit the depth the echo comes from. The sent beam has only one focus per zone. That is why the total beam is narrower than the sent one, especially far from the focus.", { deep: true }],
        ["Deep cysts", "Deeper level: Reset all, and set the Measuring depth to 15 cm. Compare the 6 mm cyst with and without harmonics.", "Without harmonics the slice is 5.6 mm thick at 15 cm, almost as thick as the cyst, so it is grey (−7 dB). With harmonics the slice is 4.2 mm, and the cyst is darker (−10 dB). At depth even large cysts are hard to see as black. Choose the focus and the probe after what you are looking for.", { deep: true }],
      ]],
    ],
  },
};

const $ = id => document.getElementById(id);
let M = PM.model(S);
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
const mm = cm => fmt(cm * 10, cm * 10 < 1 ? 2 : 1);           // a length in cm shown in mm

// ---- fixed random scatterers (complex) and electronic noise, one per line and range step, made once ----
const NL = PM.NL, NRMAX = 2100;
const RE = new Float32Array(NL * NRMAX), IM = new Float32Array(NL * NRMAX), NOISE = new Float32Array(NL * NRMAX);
{
  let seed = 31;
  const rnd = () => { seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t ^= t + Math.imul(t ^ t >>> 7, 61 | t); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  for (let i = 0; i < NL * NRMAX; i++) {
    const r = Math.sqrt(-Math.log(rnd() + 1e-9)), a = 2 * Math.PI * rnd();
    RE[i] = r * Math.cos(a); IM[i] = r * Math.sin(a); NOISE[i] = -Math.log(rnd() + 1e-9);
  }
}

// ---- the echo power along the lines (NL x NR), worked out again only when something that changes it changes ----
let ENV = null, NR = 0, DZ = 0.01, KEY = "";
function field() {
  const key = [S.probe, S.f, S.depth, S.focus, S.zones, S.harm].join("|");
  if (key === KEY) return;
  KEY = key;
  const G = PM.geom(S), P = G.P, B = PM.beam(S);
  DZ = P.dz; NR = Math.min(NRMAX, Math.ceil(S.depth / DZ) + 1);
  const ar = new Float32Array(NL * NR), ai = new Float32Array(NL * NR);
  // the phantom's scatter where each line meets it (the slice thickness fills small cysts in)
  for (let r = 0; r < NR; r++) {
    const rr = (r + 0.5) * DZ, e = B.e(rr), g = 10 ** (B.fg(rr) / 20);
    for (let l = 0; l < NL; l++) {
      const [x, z] = G.pos(l, rr), a = Math.sqrt(PM.tissue(x, z, e)) * g, o = r * NL + l;
      ar[o] = a * RE[o]; ai[o] = a * IM[o];
    }
  }
  // along the line: a 2-cycle pulse, half its length on the screen, with the phase
  const sz = PM.axial(S) / 2.355, mz = Math.max(1, Math.ceil(3 * sz / DZ)), lamCm = PM.lam(S);
  const kr = [], ki = []; let nz = 0;
  for (let m = -mz; m <= mz; m++) { const g = Math.exp(-0.5 * (m * DZ / sz) ** 2), ph = 4 * Math.PI * m * DZ / lamCm; kr.push(g * Math.cos(ph)); ki.push(g * Math.sin(ph)); nz += g * g; }
  const br = new Float32Array(NL * NR), bi = new Float32Array(NL * NR);
  for (let j = 0; j < NR; j++) for (let l = 0; l < NL; l++) {
    let sr = 0, si = 0;
    for (let m = -mz; m <= mz; m++) {
      const jj = j + m; if (jj < 0 || jj >= NR) continue;
      const o = jj * NL + l, a = ar[o], b = ai[o], c = kr[m + mz], d = ki[m + mz];
      sr += a * c - b * d; si += a * d + b * c;
    }
    br[j * NL + l] = sr; bi[j * NL + l] = si;
  }
  // across the lines: the beam as wide as it is at this range; then a wide weak haze from the side lobes
  ENV = new Float32Array(NL * NR);
  const row = new Float32Array(NL), cum = new Float64Array(NL + 1), side = 10 ** (PM.side(S) / 10);
  for (let j = 0; j < NR; j++) {
    const rr = (j + 0.5) * DZ, sl = Math.min(20, B.w(rr) / 2.355 / G.spacing(rr)), mx = Math.max(1, Math.ceil(3 * sl));
    const kx = []; let nx = 0;
    for (let m = -mx; m <= mx; m++) { const g = Math.exp(-0.5 * (m / Math.max(0.3, sl)) ** 2); kx.push(g); nx += g * g; }
    for (let l = 0; l < NL; l++) {
      let sr = 0, si = 0;
      for (let m = -mx; m <= mx; m++) { const ll = clamp(l + m, 0, NL - 1), o = j * NL + ll; sr += br[o] * kx[m + mx]; si += bi[o] * kx[m + mx]; }
      row[l] = (sr * sr + si * si) / (nz * nx);
    }
    const hw = Math.max(2, Math.round(6 * sl));
    cum[0] = 0; for (let l = 0; l < NL; l++) cum[l + 1] = cum[l] + row[l];
    for (let l = 0; l < NL; l++) {
      const a = Math.max(0, l - hw), b = Math.min(NL, l + hw + 1);
      ENV[j * NL + l] = row[l] + side * (cum[b] - cum[a]) / (b - a);
    }
  }
  // the wires: thin, so each gives the beam's own spot (its power), WIRE_DB over the gel's speckle at its peak
  for (const [x, z] of PM.WIRES) {
    const [lf, rr] = G.inv(x, z), rf = rr / DZ - 0.5;
    if (lf < -2 || lf > NL + 1 || rf < 0 || rf > NR - 1) continue;
    const sl = Math.max(0.3, Math.min(20, B.w(rr) / 2.355 / G.spacing(rr))), wp = 10 ** ((PM.WIRE_DB + B.fg(rr)) / 10);
    const ml = Math.ceil(3 * sl), mr = Math.ceil(3 * sz / DZ);
    for (let j = Math.max(0, Math.round(rf) - mr); j <= Math.min(NR - 1, Math.round(rf) + mr); j++) {
      const ga = Math.exp(-((((j - rf) * DZ) / sz) ** 2));
      for (let l = Math.max(0, Math.round(lf) - ml); l <= Math.min(NL - 1, Math.round(lf) + ml); l++) ENV[j * NL + l] += wp * ga * Math.exp(-(((l - lf) / sl) ** 2));
    }
  }
  for (let i = 0; i < ENV.length; i++) ENV[i] = 10 * Math.log10(ENV[i] + 1e-12);
}

// ---- the image: the automatic depth gain takes back the attenuation, up to a ceiling for the noise ----
const MID = -5, DR = 60, TGC_TOP = -14;
function shownDb(l, r) {
  const rr = (r + 0.5) * DZ, att = 2 * PM.ALPHA * S.f * PM.attK(S) * rr, gain = Math.min(att, TGC_TOP - PM.NOISE_DB);
  const noise = 10 ** ((PM.NOISE_DB + gain) / 10) * NOISE[r * NL + l];
  return 10 * Math.log10(10 ** ((ENV[r * NL + l] - att + gain) / 10) + noise);
}
const grey = db => clamp(0.5 + (db - MID) / DR, 0, 1);
// the image's extent in cm, and where it sits on the canvas
function extent() {
  const G = PM.geom(S), P = G.P, half = G.half(S.depth);
  const top = S.probe === "curved" ? P.R * (Math.cos(Math.PI * P.angle / 360) - 1) : 0;
  return { G, half, top, bottom: S.depth };
}
function imgRect(W, H) {
  const E = extent(), wcm = 2 * E.half, hcm = E.bottom - E.top;
  const sc = Math.min((W - 130) / wcm, (H - 10) / hcm), w = wcm * sc, h = hcm * sc;
  return { E, sc, x0: (W - w) / 2, y0: 5, w, h, X: x => (W - w) / 2 + (x + E.half) * sc, Y: z => 5 + (z - E.top) * sc };
}
let BUF = null, GREY = null;
function drawImg() {
  const cv = $("img"), [ctx, W, H] = fit(cv);
  ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H);
  field();
  const R = imgRect(W, H), G = R.E.G;
  GREY = new Uint8ClampedArray(NL * NR);
  for (let r = 0; r < NR; r++) for (let l = 0; l < NL; l++) GREY[r * NL + l] = 255 * grey(shownDb(l, r));
  const bw = Math.max(2, Math.round(Math.min(560, R.w * 1.5))), bh = Math.max(2, Math.round(bw * R.h / R.w));
  if (!BUF) BUF = document.createElement("canvas");
  BUF.width = bw; BUF.height = bh;
  const bx = BUF.getContext("2d"), id = bx.createImageData(bw, bh), d = id.data;
  for (let py = 0; py < bh; py++) {
    const z = R.E.top + (py + 0.5) / bh * (R.E.bottom - R.E.top);
    for (let px = 0; px < bw; px++) {
      const x = -R.E.half + (px + 0.5) / bw * 2 * R.E.half, o = 4 * (py * bw + px);
      const v = sampleAt(G, x, z);
      if (v < 0) { d[o + 3] = 0; continue; }
      d[o] = v; d[o + 1] = v; d[o + 2] = v; d[o + 3] = 255;
    }
  }
  bx.putImageData(id, 0, 0);
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(BUF, R.x0, R.y0, R.w, R.h);
  overlays(ctx, W, H, R);
}
// grey level (0..255) at a point in cm, from the lines; -1 outside the image
function sampleAt(G, x, z) {
  const [lf, rr] = G.inv(x, z), rf = rr / DZ - 0.5;
  if (lf < -0.5 || lf > NL - 0.5 || rf < 0 || rr > S.depth) return -1;
  const l0 = clamp(Math.floor(lf), 0, NL - 1), l1 = Math.min(NL - 1, l0 + 1), r0 = clamp(Math.floor(rf), 0, NR - 1), r1 = Math.min(NR - 1, r0 + 1);
  const tl = clamp(lf - l0, 0, 1), tr = clamp(rf - r0, 0, 1);
  return (GREY[r0 * NL + l0] * (1 - tl) + GREY[r0 * NL + l1] * tl) * (1 - tr) + (GREY[r1 * NL + l0] * (1 - tl) + GREY[r1 * NL + l1] * tl) * tr;
}
// the magnifier: a square of ZOOM cm around the clicked place, drawn large
const ZOOM = 2.6;
let ZBUF = null;
function drawZoom() {
  const cv = $("zoom"), [ctx, W, H] = fit(cv), G = PM.geom(S), mut = css("--muted") || "#8a93a6";
  ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H);
  const side = Math.min(W - 40, H - 8), x0 = (W - side) / 2, y0 = 4, n = Math.max(2, Math.round(side * 1.5));
  if (!ZBUF) ZBUF = document.createElement("canvas");
  ZBUF.width = n; ZBUF.height = n;
  const bx = ZBUF.getContext("2d"), id = bx.createImageData(n, n), d = id.data;
  for (let py = 0; py < n; py++) for (let px = 0; px < n; px++) {
    const v = sampleAt(G, S.mx - ZOOM / 2 + (px + 0.5) / n * ZOOM, S.mdepth - ZOOM / 2 + (py + 0.5) / n * ZOOM), o = 4 * (py * n + px);
    if (v < 0) { d[o + 3] = 0; continue; }
    d[o] = v; d[o + 1] = v; d[o + 2] = v; d[o + 3] = 255;
  }
  bx.putImageData(id, 0, 0);
  ctx.imageSmoothingEnabled = true; ctx.drawImage(ZBUF, x0, y0, side, side);
  // a 5 mm scale bar
  const sc = side / ZOOM, bxl = x0 + 8, byl = y0 + side - 10;
  ctx.fillStyle = "#fff"; ctx.fillRect(bxl, byl, 0.5 * sc, 2);
  text(ctx, "5 mm", bxl, byl - 4, "#fff", "left", 10, "--mono");
  text(ctx, `${fmt(S.mdepth, 1)} cm`, x0 + side - 6, y0 + 14, mut, "right", 10, "--mono");
}
function overlays(ctx, W, H, R) {
  const L = T[S.lang], Lb = L.labels, ink = "rgba(255,255,255,.85)", amber = css("--amber") || "#f0b450";
  const xr = R.x0 + R.w;
  // depth scale on the right
  ctx.strokeStyle = ink; ctx.lineWidth = 1;
  const every = S.depth > 10 ? 2 : 1;
  for (let z = 0; z <= S.depth + 1e-9; z += 0.5) {
    const y = R.Y(z), whole = Math.abs(z - Math.round(z)) < 1e-6;
    ctx.beginPath(); ctx.moveTo(xr + 3, y); ctx.lineTo(xr + (whole ? 10 : 6), y); ctx.stroke();
    if (whole && Math.round(z) % every === 0) text(ctx, String(z), xr + 13, y + 4, ink, "left", 11, "--mono");
  }
  text(ctx, "cm", xr + 13, R.Y(0) + 14, ink, "left", 10, "--mono");
  // the focus: triangles on the right
  ctx.fillStyle = amber;
  for (const z of M.foci) { const y = R.Y(z); ctx.beginPath(); ctx.moveTo(xr + 2, y); ctx.lineTo(xr - 6, y - 5); ctx.lineTo(xr - 6, y + 5); ctx.closePath(); ctx.fill(); }
  // grey scale on the left
  const gx = R.x0 - 26, gt = R.Y(0) + 6, gh = Math.min(140, R.h * 0.35);
  for (let k = 0; k < gh; k++) { const v = Math.round(255 * (1 - k / gh)); ctx.fillStyle = `rgb(${v},${v},${v})`; ctx.fillRect(gx, gt + k, 10, 1); }
  ctx.strokeStyle = "rgba(255,255,255,.4)"; ctx.strokeRect(gx - 0.5, gt - 0.5, 11, gh + 1);
  // the sent beam down the middle, at its true width
  if (S.beam) {
    const B = PM.beam(S), pts = [];
    for (let z = 0.05; z <= S.depth; z += 0.05) pts.push([z, Math.min(B.wtx(z), PM.PROBES[S.probe].DAP) / 2]);
    ctx.strokeStyle = "rgba(240,180,80,.85)"; ctx.lineWidth = 1.2;
    for (const sgn of [-1, 1]) { ctx.beginPath(); pts.forEach(([z, h], k) => { const X = R.X(sgn * h), Y = R.Y(z); k ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); }); ctx.stroke(); }
    ctx.lineWidth = 1;
  }
  // the measuring depth
  ctx.setLineDash([4, 4]); ctx.strokeStyle = "rgba(111,211,224,.8)"; ctx.beginPath();
  for (let l = 0; l < NL; l += 4) { const [x, z] = R.E.G.pos(l, S.mdepth); l ? ctx.lineTo(R.X(x), R.Y(z)) : ctx.moveTo(R.X(x), R.Y(z)); }
  ctx.stroke(); ctx.setLineDash([]);
  const zh = ZOOM / 2; ctx.strokeStyle = "rgba(111,211,224,.9)"; ctx.strokeRect(R.X(S.mx - zh), R.Y(S.mdepth - zh), ZOOM * R.sc, ZOOM * R.sc);
  text(ctx, `${fmt(S.f, 1)} MHz${S.harm ? " H" : ""}`, xr - 8, R.y0 + 14, ink, "right", 11, "--mono");
  if (!S.names) return;
  const PH = PM.PH, G = R.E.G;
  const inside = (x, z) => { const [lf, rr] = G.inv(x, z); return lf > 2 && lf < NL - 3 && rr > 0.2 && rr < S.depth - 0.2; };
  const lab = (s, x, z, align = "left") => { if (!inside(x, z)) return; label(ctx, s, R.X(x), R.Y(z), ink, align); };
  lab(Lb.column, PH.column.x - 0.15, 3.5, "right");
  lab(Lb.axial, PH.axial.x + 0.25, 3.1);
  lab(Lb.lateral, 1.5, PH.lateral.z[S.depth > 10 ? 1 : 0] + 0.1);
  lab(Lb.cysts, 1.55, PH.cysts.z[1] + 0.1);
  lab(Lb.contrast, PH.contrast.x[0] - 0.3, PH.contrast.z - 0.75);
  if (S.beam) lab(Lb.beam, 0.3, Math.min(1.0, S.depth / 8));
}
function label(ctx, s, x, y, col, align = "left") {
  ctx.font = `12px ${css("--body")}`; ctx.lineWidth = 3; ctx.strokeStyle = "rgba(0,0,0,.75)"; ctx.textAlign = align; ctx.strokeText(s, x, y); text(ctx, s, x, y, col, align, 12);
}

// ---- the graph: the beam's width, the slice thickness and the axial resolution against depth ----
function drawGraph() {
  const cv = $("graph"), [ctx, W, H] = fit(cv), L = T[S.lang], Lb = L.labels;
  const mut = css("--muted") || "#8a93a6", fg = css("--fg") || "#e8ecf3", line = css("--line") || "#2a3142", amber = css("--amber") || "#f0b450";
  const B = PM.beam(S), ax = PM.axial(S), deep = S.level === "deep";
  let top = 0;
  for (let z = 0.2; z <= S.depth; z += 0.1) top = Math.max(top, B.w(z), B.e(z), deep ? Math.min(B.wtx(z), 1) : 0);
  const YMAX = [1, 2, 4, 6, 8, 10, 15].find(v => v >= top * 10) || 15;
  const x0 = 42, x1 = W - 12, y0 = 22, y1 = H - 34;
  const X = z => x0 + z / S.depth * (x1 - x0), Y = v => y1 - clamp(v * 10 / YMAX, 0, 1) * (y1 - y0);
  // noise below the reach
  if (M.pen < S.depth) { ctx.fillStyle = "rgba(224,96,90,.12)"; ctx.fillRect(X(M.pen), y0, x1 - X(M.pen), y1 - y0); }
  ctx.strokeStyle = line; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0, y1); ctx.lineTo(x1, y1); ctx.stroke();
  const curve = (fn, col, dash, lw) => {
    ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.setLineDash(dash); ctx.beginPath();
    for (let z = 0.1, k = 0; z <= S.depth + 1e-9; z += 0.05, k++) { const X0 = X(z), Y0 = Y(fn(z)); k ? ctx.lineTo(X0, Y0) : ctx.moveTo(X0, Y0); }
    ctx.stroke(); ctx.setLineDash([]); ctx.lineWidth = 1;
  };
  if (deep) curve(z => B.wtx(z), mut, [2, 3], 1);
  curve(B.e, "#b48cf0", [6, 4], 1.6);
  curve(() => ax, amber, [], 1.6);
  curve(B.w, "#6fd3e0", [], 2.2);
  // the focus and the measuring depth
  ctx.fillStyle = amber;
  for (const z of M.foci) { const x = X(z); ctx.beginPath(); ctx.moveTo(x, y0 - 2); ctx.lineTo(x - 5, y0 - 10); ctx.lineTo(x + 5, y0 - 10); ctx.closePath(); ctx.fill(); }
  ctx.strokeStyle = "rgba(111,211,224,.7)"; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(X(S.mdepth), y0); ctx.lineTo(X(S.mdepth), y1); ctx.stroke(); ctx.setLineDash([]);
  // legend
  const items = [[Lb.lat, "#6fd3e0", []], [Lb.slice, "#b48cf0", [6, 4]], [Lb.ax, amber, []]].concat(deep ? [[Lb.tx, mut, [2, 3]]] : []);
  let lx = x0 + 8;
  ctx.font = `11px ${css("--body")}`;
  for (const [s, col, dash] of items) {
    ctx.strokeStyle = col; ctx.setLineDash(dash); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(lx, y0 + 10); ctx.lineTo(lx + 16, y0 + 10); ctx.stroke(); ctx.setLineDash([]); ctx.lineWidth = 1;
    text(ctx, s, lx + 20, y0 + 14, fg, "left", 11); lx += 28 + ctx.measureText(s).width + 10;
  }
  // axes
  for (let v = 0; v <= YMAX; v += YMAX <= 2 ? 0.5 : YMAX <= 6 ? 1 : 2) text(ctx, fmt(v, YMAX <= 2 ? 1 : 0), x0 - 6, Y(v / 10) + 4, mut, "right", 10, "--mono");
  ctx.save(); ctx.translate(11, (y0 + y1) / 2); ctx.rotate(-Math.PI / 2); text(ctx, Lb.mm, 0, 0, mut, "center", 11); ctx.restore();
  const dStep = S.depth > 10 ? 2 : 1;
  for (let z = 0; z <= S.depth; z += dStep) text(ctx, String(z), X(z), y1 + 14, mut, "center", 10, "--mono");
  text(ctx, `${Lb.depthAx} (cm)`, (x0 + x1) / 2, y1 + 28, mut, "center", 11);
}

// ---- numbers and what you can see ----
function metrics() {
  const L = T[S.lang], m = M, d = fmt(S.mdepth, 1), out = [];
  if (S.level === "deep") out.push(["", "lam", `${mm(m.lam)} mm`, L.f.lam]);
  out.push(["", "axial", `${mm(m.axial)} mm`, L.f.axial]);
  out.push(["", "lateral", `${mm(m.w)} mm`, L.f.lateral(d)]);
  out.push(["", "slice", `${mm(m.e)} mm`, L.f.slice(d)]);
  out.push([m.frame < 20 ? "err" : "", "frame", `${fmt(m.frame, 0)} ${L.unit.fps}`, L.f.frame(m.lines, S.zones)]);
  out.push([m.pen < S.depth ? "err" : "ok", "pen", `${fmt(m.pen, 0)} cm`, L.f.pen(m.pen, S.depth)]);
  return out;
}
function observations() {
  const L = T[S.lang], E = L.see, out = [], PH = PM.PH, near = z => Math.abs(S.mdepth - z) <= 0.7 && z < M.pen;
  const list = a => a.map(v => String(v).replace(".", L.dec)).join(S.lang === "da" ? " og " : " and ");
  const latRow = PH.lateral.z.find(near);
  if (latRow !== undefined) {
    const yes = PH.lateral.gap.filter((g, k) => M.latRes[k]).slice().sort((a, b) => b - a), no = PH.lateral.gap.filter((g, k) => !M.latRes[k]);
    out.push(yes.length ? E.lat.replace("{d}", fmt(latRow, 0)).replace("{yes}", list(yes)).replace("{no}", no.length ? E.latNo.replace("{no}", list(no)) : "")
                        : E.latNone.replace("{d}", fmt(latRow, 0)).replace("{w}", mm(M.w)));
  }
  if (S.mdepth >= 2 && S.mdepth <= 4.2) {
    const yes = PH.axial.gap.filter((g, k) => M.axRes[k]), no = PH.axial.gap.filter((g, k) => !M.axRes[k]);
    if (yes.length) out.push(E.ax.replace("{yes}", list(yes)).replace("{no}", no.length ? E.axNo.replace("{no}", list(no)) : "").replace("{a}", mm(M.axial)));
  }
  const cystRow = PH.cysts.z.find(near);
  if (cystRow !== undefined) {
    const word = db => db < -20 ? E.dark : db < -10 ? E.dim : db < -4 ? E.grey : E.light;
    out.push(E.cyst.replace("{d}", fmt(cystRow, 1)).replace("{e}", mm(M.e)).replace("{c2}", word(M.cyst[0])).replace("{c4}", word(M.cyst[1])));
  }
  if (near(PH.contrast.z)) out.push(E.contrast);
  if (S.zones > 1) out.push(E.zones.replaceAll("{z}", S.zones).replace("{fr}", fmt(M.frame, 0)));
  const fNear = Math.min(...M.foci.map(z => Math.abs(z - S.mdepth)));
  if (fNear > 3) out.push(E.far.replace("{f}", fmt(M.foci[0], 1)).replace("{w}", mm(M.w)).replace("{w0}", mm(PM.beam(S).w(M.foci[0]))));
  if (S.harm) out.push(E.harm);
  if (M.pen < S.depth) out.unshift(E.noise.replace("{p}", fmt(M.pen, 0)).replace("{f}", fmt(S.f, 1)).replace("{h}", S.harm ? (S.lang === "da" ? " med harmoniske" : " with harmonics") : ""));
  return out.length ? out.slice(0, 2) : [E.base];
}
function readouts() {
  const L = T[S.lang], pinned = PIN ? PIN.vals : null;
  $("readout").innerHTML = metrics().map(([cls, key, value, foot]) =>
    `<div class="metric ${cls}"><div class="k">${L.k[key]}</div><div class="v">${value}</div><div class="f">${foot}</div>` +
    (pinned && pinned[key] !== undefined ? `<div class="p">${L.saved}: ${pinned[key]}</div>` : "") + `</div>`).join("");
  $("t-seen").textContent = L.seen; $("seen").textContent = observations().join(" ");
  $("pin").textContent = pinned ? L.unpin : L.pin;
}
$("pin").onclick = () => {
  PIN = PIN ? null : { vals: Object.fromEntries(metrics().map(([, key, value]) => [key, value])) };
  readouts();
};

// ---- controls ----
function sliders() {
  const P = PM.PROBES[S.probe];
  return {
    f: [P.f[0], P.f[1], 0.5, v => `${fmt(v, 1)} MHz`],
    depth: [P.depth[0], P.depth[1], 1, v => `${v} cm`],
    focus: [1, S.depth - 0.5, 0.5, v => `${fmt(v, 1)} cm`],
    mdepth: [0.5, S.depth, 0.1, v => `${fmt(v, 1)} cm`],
  };
}
function buildControls() {
  const L = T[S.lang], C = L.ctl, box = $("controls"), SL = sliders();
  const help = k => S.level === "grund" && L.help[k] ? `<p class="help">${L.help[k]}</p>` : "";
  const seg = (k, opts) => `<div class="ctl"><label><span>${C[k]}</span><span></span></label><div class="seg">` +
    opts.map(([val, lbl]) => `<button data-k="${k}" data-v="${val}" aria-pressed="${String(S[k]) === String(val)}">${lbl}</button>`).join("") +
    `</div>${help(k)}</div>`;
  const slider = k => {
    const [mn, mx, st, f] = SL[k];
    return `<div class="ctl"><label for="s-${k}"><span>${C[k]}</span><span id="o-${k}">${f(S[k])}</span></label>` +
      `<input type="range" id="s-${k}" min="${mn}" max="${mx}" step="${st}" value="${S[k]}">${help(k)}</div>`;
  };
  const grp = k => `<h3 class="grp">${L.grp[k]}</h3>`;
  const onoff = [["false", C.off], ["true", C.on]];
  box.innerHTML = grp("probe") + seg("probe", [["linear", C.linear], ["curved", C.curved], ["phased", C.phased]]) + slider("f") + seg("harm", onoff) +
    grp("image") + slider("depth") + seg("beam", onoff) + seg("names", onoff) +
    grp("focus") + slider("focus") + seg("zones", [["1", "1"], ["2", "2"], ["3", "3"]]) +
    grp("measure") + slider("mdepth") +
    `<div class="ctl last"><button class="reset" id="reset">${C.reset}</button></div>`;
  box.querySelectorAll("button[data-k]").forEach(b => b.onclick = () => {
    const k = b.dataset.k, v = b.dataset.v;
    S[k] = v === "true" ? true : v === "false" ? false : k === "zones" ? +v : v;
    if (k === "probe") {
      const P = PM.PROBES[S.probe];
      S.f = P.f[2]; S.depth = P.depth[2]; S.focus = P.focus; S.mdepth = Math.min(S.mdepth, S.depth);
    }
    buildControls(); update();
  });
  for (const k of Object.keys(SL)) {
    const el = $(`s-${k}`); if (!el) continue;
    el.oninput = () => {
      S[k] = +el.value; $(`o-${k}`).textContent = SL[k][3](+el.value);
      if (k === "depth") {                                           // the focus and the measuring depth stay inside the image
        S.focus = Math.min(S.focus, S.depth - 0.5); S.mdepth = Math.min(S.mdepth, S.depth);
        for (const kk of ["focus", "mdepth"]) { const e2 = $(`s-${kk}`), s2 = sliders()[kk]; e2.max = s2[1]; e2.value = S[kk]; $(`o-${kk}`).textContent = s2[3](S[kk]); }
      }
      updateSoon();
    };
  }
  $("reset").onclick = () => { const keep = { lang: S.lang, level: S.level }; Object.assign(S, clone(START), keep); PIN = null; buildControls(); update(); };
}
$("img").addEventListener("click", e => {
  const r = $("img").getBoundingClientRect(), R = imgRect(r.width, r.height);
  const z = (e.clientY - r.top - R.y0) / R.sc + R.E.top, x = (e.clientX - r.left - R.x0) / R.sc - R.E.half;
  if (z < 0 || z > S.depth || Math.abs(x) > R.E.half) return;
  S.mx = +x.toFixed(2);
  S.mdepth = +clamp(z, 0.5, S.depth).toFixed(1);
  const el = $("s-mdepth"); if (el) { el.value = S.mdepth; $("o-mdepth").textContent = sliders().mdepth[3](S.mdepth); }
  update();
});

// ---- tasks and text (same pattern as the other simulators) ----
function taskList() {
  const out = [];
  T[S.lang].groups.forEach(([g, items], gi) => {
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
  for (const k of ["title", "sub", "image", "tasks", "model", "foot", "privacy"]) set("t-" + k, L[k]);
  set("t-back", L.back); set("t-simtitle", L.simTitle); set("t-imgnote", L.imgNote); set("t-graph", L.graph); set("t-zoom", L.zoom); set("t-graphnote", L.note);
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
  if ($("img").getClientRects().length) { drawImg(); drawZoom(); drawGraph(); }
  readouts();
}
function update() { M = PM.model(S); render(); }
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
