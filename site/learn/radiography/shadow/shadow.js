// ---- text ----------------------------------------------------------------
const T = {
  da: {
    sub: "Flyt fokus, objekt og detektor, og se hvad der sker med skyggen. Tallene er regnet i rigtige centimeter og millimeter.",
    grund: "Grund", deep: "Fordybelse",
    setup: "Opstilling, set fra siden", zoom: "Udsnit",
    image: "Det detektoren så", loupe: "Lup på kanten",
    scale: "Til venstre hele opstillingen, til højre den orange ramme forstørret. Begge er i rigtige proportioner. Fokus er tegnet større end virkeligt.",
    truth: "Stiplet: objektets sande størrelse, til sammenligning. Den er ikke en del af billedet.",
    oval: "Længde / bredde på billedet", trueW: "Sand bredde",
    focus: "fokus", detector: "detektor", lesion: "læsion", near: "nær ende", far: "fjern ende",
    km: "Forstørrelse", ku: "Halvskygge", kb: "Bevægelsesspor", nearFar: "nær / fjern ende",
    ctl: {
      obj: "Objekt", circle: "Rundt objekt", rod: "Aflang knogle",
      focus: "Fokus", small: "Lille 0,6 mm", large: "Stort 1,2 mm",
      sid: "SID, fokus til detektor", oid: "OID, objekt til detektor",
      objAngle: "Knoglens hældning", tube: "Rørets vinkling", offset: "Objektet ud fra midten",
      speed: "Patientens bevægelse", time: "Eksponeringstid", proj: "Projektion",
      onlyRod: "kun aflang knogle", onlyCircle: "kun rundt objekt",
    },
    legRays: "stråler fra fokus' to kanter", legRaysRod: "stråler fra fokus til knoglens ender",
    legLesion: "stråle gennem læsionen", legShadow: "skygge på detektoren",
    legTrue: "objektets sande størrelse", legZoom: "udsnit",
    pen: "halvskygge", penMotion: "halvskygge + bevægelse", objSide: "objektets skygge", around: "omgivelse",
    of: "af", prev: "Forrige opgave", next: "Næste opgave",
    tasks: "Opgaver",
    seen: "Det kan du se:", pin: "Gem tallene", unpin: "Fjern de gemte", saved: "gemt",
    see: {
      motion: "Bevægelsessporet ({b} mm) er meget større end halvskyggen. Kortere tid hjælper mest.",
      rod: "Knoglen ligger skråt, så skyggen bliver kortere, og den fjerne ende bliver bredere og mere uskarp.",
      tube: "Røret er vinklet, så skyggen strækkes til en oval: længde / bredde {r}.",
      lesion: "Læsionen kan nu ses ved siden af objektet.",
      hidden: "Læsionen ligger skjult i objektets skygge.",
      big: "Forstørrelsen er {m}×. Mindre OID eller længere SID gør den mindre.",
      base: "Forstørrelse {m}× og halvskygge {u} mm. Prøv at ændre OID og SID.",
    },
    model: "Sådan virker modellen",
    modelText: "<p>Simulatoren regner med rette stråler fra et fokus med en bredde, set fra siden, og med ligedannede trekanter: $$M = \\frac{SID}{SOD} \\quad U = f \\cdot \\frac{OID}{SOD} \\quad B = v \\cdot t \\cdot M$$ OID måles til objektets midte, og fokus er en lige linje med fokusstørrelsens bredde. Spredt stråling, hælvirkning og detektorens egen uskarphed er ikke med, så det er kun geometrien, der vises. Fokus er tegnet større end virkeligt, men tallene er regnet med den rigtige størrelse.</p><p>Kilder: Bushong, Radiologic Science for Technologists. Carlton og Adler, Principles of Radiographic Imaging.</p>",
    help: {
      obj: "Det runde objekt viser forstørrelse, uskarphed og overlejring. Den aflange knogle viser formforvrængning.",
      focus: "Hvor stort et område på anoden strålingen kommer fra.",
      sid: "Afstanden fra fokus til detektoren.",
      oid: "Afstanden fra objektet til detektoren.",
      objAngle: "Hvor skråt knoglen ligger i forhold til detektoren.",
      tube: "Vinkler røret, så strålen rammer skråt.",
      offset: "Flytter objektet væk fra centralstrålen.",
      speed: "Hvor hurtigt patienten bevæger sig under optagelsen.",
      time: "Hvor længe strålingen er tændt.",
      proj: "Hvilken retning strålen kommer fra: 0° oppefra, 90° fra siden.",
    },
    groups: [
      ["Forstørrelse", [
        ["Knæet på bordet", "Et knæ ligger på bordet, og detektoren sidder i Bucky-skuffen under bordet. Det giver cirka 8 cm OID. Bliver knæet forstørret mere eller mindre end med detektoren lige under knæet? Prøv med OID-skyderen.",
         "Mere. Bordet og skuffen lægger afstand mellem knæet og detektoren, og den afstand giver forstørrelse. Ved SID 100 cm går forstørrelsen fra cirka 1,02 til 1,09."],
        ["Helt ned på detektoren", "Sæt OID til 0. Hvorfor er forstørrelsen stadig ikke præcis 1,00?",
         "Den er 1,02. OID måles til objektets midte, og objektet har en tykkelse, så midten ligger altid lidt over detektoren, her 1,7 cm. Alt, der ligger over detektoren, bliver forstørret en smule."],
        ["Længere afstand", "Hold OID på 10 cm. Hvor lang skal SID være, for at forstørrelsen kommer ned på 1,10? Hvad er den ved 180 cm?",
         "110 cm giver 1,10, og 180 cm giver 1,06. Jo længere SID, jo mere parallelle er strålerne gennem objektet, og jo mindre forstørrelse."],
        ["Hjertet på thorax", "Hjertet ligger fortil i brystkassen. Ved en PA-optagelse er det cirka 5 cm fra detektoren, ved en AP-optagelse cirka 15 cm. Sammenlign forstørrelsen ved SID 100 og SID 180. Hvorfor tager man thorax PA på 180 cm?",
         "Ved SID 100: 1,05 for PA og 1,18 for AP. Ved SID 180: 1,03 og 1,09. PA på lang afstand giver den mindste forstørrelse, så hjertets størrelse kan vurderes. På et AP-billede kan hjertet se forstørret ud, uden at det er det."],
      ]],
      ["Formforvrængning", [
        ["Den skrå finger", "Vælg den aflange knogle. En finger kan ikke rettes ud og ligger skråt op fra detektoren. Bliver knoglen længere eller kortere på billedet? Og er de to ender lige brede?",
         "Kortere. Det er forkortning. Knoglen ligger skråt, så dens skygge bliver kortere end knoglen selv. Den fjerne ende er længere fra detektoren, så den bliver forstørret mere og ser bredere ud."],
        ["Hvor kort?", "Hold OID på 10 cm. Sammenlign knoglens skygge med den stiplede sande længde ved 0°, 40° og 60° hældning. Ved hvilken hældning bliver skyggen kortere end knoglen?",
         "Ved 0° er skyggen cirka 13,3 cm, altså længere end knoglens 12 cm, fordi hele knoglen ligger over detektoren og bliver forstørret. Ved 40° er den cirka 10 cm, og ved 60° under 7 cm. Hældningen forkorter mere, end forstørrelsen forlænger."],
        ["Rundt bliver ovalt", "Vælg det runde objekt, og sæt rørets vinkling til 10°, 20° og 30°. Hvad sker der med formen? Se tallet under billedet.",
         "Skyggen bliver oval og trækkes ud i den retning, røret er vinklet. Forholdet mellem længde og bredde går fra 1,00 til 1,02, 1,06 og 1,15. Det er elongation: strålen rammer skråt, så skyggen strækkes."],
        ["Ude fra midten", "Sæt vinklingen til 0°, og flyt objektet 20 cm ud fra midten. Bliver det lige så ovalt som med 30° vinkling? Se også på læsionens orange stråle i udsnittet.",
         "Nej, kun 1,02 mod 1,15. Ude fra midten rammer strålen kun lidt skråt. Men læsionens stråle flytter sig væk fra objektets midte: ting i forskellig højde forskydes i forhold til hinanden. Derfor centrerer man på det, der skal vurderes."],
        ["Vinkling mod forkortning", "Vælg den aflange knogle med 40° hældning. Kan rørets vinkling gøre skyggen lige så lang som den vandrette knogles? Hvor meget skal der til?",
         "Ja. Uden vinkling er skyggen cirka 10 cm. Ved 20° er den cirka 13,4 cm, som den vandrette knogle. Vinklingen strækker skyggen og modvirker forkortningen. Men de to ender får stadig forskellig forstørrelse, så formen er ikke helt rigtig."],
      ]],
      ["Geometrisk uskarphed", [
        ["To greb", "Find to ændringer, der gør både forstørrelsen og halvskyggen mindre.",
         "Mindre OID og længere SID. Fokusstørrelsen ændrer kun halvskyggen, ikke forstørrelsen."],
        ["Lille eller stort fokus", "Skift mellem lille og stort fokus ved OID 10. Hvad sker der med halvskyggen og forstørrelsen? Hvorfor bruger man så ikke altid lille fokus?",
         "Halvskyggen halveres fra 0,13 til 0,07 mm, og forstørrelsen er den samme. Lille fokus samler varmen på et mindre område af anoden, så det tåler ikke så høj mA. Så bliver eksponeringstiden længere, og risikoen for bevægelse større."],
        ["Direkte på detektoren", "Sæt OID til 0. Hvor stor er halvskyggen nu? Hvad betyder det for en hånd, der ligger direkte på detektoren?",
         "Cirka 0,02 mm, næsten ingenting. Halvskyggen vokser med afstanden til detektoren, så det, der ligger tæt på detektoren, bliver skarpt, selv med stort fokus."],
        ["Den uskarpe ende", "Vælg den aflange knogle med 40° hældning, og se i luppen. Hvorfor er den fjerne ende mere uskarp?",
         "Den fjerne ende ligger cirka 13 cm over detektoren, den nære cirka 7 cm. Halvskyggen er 0,18 mod 0,09 mm. Mere afstand til detektoren giver både mere forstørrelse og mere halvskygge."],
        ["Lang afstand", "Hold OID på 10 cm, stort fokus, og sæt SID til 180 cm. Hvad sker der med halvskyggen?",
         "Den falder til 0,07 mm, lige så lidt som med lille fokus ved SID 100. Lang SID gør både forstørrelse og halvskygge mindre, men kræver flere mAs, fordi intensiteten falder med afstanden i anden."],
      ]],
      ["Bevægelsesuskarphed", [
        ["Det urolige barn", "Sæt patientens bevægelse til 20 mm/s, som et uroligt barn. Find to greb, der gør bevægelsessporet kortere.",
         "Kortere eksponeringstid og mindre OID. Sporet er bevægelsen gange tiden gange forstørrelsen. I praksis kommer fiksering og instruktion oveni."],
        ["Hvor kort tid?", "Hold bevægelsen på 20 mm/s og OID på 10 cm. Hvilken eksponeringstid giver et spor under 0,5 mm?",
         "20 ms giver 0,44 mm, mens 100 ms giver 2,2 mm. Halv tid giver halvt spor."],
        ["Hvad er størst?", "Sammenlign bevægelsessporet og halvskyggen ved 20 mm/s og 100 ms. Hvilken betyder mest? Hvad betyder det for valget af fokus til et uroligt barn?",
         "Bevægelsessporet er 2,2 mm og halvskyggen 0,13 mm, så sporet er over 15 gange større. Lille fokus hjælper næsten ikke her. Stort fokus tåler højere mA, så tiden kan blive kortere, og det mindsker det største problem."],
        ["Hjælper OID?", "Sæt OID til 0 ved 20 mm/s og 100 ms. Forsvinder sporet?",
         "Nej, det falder kun fra 2,2 til 2,0 mm. OID påvirker kun sporet gennem forstørrelsen. Bevægelse skal først og fremmest løses med kort tid, fiksering og instruktion."],
      ]],
      ["Overlejring", [
        ["Find læsionen", "Der ligger en lille læsion bag det runde objekt. Find den på billedet.",
         "Skift til 90°-projektionen. I 0° ligger læsionen i samme stråle som objektet og forsvinder i dets skygge."],
        ["Uden at skifte projektion", "Bliv i 0°. Kan du få læsionen frem med rørets vinkling? Og ved at flytte objektet ud fra midten?",
         "Vinkling på cirka 20° eller mere får læsionen frem ved siden af objektet, fordi ting i forskellig højde forskydes forskelligt. At flytte objektet 20 cm ud fra midten er ikke nok. Vinklede optagelser bruges netop til at få overlejrede strukturer fri af hinanden."],
      ]],
      ["Samlet", [
        ["Den bedste optagelse", "Vælg den aflange knogle med 40° hældning og bevægelse 20 mm/s. Find indstillinger, der giver mindst muligt af forstørrelse, halvskygge, forkortning og bevægelsesspor. Hvad valgte I, og hvad ville det koste i praksis?",
         "For eksempel lav OID, lang SID, kort tid og vinkling mod forkortningen. Prisen: lang SID og kort tid kræver høj mA, lille fokus tåler mindre belastning, og vinkling giver de to ender forskellig forstørrelse. Der er ikke én rigtig løsning, men en afvejning."],
      ]],
      ["Formler", [
        ["Forstørrelse i hånden", "Forstørrelsen er $$M = \\frac{SID}{SOD} \\quad SOD = SID - OID$$ Regn $M$ ud for SID 100 cm og OID 10 cm, og tjek tallet i simulatoren.",
         "$M = \\frac{100}{90} \\approx 1,11$. Simulatoren viser det samme under Forstørrelse."],
        ["Halvskygge i hånden", "Halvskyggen er $$U = f \\cdot \\frac{OID}{SOD}$$ hvor $f$ er fokusstørrelsen. Regn $U$ ud for stort fokus (1,2 mm), SID 100 cm og OID 10 cm. Hvad sker der med $U$, når $f$ halveres?",
         "$U = 1,2 \\cdot \\frac{10}{90} \\approx 0,13$ mm. $U$ er proportional med $f$, så halvt fokus giver halv halvskygge: 0,07 mm."],
        ["Bevægelse i hånden", "Bevægelsessporet er $$B = v \\cdot t \\cdot M$$ Hvor lang må eksponeringstiden højst være, for at $B < 0,5$ mm ved $v = 20$ mm/s og $M = 1,11$? Tjek i simulatoren.",
         "$t < \\frac{0,5}{20 \\cdot 1,11} \\approx 0,022$ s, altså cirka 22 ms. I simulatoren giver 20 ms et spor på 0,44 mm."],
        ["Forkortning i hånden", "For en skrå knogle med længden $L$ og hældningen $\\theta$ er skyggens længde cirka $$L_s \\approx M \\cdot L \\cdot \\cos\\theta$$ Regn $L_s$ ud for $L = 12$ cm og $M = 1,11$ ved 40° og 60°. Passer det med simulatoren?",
         "$\\cos 40° \\approx 0,77$ giver $L_s \\approx 10,2$ cm, og $\\cos 60° = 0,5$ giver $L_s \\approx 6,7$ cm. Det passer med simulatoren. Formlen er en tilnærmelse, fordi de to ender i virkeligheden har forskellig forstørrelse."],
        ["Afstandskvadratloven", "Intensiteten falder med afstanden i anden: $$\\frac{I_2}{I_1} = \\left(\\frac{d_1}{d_2}\\right)^2$$ Hvis SID øges fra 100 til 180 cm, hvor mange gange skal mAs øges for at give samme dosis til detektoren? Det regner simulatoren ikke på.",
         "$\\left(\\frac{180}{100}\\right)^2 \\approx 3,2$. mAs skal altså godt tredobles. Det er prisen for den mindre forstørrelse og halvskygge ved lang SID."],
      ], "deep"],
    ],
    answer: "Vis svar", dec: ",",
    back: "← Læring", foot: "© 2026 Oliver Brage. Alle rettigheder forbeholdes.", privacy: "Privatliv",
  },
  en: {
    sub: "Move the focal spot, the object and the detector, and watch what happens to the shadow. The numbers are worked out in real centimeters and millimeters.",
    grund: "Basic", deep: "Deeper level",
    setup: "Setup, side view", zoom: "Close-up",
    image: "What the detector saw", loupe: "Loupe on the edge",
    scale: "On the left the whole setup, on the right the orange frame magnified. Both are true to proportion. The focal spot is drawn larger than life.",
    truth: "Dashed: the object's true size, for comparison. It is not part of the image.",
    oval: "Length / width in the image", trueW: "True width",
    focus: "focal spot", detector: "detector", lesion: "lesion", near: "near end", far: "far end",
    km: "Magnification", ku: "Penumbra", kb: "Motion trace", nearFar: "near / far end",
    ctl: {
      obj: "Object", circle: "Round object", rod: "Long bone",
      focus: "Focal spot", small: "Small 0.6 mm", large: "Large 1.2 mm",
      sid: "SID, source to image", oid: "OID, object to image",
      objAngle: "Bone tilt", tube: "Tube angle", offset: "Object off center",
      speed: "Patient motion", time: "Exposure time", proj: "Projection",
      onlyRod: "long bone only", onlyCircle: "round object only",
    },
    legRays: "rays from the two edges of the focal spot", legRaysRod: "rays from the focal spot to the bone's ends",
    legLesion: "ray through the lesion", legShadow: "shadow on the detector",
    legTrue: "the object's true size", legZoom: "close-up",
    pen: "penumbra", penMotion: "penumbra + motion", objSide: "object's shadow", around: "surroundings",
    of: "of", prev: "Previous task", next: "Next task",
    tasks: "Tasks",
    seen: "What you can see:", pin: "Save the numbers", unpin: "Remove saved", saved: "saved",
    see: {
      motion: "The motion trace ({b} mm) is much larger than the penumbra. A shorter time helps most.",
      rod: "The bone is tilted, so the shadow gets shorter, and the far end gets wider and more blurred.",
      tube: "The tube is angled, so the shadow is stretched into an oval: length / width {r}.",
      lesion: "The lesion can now be seen beside the object.",
      hidden: "The lesion is hidden in the object's shadow.",
      big: "The magnification is {m}×. A smaller OID or a longer SID makes it smaller.",
      base: "Magnification {m}× and penumbra {u} mm. Try changing OID and SID.",
    },
    model: "How the model works",
    modelText: "<p>The simulator works with straight rays from a focal spot of a given width, seen from the side, and with similar triangles: $$M = \\frac{SID}{SOD} \\quad U = f \\cdot \\frac{OID}{SOD} \\quad B = v \\cdot t \\cdot M$$ OID is measured to the middle of the object, and the focal spot is a straight line as wide as the focal spot size. Scatter, the heel effect and the detector's own blur are left out, so only the geometry is shown. The focal spot is drawn larger than life, but the numbers use its real size.</p><p>Sources: Bushong, Radiologic Science for Technologists. Carlton and Adler, Principles of Radiographic Imaging.</p>",
    help: {
      obj: "The round object shows magnification, blur and superimposition. The long bone shows shape distortion.",
      focus: "How large an area of the anode the radiation comes from.",
      sid: "The distance from the focal spot to the detector.",
      oid: "The distance from the object to the detector.",
      objAngle: "How steeply the bone is tilted relative to the detector.",
      tube: "Angles the tube, so the beam hits at a slant.",
      offset: "Moves the object away from the central ray.",
      speed: "How fast the patient moves during the exposure.",
      time: "How long the radiation is on.",
      proj: "The direction the beam comes from: 0° from above, 90° from the side.",
    },
    groups: [
      ["Magnification", [
        ["The knee on the table", "A knee lies on the table, and the detector sits in the Bucky tray under the table. That gives about 8 cm OID. Is the knee magnified more or less than with the detector right under the knee? Try the OID slider.",
         "More. The table and the tray put distance between the knee and the detector, and that distance gives magnification. At SID 100 cm the magnification goes from about 1.02 to 1.09."],
        ["Down on the detector", "Set OID to 0. Why is the magnification still not exactly 1.00?",
         "It is 1.02. OID is measured to the middle of the object, and the object has a thickness, so its middle is always a little above the detector, here 1.7 cm. Everything above the detector is magnified a little."],
        ["Longer distance", "Keep OID at 10 cm. How long must SID be for the magnification to come down to 1.10? What is it at 180 cm?",
         "110 cm gives 1.10, and 180 cm gives 1.06. The longer the SID, the more parallel the rays through the object, and the less magnification."],
        ["The heart on a chest X-ray", "The heart lies at the front of the chest. In a PA projection it is about 5 cm from the detector, in an AP projection about 15 cm. Compare the magnification at SID 100 and SID 180. Why is the chest taken PA at 180 cm?",
         "At SID 100: 1.05 for PA and 1.18 for AP. At SID 180: 1.03 and 1.09. PA at a long distance gives the least magnification, so the size of the heart can be judged. On an AP image the heart can look enlarged without being so."],
      ]],
      ["Shape distortion", [
        ["The tilted finger", "Choose the long bone. A finger cannot be straightened and lies tilted up from the detector. Is the bone longer or shorter in the image? And are the two ends equally wide?",
         "Shorter. That is foreshortening. The bone is tilted, so its shadow is shorter than the bone itself. The far end is further from the detector, so it is magnified more and looks wider."],
        ["How short?", "Keep OID at 10 cm. Compare the bone's shadow with the dashed true length at 0°, 40° and 60° tilt. At which tilt does the shadow become shorter than the bone?",
         "At 0° the shadow is about 13.3 cm, longer than the bone's 12 cm, because the whole bone lies above the detector and is magnified. At 40° it is about 10 cm, and at 60° under 7 cm. The tilt shortens more than the magnification lengthens."],
        ["Round turns oval", "Choose the round object and set the tube angle to 10°, 20° and 30°. What happens to the shape? See the number under the image.",
         "The shadow turns oval, stretched in the direction of the angle. The length-to-width ratio goes from 1.00 to 1.02, 1.06 and 1.15. That is elongation: the beam hits at a slant, so the shadow is drawn out."],
        ["Off center", "Set the angle to 0° and move the object 20 cm off center. Does it become as oval as with a 30° angle? Look also at the lesion's orange ray in the close-up.",
         "No, only 1.02 against 1.15. Off center the beam is only slightly slanted. But the lesion's ray moves away from the middle of the object: things at different heights shift relative to each other. That is why you center on what is to be assessed."],
        ["Angling against foreshortening", "Choose the long bone at 40° tilt. Can the tube angle make the shadow as long as that of the flat bone? How much does it take?",
         "Yes. Without angling the shadow is about 10 cm. At 20° it is about 13.4 cm, like the flat bone. The angle stretches the shadow and counters the foreshortening. But the two ends are still magnified differently, so the shape is not quite right."],
      ]],
      ["Focal spot blur", [
        ["Two changes", "Find two changes that make both the magnification and the penumbra smaller.",
         "Smaller OID and longer SID. The focal spot size only changes the penumbra, not the magnification."],
        ["Small or large focal spot", "Switch between small and large focal spot at OID 10. What happens to the penumbra and the magnification? Why not always use the small focal spot?",
         "The penumbra halves from 0.13 to 0.07 mm, and the magnification stays the same. A small focal spot gathers the heat on a smaller area of the anode, so it cannot take as high a mA. The exposure time gets longer, and so does the risk of motion."],
        ["Right on the detector", "Set OID to 0. How large is the penumbra now? What does that mean for a hand lying directly on the detector?",
         "About 0.02 mm, almost nothing. The penumbra grows with the distance to the detector, so what lies close to the detector is sharp, even with a large focal spot."],
        ["The blurred end", "Choose the long bone at 40° tilt and look at the loupe. Why is the far end more blurred?",
         "The far end lies about 13 cm above the detector, the near end about 7 cm. The penumbra is 0.18 against 0.09 mm. More distance to the detector gives both more magnification and more penumbra."],
        ["Long distance", "Keep OID at 10 cm and the large focal spot, and set SID to 180 cm. What happens to the penumbra?",
         "It drops to 0.07 mm, as little as with the small focal spot at SID 100. A long SID makes both magnification and penumbra smaller, but needs more mAs, because the intensity falls with the square of the distance."],
      ]],
      ["Motion blur", [
        ["The restless child", "Set patient motion to 20 mm/s, like a restless child. Find two changes that make the motion trace shorter.",
         "Shorter exposure time and smaller OID. The trace is motion times time times magnification. In practice, immobilization and instruction come on top."],
        ["How short a time?", "Keep motion at 20 mm/s and OID at 10 cm. Which exposure time gives a trace under 0.5 mm?",
         "20 ms gives 0.44 mm, while 100 ms gives 2.2 mm. Half the time gives half the trace."],
        ["Which is larger?", "Compare the motion trace and the penumbra at 20 mm/s and 100 ms. Which matters most? What does that mean for the choice of focal spot for a restless child?",
         "The motion trace is 2.2 mm and the penumbra 0.13 mm, so the trace is more than 15 times larger. A small focal spot hardly helps here. A large focal spot takes a higher mA, so the time can be shorter, and that reduces the biggest problem."],
        ["Does OID help?", "Set OID to 0 at 20 mm/s and 100 ms. Does the trace disappear?",
         "No, it only drops from 2.2 to 2.0 mm. OID affects the trace only through the magnification. Motion is solved first of all with a short time, immobilization and instruction."],
      ]],
      ["Superimposition", [
        ["Find the lesion", "A small lesion lies behind the round object. Find it in the image.",
         "Switch to the 90° projection. At 0° the lesion lies in the same ray as the object and disappears in its shadow."],
        ["Without changing projection", "Stay at 0°. Can you bring out the lesion with the tube angle? And by moving the object off center?",
         "An angle of about 20° or more brings the lesion out beside the object, because things at different heights shift by different amounts. Moving the object 20 cm off center is not enough. Angled projections are used precisely to free superimposed structures from each other."],
      ]],
      ["All together", [
        ["The best exposure", "Choose the long bone at 40° tilt and motion of 20 mm/s. Find settings that give as little magnification, penumbra, foreshortening and motion trace as possible. What did you choose, and what would it cost in practice?",
         "For example a low OID, a long SID, a short time and an angle against the foreshortening. The cost: a long SID and a short time need a high mA, a small focal spot takes less load, and the angle magnifies the two ends differently. There is no single right answer, only a trade-off."],
      ]],
      ["Formulas", [
        ["Magnification by hand", "The magnification is $$M = \\frac{SID}{SOD} \\quad SOD = SID - OID$$ Work out $M$ for SID 100 cm and OID 10 cm, and check the number in the simulator.",
         "$M = \\frac{100}{90} \\approx 1.11$. The simulator shows the same under Magnification."],
        ["Penumbra by hand", "The penumbra is $$U = f \\cdot \\frac{OID}{SOD}$$ where $f$ is the focal spot size. Work out $U$ for the large focal spot (1.2 mm), SID 100 cm and OID 10 cm. What happens to $U$ when $f$ is halved?",
         "$U = 1.2 \\cdot \\frac{10}{90} \\approx 0.13$ mm. $U$ is proportional to $f$, so half the focal spot gives half the penumbra: 0.07 mm."],
        ["Motion by hand", "The motion trace is $$B = v \\cdot t \\cdot M$$ How long can the exposure last at most for $B < 0.5$ mm at $v = 20$ mm/s and $M = 1.11$? Check in the simulator.",
         "$t < \\frac{0.5}{20 \\cdot 1.11} \\approx 0.022$ s, about 22 ms. In the simulator 20 ms gives a trace of 0.44 mm."],
        ["Foreshortening by hand", "For a tilted bone of length $L$ and tilt $\\theta$, the shadow's length is roughly $$L_s \\approx M \\cdot L \\cdot \\cos\\theta$$ Work out $L_s$ for $L = 12$ cm and $M = 1.11$ at 40° and 60°. Does it match the simulator?",
         "$\\cos 40° \\approx 0.77$ gives $L_s \\approx 10.2$ cm, and $\\cos 60° = 0.5$ gives $L_s \\approx 6.7$ cm. That matches the simulator. The formula is an approximation, because the two ends are really magnified differently."],
        ["The inverse square law", "The intensity falls with the square of the distance: $$\\frac{I_2}{I_1} = \\left(\\frac{d_1}{d_2}\\right)^2$$ If SID goes from 100 to 180 cm, how many times must the mAs go up to give the same dose to the detector? The simulator does not calculate this.",
         "$\\left(\\frac{180}{100}\\right)^2 \\approx 3.2$. So the mAs must be a little more than tripled. That is the price of the smaller magnification and penumbra at a long SID."],
      ], "deep"],
    ],
    answer: "Show answer", dec: ".",
    back: "← Learn", foot: "© 2026 Oliver Brage. All rights reserved.", privacy: "Privacy",
  },
};

