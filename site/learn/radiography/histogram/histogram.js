// ---- text ----------------------------------------------------------------
const T = {
  da: {
    title: "Fra tal til billede", simTitle: "Simulator: Histogram og vindue",
    sub: "Video 1b om det digitale billede: hvordan tallene fra detektoren bliver til billedet på skærmen. Se videoen først, og arbejd så med opgaverne i simulatoren.",
    grund: "Grund", deep: "Fordybelse",
    image: "Billedet på skærmen", hist: "Histogram og REX",
    synth: "Syntetisk knæ, regnet ud fra en simpel model af stråling og støj.",
    histnote: "Hold musen over histogrammet eller billedet (på telefon: hold fingeren på det), så lyser de pixel op, der har de værdier.",
    voi: "anatomien, som analysen fandt den", win: "vindue", strip: "gråtone på skærmen",
    wlMid: "midt på anatomien", lighter: "lysere", darker: "mørkere",
    wwAll: "dækker anatomien", moreC: "mere kontrast", lessC: "mindre kontrast", rawNum: "rå tal",
    of: "af", prev: "Forrige opgave", next: "Næste opgave",
    value: "værdi (mere stråling →)", count: "antal pixel",
    bone: "knogle", soft: "bløddel", background: "baggrund", collimation: "uden for indblænding",
    noisy: "for meget støj", ok: "i orden", tooMuch: "for høj dosis",
    krex: "REX (Canon)", kwin: "Vindue",
    zone: { noisy: "Under 125: for meget støj", ok: "125–400: i orden", tooMuch: "Over 400: højere dosis uden bedre billede" },
    di: "DI, med rigtig dosis som mål", clipped: "klippet",
    ctl: {
      dose: "Dosis i forhold til rigtig", coll: "Indblænding", good: "God", poor: "For lidt",
      auto: "Automatisk skalering", on: "Til", off: "Fra", lut: "LUT", linear: "Lineær", s: "S-kurve",
      wl: "Vinduets midte, WL", ww: "Vinduets bredde, WW", clip: "Vis klipning", names: "Vis navne på billedet", reset: "Nulstil",
    },
    tasks: "Opgaver",
    seen: "Det kan du se:", pin: "Gem billedet", unpin: "Fjern det gemte", saved: "gemt",
    see: {
      noAutoMore: "Uden skalering bliver billedet mørkere med mere dosis, ligesom med film.",
      noAutoLess: "Uden skalering bliver billedet lysere med mindre dosis, ligesom med film.",
      coll: "For lidt indblænding: analysen tager baggrund med som anatomi, så REX viser for højt.",
      low: "REX {r} er under 125. Billedet er kornet, men lysheden afslører det ikke.",
      high: "REX {r} er over 400. Patienten fik mere stråling end nødvendigt, men billedet ser ens ud.",
      clipped: "{p} % af anatomien falder uden for vinduet og er klippet.",
      narrow: "Smalt vindue: mere kontrast i det, der ligger inde i vinduet.",
      ok: "REX {r} er i orden. Prøv at ændre dosis: lysheden ændrer sig ikke, men REX gør.",
    },
    model: "Sådan virker modellen",
    modelText: "<p>Knæet er tegnet på computeren: 200 × 200 pixel, hvor hver pixel er uden for indblændingen, baggrund, bløddel eller knogle. Værdien i hver pixel er $$v = 7000 \\cdot D \\cdot e^{-(0,8 \\cdot s + 1,2 \\cdot k)}$$ hvor $D$ er dosis i forhold til den rigtige, og $s$ og $k$ er hvor meget bløddel og knogle strålen går igennem. Oven i kommer støj, der vokser med kvadratroden af signalet, ligesom rigtig kvantestøj.</p><p>Analysen finder anatomiens værdier (fra 1 % til 99 % af dem, plus en margen), og vinduet lægges over dem. REX er her proportional med anatomiens medianværdi og sat til 220 ved rigtig dosis. Grænserne 125 og 400 er undervisningens tommelfingerregler for Canon-anlæg, ikke fabrikantens tal. Rigtige anlæg bruger deres egne, mere avancerede algoritmer.</p><p>Kilder: IEC 62494-1 om eksponeringsindeks (EI og DI). AAPM TG-116 om eksponeringsindeks. Bushong, Radiologic Science for Technologists.</p>",
    help: {
      dose: "Hvor meget stråling knæet fik, i forhold til den rigtige dosis.",
      coll: "Om feltet er blændet ind til knæet, eller om meget baggrund kommer med.",
      auto: "Systemet lægger vinduet over anatomien, så billedet altid får samme lyshed.",
      lut: "Kurven, der giver hver værdi sin gråtone. Den er valgt i protokollen.",
      wl: "Flytter vinduet. Plus gør billedet lysere, minus mørkere.",
      ww: "Smallere vindue giver mere kontrast, bredere giver mindre.",
      clip: "Viser med rødt den anatomi, der falder uden for vinduet.",
      names: "Skriver navnene på knæets dele på billedet.",
    },
    groups: [
      ["Histogrammet", [
        ["Hvad er toppene?", "Hold musen over hver top i histogrammet. Hvilke dele af knæet lyser op? Hvorfor ligger knoglen til venstre, når den er hvid på billedet?",
         "Toppen til venstre er knoglen, den midterste bløddelene, toppen til højre baggrunden, og toppen helt ved 0 er området uden for indblændingen. Knoglen standser mest stråling og får derfor lave værdier. Skærmen vender det om: lidt stråling bliver lyst."],
        ["Toppen ved nul", "Hvad er toppen helt nede ved 0? Sæt indblændingen til \"For lidt\". Hvad sker der med den?",
         "Det er pixel uden for indblændingen, som næsten ingen stråling har fået. Ved for lidt indblænding forsvinder den, og baggrundstoppen bliver større, fordi mere af feltet rammer detektoren direkte."],
        ["Mere dosis i histogrammet", "Sæt dosis til ×4. Hvad sker der med histogrammet? Og med billedet?",
         "Hele histogrammet flytter mod højre og bliver bredere, fordi alle pixel får mere stråling. Billedet ser næsten ens ud, fordi den automatiske skalering flytter vinduet med."],
      ]],
      ["EI og REX", [
        ["Laveste dosis", "Find den laveste dosis, hvor REX stadig er over 125. Hvordan ser billedet ud lige under grænsen?",
         "×0,7 giver REX omkring 153. Ved ×0,5 falder REX til omkring 109, og billedet bliver tydeligt kornet. Lysheden er den samme hele vejen, så det er REX og støjen, der fortæller, at dosis er for lav."],
        ["For meget dosis", "Sæt dosis til ×2 og derefter ×4. Bliver billedet mørkere? Hvad siger REX?",
         "Nej, billedet er lige lyst, for den automatiske skalering flytter vinduet med. Men REX stiger til omkring 440 og 890. Patienten har fået to og fire gange så meget stråling, uden at billedet er blevet bedre at stille diagnose på."],
        ["Højeste dosis i orden", "Hvilket dosistrin er det højeste, hvor REX stadig er under 400?",
         "×1,4 giver REX omkring 310. Ved ×2 er REX omkring 440, over grænsen. Grænsen ligger altså mellem 1,4 og 2 gange den rigtige dosis."],
        ["Indblænding", "Sæt dosis til ×1 og indblændingen til \"For lidt\". Hvad sker der med REX og billedet, selvom dosis er den samme?",
         "REX stiger fra 220 til omkring 290, og anatomien bliver lysere. Histogramanalysen tager en del af baggrunden for anatomi, så den regner forkert. Det samme kan ske med metal i feltet."],
        ["Indblænding skjuler lav dosis", "Sæt dosis til ×0,5 og indblændingen til \"For lidt\". Hvad siger REX nu? Kan man stole på det?",
         "REX er omkring 150, altså i orden, selvom dosis er halveret og billedet er kornet. Analysen har taget baggrund med som anatomi og regner for højt. God indblænding er en forudsætning for, at REX kan bruges."],
      ]],
      ["Automatisk skalering", [
        ["Uden skalering", "Slå automatisk skalering fra, og skift dosis op og ned. Hvad sker der nu?",
         "Nu bliver billedet mørkere med mere dosis og lysere med mindre, ligesom med film. Den automatiske skalering er grunden til, at et digitalt billede ser rigtigt ud, selvom dosis var forkert."],
        ["Ud af vinduet", "Slå skalering fra og klipning til. Sæt dosis til ×4. Hvor ligger histogrammet nu i forhold til vinduet?",
         "Histogrammet er gledet ud til højre for vinduet, så store dele af anatomien klippes og bliver helt sort. Uden skalering ville en forkert dosis ødelægge billedet, ligesom med film."],
        ["Dose creep", "En kollega siger: \"Billedet ser fint ud, så dosis var fin.\" Brug simulatoren til at vise, hvorfor det ikke holder. Hvad skal radiografen kigge på i stedet?",
         "Billedet ser ens ud fra ×1 til ×4, fordi skaleringen retter lysheden. Kun REX, eller EI og DI, afslører dosis. Hvis ingen kigger på REX, kan dosis langsomt snige sig op. Det er dose creep."],
      ]],
      ["LUT", [
        ["Lineær eller S-kurve", "Skift mellem lineær og S-kurve. Hvor i billedet ser du forskellen tydeligst?",
         "S-kurven giver mere kontrast i midten af værdierne, altså i bløddele og knoglens struktur. I enderne bliver kurven flad, så de lyseste og mørkeste værdier presses sammen."],
        ["Gråtonestriben", "Se på gråtonestriben under histogrammet med lineær og med S-kurve. Hvor skifter gråtonen hurtigst? Hvad betyder det for billedet?",
         "Med S-kurven skifter gråtonen hurtigst midt i vinduet og langsomt i enderne. Hvor striben skifter hurtigt, giver en lille forskel i værdi en stor forskel i gråtone, altså høj kontrast. Den lineære kurve fordeler kontrasten jævnt."],
      ]],
      ["Vinduet", [
        ["Klipning", "Slå \"Vis klipning\" til. Gør vinduet smalt, og flyt det til siden. Hvad sker der?",
         "Et smalt vindue giver høj kontrast, men anatomi uden for vinduet bliver helt hvid eller helt sort. Det er klipning, vist med rødt. Et bredt vindue tager alt med, men kontrasten bliver lav."],
        ["Knogle eller bløddel", "Sæt WW til 50 %, og flyt WL fra −30 % til +30 %. Hvornår ser du knoglens struktur bedst, og hvornår bløddelene?",
         "Ved −30 % ligger vinduet over knoglens lave værdier, så knoglens struktur får kontrast, mens bløddelene bliver helt sorte. Ved +30 % ligger vinduet over bløddelene, og knoglen bliver helt hvid. Et smalt vindue viser én ting godt ad gangen."],
        ["Støj og vindue", "Sæt dosis til ×0,5. Kan du få støjen væk med vinduet?",
         "Nej. Vinduet kan kun flytte rundt på de målte værdier. Et smalt vindue gør endda støjen tydeligere. Støj fra for lav dosis kan kun undgås ved at give nok dosis."],
        ["Er noget tabt?", "Gør vinduet så smalt, at en del af knæet bliver klippet. Tryk derefter Nulstil. Er informationen væk?",
         "Nej. Vinduet ændrer kun visningen, ikke de rå tal, så man kan altid gå tilbage. Klipning er kun et problem, hvis man ikke opdager det, når man vurderer billedet."],
      ]],
      ["Samlet", [
        ["Casen", "En kollega har taget et knæ. Billedet ser fint ud, men REX er omkring 620. Find indstillingen i simulatoren. Hvad siger I til kollegaen, og hvad kan forklaringen være?",
         "×2,8 giver REX omkring 620: næsten tre gange den rigtige dosis, uden at billedet er bedre. Forklaringen kan være for mange mAs eller en vane, der har sneget sig ind over tid. Tjek også indblændingen, for den kan få REX til at vise forkert. Næste gang skal mAs ned."],
      ]],
      ["Formler", [
        ["DI i hånden", "Afvigelsesindekset er $$DI = 10 \\cdot \\log_{10}\\left(\\frac{EI}{EI_T}\\right)$$ hvor $EI_T$ er målet. Regn DI ud for dobbelt dosis og for halv dosis. Tjek i simulatoren.",
         "$10 \\cdot \\log_{10} 2 \\approx 3,0$ og $10 \\cdot \\log_{10} 0,5 \\approx -3,0$. Simulatoren viser +3,0 ved ×2 og −3,1 ved ×0,5."],
        ["Hvad er DI +1?", "Hvor mange procent for meget dosis svarer et DI på +1 til? Brug formlen baglæns: $$\\frac{EI}{EI_T} = 10^{DI/10}$$",
         "$10^{0,1} \\approx 1,26$, altså cirka 26 % for meget. DI +1 er en lille afvigelse, mens DI +3 er dobbelt dosis."],
        ["EI og detektordosis", "Standarden siger cirka $$EI \\approx 100 \\cdot K$$ hvor $K$ er dosis til detektoren i mikrogray. Hvilken detektordosis svarer EI 250 til? Og EI 500?",
         "EI 250 svarer til cirka 2,5 µGy og EI 500 til 5 µGy. Dobbelt EI er dobbelt dosis til detektoren. Sammenhængen gælder under faste stråleforhold."],
        ["REX og dosis", "Simulatoren antager, at REX er proportional med dosis: $$REX = 220 \\cdot \\frac{D}{D_0}$$ hvor $D_0$ er den rigtige dosis. Hvilken REX forventer I ved ×1,4 og ×2,8? Tjek i simulatoren.",
         "$220 \\cdot 1,4 = 308$ og $220 \\cdot 2,8 = 616$. Simulatoren viser 309 og 622, fordi støjen flytter tallene en smule."],
        ["Vinduet i hånden", "Inden for vinduet får en pixel med værdien $v$ pladsen $$g = \\frac{v - (WL - WW/2)}{WW}$$ hvor 0 er vinduets nederste kant og 1 den øverste. En pixel har værdien 4100. Hvor ligger den ved WL 3800 og WW 2000? Og ved WW 400?",
         "Ved WW 2000: $g = \\frac{4100 - 2800}{2000} = 0,65$, inde i vinduet. Ved WW 400: $g = \\frac{4100 - 3600}{400} = 1,25$, over vinduet, så pixlen klippes og bliver helt sort."],
        ["Støj og dosis", "Den relative støj falder med kvadratroden af dosis: $$\\frac{\\sigma}{S} \\propto \\frac{1}{\\sqrt{D}}$$ Hvor meget mindre relativ støj giver dobbelt dosis? Og fire gange dosis? Hvad siger det om dose creep?",
         "Dobbelt dosis: $\\frac{1}{\\sqrt{2}} \\approx 0,71$, altså kun 29 % mindre støj. Fire gange dosis halverer støjen. Patienten betaler fuld pris i dosis for en støjgevinst, der sjældent er nødvendig for diagnosen."],
      ], "deep"],
    ],
    answer: "Vis svar", dec: ",", thou: ".",
    video: "Video: Fra tal til billede",
    videoNote: "Videoen følger samme vej som simulatoren: histogram, REX, skalering, LUT og vindue. Sprog og niveau skifter med knapperne øverst.",
    back: "← Læring", foot: "© 2026 Oliver Brage. Alle rettigheder forbeholdes.", privacy: "Privatliv",
  },
  en: {
    title: "From number to image", simTitle: "Simulator: Histogram and window",
    sub: "Video 1b on the digital image: how the numbers from the detector become the image on screen. Watch the video first, then work through the tasks in the simulator.",
    grund: "Basic", deep: "Deeper level",
    image: "The image on screen", hist: "Histogram and REX",
    synth: "Synthetic knee, computed from a simple model of radiation and noise.",
    histnote: "Hover over the histogram or the image (on a phone: hold your finger on it) to light up the pixels with those values.",
    voi: "the anatomy, as the analysis found it", win: "window", strip: "grey level on screen",
    wlMid: "centred on the anatomy", lighter: "lighter", darker: "darker",
    wwAll: "covers the anatomy", moreC: "more contrast", lessC: "less contrast", rawNum: "raw numbers",
    of: "of", prev: "Previous task", next: "Next task",
    value: "value (more radiation →)", count: "number of pixels",
    bone: "bone", soft: "soft tissue", background: "background", collimation: "outside collimation",
    noisy: "too noisy", ok: "fine", tooMuch: "dose too high",
    krex: "REX (Canon)", kwin: "Window",
    zone: { noisy: "Below 125: too much noise", ok: "125–400: fine", tooMuch: "Above 400: more dose, no better image" },
    di: "DI, with the right dose as target", clipped: "clipped",
    ctl: {
      dose: "Dose relative to right", coll: "Collimation", good: "Good", poor: "Too little",
      auto: "Automatic rescaling", on: "On", off: "Off", lut: "LUT", linear: "Linear", s: "S curve",
      wl: "Window centre, WL", ww: "Window width, WW", clip: "Show clipping", names: "Show names on the image", reset: "Reset",
    },
    tasks: "Tasks",
    seen: "What you can see:", pin: "Save the image", unpin: "Remove saved", saved: "saved",
    see: {
      noAutoMore: "Without rescaling, the image gets darker with more dose, as with film.",
      noAutoLess: "Without rescaling, the image gets lighter with less dose, as with film.",
      coll: "Too little collimation: the analysis takes background for anatomy, so REX reads too high.",
      low: "REX {r} is below 125. The image is grainy, but the brightness does not show it.",
      high: "REX {r} is above 400. The patient got more radiation than needed, but the image looks the same.",
      clipped: "{p} % of the anatomy falls outside the window and is clipped.",
      narrow: "Narrow window: more contrast in what lies inside the window.",
      ok: "REX {r} is fine. Try changing the dose: the brightness does not change, but REX does.",
    },
    model: "How the model works",
    modelText: "<p>The knee is drawn on the computer: 200 × 200 pixels, each outside the collimation, background, soft tissue or bone. The value in each pixel is $$v = 7000 \\cdot D \\cdot e^{-(0.8 \\cdot s + 1.2 \\cdot k)}$$ where $D$ is the dose relative to the right one, and $s$ and $k$ are how much soft tissue and bone the ray passes through. On top comes noise that grows with the square root of the signal, like real quantum noise.</p><p>The analysis finds the anatomy's values (from 1 % to 99 % of them, plus a margin), and the window is laid over them. REX is proportional here to the anatomy's median value and set to 220 at the right dose. The limits 125 and 400 are the course's rules of thumb for Canon systems, not the manufacturer's numbers. Real systems use their own, more advanced algorithms.</p><p>Sources: IEC 62494-1 on the exposure index (EI and DI). AAPM TG-116 on exposure indices. Bushong, Radiologic Science for Technologists.</p>",
    help: {
      dose: "How much radiation the knee got, compared with the right dose.",
      coll: "Whether the field is collimated to the knee, or a lot of background comes along.",
      auto: "The system lays the window over the anatomy, so the image always gets the same brightness.",
      lut: "The curve that gives each value its grey level. It is chosen in the protocol.",
      wl: "Moves the window. Plus makes the image lighter, minus darker.",
      ww: "A narrower window gives more contrast, a wider one less.",
      clip: "Shows in red the anatomy that falls outside the window.",
      names: "Writes the names of the parts of the knee on the image.",
    },
    groups: [
      ["The histogram", [
        ["What are the peaks?", "Hover over each peak in the histogram. Which parts of the knee light up? Why is the bone on the left, when it is white in the image?",
         "The peak on the left is the bone, the middle one the soft tissue, the one on the right the background, and the peak right at 0 is the area outside the collimation. The bone stops the most radiation and so gets low values. The screen turns it around: little radiation becomes light."],
        ["The peak at zero", "What is the peak right down at 0? Set collimation to \"Too little\". What happens to it?",
         "It is the pixels outside the collimation, which got almost no radiation. With too little collimation it disappears, and the background peak grows, because more of the field hits the detector directly."],
        ["More dose in the histogram", "Set the dose to ×4. What happens to the histogram? And to the image?",
         "The whole histogram moves to the right and gets wider, because every pixel gets more radiation. The image looks almost the same, because automatic rescaling moves the window along."],
      ]],
      ["EI and REX", [
        ["Lowest dose", "Find the lowest dose at which REX is still above 125. What does the image look like just below the limit?",
         "×0.7 gives REX around 153. At ×0.5 REX drops to around 109, and the image is clearly grainy. The brightness stays the same all the way, so it is REX and the noise that tell you the dose is too low."],
        ["Too much dose", "Set the dose to ×2 and then ×4. Does the image get darker? What does REX say?",
         "No, the image is just as bright, because automatic rescaling moves the window along. But REX rises to around 440 and 890. The patient got two and four times the radiation, and the image is no better for diagnosis."],
        ["Highest dose that is fine", "Which dose step is the highest at which REX is still below 400?",
         "×1.4 gives REX around 310. At ×2 REX is around 440, over the limit. So the limit lies between 1.4 and 2 times the right dose."],
        ["Collimation", "Set the dose to ×1 and collimation to \"Too little\". What happens to REX and the image, even though the dose is the same?",
         "REX rises from 220 to around 290, and the anatomy gets lighter. The histogram analysis takes part of the background for anatomy, so it gets the sum wrong. Metal in the field can do the same."],
        ["Collimation hides a low dose", "Set the dose to ×0.5 and collimation to \"Too little\". What does REX say now? Can you trust it?",
         "REX is around 150, so it looks fine, even though the dose is halved and the image is grainy. The analysis has taken background for anatomy and reads too high. Good collimation is a precondition for REX to be any use."],
      ]],
      ["Automatic rescaling", [
        ["Without rescaling", "Turn automatic rescaling off, and move the dose up and down. What happens now?",
         "Now the image gets darker with more dose and lighter with less, as with film. Automatic rescaling is why a digital image looks right even when the dose was wrong."],
        ["Out of the window", "Turn rescaling off and clipping on. Set the dose to ×4. Where is the histogram now compared with the window?",
         "The histogram has slid out to the right of the window, so large parts of the anatomy are clipped and turn completely black. Without rescaling, a wrong dose would ruin the image, as with film."],
        ["Dose creep", "A colleague says: \"The image looks fine, so the dose was fine.\" Use the simulator to show why that does not hold. What should the radiographer look at instead?",
         "The image looks the same from ×1 to ×4, because rescaling corrects the brightness. Only REX, or EI and DI, reveals the dose. If nobody looks at REX, the dose can slowly creep upwards. That is dose creep."],
      ]],
      ["LUT", [
        ["Linear or S curve", "Switch between linear and S curve. Where in the image do you see the difference most clearly?",
         "The S curve gives more contrast in the middle of the values, in the soft tissue and the structure of the bone. At the ends the curve is flat, so the lightest and darkest values are squeezed together."],
        ["The grey strip", "Look at the grey strip under the histogram with linear and with S curve. Where does the grey level change fastest? What does that mean for the image?",
         "With the S curve the grey level changes fastest in the middle of the window and slowly at the ends. Where the strip changes fast, a small difference in value gives a large difference in grey, that is high contrast. The linear curve spreads the contrast evenly."],
      ]],
      ["The window", [
        ["Clipping", "Turn on \"Show clipping\". Make the window narrow and move it to one side. What happens?",
         "A narrow window gives high contrast, but anatomy outside the window becomes completely white or completely black. That is clipping, shown in red. A wide window takes everything in, but the contrast is low."],
        ["Bone or soft tissue", "Set WW to 50 % and move WL from −30 % to +30 %. When do you see the structure of the bone best, and when the soft tissue?",
         "At −30 % the window lies over the bone's low values, so the bone's structure gets contrast while the soft tissue turns completely black. At +30 % the window lies over the soft tissue, and the bone turns completely white. A narrow window shows one thing well at a time."],
        ["Noise and the window", "Set the dose to ×0.5. Can you get rid of the noise with the window?",
         "No. The window can only move the measured values around. A narrow window even makes the noise more visible. Noise from too low a dose can only be avoided by giving enough dose."],
        ["Is anything lost?", "Make the window so narrow that part of the knee is clipped. Then press Reset. Is the information gone?",
         "No. The window only changes the display, not the raw numbers, so you can always go back. Clipping is only a problem if you do not notice it when you assess the image."],
      ]],
      ["All together", [
        ["The case", "A colleague has taken a knee. The image looks fine, but REX is around 620. Find the setting in the simulator. What do you say to your colleague, and what could the explanation be?",
         "×2.8 gives REX around 620: almost three times the right dose, with no better image. The explanation could be too many mAs, or a habit that has crept in over time. Check the collimation too, because it can make REX read wrong. Next time the mAs must come down."],
      ]],
      ["Formulas", [
        ["DI by hand", "The deviation index is $$DI = 10 \\cdot \\log_{10}\\left(\\frac{EI}{EI_T}\\right)$$ where $EI_T$ is the target. Work out DI for double the dose and for half the dose. Check in the simulator.",
         "$10 \\cdot \\log_{10} 2 \\approx 3.0$ and $10 \\cdot \\log_{10} 0.5 \\approx -3.0$. The simulator shows +3.0 at ×2 and −3.1 at ×0.5."],
        ["What is DI +1?", "How many percent too much dose does a DI of +1 mean? Use the formula backwards: $$\\frac{EI}{EI_T} = 10^{DI/10}$$",
         "$10^{0.1} \\approx 1.26$, so about 26 % too much. DI +1 is a small deviation, while DI +3 is double the dose."],
        ["EI and detector dose", "The standard says roughly $$EI \\approx 100 \\cdot K$$ where $K$ is the dose to the detector in microgray. Which detector dose does EI 250 correspond to? And EI 500?",
         "EI 250 corresponds to about 2.5 µGy and EI 500 to 5 µGy. Double the EI is double the dose to the detector. The relation holds under fixed beam conditions."],
        ["REX and dose", "The simulator assumes that REX is proportional to the dose: $$REX = 220 \\cdot \\frac{D}{D_0}$$ where $D_0$ is the right dose. Which REX do you expect at ×1.4 and ×2.8? Check in the simulator.",
         "$220 \\cdot 1.4 = 308$ and $220 \\cdot 2.8 = 616$. The simulator shows 309 and 622, because the noise moves the numbers a little."],
        ["The window by hand", "Inside the window, a pixel with the value $v$ gets the place $$g = \\frac{v - (WL - WW/2)}{WW}$$ where 0 is the lower edge of the window and 1 the upper. A pixel has the value 4100. Where does it lie at WL 3800 and WW 2000? And at WW 400?",
         "At WW 2000: $g = \\frac{4100 - 2800}{2000} = 0.65$, inside the window. At WW 400: $g = \\frac{4100 - 3600}{400} = 1.25$, above the window, so the pixel is clipped and turns completely black."],
        ["Noise and dose", "The relative noise falls with the square root of the dose: $$\\frac{\\sigma}{S} \\propto \\frac{1}{\\sqrt{D}}$$ How much less relative noise does double the dose give? And four times the dose? What does that say about dose creep?",
         "Double the dose: $\\frac{1}{\\sqrt{2}} \\approx 0.71$, so only 29 % less noise. Four times the dose halves the noise. The patient pays the full price in dose for a gain in noise that is seldom needed for the diagnosis."],
      ], "deep"],
    ],
    answer: "Show answer", dec: ".", thou: ",",
    video: "Video: From number to image",
    videoNote: "The video follows the same path as the simulator: histogram, REX, rescaling, LUT and window. Language and level follow the buttons at the top.",
    back: "← Learn", foot: "© 2026 Oliver Brage. All rights reserved.", privacy: "Privacy",
  },
};

