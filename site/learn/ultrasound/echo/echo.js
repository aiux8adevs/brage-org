// Sound and echo simulator (ultrasound U1): the page. The numbers and the tissue live in model.js (EC). Here:
//   - the echo field: fixed random scatterers times the tissue's echo level, blurred by the pulse (downwards, with
//     the sound's phase, so close reflectors interfere) and by the beam (sideways), worked out in true depth;
//   - the image: each drawn depth is looked up at the true depth the sound came from (fat is slower), with the
//     noise the automatic depth gain lifts;
//   - the graph: the chosen line as an A-line (echo strength against time), with the pulse's shape;
//   - the numbers, the "what you can see" line, the tasks and the model text.

const START = { scene: "belly", f: 3.5, cycles: 2, depth: 12, fat: 1.5, cset: 1540, t: 65, x: -1.2, names: true };
const clone = o => JSON.parse(JSON.stringify(o));
const S = { lang: "da", level: "grund", ...clone(START) };

const T = {
  da: {
    title: "Lyd og ekko", sub: "Simulator: hvordan en lydpuls og dens ekkoer bliver til et gråtonebillede, og hvad frekvens, bølgelængde og lydens hastighed betyder for det, du ser.",
    simTitle: "Simulator: lyd og ekko", grund: "Grund", deep: "Fordybelse", back: "← Ultralyd",
    image: "Billedet", graph: "Én linje: ekkoerne over tid (A-linje)",
    note: "Ekkoernes styrke langs den valgte linje, tid hen ad. Lyst felt: ekkoer, der er kommet tilbage. Gråt felt: ekkoer, der endnu ikke er kommet. Øverst: dybden, skanneren tegner dem i. Til højre: pulsens form i samme målestok for alle frekvenser.",
    imgNote: "Simuleret billede, ikke et rigtigt skannerbillede. Klik i billedet for at vælge en linje.",
    tasks: "Opgaver", answer: "Vis svar", of: "af", prev: "Forrige opgave", next: "Næste opgave",
    model: "Sådan virker modellen", foot: "© 2026 Oliver Brage. Alle rettigheder forbeholdes.", privacy: "Privatliv",
    seen: "Det kan du se:", pin: "Gem tallene", unpin: "Fjern de gemte", saved: "gemt",
    grp: { scene: "Scene", probe: "Proben", patient: "Patienten", scanner: "Skanneren", time: "Pulsen" },
    ctl: { scene: "Scene", belly: "Lever", phantom: "Fantom", names: "Vis navne", on: "Til", off: "Fra",
           f: "Frekvens", cycles: "Svingninger i pulsen", depth: "Dybde", fat: "Fedtlag", cset: "Lydhastighed i skanneren",
           t: "Tid efter pulsen", x: "Linjens placering", reset: "Nulstil alt" },
    help: { scene: "Lever: hud, fedt, muskel og lever med cyste, vene, kalk og et hæmangiom. Fantom: et testobjekt med tråde og cylindre.",
            f: "Højere frekvens: kortere bølgelængde og skarpere billede, men lyden når ikke så dybt.",
            cycles: "Hvor mange svingninger proben sender i hver puls. Kort puls: skarpere i dybden.",
            depth: "Hvor dybt billedet går. Skanneren skal vente på ekkoerne fra bunden, før næste puls.",
            fat: "Lyden går langsommere i fedt (1450 m/s) end i andet blødt væv (1540 m/s).",
            cset: "Den hastighed, skanneren regner med, når den laver tid om til dybde.",
            t: "Hvor lang tid der er gået, siden pulsen blev sendt. Følg pulsen ned og ekkoet op.",
            x: "Hvilken linje kurven viser. Du kan også klikke i billedet." },
    k: { lam: "Bølgelængde", spl: "Pulslængde", pen: "Rækkevidde", line: "Tid pr. linje", fps: "Billeder pr. sekund", echo: "Ekko lige nu", shift: "Fejl i 10 cm" },
    f: { lam: f => `ved ${f} MHz i blødt væv`, spl: a => `skelner ting ${a} mm fra hinanden i dybden`, pen: (p, d) => p < d ? "billedet går dybere: støj forneden" : "når helt ned",
         line: p => `højst ${p} pulser pr. sekund`, fps: "128 linjer pr. billede", echo: z => `pulsen er nået ${z} cm ned`, echoEnd: "hele linjen er modtaget",
         shift: s => Math.abs(s) < 0.005 ? "tegnes på det rigtige sted" : s > 0 ? "tegnes for dybt" : "tegnes for højt" },
    see: {
      pulse: "Pulsen er nået {p} cm ned. Ekkoet, der kommer tilbage lige nu, er fra {e} cm: lyden skal både ned og op.",
      noise: "Under cirka {p} cm er der kun støj: ekkoerne er for svage ved {f} MHz. Vælg en lavere frekvens for at nå dybere.",
      fluid: "Linjen går gennem væske: der er intet, der kaster lyd tilbage, så den er sort (ekkofri). Væggen er lys.",
      calc: "Linjen rammer kalken: et meget kraftigt ekko, og næsten ingen lyd kommer forbi. Bag den er der skygge.",
      hem: "Linjen går gennem hæmangiomet: lysere end leveren omkring (hyperekkoisk).",
      fat: "Fedtet er mørkere end leveren (hypoekkoisk). Alt under fedtlaget tegnes {mm} mm for dybt, fordi lyden går langsommere i fedt.",
      pairs: "Trådparrene i 3 cm: du kan skelne {list}. Pulslængden er {spl} mm, så to ekkoer skal ligge mindst {ax} mm fra hinanden.",
      phFat: "Trådene under det fedtlignende lag står for dybt: tråden i 10 cm tegnes {mm} mm for dybt, fordi lyden går langsommere i laget.",
      pairsAll: "Alle tre trådpar i 3 cm kan skelnes: pulsen er kort ({spl} mm).",
      cset: "Skanneren regner med {c} m/s. {w}",
      csetFat: "Trådene i fedtlaget står nu rigtigt, men dem under står for højt. Der findes ikke én hastighed, der passer overalt.",
      csetOff: "Alt tegnes forkert i dybden, også uden fedt.",
      fps: "Billedet går {d} cm ned: {n} billeder pr. sekund. Mindre dybde giver flere billeder pr. sekund.",
      base: "Klik i billedet for at vælge en linje, og træk i Tid efter pulsen for at følge pulsen og ekkoet.",
    },
    labels: { skin: "hud", fat: "fedt", muscle: "muskel", liver: "lever", calc: "kalk", shadow: "skygge", vein: "vene", cyst: "cyste", hem: "hæmangiom",
              anech: "ekkofri", hypo: "hypoekkoisk", hyper: "hyperekkoisk", wires: "tråde hver 1 cm", pairs: "2 · 1 · 0,5 mm", fatlike: "fedtlignende lag",
              c1: "ekkofri", c2: "hypo", c3: "hyper", c4: "meget hyper", pulse: "puls", echo: "ekko", white: "stærkt ekko", black: "intet ekko" },
    dec: ",",
    modelText: `<p><b>Det hele er simuleret.</b> Billederne er regnet ud fra en enkel model. Der er ikke brugt rigtige ultralydsbilleder. Proben er lineær, og billedet er 5 cm bredt.</p>
<p><b>Puls og ekko.</b> Proben sender en kort puls og lytter. Et ekko fra dybden $d$ kommer tilbage efter $t = 2d/c$, fordi lyden skal både ned og op. Skanneren tegner ekkoet i dybden $c \\cdot t / 2$ med $c$ = 1540 m/s. Det giver 13 µs pr. cm. Først når ekkoerne fra bunden af billedet er kommet, kan næste puls sendes. Et billede har 128 linjer.</p>
<p><b>Bølgelængde og puls.</b> Bølgelængden er $\\lambda = c/f$: 0,44 mm ved 3,5 MHz og 0,15 mm ved 10 MHz. Pulsen har 2, 3 eller 5 svingninger, så pulslængden er $n \\lambda$. Et ekko varer lige så længe som pulsen. På skærmen fylder det den halve pulslængde, fordi lyden går frem og tilbage. To ekkoer, der ligger tættere end det, smelter sammen (aksial opløsning). Strålens bredde er sat til $0,5 + 4/f$ mm. Den kommer i emnet om proben.</p>
<p><b>Ekkoerne.</b> Vævet er tilfældigt fordelte små spredere, ganget med et ekkoniveau pr. væv. I forhold til leveren: hud +10 dB, fedt −14, muskel −8, leverkapsel +8, karvæg +10, cystevæg +4, hæmangiom +10, kalk +28, væske (cyste, vene) ingen ekkoer. Bag kalken når 25 dB mindre lyd ned (skygge). I fantomet: baggrund 0 dB, cylindre −60, −6, +6 og +15 dB og tynde tråde. Spredernes ekkoer blandes og giver det kornede mønster (speckle), der bliver finere ved højere frekvens.</p>
<p><b>Rækkevidde.</b> Lyden dæmpes 0,5 dB pr. cm pr. MHz hver vej. Skanneren skruer automatisk op for de dybe ekkoer, så billedet er jævnt, men dermed også for støjen fra elektronikken. Støjen ligger 70 dB under ekkoet fra blødt væv, så den når ekkoerne i cirka $70/f$ cm: 20 cm ved 3,5 MHz, 7 cm ved 10 MHz.</p>
<p><b>Lydens hastighed.</b> I fedt er den 1450 m/s, i resten 1540 m/s. Ekkoer under et fedtlag kommer derfor lidt senere og tegnes lidt for dybt: 6 % af fedtets tykkelse. I fordybelsen kan du ændre den hastighed, skanneren regner med.</p>
<p><b>Gråtoner.</b> Ekkoets styrke i dB vises fra sort til hvid over 60 dB omkring en fast mellemgrå.</p>
<p><b>Det er ikke med.</b> Forskellig dæmpning i væv (fx bagvedliggende forstærkning bag cysten), brydning, artefakter (de kommer i U5), fokusering og strålens form (U3), og hvordan lyden reflekteres ved grænseflader (impedans, U2). Tallene er typiske lærebogsværdier, ikke tal fra en bestemt skanner.</p>
<p>Kilder: Gibbs, Cole og Sassano, Ultrasound Physics and Technology (2009). Hoskins, Martin og Thrush, Diagnostic Ultrasound: Physics and Equipment, 3. udg. (2019). Kremkau, Sonography Principles and Instruments. Bushberg m.fl., The Essential Physics of Medical Imaging, kapitlet om ultralyd.</p>`,
    groups: [
      ["Puls og ekko", [
        ["Ned og op", "Tryk Nulstil alt. Tiden efter pulsen er 65 µs. Hvor langt er pulsen nået, og hvorfra kommer det ekko, der kommer tilbage lige nu?", "Pulsen er 10 cm nede. Ekkoet, der kommer tilbage nu, er fra 5 cm: lyden har brugt halvdelen af tiden på vejen ned og halvdelen på vejen op. Derfor regner skanneren med den halve tid, når den laver tid om til dybde."],
        ["Følg pulsen", "Træk Tid efter pulsen langsomt fra 0 og op. Hvornår kommer ekkoet fra forvæggen af cysten tilbage? Hvad kommer der fra væsken inde i cysten?", "Forvæggen ligger cirka 7 cm nede, så ekkoet kommer efter cirka 91 µs (13 µs pr. cm). Fra væsken kommer der intet: kurven er flad, til ekkoet fra bagvæggen kommer."],
        ["Fra linje til billede", "Se kurven under billedet. Klik på forskellige steder i billedet: i cysten, i kalken og i leveren. Hvordan hænger kurven sammen med gråtonerne?", "Kurven er én linje: ekkoernes styrke over tid. Billedet er 128 sådanne linjer side om side, hvor styrken er lavet om til lysstyrke. Stærkt ekko er hvidt, intet ekko er sort."],
        ["Dybde og hastighed", "Sæt Dybde til 16 cm og så til 6 cm. Hvad sker der med tiden pr. linje og antallet af billeder pr. sekund?", "Ved 16 cm tager en linje 208 µs, og der bliver 38 billeder pr. sekund. Ved 6 cm tager den 78 µs, og der bliver 100 billeder pr. sekund. Skanneren skal vente på ekkoerne fra bunden. Brug ikke mere dybde end nødvendigt, især når noget bevæger sig."],
      ]],
      ["Gråtoner og ekkogenicitet", [
        ["Sort væske", "Tryk Nulstil alt. Hvorfor er cysten og venen sorte, og hvorfor er kanten lys?", "Klar væske indeholder intet, der kaster lyd tilbage, så der kommer ingen ekkoer: ekkofri. Væggen er en grænse mellem to slags væv og giver et kraftigt ekko."],
        ["Lysere og mørkere", "Sammenlign fedtet, musklen, leveren og hæmangiomet. Hvilke ord bruger du om dem?", "Man beskriver i forhold til omgivelserne. Fedtet under huden er mørkere end leveren: hypoekkoisk. Hæmangiomet er lysere end leveren: hyperekkoisk. Noget med samme lysstyrke som omgivelserne er isoekkoisk."],
        ["Kalk", "Klik linjen ned gennem kalken. Hvad viser kurven, og hvad sker der under kalken?", "Et meget kraftigt ekko (hyperekkoisk), og bagved næsten ingenting: kalken kaster næsten al lyd tilbage, så der er skygge bag den. Skygger kommer du mere til i emnet om artefakter."],
        ["Fantomet", "Vælg Fantom. Beskriv de fire cylindre i 7 cm med ordene ekkofri, hypoekkoisk og hyperekkoisk.", "Fra venstre: ekkofri (sort, som væske), hypoekkoisk (lidt mørkere end baggrunden), hyperekkoisk (lidt lysere) og meget hyperekkoisk. Ordene beskriver lysstyrken, ikke hvad det er. Det er dit kliniske blik, der siger, om det er en cyste eller en tumor."],
        ["Fedt eller væske?", "Tryk Nulstil alt. Både fedtet under huden og cysten er mørke. Hvordan kan du se forskel?", "Fedtet er mørkegråt med små ekkoer og tynde lyse striber indeni: hypoekkoisk. Cysten er helt sort uden ekkoer indeni og har en skarp, lys væg: ekkofri. Mørk er ikke det samme som væske."],
        ["Kornene", "Se på leveren ved 2 MHz og ved 10 MHz. Hvad sker der med det kornede mønster?", "Kornene (speckle) bliver mindre ved højere frekvens. Mønsteret er ikke små strukturer i leveren, men ekkoer fra mange små spredere, der blandes. Derfor flytter det sig, når du flytter proben."],
      ]],
      ["Frekvens og bølgelængde", [
        ["Bølgelængden", "Sæt frekvensen til 2, 5 og 10 MHz. Hvad bliver bølgelængden, og hvad sker der med pulsen i hjørnet af kurven?", "0,77 mm, 0,31 mm og 0,15 mm. Jo højere frekvens, jo kortere bølgelængde og jo kortere puls. Lydens hastighed er den samme: 1540 m/s."],
        ["Tæt sammen", "Vælg Fantom, Dybde 6 cm og 2 MHz med 5 svingninger. Se på trådparrene i 3 cm (2, 1 og 0,5 mm fra hinanden). Hvilke kan du skelne? Prøv så 10 MHz med 2 svingninger.", "Ved 2 MHz og 5 svingninger er pulsen 3,9 mm lang, så kun parret med 2 mm kan skelnes. Ved 10 MHz og 2 svingninger er pulsen 0,3 mm, og alle tre par kan skelnes. En kort puls giver et skarpere billede i dybden."],
        ["Hvor dybt?", "Vælg Fantom og Dybde 16 cm. Sæt frekvensen til 3,5, 7 og 12 MHz. Hvor dybt kan du se trådene?", "Ved 3,5 MHz hele vejen ned. Ved 7 MHz til cirka 10 cm, ved 12 MHz kun til cirka 6 cm. Derunder er der kun støj. Lyden dæmpes mere ved høj frekvens."],
        ["Patient med meget fedt", "Vælg Lever, og sæt Fedtlag til 5 cm og Dybde til 16 cm. Se på cysten og hæmangiomet ved 7 MHz og så ved 3,5 MHz.", "Ved 7 MHz når lyden kun cirka 10 cm ned, så cysten og hæmangiomet forsvinder i støjen. Ved 3,5 MHz ser du dem igen. Med meget fedt ligger organerne dybere, og du må give lidt skarphed for at nå ned."],
        ["Vælg frekvensen", "Du skal skanne en lever på en voksen og en sene i hånden. Hvilken frekvens vælger du, og hvorfor?", "Leveren ligger dybt: 3 til 5 MHz, så lyden når ned. Senen ligger få millimeter under huden: 10 til 15 MHz, så billedet bliver skarpt. Vælg den højeste frekvens, der stadig når ned til det, du skal se."],
      ]],
      ["Lydens hastighed", [
        ["1540 m/s", "Vælg Fantom, og sæt Fedtlag til 0. Passer trådene med skalaen til højre?", "Ja: trådene ligger hver hele centimeter. Uden fedt går lyden 1540 m/s hele vejen, og det er den hastighed, skanneren regner med."],
        ["Et lag fedt", "Sæt Fedtlag til 4 cm. Hvor står tråden i 10 cm nu?", "Den tegnes i 10,25 cm: 2,5 mm for dybt. Lyden går langsommere i fedt, så ekkoet kommer senere, og skanneren tror, det kommer længere nede fra. Fejlen er lille, men den kan betyde noget, når du måler."],
        ["Mere fedt", "Vælg Lever, og sæt Fedtlag fra 1,5 til 5 cm. Hvad sker der med leveren, cysten og billedet?", "Alt rykker længere ned, fordi fedtet er tykkere. Fedtet er hypoekkoisk, og alt under det tegnes lidt for dybt (3 mm ved 5 cm fedt). Ved tykt fedt skal du ofte bruge en lavere frekvens for at nå ned."],
        ["Skannerens hastighed", "Fordybelse: Fantom med 4 cm fedt. Sæt Lydhastighed i skanneren til 1450 m/s. Står trådene nu rigtigt?", "Trådene i fedtlaget står rigtigt, men dem under står for højt, fordi skanneren nu regner med fedtets hastighed i alt vævet. Der findes ikke én hastighed, der passer overalt. Derfor bruger skannere 1540 m/s.", { deep: true }],
        ["Pulsens længde", "Fordybelse: Fantom, 3,5 MHz. Skift mellem 2, 3 og 5 svingninger. Hvad sker der med trådparrene og med kornene?", "Med 5 svingninger er pulsen 2,2 mm, så parret med 1 mm smelter sammen, og kornene bliver aflange i dybden. Med 2 svingninger er alt skarpere. En kort puls kræver en probe, der hurtigt holder op med at svinge (dæmpning i proben, emnet om proben).", { deep: true }],
      ]],
    ],
  },
  en: {
    title: "Sound and echo", sub: "Simulator: how a pulse of sound and its echoes become a grey-scale image, and what frequency, wavelength and the speed of sound mean for what you see.",
    simTitle: "Simulator: sound and echo", grund: "Basic", deep: "Deeper level", back: "← Ultrasound",
    image: "The image", graph: "One line: the echoes over time (A-line)",
    note: "The strength of the echoes along the chosen line, time across. Light area: echoes that have come back. Grey area: echoes that have not come yet. At the top: the depth the scanner draws them at. On the right: the pulse's shape, at the same scale for all frequencies.",
    imgNote: "Simulated image, not a real scanner image. Click in the image to choose a line.",
    tasks: "Tasks", answer: "Show answer", of: "of", prev: "Previous task", next: "Next task",
    model: "How the model works", foot: "© 2026 Oliver Brage. All rights reserved.", privacy: "Privacy",
    seen: "What you can see:", pin: "Save the numbers", unpin: "Remove saved", saved: "saved",
    grp: { scene: "Scene", probe: "The probe", patient: "The patient", scanner: "The scanner", time: "The pulse" },
    ctl: { scene: "Scene", belly: "Liver", phantom: "Phantom", names: "Show names", on: "On", off: "Off",
           f: "Frequency", cycles: "Cycles in the pulse", depth: "Depth", fat: "Fat layer", cset: "Speed of sound in the scanner",
           t: "Time after the pulse", x: "Position of the line", reset: "Reset all" },
    help: { scene: "Liver: skin, fat, muscle and liver with a cyst, a vein, a calcification and a haemangioma. Phantom: a test object with wires and cylinders.",
            f: "Higher frequency: shorter wavelength and a sharper image, but the sound does not reach as deep.",
            cycles: "How many cycles the probe sends in each pulse. A short pulse: sharper in depth.",
            depth: "How deep the image goes. The scanner must wait for the echoes from the bottom before the next pulse.",
            fat: "Sound moves more slowly in fat (1450 m/s) than in other soft tissue (1540 m/s).",
            cset: "The speed the scanner assumes when it turns time into depth.",
            t: "How long since the pulse was sent. Follow the pulse down and the echo up.",
            x: "Which line the graph shows. You can also click in the image." },
    k: { lam: "Wavelength", spl: "Pulse length", pen: "Reach", line: "Time per line", fps: "Frames per second", echo: "Echo right now", shift: "Error at 10 cm" },
    f: { lam: f => `at ${f} MHz in soft tissue`, spl: a => `tells things ${a} mm apart in depth`, pen: (p, d) => p < d ? "the image goes deeper: noise at the bottom" : "reaches all the way",
         line: p => `at most ${p} pulses per second`, fps: "128 lines per frame", echo: z => `the pulse has reached ${z} cm`, echoEnd: "the whole line is in",
         shift: s => Math.abs(s) < 0.005 ? "drawn in the right place" : s > 0 ? "drawn too deep" : "drawn too shallow" },
    see: {
      pulse: "The pulse has reached {p} cm. The echo coming back right now is from {e} cm: the sound has to go both down and back.",
      noise: "Below about {p} cm there is only noise: the echoes are too weak at {f} MHz. Choose a lower frequency to reach deeper.",
      fluid: "The line passes through fluid: nothing sends sound back, so it is black (anechoic). The wall is bright.",
      calc: "The line hits the calcification: a very strong echo, and almost no sound gets past. Behind it there is a shadow.",
      hem: "The line passes through the haemangioma: brighter than the liver around it (hyperechoic).",
      fat: "The fat is darker than the liver (hypoechoic). Everything under the fat layer is drawn {mm} mm too deep, because sound is slower in fat.",
      pairs: "The wire pairs at 3 cm: you can tell apart {list}. The pulse is {spl} mm long, so two echoes must be at least {ax} mm apart.",
      phFat: "The wires under the fat-like layer are too deep: the wire at 10 cm is drawn {mm} mm too deep, because sound is slower in the layer.",
      pairsAll: "All three wire pairs at 3 cm can be told apart: the pulse is short ({spl} mm).",
      cset: "The scanner assumes {c} m/s. {w}",
      csetFat: "The wires in the fat layer are now in the right place, but those below are too shallow. No single speed fits everywhere.",
      csetOff: "Everything is drawn at the wrong depth, even without fat.",
      fps: "The image goes {d} cm deep: {n} frames per second. Less depth gives more frames per second.",
      base: "Click in the image to choose a line, and drag Time after the pulse to follow the pulse and the echo.",
    },
    labels: { skin: "skin", fat: "fat", muscle: "muscle", liver: "liver", calc: "calcification", shadow: "shadow", vein: "vein", cyst: "cyst", hem: "haemangioma",
              anech: "anechoic", hypo: "hypoechoic", hyper: "hyperechoic", wires: "wires every 1 cm", pairs: "2 · 1 · 0.5 mm", fatlike: "fat-like layer",
              c1: "anechoic", c2: "hypo", c3: "hyper", c4: "very hyper", pulse: "pulse", echo: "echo", white: "strong echo", black: "no echo" },
    dec: ".",
    modelText: `<p><b>Everything is simulated.</b> The images are worked out from a simple model. No real ultrasound images are used. The probe is linear, and the image is 5 cm wide.</p>
<p><b>Pulse and echo.</b> The probe sends a short pulse and listens. An echo from depth $d$ comes back after $t = 2d/c$, because the sound has to go down and back. The scanner draws the echo at depth $c \\cdot t / 2$ with $c$ = 1540 m/s. That is 13 µs per cm. Only when the echoes from the bottom of the image have arrived can the next pulse be sent. A frame has 128 lines.</p>
<p><b>Wavelength and pulse.</b> The wavelength is $\\lambda = c/f$: 0.44 mm at 3.5 MHz and 0.15 mm at 10 MHz. The pulse has 2, 3 or 5 cycles, so the pulse length is $n \\lambda$. An echo lasts as long as the pulse. On the screen it takes up half the pulse length, because the sound goes there and back. Two echoes closer than that merge (axial resolution). The beam width is set to $0.5 + 4/f$ mm. It comes in the topic on the probe.</p>
<p><b>The echoes.</b> The tissue is small scatterers placed at random, times an echo level for each tissue. Relative to the liver: skin +10 dB, fat −14, muscle −8, liver capsule +8, vessel wall +10, cyst wall +4, haemangioma +10, calcification +28, fluid (cyst, vein) no echoes. Behind the calcification 25 dB less sound gets through (shadow). In the phantom: background 0 dB, cylinders −60, −6, +6 and +15 dB, and thin wires. The scatterers' echoes mix and give the grainy pattern (speckle), which gets finer at higher frequency.</p>
<p><b>Reach.</b> Sound is attenuated by 0.5 dB per cm per MHz each way. The scanner automatically turns up the deep echoes so the image is even, but that turns up the electronic noise too. The noise lies 70 dB below the echo from soft tissue, so it reaches the echoes at about $70/f$ cm: 20 cm at 3.5 MHz, 7 cm at 10 MHz.</p>
<p><b>The speed of sound.</b> In fat it is 1450 m/s, elsewhere 1540 m/s. Echoes from under a fat layer therefore come a little later and are drawn a little too deep: 6 % of the fat's thickness. At the deeper level you can change the speed the scanner assumes.</p>
<p><b>Grey scale.</b> The echo's strength in dB is shown from black to white over 60 dB around a fixed mid grey.</p>
<p><b>Not included.</b> Different attenuation in different tissues (for example enhancement behind the cyst), refraction, artefacts (they come in U5), focusing and the shape of the beam (U3), and how sound reflects at boundaries (impedance, U2). The numbers are typical textbook values, not numbers from a particular scanner.</p>
<p>Sources: Gibbs, Cole and Sassano, Ultrasound Physics and Technology (2009). Hoskins, Martin and Thrush, Diagnostic Ultrasound: Physics and Equipment, 3rd ed. (2019). Kremkau, Sonography Principles and Instruments. Bushberg et al., The Essential Physics of Medical Imaging, the ultrasound chapter.</p>`,
    groups: [
      ["Pulse and echo", [
        ["Down and back", "Press Reset all. The time after the pulse is 65 µs. How far has the pulse got, and where does the echo coming back right now come from?", "The pulse is 10 cm down. The echo coming back now is from 5 cm: the sound has spent half the time going down and half coming back. That is why the scanner uses half the time when it turns time into depth."],
        ["Follow the pulse", "Drag Time after the pulse slowly up from 0. When does the echo from the front wall of the cyst come back? What comes from the fluid inside the cyst?", "The front wall lies about 7 cm down, so the echo comes after about 91 µs (13 µs per cm). Nothing comes from the fluid: the curve is flat until the echo from the back wall arrives."],
        ["From line to image", "Look at the graph under the image. Click in different places in the image: in the cyst, in the calcification and in the liver. How does the graph relate to the grey shades?", "The graph is one line: the strength of the echoes over time. The image is 128 such lines side by side, with the strength turned into brightness. A strong echo is white, no echo is black."],
        ["Depth and speed", "Set Depth to 16 cm and then to 6 cm. What happens to the time per line and the number of frames per second?", "At 16 cm a line takes 208 µs, giving 38 frames per second. At 6 cm it takes 78 µs, giving 100 frames per second. The scanner has to wait for the echoes from the bottom. Do not use more depth than you need, especially when something moves."],
      ]],
      ["Grey shades and echogenicity", [
        ["Black fluid", "Press Reset all. Why are the cyst and the vein black, and why is the edge bright?", "Clear fluid contains nothing that sends sound back, so there are no echoes: anechoic. The wall is a boundary between two kinds of tissue and gives a strong echo."],
        ["Brighter and darker", "Compare the fat, the muscle, the liver and the haemangioma. Which words do you use for them?", "You describe them relative to their surroundings. The fat under the skin is darker than the liver: hypoechoic. The haemangioma is brighter than the liver: hyperechoic. Something as bright as its surroundings is isoechoic."],
        ["Calcification", "Click the line down through the calcification. What does the graph show, and what happens under the calcification?", "A very strong echo (hyperechoic), and behind it almost nothing: the calcification sends almost all the sound back, so there is a shadow behind it. You will see more of shadows in the topic on artefacts."],
        ["The phantom", "Choose Phantom. Describe the four cylinders at 7 cm with the words anechoic, hypoechoic and hyperechoic.", "From the left: anechoic (black, like fluid), hypoechoic (a little darker than the background), hyperechoic (a little brighter) and very hyperechoic. The words describe the brightness, not what it is. It is your clinical eye that says whether it is a cyst or a tumour."],
        ["Fat or fluid?", "Press Reset all. Both the fat under the skin and the cyst are dark. How can you tell them apart?", "The fat is dark grey with small echoes and thin bright streaks inside: hypoechoic. The cyst is completely black with no echoes inside and has a sharp, bright wall: anechoic. Dark is not the same as fluid."],
        ["The grain", "Look at the liver at 2 MHz and at 10 MHz. What happens to the grainy pattern?", "The grains (speckle) get smaller at a higher frequency. The pattern is not small structures in the liver, but echoes from many small scatterers mixing. That is why it shifts when you move the probe."],
      ]],
      ["Frequency and wavelength", [
        ["The wavelength", "Set the frequency to 2, 5 and 10 MHz. What is the wavelength, and what happens to the pulse in the corner of the graph?", "0.77 mm, 0.31 mm and 0.15 mm. The higher the frequency, the shorter the wavelength and the shorter the pulse. The speed of sound is the same: 1540 m/s."],
        ["Close together", "Choose Phantom, Depth 6 cm and 2 MHz with 5 cycles. Look at the wire pairs at 3 cm (2, 1 and 0.5 mm apart). Which can you tell apart? Then try 10 MHz with 2 cycles.", "At 2 MHz and 5 cycles the pulse is 3.9 mm long, so only the 2 mm pair can be told apart. At 10 MHz and 2 cycles the pulse is 0.3 mm, and all three pairs can be told apart. A short pulse gives a sharper image in depth."],
        ["How deep?", "Choose Phantom and Depth 16 cm. Set the frequency to 3.5, 7 and 12 MHz. How deep can you see the wires?", "At 3.5 MHz all the way down. At 7 MHz to about 10 cm, at 12 MHz only to about 6 cm. Below that there is only noise. Sound is attenuated more at a high frequency."],
        ["A patient with a lot of fat", "Choose Liver, set Fat layer to 5 cm and Depth to 16 cm. Look at the cyst and the haemangioma at 7 MHz and then at 3.5 MHz.", "At 7 MHz the sound only reaches about 10 cm, so the cyst and the haemangioma disappear in the noise. At 3.5 MHz you see them again. With a lot of fat the organs lie deeper, and you have to give up some sharpness to reach them."],
        ["Choose the frequency", "You are going to scan an adult's liver and a tendon in the hand. Which frequency do you choose, and why?", "The liver lies deep: 3 to 5 MHz, so the sound reaches it. The tendon lies a few millimetres under the skin: 10 to 15 MHz, so the image is sharp. Choose the highest frequency that still reaches what you need to see."],
      ]],
      ["The speed of sound", [
        ["1540 m/s", "Choose Phantom, and set Fat layer to 0. Do the wires match the scale on the right?", "Yes: the wires lie at every whole centimetre. Without fat the sound moves at 1540 m/s all the way, and that is the speed the scanner assumes."],
        ["A layer of fat", "Set Fat layer to 4 cm. Where is the wire at 10 cm now?", "It is drawn at 10.25 cm: 2.5 mm too deep. Sound is slower in fat, so the echo comes later, and the scanner thinks it comes from further down. The error is small, but it can matter when you measure."],
        ["More fat", "Choose Liver, and set Fat layer from 1.5 to 5 cm. What happens to the liver, the cyst and the image?", "Everything moves further down, because the fat is thicker. The fat is hypoechoic, and everything under it is drawn a little too deep (3 mm with 5 cm of fat). With thick fat you often need a lower frequency to reach down."],
        ["The scanner's speed", "Deeper level: Phantom with 4 cm of fat. Set Speed of sound in the scanner to 1450 m/s. Are the wires in the right place now?", "The wires in the fat layer are in the right place, but those below are too shallow, because the scanner now uses the speed of fat for all the tissue. No single speed fits everywhere. That is why scanners use 1540 m/s.", { deep: true }],
        ["Pulse length", "Deeper level: Phantom, 3.5 MHz. Switch between 2, 3 and 5 cycles. What happens to the wire pairs and the grain?", "With 5 cycles the pulse is 2.2 mm, so the 1 mm pair merges, and the grains get longer in depth. With 2 cycles everything is sharper. A short pulse needs a probe that stops ringing quickly (damping in the probe, the topic on the probe).", { deep: true }],
      ]],
    ],
  },
};