// ---- state & geometry (cm, detector at y = 0) ----------------------------
const S = { lang: "da", level: "grund", obj: "circle", focus: 1.2, sid: 100, oid: 10,
            objAngle: 0, tube: 0, offset: 0, speed: 0, time: 100, proj: 0 };
const R = 1.5, ROD = 12, ROD_W = 1.8, LES_R = 0.5, LES_D = 4;   // round object radius, bone length and width, lesion radius and depth
const css = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();

function objC() {
  // a tilted rod needs room above the detector
  const lift = S.obj === "rod" ? ROD / 2 * Math.sin(S.objAngle * Math.PI / 180) + ROD_W / 2 : R + 0.2;
  return [S.offset, Math.max(S.oid, lift)];
}
function focusC() {
  // the tube is angled by sliding it sideways, aimed at the middle of the detector at the object's height.
  // Moving the object off center therefore takes it out of the central ray.
  const [, oy] = objC();
  return [-(S.sid - oy) * Math.tan(S.tube * Math.PI / 180), S.sid];
}
function focusEnds() {
  const [fx, fy] = focusC(), w = S.focus / 10;
  return [[fx - w / 2, fy], [fx + w / 2, fy]];
}
function rodEnds() {  // [near end, far end] of the bone's centre line; the round caps make up the full length
  const C = objC(), a = S.objAngle * Math.PI / 180, half = (ROD - ROD_W) / 2, d = [Math.cos(a) * half, Math.sin(a) * half];
  return [[C[0] - d[0], C[1] - d[1]], [C[0] + d[0], C[1] + d[1]]];
}
function tangents(F, C, r) {   // where the two tangents from F to the circle hit y = 0
  const dx = C[0] - F[0], dy = C[1] - F[1], d = Math.hypot(dx, dy);
  const phi = Math.atan2(dy, dx), a = Math.asin(Math.min(0.999, r / d));
  return [phi - a, phi + a].map(ang => F[0] + (0 - F[1]) / Math.sin(ang) * Math.cos(ang)).sort((p, q) => p - q);
}
const proj = (F, p) => F[0] + (p[0] - F[0]) * F[1] / (F[1] - p[1]);
function circleShadow(C, r) {
  const s = focusEnds().map(F => tangents(F, C, r));
  return { ul: Math.min(s[0][0], s[1][0]), ur: Math.max(s[0][1], s[1][1]),
           il: Math.max(s[0][0], s[1][0]), ir: Math.min(s[0][1], s[1][1]) };
}
function sphereHalfHeight(C, r) {
  // the shadow of a sphere is a conic section; across the side view (out of the drawing plane)
  // its half-width is SID·sin(a)/sqrt(cos²(t) − sin²(a)), t = ray angle from vertical, a = cone half-angle
  const F = focusC(), dx = C[0] - F[0], dy = F[1] - C[1], d = Math.hypot(dx, dy);
  const sa = r / d, ct = dy / d;
  return S.sid * sa / Math.sqrt(ct * ct - sa * sa);
}
function lesionC() {
  const [ox, oy] = objC();
  return S.proj === 0 ? [ox, oy + LES_D] : [ox + LES_D, oy];
}
function lesionVisible() {   // the lesion shows when its shadow falls (mostly) outside the object's
  const F = focusC(), sh = circleShadow(objC(), R), lx = proj(F, lesionC()), bx = (sh.ul + sh.ur) / 2;
  const lr = LES_R * S.sid / (S.sid - lesionC()[1]);
  return Math.abs(lx - bx) > (sh.ur - sh.ul) / 2 - lr * .3;
}
function at(y) {   // the numbers for a point at height y above the detector
  const sod = S.sid - y, M = S.sid / sod;
  return { y, sod, M, U: S.focus * y / sod,              // penumbra in mm, same formula as the video
           B: S.speed * S.time / 1000 * M };             // motion trace in mm
}
function numbers() {   // one set for the round object, near and far end for the bone
  return S.obj === "rod" ? rodEnds().map(p => at(p[1])) : [at(objC()[1])];
}