// ---- the synthetic knee (same model as the video, manim_studio/radiografi/knee.py) ----
// Higher raw value = more radiation reached the detector; the display inverts it.
const N = 200, MAX_VALUE = 16383, DOSE_REF = 7000, GAIN = 9, OUTSIDE = 120, REX_RIGHT = 220, BINS = 82;
const DOSES = [0.25, 0.35, 0.5, 0.7, 1, 1.4, 2, 2.8, 4];

function rng(seed) {             // mulberry32: a small seeded random generator, so the noise is the same every time
  return () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function normals(seed) {         // N*N standard normal numbers (Box-Muller)
  const r = rng(seed), z = new Float32Array(N * N);
  for (let i = 0; i < z.length; i += 2) {
    const a = Math.sqrt(-2 * Math.log(r() + 1e-12)), b = 2 * Math.PI * r();
    z[i] = a * Math.cos(b); if (i + 1 < z.length) z[i + 1] = a * Math.sin(b);
  }
  return z;
}
function blur(a, passes) {       // separable 3-point box blur, wrapping at the edges like numpy's roll
  for (let p = 0; p < passes; p++) {
    const b = new Float32Array(a.length);
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++)
      b[r * N + c] = (a[((r + N - 1) % N) * N + c] + a[r * N + c] + a[((r + 1) % N) * N + c]) / 3;
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++)
      a[r * N + c] = (b[r * N + (c + N - 1) % N] + b[r * N + c] + b[r * N + (c + 1) % N]) / 3;
  }
  return a;
}
const Z = normals(11);
const GEO = {};
function geometry(collimated) {  // path lengths through soft tissue and bone, and the class of each pixel
  if (GEO[collimated]) return GEO[collimated];
  const soft = new Float32Array(N * N), bone = new Float32Array(N * N), cls = new Uint8Array(N * N);
  const tex = blur(normals(5), 2);
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
    const i = r * N + c, v = 1 - 2 * r / (N - 1), u = -1 + 2 * c / (N - 1);
    const halfW = 0.52 + 0.1 * Math.exp(-((v / 0.35) ** 2));
    soft[i] = Math.sqrt(Math.max(0, 1 - (u / halfW) ** 2));
    const fw = 0.17 + 0.2 * Math.exp(-(((v - 0.16) / 0.22) ** 2));
    const femur = v > 0.06 + 0.05 * Math.cos(Math.PI * u / 0.37) && Math.abs(u) < fw;
    const tw = 0.16 + 0.22 * Math.exp(-(((v + 0.13) / 0.2) ** 2));
    const tibia = v < -0.04 && Math.abs(u) < tw;
    const fib = ((u - 0.33) / 0.07) ** 2 + ((v + 0.33) / 0.12) ** 2 < 1 || (Math.abs(u - 0.34) < 0.045 && v < -0.4);
    const pat = ((u + 0.02) / 0.15) ** 2 + ((v - 0.2) / 0.17) ** 2 < 1;
    const isBone = femur || tibia || fib;
    const width = femur ? fw : tibia ? tw : 0.07;
    const rel = Math.min(1, Math.abs(u) / Math.max(width, 1e-3));
    bone[i] = (isBone ? 0.42 + 0.3 * rel ** 6 + 0.4 * tex[i] : 0) + (pat ? 0.2 : 0);
    const field = !collimated || (Math.abs(u) < 0.86 && Math.abs(v) < 0.93);
    cls[i] = !field ? 0 : isBone ? 3 : soft[i] > 0.02 ? 2 : 1;
  }
  blur(soft, 2); blur(bone, 2);
  return (GEO[collimated] = { soft, bone, cls });
}
function rawImage(dose, collimated) {
  const g = geometry(collimated), raw = new Float32Array(N * N);
  for (let i = 0; i < raw.length; i++) {
    const mean = g.cls[i] === 0 ? OUTSIDE * dose : DOSE_REF * dose * Math.exp(-(0.8 * g.soft[i] + 1.2 * g.bone[i]));
    raw[i] = Math.min(MAX_VALUE, Math.max(0, mean + Math.sqrt(GAIN * mean) * Z[i]));
  }
  return { raw, cls: g.cls };
}
const pct = (sorted, p) => sorted[Math.min(sorted.length - 1, Math.max(0, Math.round(p / 100 * (sorted.length - 1))))];
function analyse(raw, cls, mistaken) {
  // the values of interest: the anatomy, without background and the area outside the collimation.
  // With too little collimation the analysis mistakes most of the background for anatomy.
  const anat = [], bg = [];
  for (let i = 0; i < raw.length; i++) (cls[i] >= 2 ? anat : cls[i] === 1 ? bg : []).push(raw[i]);
  if (mistaken) { bg.sort((a, b) => a - b); const lim = pct(bg, 70); for (const v of bg) if (v < lim) anat.push(v); }
  anat.sort((a, b) => a - b);
  const lo = pct(anat, 1), hi = pct(anat, 99), pad = 0.12 * (hi - lo);
  return { lo: lo - pad, hi: hi + pad, median: pct(anat, 50) };
}
const REF = analyse(...Object.values(rawImage(1, true)), false);
const rexOf = median => REX_RIGHT * median / REF.median;
const lutS = (n, k = 5.5) => {
  const s = 1 / (1 + Math.exp(-k * (Math.min(1, Math.max(0, n)) - 0.5)));
  const a = 1 / (1 + Math.exp(k / 2)), b = 1 / (1 + Math.exp(-k / 2));
  return (s - a) / (b - a);
};
const lut = n => S.lut === "s" ? lutS(n) : Math.min(1, Math.max(0, n));
const LO_RGB = [10, 12, 18], HI_RGB = [242, 242, 238];
const grey = b => LO_RGB.map((l, k) => Math.round(l + (HI_RGB[k] - l) * Math.min(1, Math.max(0, b))));