const $ = id => document.getElementById(id);
let M = EC.model(S);
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

// ---- fixed random scatterers (complex) and electronic noise, made once ----
const NX = EC.NX, NZ = EC.NZ, RE = new Float32Array(NX * NZ), IM = new Float32Array(NX * NZ), NOISE = new Float32Array(NX * NZ);
{
  let seed = 11;
  const rnd = () => { seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t ^= t + Math.imul(t ^ t >>> 7, 61 | t); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  for (let i = 0; i < NX * NZ; i++) {
    const r = Math.sqrt(-Math.log(rnd() + 1e-9)), a = 2 * Math.PI * rnd();   // mean power 1
    RE[i] = r * Math.cos(a); IM[i] = r * Math.sin(a); NOISE[i] = -Math.log(rnd() + 1e-9);
  }
}
const cellX = i => -EC.W / 2 + (i + 0.5) * EC.DX, cellZ = j => (j + 0.5) * EC.DZ;

// ---- the echo field in true depth: worked out again only when the tissue or the pulse changes ----
const LV = new Float32Array(NX * NZ), ID = new Array(NX * NZ);
const ENV = new Float32Array(NX * NZ);
let LVKEY = "", ENVKEY = "";
function levels() {
  const key = [S.scene, S.fat].join("|");
  if (key === LVKEY) return false;
  LVKEY = key;
  for (let j = 0; j < NZ; j++) for (let i = 0; i < NX; i++) { const [db, id] = EC.tissue(cellX(i), cellZ(j), S); LV[j * NX + i] = db; ID[j * NX + i] = id; }
  return true;
}
function field() {
  const changed = levels();
  const key = [LVKEY, S.f, S.cycles].join("|");
  if (!changed && key === ENVKEY) return;
  ENVKEY = key;
  const ar = new Float32Array(NX * NZ), ai = new Float32Array(NX * NZ);
  for (let k = 0; k < NX * NZ; k++) { const a = 10 ** (LV[k] / 20); ar[k] = a * RE[k]; ai[k] = a * IM[k]; }
  const wa = 10 ** (EC.WIRE_DB / 20);
  for (const [x, z] of EC.wires(S)) {
    const i = Math.round((x + EC.W / 2) / EC.DX - 0.5), j = Math.round(z / EC.DZ - 0.5);
    if (i >= 0 && i < NX && j >= 0 && j < NZ) ar[j * NX + i] += wa;
  }
  // down: the echo lasts as long as the pulse, which on the screen is half the pulse length (FWHM), with the phase
  const sz = EC.axial(S) / 10 / 2.355, mz = Math.ceil(3 * sz / EC.DZ), lamCm = EC.lambda(S) / 10;
  const kr = [], ki = []; let nz = 0;
  for (let m = -mz; m <= mz; m++) { const g = Math.exp(-0.5 * (m * EC.DZ / sz) ** 2), ph = 4 * Math.PI * m * EC.DZ / lamCm; kr.push(g * Math.cos(ph)); ki.push(g * Math.sin(ph)); nz += g * g; }
  const br = new Float32Array(NX * NZ), bi = new Float32Array(NX * NZ);
  for (let j = 0; j < NZ; j++) for (let i = 0; i < NX; i++) {
    let sr = 0, si = 0;
    for (let m = -mz; m <= mz; m++) {
      const jj = j + m; if (jj < 0 || jj >= NZ) continue;
      const o = jj * NX + i, a = ar[o], b = ai[o], c = kr[m + mz], d = ki[m + mz];
      sr += a * c - b * d; si += a * d + b * c;
    }
    br[j * NX + i] = sr; bi[j * NX + i] = si;
  }
  // sideways: the beam's width (FWHM)
  const sx = EC.beam(S) / 10 / 2.355, mx = Math.max(1, Math.ceil(3 * sx / EC.DX)), kx = []; let nx = 0;
  for (let m = -mx; m <= mx; m++) { const g = Math.exp(-0.5 * (m * EC.DX / sx) ** 2); kx.push(g); nx += g * g; }
  const norm = nz * nx;
  for (let j = 0; j < NZ; j++) for (let i = 0; i < NX; i++) {
    let sr = 0, si = 0;
    for (let m = -mx; m <= mx; m++) { const ii = clamp(i + m, 0, NX - 1), o = j * NX + ii; sr += br[o] * kx[m + mx]; si += bi[o] * kx[m + mx]; }
    ENV[j * NX + i] = 10 * Math.log10((sr * sr + si * si) / norm + 1e-12);
  }
}

// ---- the image: drawn depth -> true depth, noise lifted by the automatic depth gain ----
const MID = -5, DR = 60, TGC_TOP = -14;               // noise is never lifted above -14 dB (dark grey)
const rowsShown = () => Math.round(S.depth / EC.DZ);
function shownDb(i, r) {                                       // column i, drawn row r
  const zd = (r + 0.5) * EC.DZ, z = EC.toTrue(zd, S), j = clamp(Math.round(z / EC.DZ - 0.5), 0, NZ - 1);
  // the automatic depth gain takes back the attenuation (f · d dB there and back), but stops where the noise would
  // reach TGC_TOP; deeper down the echoes fade into the noise
  const att = 2 * EC.ALPHA * S.f * zd, gain = Math.min(att, TGC_TOP - EC.NOISE_DB);
  const noise = 10 ** ((EC.NOISE_DB + gain) / 10) * NOISE[(r % NZ) * NX + i];
  return 10 * Math.log10(10 ** ((ENV[j * NX + i] - att + gain) / 10) + noise);
}
const grey = db => clamp(0.5 + (db - MID) / DR, 0, 1);
let BUF = null;
function imgRect(W, H) {
  const h = H - 10, w = Math.min(W - 150, h * EC.W / S.depth), hh = w * S.depth / EC.W;
  return { x0: (W - w) / 2, y0: 5, w, h: hh, sc: w / EC.W };
}
function drawImg() {
  const cv = $("img"), [ctx, W, H] = fit(cv);
  ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H);
  field();
  const R = imgRect(W, H), nr = rowsShown();
  // draw at most ~2 rows per screen pixel
  const step = Math.max(1, Math.floor(nr / (R.h * 2)));
  const rows = Math.ceil(nr / step);
  if (!BUF) BUF = document.createElement("canvas");
  BUF.width = NX; BUF.height = rows;
  const bx = BUF.getContext("2d"), id = bx.createImageData(NX, rows), d = id.data;
  for (let rr = 0; rr < rows; rr++) for (let i = 0; i < NX; i++) {
    const v = grey(shownDb(i, Math.min(nr - 1, rr * step))) * 255, o = 4 * (rr * NX + i);
    d[o] = v; d[o + 1] = v; d[o + 2] = v; d[o + 3] = 255;
  }
  bx.putImageData(id, 0, 0);
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(BUF, R.x0, R.y0, R.w, R.h);
  overlays(ctx, W, H, R);
}
function overlays(ctx, W, H, R) {
  const L = T[S.lang], P = (x, zd) => [R.x0 + (x + EC.W / 2) * R.sc, R.y0 + zd * R.sc];
  const ink = "rgba(255,255,255,.85)", amber = css("--amber") || "#f0b450", cyan = "#6fd3e0";
  // depth (and echo time) on the right
  ctx.strokeStyle = ink; ctx.lineWidth = 1;
  const every = S.depth > 10 ? 2 : 1;
  for (let z = 0; z <= S.depth + 1e-9; z += 0.5) {
    const y = R.y0 + z * R.sc, whole = Math.abs(z - Math.round(z)) < 1e-6;
    ctx.beginPath(); ctx.moveTo(R.x0 + R.w + 3, y); ctx.lineTo(R.x0 + R.w + (whole ? 10 : 6), y); ctx.stroke();
    if (whole && Math.round(z) % every === 0) {
      text(ctx, String(z), R.x0 + R.w + 13, y + 4, ink, "left", 11, "--mono");
      if (z > 0) text(ctx, `${Math.round(2 * z / S.cset * 1e4)} µs`, R.x0 + R.w + 32, y + 4, "rgba(255,255,255,.5)", "left", 10, "--mono");
    }
  }
  text(ctx, "cm", R.x0 + R.w + 13, R.y0 + 0.4 * R.sc + 4, ink, "left", 10, "--mono");
  // grey scale bar on the left
  const gx = R.x0 - 30, gt = R.y0 + 6, gh = Math.min(160, R.h * 0.4);
  for (let k = 0; k < gh; k++) { const v = Math.round(255 * (1 - k / gh)); ctx.fillStyle = `rgb(${v},${v},${v})`; ctx.fillRect(gx, gt + k, 10, 1); }
  ctx.strokeStyle = "rgba(255,255,255,.4)"; ctx.strokeRect(gx - 0.5, gt - 0.5, 11, gh + 1);
  if (gh >= 140) {                                            // the words only where there is room for them
    ctx.save(); ctx.translate(gx - 5, gt); ctx.rotate(-Math.PI / 2);
    text(ctx, L.labels.black, -gh, 0, "rgba(255,255,255,.6)", "left", 10); text(ctx, L.labels.white, 0, 0, "rgba(255,255,255,.6)", "right", 10);
    ctx.restore();
  }
  // marker dot and frequency
  ctx.fillStyle = amber; ctx.beginPath(); ctx.arc(R.x0 + 6, R.y0 + 6, 4, 0, 2 * Math.PI); ctx.fill();
  text(ctx, `${fmt(S.f, 1)} MHz`, R.x0 + R.w - 6, R.y0 + 14, ink, "right", 11, "--mono");
  // the chosen line, the pulse going down and the echo coming up
  const [lx] = P(S.x, 0);
  ctx.setLineDash([3, 4]); ctx.strokeStyle = "rgba(240,180,80,.75)"; ctx.beginPath(); ctx.moveTo(lx, R.y0); ctx.lineTo(lx, R.y0 + R.h); ctx.stroke(); ctx.setLineDash([]);
  if (S.t < M.tMax) {
    const pz = M.pulseZ, ez = M.echoZ, ph = Math.max(3, M.spl / 10 * R.sc);
    if (pz <= S.depth) {
      ctx.fillStyle = amber; ctx.fillRect(lx - 7, R.y0 + pz * R.sc - ph, 14, ph);
      arrow(ctx, lx + 12, R.y0 + pz * R.sc - 14, lx + 12, R.y0 + pz * R.sc, amber);
      label(ctx, L.labels.pulse, lx + 18, R.y0 + pz * R.sc - 2, amber);
    }
    ctx.fillStyle = cyan; ctx.fillRect(lx - 7, R.y0 + ez * R.sc - 1.5, 14, 3);
    arrow(ctx, lx - 12, R.y0 + ez * R.sc + 14, lx - 12, R.y0 + ez * R.sc, cyan);
    label(ctx, L.labels.echo, lx - 18, R.y0 + ez * R.sc + 4, cyan, "right");
  }
  if (!S.names) return;
  const lab = (s, x, z, align = "center") => { const zd = EC.toDisplay(z, S); if (zd > S.depth - 0.2) return; const [px, py] = P(x, zd); label(ctx, s, px, py, ink, align); };
  const Lb = L.labels;
  if (S.scene === "belly") {
    const B = EC.belly(S);
    lab(`${Lb.fat} (${Lb.hypo})`, 0, EC.SKIN + S.fat / 2 + 0.1);
    lab(Lb.muscle, -1.6, B.fb + 0.5);
    lab(Lb.liver, -1.6, B.fb + 2.2);
    lab(`${Lb.calc} (${Lb.hyper})`, B.calc.x, B.calc.z - 0.35);
    lab(Lb.shadow, B.calc.x + 0.25, B.calc.z + 1.3, "left");
    lab(Lb.vein, B.vein.x, B.vein.z - B.vein.R - 0.15);
    lab(`${Lb.cyst} (${Lb.anech})`, B.cyst.x, B.cyst.z - B.cyst.R - 0.15);
    lab(`${Lb.hem} (${Lb.hyper})`, B.hem.x - 0.2, B.hem.z - B.hem.R - 0.15);
  } else {
    if (S.fat > 0.4) lab(Lb.fatlike, 0.4, Math.min(S.fat / 2, 1.4) + 0.1);
    lab(Lb.wires, EC.PH.col + 0.15, 0.6 + S.fat, "left");
    lab(Lb.pairs, -0.1, EC.PH.pairZ[0] - 0.35);
    if (S.depth > EC.PH.pairZ[1] + 0.5) lab(Lb.pairs, -0.1, EC.PH.pairZ[1] - 0.35);
    const names = [Lb.c1, Lb.c2, Lb.c3, Lb.c4];
    // above and below in turn, so the four names do not run into each other in a narrow image
    EC.PH.cyl.forEach(([x], k) => lab(names[k], x, EC.PH.cylZ + (k % 2 ? 0.95 : -0.65)));
  }
}
function arrow(ctx, x0, y0, x1, y1, col) {
  ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
  const s = Math.sign(y1 - y0); ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x1 - 4, y1 - 6 * s); ctx.lineTo(x1 + 4, y1 - 6 * s); ctx.closePath(); ctx.fill(); ctx.lineWidth = 1;
}
function label(ctx, s, x, y, col, align = "left") {
  ctx.font = `12px ${css("--body")}`; ctx.lineWidth = 3; ctx.strokeStyle = "rgba(0,0,0,.75)"; ctx.textAlign = align; ctx.strokeText(s, x, y); text(ctx, s, x, y, col, align, 12);
}