// ---- canvases -------------------------------------------------------------
function fit(cv) {
  const r = cv.getBoundingClientRect(), dpr = window.devicePixelRatio || 1;
  cv.width = Math.round(r.width * dpr); cv.height = Math.round(r.height * dpr);
  const ctx = cv.getContext("2d"); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return [ctx, r.width, r.height];
}
function line(ctx, a, b, color, w = 1, dash = null, alpha = 1, cap = "butt") {
  ctx.save(); ctx.globalAlpha = alpha; ctx.strokeStyle = color; ctx.lineWidth = w; ctx.lineCap = cap;
  if (dash) ctx.setLineDash(dash);
  ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.stroke(); ctx.restore();
}
function text(ctx, s, x, y, color, align = "left", size = 12) {
  ctx.fillStyle = color; ctx.font = `${size}px ${css("--body")}`; ctx.textAlign = align; ctx.fillText(s, x, y);
}
function arrow(ctx, x, ya, yb, lbl) {   // a vertical distance marker with its label on the left
  const c = css("--muted");
  line(ctx, [x, ya], [x, yb], c); line(ctx, [x - 4, ya], [x + 4, ya], c); line(ctx, [x - 4, yb], [x + 4, yb], c);
  text(ctx, lbl, x - 6, (ya + yb) / 2 + 4, c, "right", 11);
}

