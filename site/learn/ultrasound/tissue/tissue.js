// Sound meets tissue simulator (ultrasound U2): the page. The tissues, the boundaries and the beam live in model.js
// (TM). Here:
//   - the echo field: each line is followed down with TM.trace; the scatter from fixed random scatterers and the
//     boundaries' echoes are put where the scanner draws them, then blurred by the pulse (downwards, with the phase)
//     and by the beam (sideways);
//   - the image: the automatic depth gain takes back the attenuation of soft tissue, and lifts the noise with it;
//   - the graph: how strong the sound is on its way down the chosen line, against depth;
//   - the numbers, the "what you can see" line, the tasks and the model text.

const START = { scene: "body", f: 3.5, depth: 12, gel: true, layer: "fat", tilt: 0, surface: "smooth", x: -1.7, names: true };
const clone = o => JSON.parse(JSON.stringify(o));
const S = { lang: "da", level: "grund", ...clone(START) };

const T = {
  da: {
    title: "Lyd møder væv", sub: "Simulator: hvad der sker med lyden ved grænser mellem væv, hvorfor vinklen betyder noget, og hvorfor lyden bliver svagere på vejen ned.",
    simTitle: "Simulator: lyd møder væv", grund: "Grund", deep: "Fordybelse", back: "← Ultralyd",
    image: "Billedet", graph: "Lydens styrke på vej ned ad linjen",
    note: "Hvor stærk lyden er på vej ned ad den valgte linje, dybde hen ad. Den stiplede kurve: samme linje gennem blødt væv. Under den røde linje er lyden så svag, at ekkoet drukner i støj. Farverne viser vævet langs linjen.",
    imgNote: "Simuleret billede, ikke et rigtigt skannerbillede. Klik i billedet for at vælge en linje.",
    tasks: "Opgaver", answer: "Vis svar", of: "af", prev: "Forrige opgave", next: "Næste opgave",
    model: "Sådan virker modellen", foot: "© 2026 Oliver Brage. Alle rettigheder forbeholdes.", privacy: "Privatliv",
    seen: "Det kan du se:", pin: "Gem tallene", unpin: "Fjern de gemte", saved: "gemt",
    grp: { scene: "Scene", probe: "Proben", layer: "Laget i fantomet", line: "Linjen" },
    ctl: { scene: "Scene", body: "Krop", phantom: "Fantom", names: "Vis navne", on: "Til", off: "Fra", gel: "Gel",
           f: "Frekvens", depth: "Dybde", layer: "Materiale", tilt: "Hældning", surface: "Overflade", smooth: "Glat", rough: "Ru",
           x: "Linjens placering", reset: "Nulstil alt" },
    help: { scene: "Krop: hud, fedt, muskel med et ribben og lever med galdeblære og en tarm med luft. Fantom: et testobjekt med et lag, du selv vælger, og tråde under det.",
            gel: "Gel fjerner luften mellem proben og huden.",
            f: "Højere frekvens: skarpere billede, men lyden dæmpes mere og når ikke så dybt.",
            depth: "Hvor dybt billedet går.",
            layer: "Hvad laget i 3–5 cm er lavet af.",
            tilt: "Hvor skråt laget ligger i forhold til lyden.",
            surface: "Glat: grænsen virker som et spejl. Ru: grænsen spreder lyden i alle retninger.",
            x: "Hvilken linje kurven viser. Du kan også klikke i billedet." },
    mats: { soft: "blødt væv", skin: "hud", fat: "fedt", muscle: "muskel", fluid: "væske", wall: "væg", bone: "knogle", air: "luft" },
    k: { Z: "Lagets impedans", R: "Kastes tilbage", T: "Går videre", under: "Under laget", lobe: "Ekko fra laget", refr: "Brydning",
         strong: "Stærkeste grænse", at10: "Lyd i 10 cm", pen: "Rækkevidde", gel: "Uden gel" },
    f: { Z: "blødt væv: 1,65 MRayl", R: (a, b) => `ved grænsen ${a} → ${b}`, T: "af lyden fortsætter ned",
         under: v => v < -100 ? "ingen lyd kommer igennem" : v > 0.5 ? "mere lyd end gennem blødt væv" : v < -0.5 ? "mindre lyd end gennem blødt væv" : "næsten som gennem blødt væv",
         lobe: (t, rough) => rough ? "ru overflade: ens i alle vinkler" : t > 0 ? "fordi grænsen står skråt" : "grænsen står vinkelret",
         refr: tot => tot ? "ingen lyd kommer ind i laget" : "vinklen ind → vinklen i laget",
         strong: (a, b) => `kastes tilbage ved ${a} → ${b}`, at10: v => v > 0.5 ? "mere end gennem lever: forstærkning" : v < -10 ? "næsten ingen lyd: skygge" : v < -0.5 ? "mindre end gennem lever" : "som gennem lever",
         pen: (p, d) => p < d ? "billedet går dybere: støj forneden" : "når helt ned", gel: "kastes tilbage ved luften" },
    see: {
      gel: "Uden gel er der luft mellem proben og huden. Næsten al lyd kastes tilbage, så billedet er sort med lyse striber øverst: lyden kastes frem og tilbage mellem proben og luften.",
      air: "Linjen rammer luft: 99,9 % af lyden kastes tilbage. Under luften ser du kun gentagne ekkoer (genlyd) med samme afstand som ned til luften.",
      bone: "Linjen rammer knogle: {r} % kastes tilbage, og resten dæmpes kraftigt i knoglen. Under den er der skygge.",
      fluid: "Linjen går gennem væske, som næsten ikke dæmper lyden. Skanneren skruer op, som om det var væv, så vævet under er lysere (forstærkning).",
      weak: "Grænsen mellem {a} og {b} kaster kun {r} % tilbage: impedanserne ligner hinanden, så næsten al lyd går videre.",
      tilted: "Laget står {t}° skråt, og grænsen er glat: ekkoet går til siden som fra et spejl, så du ser næsten intet af grænsen. Trådene under kan stadig ses.",
      rough: "Den ru overflade spreder lyden i alle retninger, så noget kommer tilbage til proben, også når laget står skråt.",
      total: "Laget står mere end {c}° skråt: lyden kan slet ikke komme ind i knoglen, alt kastes væk (total refleksion).",
      refr: "Lyden bøjer, når den går skråt ind i laget: trådene under tegnes {mm} mm til siden, fordi skanneren regner med lige linjer.",
      muscle: "Muskel dæmper lyden mere end blødt væv, så alt under laget er lidt mørkere.",
      noise: "Under cirka {p} cm er der kun støj: lyden er for svag ved {f} MHz.",
      base: "Klik i billedet for at vælge en linje, og se på kurven, hvor lyden bliver svagere.",
    },
    labels: { fat: "fedt", muscle: "muskel", liver: "lever", rib: "ribben", shadow: "skygge", gb: "galdeblære", enh: "forstærkning",
              gas: "tarmluft", reverb: "genlyd", wires: "tråde", layer: "lag", white: "stærkt ekko", black: "intet ekko",
              noise: "støjgrænse", ref: "blødt væv", dB: "dB", depthAx: "dybde", strength: "lydens styrke" },
    dec: ",",
    modelText: `<p><b>Det hele er simuleret.</b> Billederne er regnet ud fra en enkel model. Der er ikke brugt rigtige ultralydsbilleder. Proben er lineær, og billedet er 5 cm bredt.</p>
<p><b>Impedans og refleksion.</b> Hvert væv har en akustisk impedans $Z$ (tæthed gange lydens hastighed). Ved en grænse kastes andelen $R = \\left(\\frac{Z_2 - Z_1}{Z_2 + Z_1}\\right)^2$ af lyden tilbage, og resten går videre. Værdier i MRayl: blødt væv 1,65, fedt 1,38, muskel 1,70, væske 1,52, knogle 7,8 og luft 0,0004. Blødt væv mod fedt giver 0,8 %, mod knogle 42 % og mod luft 99,9 %.</p>
<p><b>Spejl og spredning.</b> En glat grænse sender ekkoet tilbage som et spejl. Proben får det kun, når grænsen står næsten vinkelret på lyden. Modellen lader ekkoet falde med vinklen, hurtigere ved højere frekvens (−15 dB ved 10° ved 3,5 MHz). En ru grænse spreder lyden i alle retninger og giver et svagere ekko (−12 dB), der ikke afhænger af vinklen. Inde i vævet spreder mange små strukturer lyden. Det giver det kornede mønster (speckle) og er grunden til, at du kan se vævet fra alle vinkler.</p>
<p><b>Dæmpning.</b> Lyden bliver svagere på vejen, fordi vævet optager den (absorption) og spreder den. I dB pr. cm pr. MHz: blødt væv 0,5, fedt 0,6, muskel 1,0, væske næsten 0, knogle 20. Skanneren skruer automatisk op for de dybe ekkoer, som om alt var blødt væv. Bag væske, der næsten ikke dæmper, bliver der derfor for lyst (forstærkning), og bag knogle og luft bliver der mørkt (skygge). Støjen ligger 70 dB under ekkoet fra blødt væv, så lyden rækker cirka $70/f$ cm i blødt væv.</p>
<p><b>Brydning.</b> Går lyden skråt ind i et væv med en anden hastighed, bøjer den (Snells lov: $\\sin\\theta_2 / \\sin\\theta_1 = c_2 / c_1$). Skanneren regner med lige linjer og tegner derfor det, der ligger under, lidt til siden. Fra blødt væv ind i knogle findes en vinkel (22°), hvor lyden slet ikke kan komme ind (total refleksion). Modellen bøjer ikke lyden inde i knogle og luft: der når næsten ingen lyd igennem alligevel.</p>
<p><b>Ekkoer frem og tilbage.</b> Ved luft kastes lyden frem og tilbage mellem grænsen og proben. Hver gang kommer et nyt, svagere ekko (−12 dB) med samme afstand. Det er genlyd, som du møder igen i emnet om artefakter.</p>
<p><b>Lydens hastighed.</b> Hastighederne er blødt væv 1540, fedt 1450, muskel 1580, væske 1520, knogle 4080 og luft 330 m/s. Skanneren regner med 1540 m/s, så tid bliver til dybde som i U1.</p>
<p><b>Det er ikke med.</b> At strålen breder sig og bliver svagere med afstanden (divergens) er med i den samlede dæmpning og kommer i emnet om proben (U3). Kantskygge, spejlbilleder og andre artefakter kommer i U5. Tallene er typiske lærebogsværdier, ikke tal fra en bestemt skanner.</p>
<p>Kilder: Hoskins, Martin og Thrush, Diagnostic Ultrasound: Physics and Equipment, 3. udg. (2019). Gibbs, Cole og Sassano, Ultrasound Physics and Technology (2009). Kremkau, Sonography Principles and Instruments. Bushberg m.fl., The Essential Physics of Medical Imaging, kapitlet om ultralyd.</p>`,
    groups: [
      ["Gel og luft", [
        ["Uden gel", "Tryk Nulstil alt, og sæt Gel til Fra. Hvad ser du, og hvorfor?", "Billedet er sort med lyse striber øverst. Uden gel er der luft mellem proben og huden, og ved luft kastes 99,9 % af lyden tilbage. Den lille rest, der kommer ind, er for svag til at give et billede. Striberne er lyden, der kastes frem og tilbage mellem proben og luften. Derfor bruger du gel."],
        ["Tarmluft", "Gel til. Klik linjen ned gennem tarmluften til højre. Hvad viser kurven, og hvad ser du under luften?", "Kurven falder lodret ved luften: næsten al lyd kastes tilbage, og det, der går ind, dæmpes helt. Øverst på luften er der et meget lyst ekko. Under den er der skygge med svage gentagne ekkoer (genlyd). Du kan ikke se gennem tarmluft. Flyt proben, eller tryk let for at skubbe luften væk."],
        ["Luft i fantomet", "Vælg Fantom og Materiale Luft. Hvor ligger de lyse striber under laget, og hvorfor ligger de der?", "Lagets top ligger i 3 cm, og striberne kommer i 6, 9 og 12 cm: lyden kastes frem og tilbage mellem luften og proben, og hver tur tager lige så lang tid som den første. Det samme ser du i lungen, hvor der kommer vandrette linjer under lungehinden (A-linjer)."],
      ]],
      ["Impedans og refleksion", [
        ["Fedt", "Vælg Fantom og Materiale Fedt. Hvor meget af lyden kastes tilbage ved grænsen, og hvor meget går videre?", "0,8 % kastes tilbage, og 99,2 % går videre. Grænsen ses som en lys streg, men næsten al lyd fortsætter, så trådene under ses fint. Det er de små refleksioner ved mange grænser, der giver billedet."],
        ["Muskel og væske", "Skift Materiale til Muskel og så til Væske. Hvor meget kastes tilbage nu?", "Muskel: 0,02 %. Væske: 0,17 %. Impedanserne ligner blødt væv (1,70 og 1,52 mod 1,65 MRayl), så grænserne giver kun svage ekkoer. Inde i væsken er der sort, fordi intet spreder lyden."],
        ["Knogle", "Skift Materiale til Knogle. Hvor meget kastes tilbage, og hvorfor er der sort under laget?", "42 % kastes tilbage, fordi knoglens impedans (7,8 MRayl) er langt fra blødt væv. Det, der går ind, dæmpes kraftigt i knoglen (20 dB pr. cm pr. MHz). Under knoglen når der ingen lyd frem: skygge."],
        ["Ribbenet", "Vælg Krop, og tryk Nulstil alt. Linjen går gennem ribbenet. Hvad ser du under det, og hvad gør du i klinikken?", "Øverst på ribbenet er der et lyst ekko, og under det en sort skygge hele vejen ned. Leveren bag ribbenet kan ikke ses. I klinikken skanner du mellem ribbenene (interkostalt), eller beder patienten trække vejret dybt ind, så leveren kommer ned under ribbenene."],
        ["Hvad bestemmer ekkoet?", "Sammenlign grænserne fedt → muskel i Krop og blødt væv → fedt i Fantom. Hvad bestemmer, hvor meget der kastes tilbage?", "Forskellen i impedans mellem de to væv. Fedt mod muskel (1,38 mod 1,70) giver 1,1 %, blødt væv mod fedt (1,65 mod 1,38) 0,8 %. Det er ikke vævets egen lysstyrke, men hvor forskellige de to væv er."],
      ]],
      ["Vinkel og overflade", [
        ["Skrå grænse", "Fantom, Fedt. Sæt Hældning til 0°, 10° og 20°. Hvad sker der med grænsens ekko og med trådene under?", "Ved 0° er grænsen en lys streg. Ved 10° er ekkoet 15 dB svagere, og ved 20° er grænsen næsten væk. Trådene under ses stadig. En glat grænse virker som et spejl: står den skråt, går ekkoet til siden og rammer ikke proben."],
        ["Ru overflade", "Sæt Overflade til Ru ved 20°. Og så ved 0°. Hvad er forskellen fra den glatte grænse?", "Den ru grænse giver et svagere ekko end den glatte ved 0°, men den ses ved alle vinkler, fordi den spreder lyden i alle retninger. Det er derfor, leveren og andet væv kan ses fra alle vinkler: de små strukturer spreder."],
        ["Galdeblæren", "Vælg Krop, og klik linjen gennem galdeblæren. Hvorfor er væggen lys foroven og forneden, men svagere i siderne?", "Foroven og forneden står væggen vinkelret på lyden, så ekkoet kommer lige tilbage. I siderne står væggen skråt, så ekkoet går til siden. Vinklen betyder noget for alle glatte grænser: kar, sener og kanyler (emnet om artefakter)."],
        ["Kornene", "Se på leveren omkring galdeblæren. Hvorfor kan du se leveren, selvom den ikke har nogen glatte grænser?", "Leveren består af mange små strukturer, der spreder lyden i alle retninger. Ekkoerne blandes og giver det kornede mønster (speckle). Spredningen er svag, men den afhænger ikke af vinklen."],
      ]],
      ["Dæmpning", [
        ["Under galdeblæren", "Krop, 3,5 MHz. Klik linjen gennem galdeblæren. Er leveren under galdeblæren lysere eller mørkere end ved siden af? Prøv også 7 MHz.", "Lysere: forstærkning. Galde dæmper næsten ikke lyden, men skanneren skruer op, som om det var lever. Ved 3,5 MHz er der 2,6 dB mere lyd i 10 cm, ved 7 MHz 5,3 dB. Forstærkning bag noget er et tegn på væske, fx en cyste."],
        ["Kurven", "Fantom, Væske, linjen gennem midten. Hvor falder kurven, og hvor er den flad?", "Kurven falder jævnt i det bløde væv: lyden dæmpes hele vejen. I væsken er den flad, fordi væske næsten ikke dæmper. Under laget ligger kurven derfor over den stiplede kurve for blødt væv."],
        ["Frekvens og dæmpning", "Fantom, Fedt, Dybde 16 cm. Se på kurven ved 3,5 og 7 MHz. Hvor rammer den støjgrænsen?", "Ved 7 MHz falder kurven dobbelt så hurtigt, fordi dæmpningen vokser med frekvensen. Den rammer støjgrænsen ved cirka 10 cm. Ved 3,5 MHz når lyden hele vejen ned. Høj frekvens er skarpere, men når ikke så dybt."],
        ["Muskel", "Fantom, Muskel. Er trådene under laget lige så tydelige som under fedt?", "Lidt svagere. Muskel dæmper dobbelt så meget som blødt væv (1,0 mod 0,5 dB pr. cm pr. MHz), så der er 3,6 dB mindre lyd under laget ved 3,5 MHz. Grænsen selv er næsten usynlig."],
      ]],
      ["Brydning", [
        ["Lyden bøjer", "Fantom, Fedt, Hældning 30°. Se på brydningen i tallene. Hvor tegnes trådene under laget?", "Lyden går ind ved 30° og fortsætter ved 28° i fedtet, fordi lyden går langsommere i fedt. Trådene under tegnes 0,8 mm til siden. Skanneren regner med, at lyden går lige ned. Forskydningen er lille her, men ved kanten af runde strukturer kan brydning give kantskygger (U5)."],
        ["Total refleksion", "Fordybelse: Fantom, Knogle. Sæt Hældning fra 10° til 25°. Hvad sker der ved cirka 22°?", "Over 22° kan lyden slet ikke komme ind i knoglen: alt kastes væk (total refleksion), fordi lyden går meget hurtigere i knogle (4080 m/s). Under 22° bøjer lyden kraftigt væk fra lodret. Der er skygge under knoglen i begge tilfælde.", { deep: true }],
        ["Vinkel og frekvens", "Fordybelse: Fantom, Fedt, Hældning 10°. Sammenlign grænsens ekko ved 3,5 og 10 MHz.", "Ved 3,5 MHz er ekkoet 15 dB svagere end ved 0°, ved 10 MHz 42 dB svagere. Ved høj frekvens er spejlet mere præcist, så vinklen betyder endnu mere. Hold proben vinkelret på det, du vil se.", { deep: true }],
      ]],
    ],
  },
  en: {
    title: "Sound meets tissue", sub: "Simulator: what happens to sound at boundaries between tissues, why the angle matters, and why sound gets weaker on the way down.",
    simTitle: "Simulator: sound meets tissue", grund: "Basic", deep: "Deeper level", back: "← Ultrasound",
    image: "The image", graph: "The strength of the sound on its way down the line",
    note: "How strong the sound is on its way down the chosen line, depth across. The dashed curve: the same line through soft tissue. Below the red line the sound is so weak that the echo drowns in noise. The colours show the tissue along the line.",
    imgNote: "Simulated image, not a real scanner image. Click in the image to choose a line.",
    tasks: "Tasks", answer: "Show answer", of: "of", prev: "Previous task", next: "Next task",
    model: "How the model works", foot: "© 2026 Oliver Brage. All rights reserved.", privacy: "Privacy",
    seen: "What you can see:", pin: "Save the numbers", unpin: "Remove saved", saved: "saved",
    grp: { scene: "Scene", probe: "The probe", layer: "The layer in the phantom", line: "The line" },
    ctl: { scene: "Scene", body: "Body", phantom: "Phantom", names: "Show names", on: "On", off: "Off", gel: "Gel",
           f: "Frequency", depth: "Depth", layer: "Material", tilt: "Tilt", surface: "Surface", smooth: "Smooth", rough: "Rough",
           x: "Position of the line", reset: "Reset all" },
    help: { scene: "Body: skin, fat, muscle with a rib, and liver with the gallbladder and a bowel loop with gas. Phantom: a test object with a layer you choose and wires under it.",
            gel: "Gel removes the air between the probe and the skin.",
            f: "Higher frequency: a sharper image, but the sound is attenuated more and does not reach as deep.",
            depth: "How deep the image goes.",
            layer: "What the layer at 3–5 cm is made of.",
            tilt: "How much the layer is tilted relative to the sound.",
            surface: "Smooth: the boundary acts like a mirror. Rough: the boundary scatters sound in all directions.",
            x: "Which line the graph shows. You can also click in the image." },
    mats: { soft: "soft tissue", skin: "skin", fat: "fat", muscle: "muscle", fluid: "fluid", wall: "wall", bone: "bone", air: "air" },
    k: { Z: "The layer's impedance", R: "Sent back", T: "Goes on", under: "Under the layer", lobe: "Echo from the layer", refr: "Refraction",
         strong: "Strongest boundary", at10: "Sound at 10 cm", pen: "Reach", gel: "Without gel" },
    f: { Z: "soft tissue: 1.65 MRayl", R: (a, b) => `at the boundary ${a} → ${b}`, T: "of the sound carries on down",
         under: v => v < -100 ? "no sound gets through" : v > 0.5 ? "more sound than through soft tissue" : v < -0.5 ? "less sound than through soft tissue" : "almost as through soft tissue",
         lobe: (t, rough) => rough ? "rough surface: the same at all angles" : t > 0 ? "because the boundary is tilted" : "the boundary is at right angles",
         refr: tot => tot ? "no sound gets into the layer" : "angle in → angle in the layer",
         strong: (a, b) => `sent back at ${a} → ${b}`, at10: v => v > 0.5 ? "more than through liver: enhancement" : v < -10 ? "almost no sound: shadow" : v < -0.5 ? "less than through liver" : "as through liver",
         pen: (p, d) => p < d ? "the image goes deeper: noise at the bottom" : "reaches all the way", gel: "sent back at the air" },
    see: {
      gel: "Without gel there is air between the probe and the skin. Almost all the sound is sent back, so the image is black with bright stripes at the top: the sound bounces back and forth between the probe and the air.",
      air: "The line hits air: 99.9 % of the sound is sent back. Under the air you only see repeated echoes (reverberation), spaced like the distance down to the air.",
      bone: "The line hits bone: {r} % is sent back, and the rest is strongly attenuated in the bone. Under it there is a shadow.",
      fluid: "The line passes through fluid, which hardly attenuates the sound. The scanner turns up as if it were tissue, so the tissue below is brighter (enhancement).",
      weak: "The boundary between {a} and {b} sends only {r} % back: the impedances are similar, so almost all the sound goes on.",
      tilted: "The layer is tilted {t}°, and the boundary is smooth: the echo goes off to the side as from a mirror, so you see almost nothing of the boundary. The wires below can still be seen.",
      rough: "The rough surface scatters the sound in all directions, so some comes back to the probe, even when the layer is tilted.",
      total: "The layer is tilted more than {c}°: the sound cannot get into the bone at all, everything is sent away (total reflection).",
      refr: "The sound bends when it enters the layer at an angle: the wires below are drawn {mm} mm to the side, because the scanner assumes straight lines.",
      muscle: "Muscle attenuates sound more than soft tissue, so everything under the layer is a little darker.",
      noise: "Below about {p} cm there is only noise: the sound is too weak at {f} MHz.",
      base: "Click in the image to choose a line, and look at the graph to see where the sound gets weaker.",
    },
    labels: { fat: "fat", muscle: "muscle", liver: "liver", rib: "rib", shadow: "shadow", gb: "gallbladder", enh: "enhancement",
              gas: "bowel gas", reverb: "reverberation", wires: "wires", layer: "layer", white: "strong echo", black: "no echo",
              noise: "noise limit", ref: "soft tissue", dB: "dB", depthAx: "depth", strength: "strength of the sound" },
    dec: ".",
    modelText: `<p><b>Everything is simulated.</b> The images are worked out from a simple model. No real ultrasound images are used. The probe is linear, and the image is 5 cm wide.</p>
<p><b>Impedance and reflection.</b> Each tissue has an acoustic impedance $Z$ (density times the speed of sound). At a boundary the share $R = \\left(\\frac{Z_2 - Z_1}{Z_2 + Z_1}\\right)^2$ of the sound is sent back, and the rest goes on. Values in MRayl: soft tissue 1.65, fat 1.38, muscle 1.70, fluid 1.52, bone 7.8 and air 0.0004. Soft tissue against fat gives 0.8 %, against bone 42 % and against air 99.9 %.</p>
<p><b>Mirror and scatter.</b> A smooth boundary sends the echo back like a mirror. The probe only gets it when the boundary is nearly at right angles to the sound. The model lets the echo fall with the angle, faster at a higher frequency (−15 dB at 10° at 3.5 MHz). A rough boundary scatters sound in all directions and gives a weaker echo (−12 dB) that does not depend on the angle. Inside the tissue many small structures scatter the sound. That gives the grainy pattern (speckle) and is why you can see tissue from all angles.</p>
<p><b>Attenuation.</b> Sound gets weaker on the way, because the tissue takes it up (absorption) and scatters it. In dB per cm per MHz: soft tissue 0.5, fat 0.6, muscle 1.0, fluid almost 0, bone 20. The scanner automatically turns up the deep echoes as if everything were soft tissue. Behind fluid, which hardly attenuates, it therefore gets too bright (enhancement), and behind bone and air it gets dark (shadow). The noise lies 70 dB below the echo from soft tissue, so the sound reaches about $70/f$ cm in soft tissue.</p>
<p><b>Refraction.</b> When sound enters a tissue with a different speed at an angle, it bends (Snell's law: $\\sin\\theta_2 / \\sin\\theta_1 = c_2 / c_1$). The scanner assumes straight lines and so draws what lies below a little to the side. From soft tissue into bone there is an angle (22°) above which the sound cannot get in at all (total reflection). The model does not bend the sound inside bone and air: almost no sound gets through them anyway.</p>
<p><b>Echoes back and forth.</b> At air the sound bounces back and forth between the boundary and the probe. Each time a new, weaker echo (−12 dB) comes at the same spacing. That is reverberation, which you will meet again in the topic on artefacts.</p>
<p><b>The speed of sound.</b> The speeds are soft tissue 1540, fat 1450, muscle 1580, fluid 1520, bone 4080 and air 330 m/s. The scanner assumes 1540 m/s, so time becomes depth as in U1.</p>
<p><b>Not included.</b> That the beam spreads and gets weaker with distance (divergence) is part of the total attenuation and comes in the topic on the probe (U3). Edge shadows, mirror images and other artefacts come in U5. The numbers are typical textbook values, not numbers from a particular scanner.</p>
<p>Sources: Hoskins, Martin and Thrush, Diagnostic Ultrasound: Physics and Equipment, 3rd ed. (2019). Gibbs, Cole and Sassano, Ultrasound Physics and Technology (2009). Kremkau, Sonography Principles and Instruments. Bushberg et al., The Essential Physics of Medical Imaging, the ultrasound chapter.</p>`,
    groups: [
      ["Gel and air", [
        ["Without gel", "Press Reset all, and set Gel to Off. What do you see, and why?", "The image is black with bright stripes at the top. Without gel there is air between the probe and the skin, and at air 99.9 % of the sound is sent back. The small rest that gets in is too weak to make an image. The stripes are the sound bouncing back and forth between the probe and the air. That is why you use gel."],
        ["Bowel gas", "Gel on. Click the line down through the bowel gas on the right. What does the graph show, and what do you see under the gas?", "The graph drops straight down at the gas: almost all the sound is sent back, and what gets in is attenuated completely. At the top of the gas there is a very bright echo. Under it there is a shadow with weak repeated echoes (reverberation). You cannot see through bowel gas. Move the probe, or press gently to push the gas away."],
        ["Air in the phantom", "Choose Phantom and Material Air. Where are the bright stripes under the layer, and why are they there?", "The top of the layer is at 3 cm, and the stripes come at 6, 9 and 12 cm: the sound bounces back and forth between the air and the probe, and each trip takes as long as the first. You see the same in the lung, where horizontal lines appear under the pleura (A-lines)."],
      ]],
      ["Impedance and reflection", [
        ["Fat", "Choose Phantom and Material Fat. How much of the sound is sent back at the boundary, and how much goes on?", "0.8 % is sent back, and 99.2 % goes on. The boundary shows as a bright line, but almost all the sound carries on, so the wires below are seen well. It is the small reflections at many boundaries that make the image."],
        ["Muscle and fluid", "Change Material to Muscle and then to Fluid. How much is sent back now?", "Muscle: 0.02 %. Fluid: 0.17 %. The impedances are similar to soft tissue (1.70 and 1.52 against 1.65 MRayl), so the boundaries give only weak echoes. Inside the fluid it is black, because nothing scatters the sound."],
        ["Bone", "Change Material to Bone. How much is sent back, and why is it black under the layer?", "42 % is sent back, because the impedance of bone (7.8 MRayl) is far from soft tissue. What gets in is strongly attenuated in the bone (20 dB per cm per MHz). No sound reaches below the bone: a shadow."],
        ["The rib", "Choose Body, and press Reset all. The line goes through the rib. What do you see under it, and what do you do in the clinic?", "At the top of the rib there is a bright echo, and under it a black shadow all the way down. The liver behind the rib cannot be seen. In the clinic you scan between the ribs (intercostally), or ask the patient to breathe in deeply, so the liver comes down below the ribs."],
        ["What decides the echo?", "Compare the boundaries fat → muscle in Body and soft tissue → fat in Phantom. What decides how much is sent back?", "The difference in impedance between the two tissues. Fat against muscle (1.38 against 1.70) gives 1.1 %, soft tissue against fat (1.65 against 1.38) 0.8 %. It is not the tissue's own brightness, but how different the two tissues are."],
      ]],
      ["Angle and surface", [
        ["Tilted boundary", "Phantom, Fat. Set Tilt to 0°, 10° and 20°. What happens to the boundary's echo and to the wires below?", "At 0° the boundary is a bright line. At 10° the echo is 15 dB weaker, and at 20° the boundary has almost gone. The wires below can still be seen. A smooth boundary acts like a mirror: when it is tilted, the echo goes off to the side and misses the probe."],
        ["Rough surface", "Set Surface to Rough at 20°. And then at 0°. How does it differ from the smooth boundary?", "The rough boundary gives a weaker echo than the smooth one at 0°, but it is seen at all angles, because it scatters sound in all directions. That is why the liver and other tissue can be seen from all angles: the small structures scatter."],
        ["The gallbladder", "Choose Body, and click the line through the gallbladder. Why is the wall bright at the top and bottom, but weaker at the sides?", "At the top and bottom the wall is at right angles to the sound, so the echo comes straight back. At the sides the wall is tilted, so the echo goes off to the side. The angle matters for all smooth boundaries: vessels, tendons and needles (the topic on artefacts)."],
        ["The grain", "Look at the liver around the gallbladder. Why can you see the liver, even though it has no smooth boundaries?", "The liver is made of many small structures that scatter the sound in all directions. The echoes mix and give the grainy pattern (speckle). The scatter is weak, but it does not depend on the angle."],
      ]],
      ["Attenuation", [
        ["Under the gallbladder", "Body, 3.5 MHz. Click the line through the gallbladder. Is the liver under the gallbladder brighter or darker than beside it? Also try 7 MHz.", "Brighter: enhancement. Bile hardly attenuates the sound, but the scanner turns up as if it were liver. At 3.5 MHz there is 2.6 dB more sound at 10 cm, at 7 MHz 5.3 dB. Enhancement behind something is a sign of fluid, for example a cyst."],
        ["The graph", "Phantom, Fluid, the line through the middle. Where does the graph fall, and where is it flat?", "The graph falls evenly in the soft tissue: the sound is attenuated all the way. In the fluid it is flat, because fluid hardly attenuates. Under the layer the graph therefore lies above the dashed curve for soft tissue."],
        ["Frequency and attenuation", "Phantom, Fat, Depth 16 cm. Look at the graph at 3.5 and 7 MHz. Where does it meet the noise limit?", "At 7 MHz the graph falls twice as fast, because attenuation grows with frequency. It meets the noise limit at about 10 cm. At 3.5 MHz the sound reaches all the way down. A high frequency is sharper, but does not reach as deep."],
        ["Muscle", "Phantom, Muscle. Are the wires under the layer as clear as under fat?", "A little weaker. Muscle attenuates twice as much as soft tissue (1.0 against 0.5 dB per cm per MHz), so there is 3.6 dB less sound under the layer at 3.5 MHz. The boundary itself is almost invisible."],
      ]],
      ["Refraction", [
        ["The sound bends", "Phantom, Fat, Tilt 30°. Look at the refraction in the numbers. Where are the wires under the layer drawn?", "The sound goes in at 30° and continues at 28° in the fat, because sound is slower in fat. The wires below are drawn 0.8 mm to the side. The scanner assumes that sound goes straight down. The shift is small here, but at the edge of round structures refraction can give edge shadows (U5)."],
        ["Total reflection", "Deeper level: Phantom, Bone. Set Tilt from 10° to 25°. What happens at about 22°?", "Above 22° the sound cannot get into the bone at all: everything is sent away (total reflection), because sound is much faster in bone (4080 m/s). Below 22° the sound bends strongly away from vertical. There is a shadow under the bone in both cases.", { deep: true }],
        ["Angle and frequency", "Deeper level: Phantom, Fat, Tilt 10°. Compare the boundary's echo at 3.5 and 10 MHz.", "At 3.5 MHz the echo is 15 dB weaker than at 0°, at 10 MHz 42 dB weaker. At a high frequency the mirror is more precise, so the angle matters even more. Hold the probe at right angles to what you want to see.", { deep: true }],
      ]],
    ],
  },
};