// ---- the graph: one A-line against time, and the pulse ----
function drawGraph() {
  const cv = $("graph"), [ctx, W, H] = fit(cv), L = T[S.lang];
  const mut = css("--muted") || "#8a93a6", fg = css("--fg") || "#e8ecf3", amber = css("--amber") || "#f0b450", line = css("--line") || "#2a3142";
  const inset = Math.min(150, W * 0.3), x0 = 40, x1 = W - inset - 18, y0 = 26, y1 = H - 30;
  const tMax = M.tMax, X = t => x0 + t / tMax * (x1 - x0), Y = g => y1 - g * (y1 - y0);
  ctx.strokeStyle = line; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0, y1); ctx.lineTo(x1, y1); ctx.stroke();
  // the A-line: brightness of each drawn depth on the chosen line
  const i = clamp(Math.round((S.x + EC.W / 2) / EC.DX - 0.5), 0, NX - 1), nr = rowsShown(), n = Math.min(nr, 900);
  const pts = [];
  for (let k = 0; k < n; k++) {
    const r = Math.floor(k * nr / n);
    let g = 0; for (let ii = Math.max(0, i - 1); ii <= Math.min(NX - 1, i + 1); ii++) g = Math.max(g, grey(shownDb(ii, r)));
    pts.push([2 * (r + 0.5) * EC.DZ / S.cset * 1e4, g]);
  }
  const tNow = Math.min(S.t, tMax);
  ctx.fillStyle = "rgba(111,211,224,.18)"; ctx.strokeStyle = "#6fd3e0"; ctx.lineWidth = 1.2;
  for (const [from, to, fill, stroke] of [[0, tNow, "rgba(111,211,224,.22)", "#6fd3e0"], [tNow, tMax, "rgba(140,150,170,.12)", "rgba(140,150,170,.55)"]]) {
    const seg = pts.filter(([t]) => t >= from && t <= to); if (seg.length < 2) continue;
    ctx.beginPath(); ctx.moveTo(X(seg[0][0]), Y(0)); seg.forEach(([t, g]) => ctx.lineTo(X(t), Y(g))); ctx.lineTo(X(seg[seg.length - 1][0]), Y(0)); ctx.closePath();
    ctx.fillStyle = fill; ctx.fill();
    ctx.beginPath(); seg.forEach(([t, g], k) => k ? ctx.lineTo(X(t), Y(g)) : ctx.moveTo(X(t), Y(g))); ctx.strokeStyle = stroke; ctx.stroke();
  }
  ctx.lineWidth = 1;
  if (S.t < tMax) { ctx.strokeStyle = amber; ctx.beginPath(); ctx.moveTo(X(tNow), y0); ctx.lineTo(X(tNow), y1); ctx.stroke(); }
  // time below, depth above
  const tStep = tMax > 150 ? 50 : tMax > 60 ? 20 : 10;
  for (let t = 0; t <= tMax; t += tStep) text(ctx, String(t), X(t), y1 + 14, mut, "center", 10, "--mono");
  text(ctx, "µs", x1, y1 + 27, mut, "right", 10, "--mono");
  text(ctx, S.lang === "da" ? "tid efter pulsen" : "time after the pulse", (x0 + x1) / 2, y1 + 27, mut, "center", 11);
  const dStep = S.depth > 10 ? 2 : 1;
  for (let z = 0; z <= S.depth; z += dStep) text(ctx, String(z), X(2 * z / S.cset * 1e4), y0 - 8, mut, "center", 10, "--mono");
  text(ctx, "cm", x0 - 6, y0 - 8, mut, "right", 10, "--mono");
  ctx.save(); ctx.translate(14, (y0 + y1) / 2); ctx.rotate(-Math.PI / 2); text(ctx, S.lang === "da" ? "ekko" : "echo", 0, 0, mut, "center", 11); ctx.restore();
  // the pulse, at a fixed scale (4 mm across), with its wavelength
  const px0 = W - inset - 4, px1 = W - 6, pyc = (y0 + y1) / 2 - 8, amp = Math.min(40, (y1 - y0) / 3), mm = (px1 - px0) / 4;
  ctx.strokeStyle = line; ctx.strokeRect(px0, y0, px1 - px0, y1 - y0);
  text(ctx, S.lang === "da" ? "pulsen" : "the pulse", (px0 + px1) / 2, y0 + 14, mut, "center", 11);
  const spl = M.spl, lam = M.lam, cx = (px0 + px1) / 2;
  ctx.strokeStyle = fg; ctx.lineWidth = 1.5; ctx.beginPath();
  for (let k = 0; k <= 400; k++) {
    const u = -2.2 + 4.4 * k / 400, s = u * mm;                // mm from the centre
    const env = Math.abs(u) <= spl / 2 ? 0.5 + 0.5 * Math.cos(2 * Math.PI * u / spl) : 0;
    const y = pyc - amp * env * Math.sin(2 * Math.PI * u / lam);
    k ? ctx.lineTo(cx + s, y) : ctx.moveTo(cx + s, y);
  }
  ctx.stroke(); ctx.lineWidth = 1;
  // λ bracket and 1 mm scale
  const ly = pyc + amp + 14;
  ctx.strokeStyle = amber; ctx.beginPath(); ctx.moveTo(cx, ly); ctx.lineTo(cx + lam * mm, ly); ctx.stroke();
  text(ctx, `λ ${fmt(lam, 2)} mm`, cx, ly + 13, amber, "left", 10, "--mono");
  ctx.strokeStyle = mut; ctx.beginPath(); ctx.moveTo(px0 + 8, y1 - 10); ctx.lineTo(px0 + 8 + mm, y1 - 10); ctx.stroke();
  text(ctx, "1 mm", px0 + 8, y1 - 14, mut, "left", 10, "--mono");
}