// what the close-up must contain, in cm: the object, its lesion and its shadow on the detector
function zoomBox() {
  // The box covers every bone tilt and both projections, so the close-up keeps one scale while
  // the tilt or projection changes. Otherwise the bone would seem to change length and thickness.
  const keep = [S.objAngle, S.proj], xs = [], ys = [0];
  for (const ang of [0, 15, 30, 45, 60]) for (const pr of [0, 90]) {
    S.objAngle = ang; S.proj = pr;
    const F = focusC(), C = objC();
    if (S.obj === "circle") {
      const sh = circleShadow(C, R), Lc = lesionC();
      xs.push(C[0] - R, C[0] + R, sh.ul, sh.ur, Lc[0] - LES_R, Lc[0] + LES_R); ys.push(C[1] + R, Lc[1] + LES_R);
    } else {
      for (const p of rodEnds()) { xs.push(p[0] - ROD_W, p[0] + ROD_W, proj(F, p) - ROD_W, proj(F, p) + ROD_W); ys.push(p[1] + ROD_W); }
    }
  }
  [S.objAngle, S.proj] = keep;
  return { x0: Math.min(...xs) - 1.5, x1: Math.max(...xs) + 1.5, y1: Math.max(...ys) + 1.5 };
}

function drawGeo() {
  // One canvas: the whole setup on the left, the orange frame around the object magnified on the right,
  // joined by two orange lines so it is clear which is which. Both use one scale in both directions.
  const L = T[S.lang], [ctx, W, H] = fit(document.getElementById("geo"));
  ctx.clearRect(0, 0, W, H);
  const F = focusC(), C = objC(), ends = focusEnds();
  const signal = css("--signal"), hot = css("--hot"), bone = css("--bone"), amber = css("--amber"), fg = css("--fg");

  // layout: overview strip on the left, close-up box on the right
  const OW = Math.max(120, Math.min(W * 0.36, 260)), gap = 34;
  const box = { x: OW + gap, y: 6, w: W - OW - gap - 6, h: H - 12 };

  // close-up scale and the area it shows, in cm
  const zb = zoomBox(), zpad = 26, right = 46;     // room under the detector and for the OID marker
  const z = Math.min((box.w - right - 16) / (zb.x1 - zb.x0), (box.h - zpad - 28) / zb.y1);
  const zmid = (zb.x0 + zb.x1) / 2, zcx = box.x + (box.w - right) / 2;
  const ZX = x => zcx + (x - zmid) * z, ZY = y => box.y + box.h - zpad - y * z, ZP = p => [ZX(p[0]), ZY(p[1])];
  const zview = { x0: zmid - (zcx - box.x) / z, x1: zmid + (box.x + box.w - zcx) / z, y0: -zpad / z, y1: (box.h - zpad) / z };

  // overview scale
  const top = 18, bot = H - 34;
  const xs = [-21.5, 21.5, F[0] - 3, F[0] + 3, zview.x0, zview.x1];
  const span = Math.max(...xs) - Math.min(...xs), mid = (Math.max(...xs) + Math.min(...xs)) / 2;
  const s = Math.min((bot - top) / (S.sid + 5), (OW - 70) / span);
  const X = x => (OW - 40) / 2 + 12 + (x - mid) * s, Y = y => bot - y * s, P = p => [X(p[0]), Y(p[1])];

  // --- overview -------------------------------------------------------------
  ctx.save(); ctx.beginPath(); ctx.rect(0, 0, OW, H); ctx.clip();
  ctx.fillStyle = "rgba(255,255,255,.25)"; ctx.fillRect(X(-21.5), Y(0), 43 * s, 4);
  text(ctx, L.detector, X(-21.5), Y(0) + 20, css("--muted"));
  const hit = S.obj === "circle" ? proj(F, C) : (proj(F, rodEnds()[0]) + proj(F, rodEnds()[1])) / 2;
  line(ctx, P(F), P([hit, 0]), signal, 1, [4, 4], .7);
  if (S.obj === "circle") {
    ctx.fillStyle = bone; ctx.beginPath(); ctx.arc(X(C[0]), Y(C[1]), Math.max(R * s, 1.5), 0, 7); ctx.fill();
  } else {
    const [p1, p2] = rodEnds(); line(ctx, P(p1), P(p2), bone, Math.max(ROD_W * s, 2), null, 1, "round");
  }
  const fw = Math.max(S.focus / 10 * 20 * s, 4);   // focal spot drawn 20x wider than life
  ctx.fillStyle = fg; ctx.fillRect(X(F[0]) - fw / 2, Y(F[1]) - 3, fw, 6);
  ctx.font = `12px ${css("--body")}`;                  // label left of the focal spot, or right if there is no room
  if (X(F[0]) - fw / 2 - 8 - ctx.measureText(L.focus).width > 2) text(ctx, L.focus, X(F[0]) - fw / 2 - 6, Y(F[1]) + 4, fg, "right");
  else text(ctx, L.focus, X(F[0]) + fw / 2 + 6, Y(F[1]) + 4, fg, "left");
  arrow(ctx, OW - 8, Y(S.sid), Y(0), `SID ${fmt(S.sid, 0)}`);
  ctx.restore();

  // --- the frame, the joining lines and the close-up box ----------------------
  const fr = { x: X(zview.x0), y: Y(zview.y1), w: (zview.x1 - zview.x0) * s, h: (zview.y1 - zview.y0) * s };
  ctx.save(); ctx.strokeStyle = amber; ctx.globalAlpha = .55; ctx.lineWidth = 1; ctx.setLineDash([3, 3]);
  ctx.beginPath(); ctx.moveTo(fr.x + fr.w, fr.y); ctx.lineTo(box.x, box.y);
  ctx.moveTo(fr.x + fr.w, fr.y + fr.h); ctx.lineTo(box.x, box.y + box.h); ctx.stroke(); ctx.restore();
  ctx.strokeStyle = amber; ctx.lineWidth = 1.5; ctx.strokeRect(fr.x, fr.y, fr.w, fr.h);
  text(ctx, L.zoom, fr.x - 4, fr.y - 4, amber, "right", 11);
  ctx.fillStyle = "rgba(0,0,0,.18)"; ctx.fillRect(box.x, box.y, box.w, box.h);
  ctx.strokeStyle = amber; ctx.lineWidth = 2; ctx.strokeRect(box.x, box.y, box.w, box.h);

  ctx.save(); ctx.beginPath(); ctx.rect(box.x, box.y, box.w, box.h); ctx.clip();
  ctx.fillStyle = "rgba(255,255,255,.25)";
  ctx.fillRect(Math.max(box.x, ZX(-21.5)), ZY(0), Math.min(box.x + box.w, ZX(21.5)) - Math.max(box.x, ZX(-21.5)), 5);
  if (S.obj === "circle") {
    for (const E of ends) for (const x of tangents(E, C, R)) line(ctx, ZP(E), ZP([x, 0]), signal, 1, null, .55);
    const sh = circleShadow(C, R);
    line(ctx, ZP([sh.il, 0]), ZP([sh.ir, 0]), bone, 5);
    line(ctx, ZP([sh.ul, 0]), ZP([sh.il, 0]), hot, 5); line(ctx, ZP([sh.ir, 0]), ZP([sh.ur, 0]), hot, 5);
    ctx.save(); ctx.fillStyle = "rgba(232,232,232,.45)"; ctx.strokeStyle = bone;
    ctx.beginPath(); ctx.arc(ZX(C[0]), ZY(C[1]), R * z, 0, 7); ctx.fill(); ctx.stroke(); ctx.restore();
    const Lc = lesionC();
    for (const x of tangents(F, Lc, LES_R)) line(ctx, ZP(F), ZP([x, 0]), amber, 1, null, .45);
    ctx.fillStyle = "#AEB4C2"; ctx.beginPath(); ctx.arc(ZX(Lc[0]), ZY(Lc[1]), LES_R * z, 0, 7); ctx.fill();
    text(ctx, L.lesion, ZX(Lc[0]) + LES_R * z + 6, ZY(Lc[1]) + 4, amber);
    line(ctx, [ZX(C[0] - R), ZY(0) + 12], [ZX(C[0] + R), ZY(0) + 12], fg, 1.5, [4, 3]);
  } else {
    const [p1, p2] = rodEnds(), a = S.objAngle * Math.PI / 180, e = [Math.cos(a) * ROD_W / 2, Math.sin(a) * ROD_W / 2];
    const t1 = [p1[0] - e[0], p1[1] - e[1]], t2 = [p2[0] + e[0], p2[1] + e[1]];   // the bone's outer tips
    const x1 = proj(F, t1), x2 = proj(F, t2);
    line(ctx, ZP(F), ZP([x1, 0]), signal, 1, null, .55); line(ctx, ZP(F), ZP([x2, 0]), signal, 1, null, .55);
    line(ctx, ZP(p1), ZP(p2), bone, ROD_W * z, null, .8, "round");   // keeps its real length when tilted
    line(ctx, ZP([x1, 0]), ZP([x2, 0]), bone, 5);
    text(ctx, L.near, ZX(p1[0]), ZY(p1[1]) - ROD_W * z / 2 - 6, css("--muted"), "center", 11);
    text(ctx, L.far, ZX(p2[0]), ZY(p2[1]) - ROD_W * z / 2 - 6, css("--muted"), "center", 11);
    line(ctx, [ZX(C[0] - ROD / 2), ZY(0) + 12], [ZX(C[0] + ROD / 2), ZY(0) + 12], fg, 1.5, [4, 3]);
  }
  arrow(ctx, box.x + box.w - 10, ZY(C[1]), ZY(0), `OID ${fmt(C[1], 0)}`);
  ctx.restore();
  // label inside the box, with how much it is magnified compared with the overview
  ctx.fillStyle = css("--panel"); ctx.fillRect(box.x + 2, box.y + 2, 118, 20);
  text(ctx, `${L.zoom} ×${fmt(z / s, 0)}`, box.x + 8, box.y + 16, amber, "left", 12);
}