// ---- state ------------------------------------------------------------------
const START = { dose: 4, coll: "good", auto: "on", lut: "s", wl: 0, ww: 100, clip: "off", names: "on" };
const S = { lang: "da", level: "grund", ...START };
let M = null;   // the current model: raw values, classes, window, REX
function compute() {
  const dose = DOSES[S.dose], collimated = S.coll === "good";
  const { raw, cls } = rawImage(dose, collimated);
  const a = analyse(raw, cls, !collimated);
  // without rescaling the window stays where the right dose would put it
  const base = S.auto === "on" ? a : analyse(...Object.values(rawImage(1, collimated)), !collimated);
  const w = base.hi - base.lo, mid = (base.lo + base.hi) / 2 + S.wl / 100 * w, width = w * S.ww / 100;
  M = { raw, cls, lo: mid - width / 2, hi: mid + width / 2, rex: rexOf(a.median), dose, voi: [a.lo, a.hi] };
}
// the value band under the pointer, [lo, hi], from the histogram or the image; its pixels and bars light up
let HOV = null;
const BIN_W = (MAX_VALUE + 1) / BINS, binOf = v => Math.min(BINS - 1, Math.floor(v / BIN_W));
const bandOf = bin => [(bin - 1) * BIN_W, (bin + 2) * BIN_W];   // three bins, so a peak lights up as a region
const inBand = v => HOV && v >= HOV[0] && v < HOV[1];
const bright = v => 1 - lut((v - M.lo) / Math.max(M.hi - M.lo, 1));