// ---- numbers and what you can see ----
function metrics() {
  const L = T[S.lang], m = M;
  const out = [
    ["", "lam", `${fmt(m.lam, 2)} mm`, L.f.lam(fmt(S.f, 1))],
    ["", "spl", `${fmt(m.spl, 2)} mm`, L.f.spl(fmt(m.axial, 2))],
    [m.pen < S.depth ? "err" : "ok", "pen", `${fmt(m.pen, 0)} cm`, L.f.pen(m.pen, S.depth)],
    ["", "line", `${fmt(m.lineUs, 0)} µs`, L.f.line(Math.round(m.prfMax).toLocaleString(S.lang === "da" ? "da-DK" : "en-GB"))],
    ["mag", "fps", fmt(m.fps, 0), L.f.fps],
    S.t < m.tMax ? ["", "echo", `${fmt(m.echoZ, 1)} cm`, L.f.echo(fmt(m.pulseZ, 1))] : ["", "echo", "–", L.f.echoEnd],
  ];
  if (S.fat > 0 || S.cset !== 1540) out.push([Math.abs(m.shift10) > 0.05 ? "err" : "", "shift", `${m.shift10 >= 0 ? "+" : "−"}${fmt(Math.abs(m.shift10) * 10, 1)} mm`, L.f.shift(m.shift10)]);
  return out;
}
function lineHits() {
  const hits = new Set(), i = clamp(Math.round((S.x + EC.W / 2) / EC.DX - 0.5), 0, NX - 1), zMax = EC.toTrue(S.depth, S);
  for (let j = 0; j < NZ && cellZ(j) < zMax; j += 2) hits.add(ID[j * NX + i]);
  return hits;
}
function observations() {
  const L = T[S.lang].see, out = [], add = (on, t) => { if (on) out.push(t); };
  add(S.t < M.tMax, L.pulse.replace("{p}", fmt(Math.min(M.pulseZ, 99), 1)).replace("{e}", fmt(M.echoZ, 1)));
  add(M.pen < S.depth, L.noise.replace("{p}", fmt(M.pen, 0)).replace("{f}", fmt(S.f, 1)));
  if (S.cset !== 1540) add(true, L.cset.replace("{c}", S.cset).replace("{w}", S.fat > 0 && S.scene === "phantom" && S.cset < 1500 ? L.csetFat : L.csetOff));
  const hits = lineHits();
  if (S.scene === "belly") {
    add(hits.has("calc"), L.calc);
    add(hits.has("cyst") || hits.has("vein"), L.fluid);
    add(hits.has("hem"), L.hem);
    const zb = EC.SKIN + S.fat + 1;                               // 1 cm under the fat
    add(S.fat >= 1 && S.cset === 1540, L.fat.replace("{mm}", fmt((EC.toDisplay(zb, S) - zb) * 10, 1)));
  } else if (S.fat >= 1 && S.cset === 1540) {
    add(true, L.phFat.replace("{mm}", fmt(M.shift10 * 10, 1)));
  } else if (EC.PH.pairZ[0] < S.depth) {
    const names = ["2 mm", "1 mm", S.lang === "da" ? "0,5 mm" : "0.5 mm"], ok = names.filter((_, k) => M.resolved[k]);
    const and = S.lang === "da" ? " og " : " and ";
    add(ok.length === 3, L.pairsAll.replace("{spl}", fmt(M.spl, 2)));
    add(ok.length < 3, L.pairs.replace("{list}", ok.length ? ok.join(and).replace(/ og (?=.* og )/, ", ").replace(/ and (?=.* and )/, ", ") : "–").replace("{spl}", fmt(M.spl, 1)).replace("{ax}", fmt(M.axial, 1)));
  }
  add(out.length < 2, L.fps.replace("{d}", S.depth).replace("{n}", fmt(M.fps, 0)));
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
// key: [min, max, step, label, only on the deeper level]
const SLIDERS = {
  f: [2, 15, 0.5, v => `${fmt(v, 1)} MHz`],
  depth: [4, 16, 1, v => `${v} cm`],
  fat: [0, 5, 0.5, v => `${fmt(v, 1)} cm`],
  cset: [1400, 1600, 10, v => `${v} m/s`, true],
  t: [0, 210, 1, v => v >= M.tMax ? `${Math.round(v)} µs ✓` : `${v} µs`],
  x: [-2.4, 2.4, 0.05, v => `${v >= 0 ? "+" : "−"}${fmt(Math.abs(v), 2)} cm`],
};
function buildControls() {
  const L = T[S.lang], C = L.ctl, box = $("controls");
  const help = k => S.level === "grund" && L.help[k] ? `<p class="help">${L.help[k]}</p>` : "";
  const seg = (k, opts) => `<div class="ctl"><label><span>${C[k]}</span><span></span></label><div class="seg">` +
    opts.map(([val, lbl]) => `<button data-k="${k}" data-v="${val}" aria-pressed="${String(S[k]) === String(val)}">${lbl}</button>`).join("") +
    `</div>${help(k)}</div>`;
  const slider = k => {
    const [mn, mx, st, f, deep] = SLIDERS[k];
    if (deep && S.level !== "deep") return "";
    return `<div class="ctl"><label for="s-${k}"><span>${C[k]}</span><span id="o-${k}">${f(S[k])}</span></label>` +
      `<input type="range" id="s-${k}" min="${mn}" max="${mx}" step="${st}" value="${S[k]}">${help(k)}</div>`;
  };
  const grp = k => `<h3 class="grp">${L.grp[k]}</h3>`;
  box.innerHTML = grp("scene") + seg("scene", [["belly", C.belly], ["phantom", C.phantom]]) + seg("names", [["false", C.off], ["true", C.on]]) +
    grp("probe") + slider("f") + seg("cycles", [["2", "2"], ["3", "3"], ["5", "5"]]) + slider("depth") +
    grp("patient") + slider("fat") +
    (S.level === "deep" ? grp("scanner") + slider("cset") : "") +
    grp("time") + slider("t") + slider("x") +
    `<div class="ctl last"><button class="reset" id="reset">${C.reset}</button></div>`;
  box.querySelectorAll("button[data-k]").forEach(b => b.onclick = () => {
    const k = b.dataset.k, v = b.dataset.v;
    S[k] = v === "true" ? true : v === "false" ? false : k === "cycles" ? +v : v;
    if (k === "scene") { PIN = null; S.fat = S.scene === "belly" ? 1.5 : 0; }
    buildControls(); update();
  });
  for (const k of Object.keys(SLIDERS)) {
    const el = $(`s-${k}`); if (!el) continue;
    el.oninput = () => { S[k] = +el.value; M = EC.model(S); $(`o-${k}`).textContent = SLIDERS[k][3](+el.value); updateSoon(); };
  }
  $("reset").onclick = () => { const keep = { lang: S.lang, level: S.level }; Object.assign(S, clone(START), keep); PIN = null; buildControls(); update(); };
}
// click in the image chooses the line
$("img").addEventListener("click", e => {
  const r = $("img").getBoundingClientRect(), R = imgRect(r.width, r.height);
  const x = (e.clientX - r.left - R.x0) / R.sc - EC.W / 2;
  if (x < -EC.W / 2 || x > EC.W / 2) return;
  S.x = +clamp(x, -2.4, 2.4).toFixed(2);
  const el = $("s-x"); if (el) { el.value = S.x; $("o-x").textContent = SLIDERS.x[3](S.x); }
  update();
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
function buildCard() {
  const L = T[S.lang], flat = taskList(), i = Math.max(0, flat.findIndex(t => t.id === taskId)), t = flat[i];
  taskId = t.id;
  $("taskcard").innerHTML =
    `<div class="tc-head"><span><b>${t.g}</b> · ${t.k} ${L.of} ${t.n}</span>` +
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
  for (const k of ["title", "sub", "image", "tasks", "model", "foot", "privacy"]) set("t-" + k, L[k]);
  set("t-back", L.back); set("t-simtitle", L.simTitle); set("t-imgnote", L.imgNote); set("t-graph", L.graph); set("t-graphnote", L.note);
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
  for (const [id, on] of [["lang-da", S.lang === "da"], ["lang-en", S.lang === "en"], ["lvl-grund", S.level === "grund"], ["lvl-deep", S.level === "deep"]])
    $(id).setAttribute("aria-pressed", on);
}
function render() {
  if ($("img").getClientRects().length) { drawImg(); drawGraph(); }
  readouts();
}
function update() { M = EC.model(S); render(); }
let pending = false;
function updateSoon() { if (!pending) { pending = true; requestAnimationFrame(() => { pending = false; update(); }); } }
function all() {
  if (S.level !== "deep") S.cset = 1540;                       // the scanner's speed is only on the deeper level
  setPressed(); buildText(); buildControls(); update();
}
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