const $ = id => document.getElementById(id);
let M = TM.model(S);
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
// percent with as many decimals as it needs
function pct(p) {
  if (p >= 99 && p < 100) return `${fmt(Math.floor(p * 10) / 10, 1)} %`;
  if (p >= 10) return `${fmt(p, 0)} %`;
  if (p >= 0.5) return `${fmt(p, 1)} %`;
  if (p >= 0.01) return `${fmt(p, 2)} %`;
  return `< ${fmt(0.01, 2)} %`;
}

// ---- fixed random scatterers (complex) and electronic noise, made once ----
const NX = TM.NX, NZ = TM.NZ, RE = new Float32Array(NX * NZ), IM = new Float32Array(NX * NZ), NOISE = new Float32Array(NX * NZ);
{
  let seed = 23;
  const rnd = () => { seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t ^= t + Math.imul(t ^ t >>> 7, 61 | t); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  for (let i = 0; i < NX * NZ; i++) {
    const r = Math.sqrt(-Math.log(rnd() + 1e-9)), a = 2 * Math.PI * rnd();
    RE[i] = r * Math.cos(a); IM[i] = r * Math.sin(a); NOISE[i] = -Math.log(rnd() + 1e-9);
  }
}
const cellX = i => -TM.W / 2 + (i + 0.5) * TM.DX;
const ix = x => Math.round((x + TM.W / 2) / TM.DX - 0.5), iz = z => Math.round(z / TM.DZ - 0.5);

// ---- the echo field where the scanner draws it, worked out again only when something that changes it changes ----
const ENV = new Float32Array(NX * NZ);
let KEY = "";
function field() {
  const key = [S.scene, S.layer, S.tilt, S.surface, S.gel, S.f].join("|");
  if (key === KEY) return;
  KEY = key;
  const ar = new Float32Array(NX * NZ), ai = new Float32Array(NX * NZ);
  const wires = S.scene === "phantom" ? TM.PH.wireZ.flatMap(z => TM.PH.wires.map(x => [x, z])) : [];
  const wa = TM.WIRE_DB;
  // each drawn row takes the scatterer at the true place the sound came from (one sample per row, so the grain is
  // even also where the speed changes)
  const SX = new Float32Array(2 * NZ + 8), SZ = new Float32Array(2 * NZ + 8), SD = new Float32Array(2 * NZ + 8), SA = new Float32Array(2 * NZ + 8);
  for (let i = 0; i < NX; i++) {
    const seen = new Set();
    let n = 0;
    TM.trace(cellX(i), S, (x, z, zd, I, m) => {
      if (n < SX.length) { SX[n] = x; SZ[n] = z; SD[n] = zd; SA[n] = 10 ** ((TM.MAT[m].bs + 2 * I) / 20); n++; }
      if (wires.length && Math.abs(z - Math.round(z)) < TM.DZ) for (let w = 0; w < wires.length; w++) {
        const [wx, wz] = wires[w], r = iz(zd);
        if (Math.abs(z - wz) < TM.DZ / 2 && Math.abs(x - wx) < TM.DX / 2 && !seen.has(w) && r >= 0 && r < NZ) { seen.add(w); ar[r * NX + i] += 10 ** ((wa + 2 * I) / 20); }
      }
    }, (zd, db) => {
      const r = iz(zd); if (r < 0 || r >= NZ || db < -150) return;
      ar[r * NX + i] += 10 ** (db / 20);
    });
    let k = 0;
    for (let r = 0; r < NZ && n; r++) {
      const zc = (r + 0.5) * TM.DZ;
      while (k + 1 < n && Math.abs(SD[k + 1] - zc) <= Math.abs(SD[k] - zc)) k++;
      if (Math.abs(SD[k] - zc) > TM.DZ) continue;              // the sound never got here
      const ci = ix(SX[k]), cj = iz(SZ[k]);
      if (ci < 0 || ci >= NX || cj < 0 || cj >= NZ) continue;
      const o = cj * NX + ci;
      ar[r * NX + i] += SA[k] * RE[o]; ai[r * NX + i] += SA[k] * IM[o];
    }
  }
  // down: a 2-cycle pulse, half its length on the screen, with the phase
  const sz = TM.axial(S) / 10 / 2.355, mz = Math.ceil(3 * sz / TM.DZ), lamCm = TM.lambda(S) / 10;
  const kr = [], ki = []; let nz = 0;
  for (let m = -mz; m <= mz; m++) { const g = Math.exp(-0.5 * (m * TM.DZ / sz) ** 2), ph = 4 * Math.PI * m * TM.DZ / lamCm; kr.push(g * Math.cos(ph)); ki.push(g * Math.sin(ph)); nz += g * g; }
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
  // sideways: the beam's width
  const sx = TM.beam(S) / 10 / 2.355, mx = Math.max(1, Math.ceil(3 * sx / TM.DX)), kx = []; let nx = 0;
  for (let m = -mx; m <= mx; m++) { const g = Math.exp(-0.5 * (m * TM.DX / sx) ** 2); kx.push(g); nx += g * g; }
  const norm = nz * nx;
  for (let j = 0; j < NZ; j++) for (let i = 0; i < NX; i++) {
    let sr = 0, si = 0;
    for (let m = -mx; m <= mx; m++) { const ii = clamp(i + m, 0, NX - 1), o = j * NX + ii; sr += br[o] * kx[m + mx]; si += bi[o] * kx[m + mx]; }
    ENV[j * NX + i] = 10 * Math.log10((sr * sr + si * si) / norm + 1e-12);
  }
}

// ---- the image: the automatic depth gain takes back soft tissue's attenuation, up to a ceiling for the noise ----
const MID = -5, DR = 60, TGC_TOP = -14;
const rowsShown = () => Math.round(S.depth / TM.DZ);
function shownDb(i, r) {
  const zd = (r + 0.5) * TM.DZ, att = 2 * TM.ALPHA * S.f * zd, gain = Math.min(att, TGC_TOP - TM.NOISE_DB);
  const noise = 10 ** ((TM.NOISE_DB + gain) / 10) * NOISE[(r % NZ) * NX + i];
  return 10 * Math.log10(10 ** ((ENV[r * NX + i] + gain) / 10) + noise);
}
const grey = db => clamp(0.5 + (db - MID) / DR, 0, 1);
let BUF = null;
function imgRect(W, H) {
  const h = H - 10, w = Math.min(W - 150, h * TM.W / S.depth), hh = w * S.depth / TM.W;
  return { x0: (W - w) / 2, y0: 5, w, h: hh, sc: w / TM.W };
}
function drawImg() {
  const cv = $("img"), [ctx, W, H] = fit(cv);
  ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H);
  field();
  const R = imgRect(W, H), nr = rowsShown();
  const step = Math.max(1, Math.floor(nr / (R.h * 2))), rows = Math.ceil(nr / step);
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
  const L = T[S.lang], Lb = L.labels, P = (x, zd) => [R.x0 + (x + TM.W / 2) * R.sc, R.y0 + zd * R.sc];
  const ink = "rgba(255,255,255,.85)", amber = css("--amber") || "#f0b450";
  ctx.strokeStyle = ink; ctx.lineWidth = 1;
  const every = S.depth > 10 ? 2 : 1;
  for (let z = 0; z <= S.depth + 1e-9; z += 0.5) {
    const y = R.y0 + z * R.sc, whole = Math.abs(z - Math.round(z)) < 1e-6;
    ctx.beginPath(); ctx.moveTo(R.x0 + R.w + 3, y); ctx.lineTo(R.x0 + R.w + (whole ? 10 : 6), y); ctx.stroke();
    if (whole && Math.round(z) % every === 0) text(ctx, String(z), R.x0 + R.w + 13, y + 4, ink, "left", 11, "--mono");
  }
  text(ctx, "cm", R.x0 + R.w + 13, R.y0 + 0.4 * R.sc + 4, ink, "left", 10, "--mono");
  const gx = R.x0 - 30, gt = R.y0 + 6, gh = Math.min(160, R.h * 0.4);
  for (let k = 0; k < gh; k++) { const v = Math.round(255 * (1 - k / gh)); ctx.fillStyle = `rgb(${v},${v},${v})`; ctx.fillRect(gx, gt + k, 10, 1); }
  ctx.strokeStyle = "rgba(255,255,255,.4)"; ctx.strokeRect(gx - 0.5, gt - 0.5, 11, gh + 1);
  if (gh >= 140) {
    ctx.save(); ctx.translate(gx - 5, gt); ctx.rotate(-Math.PI / 2);
    text(ctx, Lb.black, -gh, 0, "rgba(255,255,255,.6)", "left", 10); text(ctx, Lb.white, 0, 0, "rgba(255,255,255,.6)", "right", 10);
    ctx.restore();
  }
  ctx.fillStyle = amber; ctx.beginPath(); ctx.arc(R.x0 + 6, R.y0 + 6, 4, 0, 2 * Math.PI); ctx.fill();
  text(ctx, `${fmt(S.f, 1)} MHz`, R.x0 + R.w - 6, R.y0 + 14, ink, "right", 11, "--mono");
  const [lx] = P(S.x, 0);
  ctx.setLineDash([3, 4]); ctx.strokeStyle = "rgba(240,180,80,.75)"; ctx.beginPath(); ctx.moveTo(lx, R.y0); ctx.lineTo(lx, R.y0 + R.h); ctx.stroke(); ctx.setLineDash([]);
  if (!S.names || !S.gel) return;
  const lab = (s, x, z, align = "center") => { if (z > S.depth - 0.2 || z < 0.2) return; const [px, py] = P(x, z); label(ctx, s, px, py, ink, align); };
  if (S.scene === "body") {
    const B = TM.BODY;
    lab(Lb.fat, 0.3, 1.0);
    lab(Lb.muscle, 0.6, 2.2);
    lab(Lb.rib, B.rib.x, B.rib.z - B.rib.rz - 0.1);
    lab(Lb.shadow, B.rib.x, B.rib.z + 2.2);
    lab(Lb.liver, 0.9, 3.4);
    lab(Lb.gb, B.gb.x, B.gb.z + 0.1);
    lab(Lb.enh, B.gb.x, B.gb.z + B.gb.rz + 1.6);
    lab(Lb.gas, B.gas.x, B.gas.z - B.gas.rz - 0.25);
    lab(Lb.reverb, B.gas.x, 2 * (B.gas.z - B.gas.rz) + 0.5);
  } else {
    const yTop = TM.PH.zc - TM.PH.half / Math.cos(S.tilt * Math.PI / 180);
    lab(`${Lb.layer}: ${L.mats[S.layer]}`, -1.3, yTop - 0.25 - 1.3 * Math.tan(S.tilt * Math.PI / 180));
    lab(Lb.wires, 1.6, TM.PH.wireZ[0] - 0.4, "center");
  }
}
function label(ctx, s, x, y, col, align = "left") {
  ctx.font = `12px ${css("--body")}`; ctx.lineWidth = 3; ctx.strokeStyle = "rgba(0,0,0,.75)"; ctx.textAlign = align; ctx.strokeText(s, x, y); text(ctx, s, x, y, col, align, 12);
}