function drawImage() {
  const cv = document.getElementById("img"), [ctx, W, H] = fit(cv);
  ctx.fillStyle = css("--soft"); ctx.fillRect(0, 0, W, H);
  const cx = W / 2, cy = H / 2, n = numbers(), bone = css("--bone"), F = focusC(), C = objC();
  // the motion trace smears the shadow up and down: many faint copies side by side
  // layers = how many fills each copy makes; together they add up to an almost opaque shadow
  const smearCopies = (layers, draw) => {
    const smear = n[0].B / 10, copies = smear > 0.005 ? 16 : 1;
    ctx.fillStyle = bone; ctx.globalAlpha = 1 - Math.pow(0.03, 1 / (copies * layers));
    for (let c = 0; c < copies; c++) draw(copies > 1 ? (c / (copies - 1) - .5) * smear : 0);
    ctx.globalAlpha = 1;
  };
  if (S.obj === "circle") {
    const k = W / 12;                                    // px per cm in the image
    const sh = circleShadow(C, R), pen = ((sh.il - sh.ul) + (sh.ur - sh.ir)) / 2;
    const b = sphereHalfHeight(C, R), steps = 14;
    smearCopies(steps, dy => {
      for (let i = 0; i < steps; i++) {                  // umbra in the middle, fading out over the penumbra
        const f = i / (steps - 1);
        const w = (sh.ur - sh.ul) + f * ((sh.ir - sh.il) - (sh.ur - sh.ul)), hh = 2 * b + pen - 2 * f * pen;
        ctx.beginPath(); ctx.ellipse(cx, cy + dy * k, Math.max(w, .02) / 2 * k, Math.max(hh, .02) / 2 * k, 0, 0, 7); ctx.fill();
      }
    });
    // lesion: hidden while its shadow falls inside the object's
    const lx = proj(F, lesionC()), bx = (sh.ul + sh.ur) / 2;
    const off = (lx - bx) * k, lr = LES_R * S.sid / (S.sid - lesionC()[1]) * k;  // its own magnification
    if (lesionVisible()) {
      ctx.fillStyle = "#AEB4C2"; ctx.beginPath(); ctx.arc(cx + off, cy, lr, 0, 7); ctx.fill();
      pill(ctx, T[S.lang].lesion, cx + off, cy - lr - 8, css("--amber"));
    }
    ctx.save(); ctx.setLineDash([5, 4]); ctx.strokeStyle = css("--bg"); ctx.lineWidth = 1.5;   // dark, so it shows on the light shadow
    ctx.beginPath(); ctx.arc(cx, cy, R * k, 0, 7); ctx.stroke(); ctx.restore();
  } else {
    // each end has its own magnification, so the shadow is wider at the far end
    const [p1, p2] = rodEnds(), x1 = proj(F, p1), x2 = proj(F, p2), m = (x1 + x2) / 2;
    const k = W / Math.max(ROD, Math.abs(x2 - x1) + 2 * ROD_W) / 1.15;   // the longer of bone and shadow fills the field
    const h1 = ROD_W / 2 * n[0].M, h2 = ROD_W / 2 * n[1].M, X = x => cx + (x - m) * k;
    smearCopies(1, dy => {
      const y = cy + dy * k;
      ctx.beginPath();
      ctx.moveTo(X(x1), y - h1 * k); ctx.lineTo(X(x2), y - h2 * k);
      ctx.arc(X(x2), y, h2 * k, -Math.PI / 2, Math.PI / 2);
      ctx.lineTo(X(x1), y + h1 * k);
      ctx.arc(X(x1), y, h1 * k, Math.PI / 2, 3 * Math.PI / 2);
      ctx.fill();
    });
    ctx.save(); ctx.setLineDash([5, 4]); ctx.strokeStyle = css("--bg"); ctx.lineWidth = 1.5;
    roundRect(ctx, cx - ROD / 2 * k, cy - ROD_W / 2 * k, ROD * k, ROD_W * k, ROD_W / 2 * k); ctx.stroke(); ctx.restore();
    // width markers: the shadow's width at each end, and the bone's true width for comparison
    const amber = css("--amber"), L = T[S.lang];
    for (const [x, h, lbl] of [[x1, h1, L.near], [x2, h2, L.far]]) {
      line(ctx, [X(x), cy - h * k], [X(x), cy + h * k], amber, 2);
      text(ctx, `${fmt(2 * h, 1)} cm`, X(x), cy + h * k + 16, amber, "center", 12);
      text(ctx, lbl, X(x), cy + h * k + 30, css("--fg"), "center", 11);
    }
    text(ctx, `${L.trueW}: ${fmt(ROD_W, 1)} cm`, cx, cy - ROD_W / 2 * k - 12, css("--fg"), "center", 11);
  }
}
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}

