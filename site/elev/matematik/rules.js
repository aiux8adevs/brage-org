// The rule behind each topic, shown under every answer in the trainer ("Regel"), short and with an example.
// Fractions are written with a slash here; the page shows them as they are.
const MathRules = {
  "brok-plus": "Plus og minus med brøker: gør nævnerne ens (fællesnævner), læg så tællerne sammen eller træk dem fra. Nævneren bliver stående. Eksempel: 1/2 + 1/3 = 3/6 + 2/6 = 5/6.",
  "brok-gange": "Gange: tæller gange tæller og nævner gange nævner (2/3 · 3/4 = 6/12). Dividere med en brøk: gang med den omvendte brøk (2/3 : 1/4 = 2/3 · 4/1 = 8/3).",
  "omskriv": "Brøk til decimaltal: tæller divideret med nævner (3/4 = 0,75). Decimaltal til procent: gang med 100 (0,75 = 75 %). Procent til decimaltal: divider med 100.",
  "procent": "Procent betyder hundrededele: 15 % af 80 = 80 · 15/100 = 12. Hvor mange procent er del af helhed? Del : helhed · 100. En ændring regnes altid i forhold til det oprindelige tal.",
  "negative": "Minus et negativt tal er plus: 5 − (−3) = 8. Gange og dividere: samme fortegn giver plus, forskellige fortegn giver minus: (−4) · 3 = −12.",
  "hierarki": "Rækkefølgen: først parenteser, så potenser og rødder, så gange og dividere, til sidst plus og minus. Eksempel: 2 + 3 · 4 = 2 + 12 = 14.",
  "potens": "a³ betyder a · a · a, ikke a · 3. Samme grundtal: 2³ · 2⁴ = 2⁷ (læg eksponenterne sammen). 10⁻² = 1/100 = 0,01. √49 = 7, fordi 7 · 7 = 49.",
  "forhold": "Forholdet 2 : 3 betyder 5 lige store dele i alt, hvor den ene får 2 og den anden 3. Find først, hvad én del er, og gang så op.",
  "primtal": "Et primtal kan kun deles med 1 og sig selv (2, 3, 5, 7, 11, 13 …). Del tallet med det mindste primtal, der går op, igen og igen: 60 = 2 · 2 · 3 · 5.",
  "indsaet": "Sæt tallet ind i stedet for bogstavet, og husk parentes om negative tal: x² − 3x for x = −2 er (−2)² − 3 · (−2) = 4 + 6 = 10.",
  "reducer": "Saml led af samme slags: 3x + 5x = 8x. Gang ind i parenteser: 2(x + 3) = 2x + 6. Minus foran en parentes skifter fortegn inde i den: −2(x − 4) = −2x + 8.",
  "ligning": "Gør det samme på begge sider af lighedstegnet, til x står alene. 3x + 5 = 20 → træk 5 fra: 3x = 15 → divider med 3: x = 5. Prøv efter ved at sætte ind.",
  "linfunk": "En lineær funktion er y = ax + b. Hældningen a er, hvor meget y vokser, når x vokser 1. b er y, når x = 0 (hvor linjen skærer y-aksen). Hældning = (y₂ − y₁) : (x₂ − x₁).",
  "vaekst": "Lineær vækst: det samme lægges til hver gang (+8 om ugen). Procentvis vækst: der ganges med det samme tal hver gang. 10 % op betyder gange 1,10, 20 % ned betyder gange 0,80.",
  "vinkler": "Vinklerne i en trekant giver 180°. Vinkler ved siden af hinanden på en ret linje giver 180°. Topvinkler (overfor hinanden) er lige store. En n-kant har vinkelsummen (n − 2) · 180°.",
  "areal": "Rektangel: længde · bredde. Trekant: ½ · grundlinje · højde. Parallelogram: grundlinje · højde. Trapez: ½ · (a + b) · højde. Omkreds er længden hele vejen rundt, areal er fladen.",
  "cirkel": "Omkreds = π · d (eller 2 · π · r). Areal = π · r². Radius er halvdelen af diameteren. Du må skrive svaret med π, fx 9π, eller regne med 3,14.",
  "rumfang": "Kasse: længde · bredde · højde. Cylinder og prisme: grundfladens areal · højde (cylinder: π · r² · h). 1 liter = 1 dm³ = 1.000 cm³.",
  "pythagoras": "I en retvinklet trekant: a² + b² = c², hvor c er hypotenusen (siden over for den rette vinkel). Find c: c = √(a² + b²). Find en katete: b = √(c² − a²).",
  "enheder": "Længde: 1 m = 100 cm. Areal: 1 m² = 100 · 100 = 10.000 cm². Rumfang: 1 m³ = 1.000 liter, 1 dm³ = 1 liter. Fart: km/t divideret med 3,6 giver m/s.",
  "ligedannet": "Ligedannede figurer har samme form. Alle længder ganges med skalafaktoren k. Arealer ganges med k², rumfang med k³.",
  "deskriptorer": "Middeltal: summen divideret med antallet. Median: det midterste tal, når tallene står i rækkefølge (to midterste: tag gennemsnittet). Typetal: det, der er flest af. Variationsbredde: største minus mindste.",
  "kvartiler": "Sortér tallene. Medianen deler dem i to halvdele. Nedre kvartil er medianen af den nederste halvdel, øvre kvartil af den øverste. Boksen i et boksplot går fra nedre til øvre kvartil.",
  "sandsynlighed": "Sandsynlighed = antal gunstige udfald : antal mulige udfald, når alle er lige sandsynlige. Med to terninger er der 6 · 6 = 36 lige sandsynlige udfald.",
};
if (typeof module !== "undefined") module.exports = MathRules;