// ---- drawing ----------------------------------------------------------------
const css = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
function fit(cv) {
  const r = cv.getBoundingClientRect(), dpr = window.devicePixelRatio || 1;
  cv.width = Math.round(r.width * dpr); cv.height = Math.round(r.height * dpr);
  const ctx = cv.getContext("2d"); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return [ctx, r.width, r.height];
}
function text(ctx, s, x, y, color, align = "left", size = 12) {
  ctx.fillStyle = color; ctx.font = `${size}px ${css("--body")}`; ctx.textAlign = align; ctx.fillText(s, x, y);
}
const off = document.createElement("canvas"); off.width = off.height = N;
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}
function pill(ctx, s, x, y, color = css("--fg"), align = "center") {   // a label on a dark tag, readable on any background
  ctx.font = `11px ${css("--body")}`;
  const w = ctx.measureText(s).width + 10, l = align === "center" ? x - w / 2 : x;
  ctx.fillStyle = "rgba(18,26,43,.88)"; roundRect(ctx, l, y - 12, w, 17, 4); ctx.fill();
  text(ctx, s, l + 5, y, color, "left", 11);
}
// where each name goes on the knee, in the model's coordinates (u across, v up, both −1 to 1)
const NAME_AT = [["bone", 0, 0.55], ["soft", -0.42, 0.62], ["background", 0.75, 0.05], ["collimation", 0, -0.965]];
let KNEE = null;   // where the image sits on its canvas: left, top, size
function drawKnee() {
  const [ctx, W, H] = fit(document.getElementById("knee"));
  const octx = off.getContext("2d"), img = octx.createImageData(N, N), hot = [255, 77, 109], sig = [94, 231, 223];
  for (let i = 0; i < N * N; i++) {
    let rgb = grey(bright(M.raw[i]));
    if (S.clip === "on" && M.cls[i] >= 2) {
      const n = (M.raw[i] - M.lo) / Math.max(M.hi - M.lo, 1);
      if (n <= 0 || n >= 1) rgb = rgb.map((c, k) => Math.round(0.45 * c + 0.55 * hot[k]));
    }
    if (inBand(M.raw[i])) rgb = rgb.map((c, k) => Math.round(0.35 * c + 0.65 * sig[k]));
    img.data.set([...rgb, 255], i * 4);
  }
  octx.putImageData(img, 0, 0);
  const s = Math.min(W, H);
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(off, (W - s) / 2, (H - s) / 2, s, s);
  KNEE = { x: (W - s) / 2, y: (H - s) / 2, s };
  if (PIN) {
    const t = s * 0.3, x = KNEE.x + s - t - 6, y = KNEE.y + 6;
    ctx.drawImage(PIN.img, x, y, t, t);
    ctx.strokeStyle = css("--amber"); ctx.lineWidth = 2; ctx.strokeRect(x, y, t, t);
    pill(ctx, PIN.label, x + t / 2, y + t + 16, css("--amber"));
  }
  if (S.names !== "on") return;
  const L = T[S.lang];
  for (const [k, u, v] of NAME_AT) {
    if (k === "collimation" && S.coll !== "good") continue;   // no border without collimation
    const x = KNEE.x + (u + 1) / 2 * s, y = KNEE.y + (1 - v) / 2 * s;
    if (k === "collimation") { pill(ctx, L[k], x, y + 5); continue; }   // the thin border: the tag sits on it
    ctx.fillStyle = css("--amber"); ctx.strokeStyle = "#0A0E18"; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(x, y, 3.5, 0, 7); ctx.fill(); ctx.stroke();
    pill(ctx, L[k], x, y + 20);
  }
}
function drawHist() {
  const L = T[S.lang], [ctx, W, H] = fit(document.getElementById("hist"));
  const x0 = 34, x1 = W - 12, top = 42, scaleH = 64, yb = H - scaleH - 46, hh = yb - top;
  HG = { x0, x1 };
  const X = v => x0 + (x1 - x0) * v / (MAX_VALUE + 1);
  // counts per bin, and which class dominates each bin
  const counts = new Array(BINS).fill(0), per = [0, 1, 2, 3].map(() => new Array(BINS).fill(0));
  for (let i = 0; i < M.raw.length; i++) {
    const b = Math.min(BINS - 1, Math.floor(M.raw[i] / (MAX_VALUE + 1) * BINS));
    counts[b]++; per[M.cls[i]][b]++;
  }
  const ymax = YMAX, bw = (x1 - x0) / BINS;
  // the window as a band behind the bars
  const a = Math.max(X(M.lo), x0), b = Math.min(X(M.hi), x1);
  ctx.fillStyle = "rgba(245,166,35,0.12)"; ctx.fillRect(a, top - 6, Math.max(b - a, 1), hh + 6);
  ctx.strokeStyle = css("--amber"); ctx.lineWidth = 2; ctx.strokeRect(a, top - 6, Math.max(b - a, 1), hh + 6);
  // above it, what the analysis found: the anatomy's values. The window starts there and can be moved away from it.
  {
    const va = Math.max(X(M.voi[0]), x0), vb = Math.min(X(M.voi[1]), x1), y = top - 18, c = css("--fg");
    ctx.strokeStyle = c; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(va, y + 5); ctx.lineTo(va, y); ctx.lineTo(vb, y); ctx.lineTo(vb, y + 5); ctx.stroke();
    ctx.font = `11px ${css("--body")}`;
    const tx = Math.min(Math.max((va + vb) / 2, x0 + ctx.measureText(L.voi).width / 2), x1 - ctx.measureText(L.voi).width / 2);
    text(ctx, L.voi, tx, y - 5, c, "center", 11);
  }
  counts.forEach((n, i) => {
    if (!n) return;
    const h = hh * Math.min(n / ymax, 1);
    ctx.fillStyle = css("--signal"); ctx.globalAlpha = !HOV ? 0.8 : inBand((i + 0.5) * BIN_W) ? 1 : 0.3;
    ctx.fillRect(x0 + i * bw + bw * 0.07, yb - h, bw * 0.86, h);
    ctx.globalAlpha = 1;
    if (n > ymax) {   // cut-off bar: a break mark at the top
      ctx.strokeStyle = css("--panel"); ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(x0 + i * bw - 3, yb - h + 12); ctx.lineTo(x0 + (i + 1) * bw + 3, yb - h + 6); ctx.stroke();
    }
  });
  // axes, the grey each value becomes, labels
  ctx.strokeStyle = css("--fg"); ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(x0, top - 10); ctx.lineTo(x0, yb); ctx.lineTo(x1, yb); ctx.stroke();
  for (let k = 0; k < 160; k++) {
    const v = (k + 0.5) / 160 * MAX_VALUE;
    ctx.fillStyle = `rgb(${grey(bright(v)).join(",")})`;
    ctx.fillRect(x0 + (x1 - x0) * k / 160, yb + 3, (x1 - x0) / 160 + 0.6, 16);
  }
  text(ctx, "↑ " + L.strip, x0, yb + 33, css("--muted"), "left", 11);
  text(ctx, L.value, x1, yb + 33, css("--muted"), "right", 11);
  // tags that would overlap an earlier one move down a line
  const placed = [];
  const tag = (s, x, y, color, align = "center") => {
    ctx.font = `11px ${css("--body")}`;
    const w = ctx.measureText(s).width + 10;
    if (align === "center") x = Math.min(Math.max(x, w / 2 + 2), W - w / 2 - 2);   // keep the tag inside the canvas
    const l = align === "center" ? x - w / 2 : x;
    while (placed.some(p => l < p.r && l + w > p.l && y - 12 < p.b && y + 5 > p.t)) y += 19;
    placed.push({ l, r: l + w, t: y - 12, b: y + 5 });
    pill(ctx, s, x, y, color, align);
  };
  tag(L.win, a + 4, top + 10, css("--amber"), "left");
  ctx.save(); ctx.translate(12, top + hh / 2); ctx.rotate(-Math.PI / 2); text(ctx, L.count, 0, 0, css("--muted"), "center", 11); ctx.restore();
  // peak names
  {
    const keys = ["collimation", "background", "soft", "bone"];
    [3, 2, 1, 0].forEach(c => {
      const vals = []; for (let i = 0; i < M.raw.length; i += 7) if (M.cls[i] === c) vals.push(M.raw[i]);
      if (!vals.length) return;
      vals.sort((p, q) => p - q);
      const v = pct(vals, 50), bin = Math.min(BINS - 1, Math.floor(v / (MAX_VALUE + 1) * BINS));
      const h = hh * Math.min(Math.max(...counts.slice(Math.max(0, bin - 1), bin + 2)) / ymax, 1);
      if (c === 0 && x1 - x0 < 420) return;   // no room on a phone
      if (c === 0) {   // the collimation bar is cut off at the top: name it upright beside the bar
        ctx.save(); ctx.translate(X(v) + bw + 12, yb - 8); ctx.rotate(-Math.PI / 2);
        pill(ctx, L[keys[c]], 0, 0, css("--fg"), "left"); ctx.restore();
      } else tag(L[keys[c]], X(v), Math.max(yb - h - 8, top + 10), css("--fg"));
    });
  }
  // the REX scale: three zones and a marker
  const ys = H - 30, RMAX = 600, R = r => x0 + (x1 - x0) * Math.min(r, RMAX) / RMAX;
  [[0, 125, "--hot"], [125, 400, "--signal"], [400, RMAX, "--hot"]].forEach(([p, q, col]) => {
    ctx.fillStyle = css(col); ctx.globalAlpha = 0.75; ctx.fillRect(R(p), ys, R(q) - R(p), 8); ctx.globalAlpha = 1;
  });
  text(ctx, "REX", x0 - 4, ys + 8, css("--amber"), "right", 11);
  [125, 400].forEach(v => text(ctx, String(v), R(v), ys - 4, css("--muted"), "center", 11));
  [[62, "noisy", "--hot"], [262, "ok", "--signal"], [500, "tooMuch", "--hot"]].forEach(([v, k, col]) =>
    text(ctx, L[k], R(v), ys + 22, css(col), "center", 11));
  const mx = R(M.rex);
  ctx.fillStyle = css("--fg");
  ctx.beginPath(); ctx.moveTo(mx, ys - 2); ctx.lineTo(mx - 6, ys - 12); ctx.lineTo(mx + 6, ys - 12); ctx.closePath(); ctx.fill();
  if (M.rex > RMAX) text(ctx, "→", mx - 10, ys - 4, css("--fg"), "right", 12);
}
let YMAX = 1, HG = null;
let PIN = null;   // the image saved with the compare button: a copy of the knee, its label and REX
document.getElementById("pin").onclick = () => {
  if (PIN) PIN = null;
  else {
    const c = document.createElement("canvas"); c.width = c.height = N; c.getContext("2d").drawImage(off, 0, 0);
    PIN = { img: c, rex: M.rex, label: `${T[S.lang].saved}: ${xfmt(DOSES[S.dose])} · REX ${fmt(M.rex)}` };
  }
  render();
};
{
  const { raw } = rawImage(1, true), c = new Array(BINS).fill(0);
  for (const v of raw) c[Math.min(BINS - 1, Math.floor(v / (MAX_VALUE + 1) * BINS))]++;
  YMAX = Math.max(...c.slice(2)) * 1.15;   // the collimation peak alone is cut off at the top
}