function pill(ctx, s, x, y, color = css("--fg")) {   // a centred label on a dark tag, readable on any background
  ctx.font = `11px ${css("--body")}`;
  const w = ctx.measureText(s).width + 10;
  ctx.fillStyle = "rgba(18,26,43,.88)"; roundRect(ctx, x - w / 2, y - 12, w, 17, 4); ctx.fill();
  text(ctx, s, x, y, color, "center", 11);
}

function drawLoupe() {
  // the edge profile: a ramp as wide as the penumbra, smeared by the motion trace.
  // The bone gets two strips, one per end, because the far end is blurrier.
  const cv = document.getElementById("loupe"), [ctx, W, H] = fit(cv), n = numbers(), L = T[S.lang];
  const span = Math.max(1, ...n.map(e => 2.5 * (e.U + e.B)));   // mm shown across the loupe
  const soft = [0x5A, 0x5F, 0x6B], bone = [0xE8, 0xE8, 0xE8], K = 24, bh = H / n.length;
  n.forEach((e, row) => {
    for (let px = 0; px < W; px++) {
      const x = (px / W - .5) * span;
      let I = 0;
      for (let j = 0; j < K; j++) {
        const u = x - (e.B ? (j / (K - 1) - .5) * e.B : 0);
        I += e.U > 1e-4 ? Math.min(1, Math.max(0, .5 - u / e.U)) : (u < 0 ? 1 : 0);
      }
      I /= K;
      ctx.fillStyle = `rgb(${soft.map((s, i) => Math.round(s + (bone[i] - s) * I)).join(",")})`;
      ctx.fillRect(px, row * bh, 1.5, bh);
    }
    if (n.length > 1) text(ctx, row ? L.far : L.near, 8, row * bh + 15, "#0A0E18", "left", 11);
  });
  if (n.length > 1) line(ctx, [0, bh], [W, bh], "#0A0E18", 2);
  // the grey transition is the penumbra (widened by the motion trace): a bracket across it, centred at the edge
  n.forEach((e, row) => {
    const w = Math.max((e.U + e.B) / span * W, 2), y = row * bh + bh / 2 + 6, l = W / 2 - w / 2, r = W / 2 + w / 2;
    line(ctx, [l, y], [r, y], "#0A0E18", 1.5);
    line(ctx, [l, y - 5], [l, y + 5], "#0A0E18", 1.5); line(ctx, [r, y - 5], [r, y + 5], "#0A0E18", 1.5);
    pill(ctx, e.B > 1e-3 ? L.penMotion : L.pen, W / 2, y - 10);
  });
  text(ctx, L.objSide, 8, bh - 8, "#0A0E18", "left", 11);
  text(ctx, L.around, W - 8, 15, css("--fg"), "right", 11);
  // scale bar
  const mm = span > 6 ? 2 : span > 2.5 ? 1 : 0.5, bar = mm / span * W;
  line(ctx, [W - 14 - bar, H - 12], [W - 14, H - 12], css("--hot"), 3);
  text(ctx, `${fmt(mm, mm < 1 ? 1 : 0)} mm`, W - 14 - bar / 2, H - 20, css("--hot"), "center", 11);
  ctx.strokeStyle = css("--amber"); ctx.lineWidth = 2; ctx.strokeRect(1, 1, W - 2, H - 2);
}