// ---- the graph: the sound's strength on its way down the chosen line ----
const MATCOL = { soft: "rgba(140,150,170,.10)", skin: "rgba(230,190,160,.22)", fat: "rgba(240,200,90,.22)", muscle: "rgba(220,110,110,.20)",
                 fluid: "rgba(90,160,240,.28)", wall: "rgba(200,200,200,.22)", bone: "rgba(255,255,255,.45)", air: "rgba(0,0,0,.6)" };
function drawGraph() {
  const cv = $("graph"), [ctx, W, H] = fit(cv), L = T[S.lang], Lb = L.labels;
  const mut = css("--muted") || "#8a93a6", fg = css("--fg") || "#e8ecf3", line = css("--line") || "#2a3142";
  const x0 = 46, x1 = W - 14, y0 = 18, y1 = H - 34, YMIN = -60;
  const X = zd => x0 + zd / S.depth * (x1 - x0), Y = db => y0 + clamp(db, YMIN, 0) / YMIN * (y1 - y0);
  // the tissue along the line, as coloured bands
  const pts = []; let segStart = 0, segMat = null;
  const bands = [];
  TM.trace(S.x, S, (x, z, zd, I, m) => {
    if (zd > S.depth) return;
    pts.push([zd, I]);
    if (m !== segMat) { if (segMat) bands.push([segStart, zd, segMat]); segStart = zd; segMat = m; }
  });
  if (segMat) bands.push([segStart, Math.min(S.depth, pts.length ? pts[pts.length - 1][0] : 0), segMat]);
  const lastZ = pts.length ? pts[pts.length - 1][0] : 0;
  if (lastZ < S.depth - 0.05) bands.push([lastZ, S.depth, "air"]);
  for (const [a, b, m] of bands) { ctx.fillStyle = MATCOL[m] || MATCOL.soft; ctx.fillRect(X(a), y0, Math.max(1, X(b) - X(a)), y1 - y0); }
  // names of the bands that are wide enough
  for (const [a, b, m] of bands) if (X(b) - X(a) > 34 && m !== "soft") text(ctx, L.mats[m], (X(a) + X(b)) / 2, y1 - 6, fg, "center", 10);
  ctx.strokeStyle = line; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0, y1); ctx.lineTo(x1, y1); ctx.stroke();
  // the noise limit: an echo from soft tissue drowns when the sound is 35 dB down on the way (70 dB there and back)
  ctx.strokeStyle = "#e0605a"; ctx.setLineDash([2, 3]); ctx.beginPath(); ctx.moveTo(x0, Y(-35)); ctx.lineTo(x1, Y(-35)); ctx.stroke(); ctx.setLineDash([]);
  text(ctx, Lb.noise, x1 - 2, Y(-35) - 4, "#e0605a", "right", 10);
  // soft tissue for comparison
  ctx.strokeStyle = mut; ctx.setLineDash([5, 4]); ctx.beginPath(); ctx.moveTo(X(0), Y(0)); ctx.lineTo(X(S.depth), Y(-TM.ALPHA * S.f * S.depth)); ctx.stroke(); ctx.setLineDash([]);
  // the line itself
  const g = S.gel ? 0 : 10 * Math.log10(1 - TM.refl("soft", "air"));
  ctx.strokeStyle = "#6fd3e0"; ctx.lineWidth = 2; ctx.beginPath();
  ctx.moveTo(X(0), Y(g));
  for (const [zd, I] of pts) ctx.lineTo(X(zd), Y(I));
  if (lastZ < S.depth - 0.05) { ctx.lineTo(X(lastZ), Y(YMIN)); }
  ctx.stroke(); ctx.lineWidth = 1;
  // axes
  for (let db = 0; db >= YMIN; db -= 20) text(ctx, String(db), x0 - 6, Y(db) + 4, mut, "right", 10, "--mono");
  ctx.save(); ctx.translate(12, (y0 + y1) / 2); ctx.rotate(-Math.PI / 2); text(ctx, `${Lb.strength} (dB)`, 0, 0, mut, "center", 11); ctx.restore();
  const dStep = S.depth > 10 ? 2 : 1;
  for (let z = 0; z <= S.depth; z += dStep) text(ctx, String(z), X(z), y1 + 14, mut, "center", 10, "--mono");
  text(ctx, `${Lb.depthAx} (cm)`, (x0 + x1) / 2, y1 + 28, mut, "center", 11);
}