// ---- readouts ---------------------------------------------------------------
const fmt = (v, d = 0) => {
  const s = v.toFixed(d).split("."), L = T[S.lang];
  return s[0].replace(/\B(?=(\d{3})+(?!\d))/g, L.thou) + (s[1] ? L.dec + s[1] : "");
};
function readouts() {
  const L = T[S.lang], deep = S.level === "deep", set = (id, s) => { document.getElementById(id).textContent = s; };
  const zone = M.rex < 125 ? "noisy" : M.rex <= 400 ? "ok" : "tooMuch";
  set("k-rex", L.krex); set("v-rex", fmt(M.rex));
  document.getElementById("v-rex").className = "v " + (zone === "ok" ? "ok" : "bad");
  document.getElementById("m-rex").className = "metric " + (zone === "ok" ? "ok" : "err");
  const di = 10 * Math.log10(M.rex / REX_RIGHT);
  set("f-rex", L.zone[zone] + (deep ? ` · ${L.di}: ${di >= 0 ? "+" : "−"}${fmt(Math.abs(di), 1)}` : ""));
  set("k-win", L.kwin);
  // the sliders' own units, then what they do in words; the raw numbers only at the deeper level
  set("v-win", `WL ${S.wl > 0 ? "+" : S.wl < 0 ? "−" : "±"}${Math.abs(S.wl)} % · WW ${S.ww} %`);
  const words = [S.wl === 0 ? L.wlMid : S.wl > 0 ? L.lighter : L.darker,
                 S.ww === 100 ? L.wwAll : S.ww < 100 ? L.moreC : L.lessC].join(" · ");
  // what you can see: the first two observations that apply
  let anat = 0, clipped = 0;
  for (let i = 0; i < M.raw.length; i++) if (M.cls[i] >= 2) {
    anat++; const n = (M.raw[i] - M.lo) / Math.max(M.hi - M.lo, 1); if (n <= 0 || n >= 1) clipped++;
  }
  const pc = 100 * clipped / Math.max(anat, 1), dose = DOSES[S.dose];
  const fill = t => t.replace("{r}", fmt(M.rex)).replace("{p}", fmt(pc));
  const found = [
    [S.auto === "off" && dose > 1, "noAutoMore"], [S.auto === "off" && dose < 1, "noAutoLess"],
    [S.coll === "poor", "coll"], [M.rex < 125, "low"], [M.rex > 400, "high"],
    [pc >= 2, "clipped"], [S.ww < 100, "narrow"]].filter(([on]) => on).slice(0, 2).map(([, k]) => k);
  const see = (found.length ? found : ["ok"]).map(k => fill(L.see[k]));
  set("t-seen", L.seen); set("seen", see.join(" "));
  set("p-rex", PIN ? `${L.saved}: ${fmt(PIN.rex)}` : ""); set("p-win", "");
  set("pin", PIN ? L.unpin : L.pin);
  set("f-win", deep ? `${L.rawNum}: WL ${fmt((M.lo + M.hi) / 2)} · WW ${fmt(M.hi - M.lo)} · g = (v − (WL − WW/2)) / WW` : words);
}