// ---- readouts ---------------------------------------------------------------
const fmt = (v, d = 2) => v.toFixed(d).replace(".", T[S.lang].dec);
function readouts() {
  const L = T[S.lang], n = numbers(), deep = S.level === "deep", rod = n.length > 1;
  const both = (f, unit) => n.map(f).join(" / ") + unit;          // "near / far" for the bone
  const set = (id, s) => { document.getElementById(id).textContent = s; };
  const sub = rod ? ` (${L.nearFar})` : "";
  set("k-m", L.km + sub); set("k-u", L.ku + sub); set("k-b", L.kb + sub);
  set("v-m", both(e => fmt(e.M), "×"));
  set("v-u", both(e => fmt(e.U), " mm"));
  set("v-b", both(e => fmt(e.B, 1), " mm"));
  set("f-m", deep ? "SID/SOD = " + n.map(e => `${fmt(S.sid, 0)}/${fmt(e.sod, 0)}`).join(" · ") : "");
  set("f-u", deep ? "f·OID/SOD = " + n.map(e => `${fmt(S.focus, 1)}·${fmt(e.y, 0)}/${fmt(e.sod, 0)}`).join(" · ") : "");
  set("f-b", deep ? "v·t·M = " + n.map(e => `${fmt(S.speed, 0)}·${fmt(S.time / 1000, 2)}·${fmt(e.M)}`).join(" · ") : "");
  // how oval the round object has become (deeper level only)
  let oval = "";
  if (!rod) {
    const sh = circleShadow(objC(), R), w = ((sh.ur - sh.ul) + (sh.ir - sh.il)) / 2;
    oval = `${L.oval}: ${fmt(w / (2 * sphereHalfHeight(objC(), R)))}`;
  }
  set("t-oval", oval);

  // what you can see: the first two observations that apply
  const e = n[n.length - 1], ratio = rod ? 0 : (() => { const sh = circleShadow(objC(), R);
    return ((sh.ur - sh.ul) + (sh.ir - sh.il)) / 2 / (2 * sphereHalfHeight(objC(), R)); })();
  const fill = t => t.replace("{b}", fmt(e.B, 1)).replace("{r}", fmt(ratio)).replace("{m}", fmt(e.M)).replace("{u}", fmt(e.U));
  const found = [
    [S.speed > 0 && e.B > 3 * e.U, "motion"], [rod && S.objAngle >= 10, "rod"], [!rod && S.tube >= 5, "tube"],
    [!rod && lesionVisible(), "lesion"], [!rod && S.proj === 0 && S.tube > 0 && !lesionVisible(), "hidden"],
    [e.M > 1.15, "big"]].filter(([on]) => on).slice(0, 2).map(([, k]) => k);
  const see = (found.length ? found : ["base"]).map(k => fill(L.see[k]));
  set("t-seen", L.seen); set("seen", see.join(" "));
  // saved numbers for comparison
  for (const k of ["m", "u", "b"]) set("p-" + k, PIN ? `${L.saved}: ${PIN[k]}` : "");
  set("pin", PIN ? L.unpin : L.pin);
}
let PIN = null;   // the numbers saved with the compare button
document.getElementById("pin").onclick = () => {
  PIN = PIN ? null : Object.fromEntries(["m", "u", "b"].map(k => [k, document.getElementById("v-" + k).textContent]));
  readouts();
};