// ---- numbers and what you can see ----
function metrics() {
  const L = T[S.lang], m = M, out = [], mats = L.mats;
  if (!S.gel) out.push(["err", "gel", pct(100 * m.gelR), L.f.gel]);
  if (S.scene === "phantom") {
    out.push(["", "Z", `${fmt(m.Z, m.Z < 0.01 ? 4 : 2)} MRayl`, L.f.Z]);
    out.push([m.R > 0.1 ? "err" : "", "R", pct(100 * m.R), L.f.R(mats.soft, mats[S.layer])]);
    out.push(["", "T", pct(100 * (1 - m.R)), L.f.T]);
    out.push([m.through < -10 ? "err" : m.through > 0.5 ? "ok" : "", "under", m.through < -100 ? "≈ 0" : `${m.through >= 0 ? "+" : "−"}${fmt(Math.abs(m.through), 1)} dB`, L.f.under(m.through)]);
    if (S.tilt > 0 || S.surface === "rough") out.push([m.lobe < -10 ? "err" : "", "lobe", `${m.lobe >= 0 ? "" : "−"}${fmt(Math.abs(m.lobe), 0)} dB`, L.f.lobe(S.tilt, S.surface === "rough")]);
    if (S.tilt > 0 && !["air"].includes(S.layer)) out.push([m.total ? "err" : "", "refr", m.total ? "–" : `${S.tilt}° → ${fmt(m.refr, 1)}°`, L.f.refr(m.total)]);
  } else {
    const b = m.strong;
    if (b && S.gel) out.push([b.R > 0.1 ? "err" : "", "strong", pct(100 * b.R), L.f.strong(mats[b.m1], mats[b.m2])]);
    if (b && S.gel) out.push(["", "T", pct(100 * (1 - b.R)), L.f.T]);
    if (S.gel) out.push([m.diff10 < -10 ? "err" : m.diff10 > 0.5 ? "ok" : "", "at10", m.diff10 < -100 ? "≈ 0" : `${m.diff10 >= 0 ? "+" : "−"}${fmt(Math.abs(m.diff10), 1)} dB`, L.f.at10(m.diff10)]);
  }
  out.push([m.pen < S.depth ? "err" : "ok", "pen", `${fmt(m.pen, 0)} cm`, L.f.pen(m.pen, S.depth)]);
  return out;
}
function observations() {
  const L = T[S.lang], E = L.see, out = [], add = (on, t) => { if (on) out.push(t); }, mats = L.mats;
  if (!S.gel) return [E.gel];
  const hit = new Set(M.bounds.map(b => b.m2));
  if (S.scene === "phantom") {
    add(S.layer === "bone" && M.total, E.total.replace("{c}", fmt(M.crit || 0, 0)));
    add(S.layer === "air", E.air);
    add(S.layer === "bone" && !M.total, E.bone.replace("{r}", fmt(100 * M.R, 0)));
    add(S.tilt >= 8 && S.surface === "smooth" && !["air", "bone"].includes(S.layer), E.tilted.replace("{t}", S.tilt));
    add(S.surface === "rough" && S.tilt >= 8, E.rough);
    add(S.tilt >= 15 && ["fat", "muscle", "fluid"].includes(S.layer) && Math.abs(M.shift) >= 0.02, E.refr.replace("{mm}", fmt(Math.abs(M.shift || 0) * 10, 2)));
    add(S.layer === "fluid", E.fluid);
    add(S.layer === "muscle", E.muscle);
    add(["fat", "muscle", "fluid"].includes(S.layer) && S.tilt < 8, E.weak.replace("{a}", mats.soft).replace("{b}", mats[S.layer]).replace("{r}", fmt(100 * M.R, S.layer === "muscle" ? 2 : 1)));
  } else {
    add(hit.has("air"), E.air);
    add(hit.has("bone"), E.bone.replace("{r}", fmt(100 * TM.refl("muscle", "bone"), 0)));
    add(hit.has("fluid"), E.fluid);
  }
  add(M.pen < S.depth, E.noise.replace("{p}", fmt(M.pen, 0)).replace("{f}", fmt(S.f, 1)));
  return out.length ? out.slice(0, 2) : [E.base];
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
const SLIDERS = {
  f: [2, 15, 0.5, v => `${fmt(v, 1)} MHz`],
  depth: [4, 16, 1, v => `${v} cm`],
  tilt: [0, 30, 1, v => `${v}°`],
  x: [-2.4, 2.4, 0.05, v => `${v >= 0 ? "+" : "−"}${fmt(Math.abs(v), 2)} cm`],
};
function buildControls() {
  const L = T[S.lang], C = L.ctl, box = $("controls");
  const help = k => S.level === "grund" && L.help[k] ? `<p class="help">${L.help[k]}</p>` : "";
  const seg = (k, opts) => `<div class="ctl"><label><span>${C[k]}</span><span></span></label><div class="seg">` +
    opts.map(([val, lbl]) => `<button data-k="${k}" data-v="${val}" aria-pressed="${String(S[k]) === String(val)}">${lbl}</button>`).join("") +
    `</div>${help(k)}</div>`;
  const slider = k => {
    const [mn, mx, st, f] = SLIDERS[k];
    return `<div class="ctl"><label for="s-${k}"><span>${C[k]}</span><span id="o-${k}">${f(S[k])}</span></label>` +
      `<input type="range" id="s-${k}" min="${mn}" max="${mx}" step="${st}" value="${S[k]}">${help(k)}</div>`;
  };
  const grp = k => `<h3 class="grp">${L.grp[k]}</h3>`;
  const mats = ["fat", "muscle", "fluid", "bone", "air"].map(m => [m, L.mats[m][0].toUpperCase() + L.mats[m].slice(1)]);
  box.innerHTML = grp("scene") + seg("scene", [["body", C.body], ["phantom", C.phantom]]) + seg("names", [["false", C.off], ["true", C.on]]) +
    grp("probe") + seg("gel", [["true", C.on], ["false", C.off]]) + slider("f") + slider("depth") +
    (S.scene === "phantom" ? grp("layer") + seg("layer", mats) + slider("tilt") + seg("surface", [["smooth", C.smooth], ["rough", C.rough]]) : "") +
    grp("line") + slider("x") +
    `<div class="ctl last"><button class="reset" id="reset">${C.reset}</button></div>`;
  box.querySelectorAll("button[data-k]").forEach(b => b.onclick = () => {
    const k = b.dataset.k, v = b.dataset.v;
    S[k] = v === "true" ? true : v === "false" ? false : v;
    if (k === "scene") { PIN = null; S.x = S.scene === "body" ? START.x : 0; S.depth = S.scene === "body" ? 12 : 14; }
    buildControls(); update();
  });
  for (const k of Object.keys(SLIDERS)) {
    const el = $(`s-${k}`); if (!el) continue;
    el.oninput = () => { S[k] = +el.value; $(`o-${k}`).textContent = SLIDERS[k][3](+el.value); updateSoon(); };
  }
  $("reset").onclick = () => { const keep = { lang: S.lang, level: S.level }; Object.assign(S, clone(START), keep); PIN = null; buildControls(); update(); };
}
$("img").addEventListener("click", e => {
  const r = $("img").getBoundingClientRect(), R = imgRect(r.width, r.height);
  const x = (e.clientX - r.left - R.x0) / R.sc - TM.W / 2;
  if (x < -TM.W / 2 || x > TM.W / 2) return;
  S.x = +clamp(x, -2.4, 2.4).toFixed(2);
  const el = $("s-x"); if (el) { el.value = S.x; $("o-x").textContent = SLIDERS.x[3](S.x); }
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
  readouts();
}
function update() { M = TM.model(S); render(); }
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