// ---- controls -----------------------------------------------------------------
const xfmt = v => "×" + String(v).replace(".", T[S.lang].dec);
const SLIDERS = [
  ["dose", 0, DOSES.length - 1, 1, v => xfmt(DOSES[v])],
  ["wl", -50, 50, 5, v => `${v > 0 ? "+" : v < 0 ? "−" : ""}${Math.abs(v)} %`],
  ["ww", 20, 300, 10, v => `${v} %`],
];
function buildControls() {
  const L = T[S.lang].ctl, box = document.getElementById("controls");
  const help = k => S.level === "grund" ? `<p class="help">${T[S.lang].help[k]}</p>` : "";
  const seg = (key, opts) => `<div class="ctl"><label><span>${L[key]}</span><span></span></label><div class="seg">` +
    opts.map(([val, lbl]) => `<button data-k="${key}" data-v="${val}" aria-pressed="${S[key] === val}">${lbl}</button>`).join("") +
    `</div>${help(key)}</div>`;
  const slider = ([k, mn, mx, st, f]) =>
    `<div class="ctl"><label for="s-${k}"><span>${L[k]}</span><span id="o-${k}">${f(S[k])}</span></label>` +
    `<input type="range" id="s-${k}" min="${mn}" max="${mx}" step="${st}" value="${S[k]}">${help(k)}</div>`;
  box.innerHTML =
    slider(SLIDERS[0]) +
    seg("coll", [["good", L.good], ["poor", L.poor]]) +
    seg("auto", [["on", L.on], ["off", L.off]]) +
    seg("lut", [["linear", L.linear], ["s", L.s]]) +
    slider(SLIDERS[1]) + slider(SLIDERS[2]) +
    seg("clip", [["off", L.off], ["on", L.on]]) +
    seg("names", [["off", L.off], ["on", L.on]]) +
    `<div class="ctl"><button class="reset" id="reset">${L.reset}</button></div>`;
  box.querySelectorAll("button[data-k]").forEach(b => b.onclick = () => {
    S[b.dataset.k] = b.dataset.v; buildControls(); update();
  });
  SLIDERS.forEach(([k, , , , f]) => {
    const el = document.getElementById(`s-${k}`);
    el.oninput = () => { S[k] = +el.value; document.getElementById(`o-${k}`).textContent = f(S[k]); update(); };
  });
  document.getElementById("reset").onclick = () => { Object.assign(S, START); buildControls(); update(); };
}
function buildText() {
  const L = T[S.lang];
  document.documentElement.lang = S.lang;
  document.getElementById("t-title").textContent = L.title;
  document.title = L.title + " | Oliver Brage";
  document.getElementById("t-sub").textContent = L.sub;
  document.getElementById("t-back").textContent = L.back;
  document.getElementById("t-back").href = "../../?lang=" + S.lang;
  document.getElementById("t-foot").textContent = L.foot;
  document.getElementById("t-privacy").textContent = L.privacy;
  for (const [id, key] of [["t-image", "image"], ["t-hist", "hist"], ["t-synth", "synth"],
                           ["t-histnote", "histnote"], ["t-tasks", "tasks"], ["t-model", "model"]])
    document.getElementById(id).textContent = L[key];
  document.getElementById("model-text").innerHTML = withMath(L.modelText);
  // the video in the chosen language and level; only reloaded when that choice changes
  document.getElementById("t-simtitle").textContent = L.simTitle;
  document.getElementById("t-videonote").textContent = L.videoNote;
  const vid = document.getElementById("vid"), file = `video/histogram_${S.lang}_${S.level === "deep" ? "fordybelse" : "grund"}.mp4`;
  if (vid.getAttribute("src") !== file) { vid.poster = `video/poster_${S.lang}.jpg`; vid.src = file; }
  document.getElementById("lvl-grund").textContent = L.grund;
  document.getElementById("lvl-deep").textContent = L.deep;
  document.getElementById("level-group").setAttribute("aria-label", S.lang === "da" ? "Niveau" : "Level");
  document.getElementById("task-list").innerHTML = groups().map(([g, items]) =>
    `<h4 class="tgroup">${g}</h4>` + items.map(([h, q, a]) =>
      `<details><summary>${h}</summary><p class="q">${withMath(q)}</p><details class="answer">` +
      `<summary>${L.answer}</summary><p class="a">${withMath(a)}</p></details></details>`).join("")).join("");
  buildCard();
}
// the tasks, grouped by topic; groups marked "deep" (the formulas) only at the deeper level
const groups = () => T[S.lang].groups.filter(g => g[2] !== "deep" || S.level === "deep");
// one task at a time in a card under the controls; the full list stays at the bottom of the page
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
function setPressed() {
  for (const [id, on] of [["lang-da", S.lang === "da"], ["lang-en", S.lang === "en"],
                          ["lvl-grund", S.level === "grund"], ["lvl-deep", S.level === "deep"]])
    document.getElementById(id).setAttribute("aria-pressed", on);
}
function render() { drawKnee(); drawHist(); readouts(); }
function update() { compute(); render(); }
function all() { setPressed(); buildText(); buildControls(); update(); }