// ---- controls -----------------------------------------------------------------
const SLIDERS = [
  ["sid", 80, 180, 5, v => `${v} cm`], ["oid", 0, 30, 1, v => `${v} cm`],
  ["objAngle", 0, 60, 5, v => `${v}°`], ["tube", 0, 30, 1, v => `${v}°`],
  ["offset", 0, 20, 1, v => `${v} cm`], ["speed", 0, 40, 1, v => `${v} mm/s`],
  ["time", 5, 500, 5, v => `${v} ms`],
];
function buildControls() {
  const L = T[S.lang].ctl, box = document.getElementById("controls");
  // a control that does nothing for the chosen object is greyed out, with a note saying which object it is for
  const off = k => k === "objAngle" && S.obj === "circle" ? L.onlyRod : k === "proj" && S.obj === "rod" ? L.onlyCircle : "";
  const help = k => S.level === "grund" ? `<p class="help">${T[S.lang].help[k]}</p>` : "";
  const seg = (key, opts) => `<div class="ctl${off(key) ? " off" : ""}"><label><span>${L[key]}</span><span>${off(key)}</span></label><div class="seg">` +
    opts.map(([val, lbl]) => `<button data-k="${key}" data-v="${val}" aria-pressed="${S[key] == val}"${off(key) ? " disabled" : ""}>${lbl}</button>`).join("") +
    `</div>${help(key)}</div>`;
  box.innerHTML =
    seg("obj", [["circle", L.circle], ["rod", L.rod]]) +
    seg("focus", [[0.6, L.small], [1.2, L.large]]) +
    SLIDERS.map(([k, mn, mx, st, f]) =>
      `<div class="ctl${off(k) ? " off" : ""}"><label for="s-${k}"><span>${L[k]}</span><span id="o-${k}">${off(k) || f(S[k])}</span></label>` +
      `<input type="range" id="s-${k}" min="${mn}" max="${mx}" step="${st}" value="${S[k]}"${off(k) ? " disabled" : ""}>${help(k)}</div>`).join("") +
    seg("proj", [[0, "0°"], [90, "90°"]]);
  box.querySelectorAll("button").forEach(b => b.onclick = () => {
    const k = b.dataset.k, v = b.dataset.v; S[k] = isNaN(+v) ? v : +v; buildControls(); render();
  });
  SLIDERS.forEach(([k, , , , f]) => {
    const el = document.getElementById(`s-${k}`);
    el.oninput = () => { S[k] = +el.value; document.getElementById(`o-${k}`).textContent = f(S[k]); render(); };
  });
}
function buildText() {
  const L = T[S.lang];
  document.documentElement.lang = S.lang;
  document.getElementById("t-title").textContent = S.lang === "da" ? "Når skyggen snyder" : "When the shadow lies";
  document.getElementById("t-sub").textContent = L.sub;
  document.title = (S.lang === "da" ? "Når skyggen snyder" : "When the shadow lies") + " | Oliver Brage";
  document.getElementById("t-back").textContent = L.back;
  document.getElementById("t-back").href = "../../?lang=" + S.lang;
  document.getElementById("t-foot").textContent = L.foot;
  document.getElementById("t-privacy").textContent = L.privacy;
  for (const [id, key] of [["t-setup", "setup"], ["t-image", "image"], ["t-loupe", "loupe"],
                           ["t-scale", "scale"], ["t-truth", "truth"], ["t-tasks", "tasks"], ["t-model", "model"]])
    document.getElementById(id).textContent = L[key];
  document.getElementById("model-text").innerHTML = withMath(L.modelText);
  document.getElementById("lvl-grund").textContent = L.grund;
  document.getElementById("lvl-deep").textContent = L.deep;
  document.getElementById("level-group").setAttribute("aria-label", S.lang === "da" ? "Niveau" : "Level");
  document.getElementById("task-list").innerHTML = groups().map(([g, items]) =>
    `<h4 class="tgroup">${g}</h4>` + items.map(([h, q, a]) =>
      `<details><summary>${h}</summary><p class="q">${withMath(q)}</p><details class="answer">` +
      `<summary>${L.answer}</summary><p class="a">${withMath(a)}</p></details></details>`).join("")).join("");
  buildCard();
}
function setPressed() {
  for (const [id, on] of [["lang-da", S.lang === "da"], ["lang-en", S.lang === "en"],
                          ["lvl-grund", S.level === "grund"], ["lvl-deep", S.level === "deep"]])
    document.getElementById(id).setAttribute("aria-pressed", on);
}
function legend() {
  const L = T[S.lang], item = (cls, s) => `<span><i class="${cls}"></i>${s}</span>`;
  document.getElementById("geo-legend").innerHTML =
    item("", S.obj === "circle" ? L.legRays : L.legRaysRod) + (S.obj === "circle" ? item("les", L.legLesion) : "") +
    item("sh", L.legShadow) + item("tr", L.legTrue) + item("zm", L.legZoom);
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
function render() { drawGeo(); drawImage(); drawLoupe(); readouts(); legend(); }
function all() { setPressed(); buildText(); buildControls(); render(); }

document.getElementById("lang-da").onclick = () => { S.lang = "da"; save(); all(); };
document.getElementById("lang-en").onclick = () => { S.lang = "en"; save(); all(); };
document.getElementById("lvl-grund").onclick = () => { S.level = "grund"; save(); all(); };
document.getElementById("lvl-deep").onclick = () => { S.level = "deep"; save(); all(); };
// language and level are kept in the address (?lang=da&level=deep), not in browser storage,
// so a link can open the right version and nothing is stored on the visitor's device
function save() {
  const q = new URLSearchParams(location.search);
  q.set("lang", S.lang); S.level === "deep" ? q.set("level", "deep") : q.delete("level");
  history.replaceState(null, "", "?" + q);
}
{
  const q = new URLSearchParams(location.search), l = q.get("lang");
  S.lang = l === "da" || l === "en" ? l : (navigator.language || "").toLowerCase().startsWith("da") ? "da" : "en";
  if (q.get("level") === "deep") S.level = "deep";
}
window.addEventListener("resize", render);
if (document.fonts && document.fonts.ready) document.fonts.ready.then(render);
all();