document.getElementById("lang-da").onclick = () => { S.lang = "da"; save(); all(); };
document.getElementById("lang-en").onclick = () => { S.lang = "en"; save(); all(); };
document.getElementById("lvl-grund").onclick = () => { S.level = "grund"; save(); all(); };
document.getElementById("lvl-deep").onclick = () => { S.level = "deep"; save(); all(); };
// language and level are kept in the address (?lang=da&level=deep), not in browser storage,
// so a link can open the right version and nothing is stored on the visitor's device
function save() {
  const q = new URLSearchParams(location.search);
  q.set("lang", S.lang); S.level === "deep" ? q.set("level", "deep") : q.delete("level");
  history.replaceState(null, "", "?" + q + location.hash);
}
{
  const q = new URLSearchParams(location.search), l = q.get("lang");
  S.lang = l === "da" || l === "en" ? l : (navigator.language || "").toLowerCase().startsWith("da") ? "da" : "en";
  if (q.get("level") === "deep") S.level = "deep";
}
// pointer over the histogram or the knee: light up a band of values in both
function hover(id, toBin) {
  const cv = document.getElementById(id);
  const set = e => {
    const r = cv.getBoundingClientRect(), bin = toBin(e.clientX - r.left, e.clientY - r.top);
    const band = bin === null ? null : bandOf(bin);
    if (String(band) !== String(HOV)) { HOV = band; render(); }
  };
  cv.addEventListener("pointermove", set); cv.addEventListener("pointerdown", set);
  for (const ev of ["pointerleave", "pointercancel"]) cv.addEventListener(ev, () => { if (HOV) { HOV = null; render(); } });
}
hover("hist", x => HG && x >= HG.x0 && x <= HG.x1 ? binOf((x - HG.x0) / (HG.x1 - HG.x0) * (MAX_VALUE + 1)) : null);
hover("knee", (x, y) => {
  if (!KNEE) return null;
  const c = Math.floor((x - KNEE.x) / KNEE.s * N), r = Math.floor((y - KNEE.y) / KNEE.s * N);
  return c >= 0 && c < N && r >= 0 && r < N ? binOf(M.raw[r * N + c]) : null;
});
window.addEventListener("resize", render);
if (document.fonts && document.fonts.ready) document.fonts.ready.then(render);
all();
