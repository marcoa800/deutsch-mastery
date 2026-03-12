import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  MessageCircle, 
  Edit3, 
  Award, 
  CheckCircle, 
  PlayCircle,
  BrainCircuit,
  Target,
  Flame,
  Mic,
  Volume2,
  ArrowLeft,
  Send,
  Star,
  FileText,
  Clock,
  User,
  Briefcase,
  X
} from 'lucide-react';

import { initializeApp } from 'firebase/app';
import { getAuth, signInWithCustomToken, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, onSnapshot } from 'firebase/firestore';

// --- CONFIGURACIÓN GLOBAL DE FIREBASE ---
const appId = typeof __app_id !== 'undefined' ? __app_id : 'deutsch-mastery-app';
let app, auth, db;
try {
  apiKey: "AIzaSyAHtH9TNxxm03NbKyeU6uQAazqcHNaYZog",
  authDomain: "deutsch-mastery-app.firebaseapp.com",
  projectId: "deutsch-mastery-app",
  storageBucket: "deutsch-mastery-app.firebasestorage.app",
  messagingSenderId: "495317649948",
  appId: "1:495317649948:web:5fd90b6882aac79b132dd9"
}

// --- DATOS DE EVALUACIÓN DIAGNÓSTICA (22 PREGUNTAS DE ALEMÁN: BÁSICO A AVANZADO) ---
const evaluationQuestions = [
  {
    id: 1, question: "Alemán Básico: ¿Cuál es la forma correcta y formal de decir 'Buenos días, me llamo...'?",
    options: ["Hallo, ich heiße...", "Guten Morgen, mein Name ist...", "Guten Tag, ich bin...", "Tschüss, ich heiße..."],
    correct: 1, explanation: "'Guten Morgen' (hasta las 10-11am) y 'mein Name ist' denotan un registro formal adecuado (Sie-Form)."
  },
  {
    id: 2, question: "Artículos Definidos: En alemán, la palabra 'niña' (Mädchen) lleva el artículo...",
    options: ["der (masculino)", "die (femenino)", "das (neutro)", "den (acusativo)"],
    correct: 2, explanation: "En alemán, todos los diminutivos que terminan en '-chen' o '-lein' son siempre de género neutro (das)."
  },
  {
    id: 3, question: "Caso Acusativo: 'Ich sehe ______ Hund' (Veo al perro). 'Hund' es masculino.",
    options: ["der", "den", "dem", "des"],
    correct: 1, explanation: "El verbo 'sehen' rige Acusativo. El artículo masculino 'der' cambia a 'den' en acusativo."
  },
  {
    id: 4, question: "Caso Dativo: 'Ich helfe ______ Frau' (Ayudo a la mujer). 'Frau' es femenino.",
    options: ["die", "der", "den", "dem"],
    correct: 1, explanation: "El verbo 'helfen' rige Dativo. El artículo femenino 'die' cambia a 'der' en dativo."
  },
  {
    id: 5, question: "Verbos Modales y Estructura: 'Ich ______ heute Abend ins Kino ______.'",
    options: ["will / gehen", "will / gehe", "möchte / gegangen", "muss / zu gehen"],
    correct: 0, explanation: "Los verbos modales (will) envían el verbo principal en infinitivo (gehen) al final de la oración."
  },
  {
    id: 6, question: "El Pasado (Perfekt): ¿Cuál es el participio correcto de 'trinken' (beber)? 'Ich habe Wasser ______.'",
    options: ["getrinkt", "getrank", "getrunken", "trinkte"],
    correct: 2, explanation: "'Trinken' es un verbo fuerte (irregular). Su participio II es 'getrunken'."
  },
  {
    id: 7, question: "Verbos Separables: 'anrufen' (llamar por teléfono). 'Yo te llamo mañana'.",
    options: ["Ich anrufe dich morgen.", "Ich rufe an dich morgen.", "Ich rufe dich morgen an.", "Ich anrufe morgen dich."],
    correct: 2, explanation: "El prefijo 'an-' se separa y va al final de la oración principal."
  },
  {
    id: 8, question: "Oraciones Subordinadas (Nebensätze): 'Ich bleibe zu Hause, weil ich müde ______.'",
    options: ["bin", "ist", "sein", "werde"],
    correct: 0, explanation: "La conjunción 'weil' (porque) envía el verbo conjugado (bin) exactamente al final de la cláusula."
  },
  {
    id: 9, question: "Wechselpräpositionen: 'Ich stelle das Buch auf ______ Tisch.' (Pongo el libro sobre la mesa).",
    options: ["der", "den", "dem", "das"],
    correct: 1, explanation: "'Stellen' implica movimiento (dirección), por lo que la preposición 'auf' rige Acusativo (den Tisch)."
  },
  {
    id: 10, question: "Declinación de Adjetivos: 'Ich habe ein ______ Auto gekauft.' (Auto es neutro).",
    options: ["neues", "neue", "neuen", "neuem"],
    correct: 0, explanation: "Con artículo indefinido 'ein' (neutro, acusativo), el adjetivo toma la terminación '-es' (neues)."
  },
  {
    id: 11, question: "Voz Pasiva: 'Das Haus ______ im Jahr 1990 ______.' (La casa fue construida en 1990).",
    options: ["wird / gebaut", "wurde / gebaut", "war / gebaut", "ist / bauen"],
    correct: 1, explanation: "Pasado pasivo en Präteritum: 'wurde' (auxiliar werden en pasado) + Participio II (gebaut)."
  },
  {
    id: 12, question: "N-Deklination: 'Ich spreche mit dem ______.' (Hablo con el estudiante).",
    options: ["Student", "Studenten", "Studentes", "Studentem"],
    correct: 1, explanation: "'Student' es un sustantivo masculino débil. En dativo, recibe una '-en' extra."
  },
  {
    id: 13, question: "Konjunktiv II (Deseos/Hipótesis): 'Wenn ich reich ______, ______ ich ein Haus kaufen.'",
    options: ["war / würde", "wäre / werde", "wäre / würde", "bin / will"],
    correct: 2, explanation: "'wäre' (fuera) es la forma del verbo sein en KII, y 'würde' (compraría) es el auxiliar condicional."
  },
  {
    id: 14, question: "Preposiciones Fijas: 'Ich interessiere mich ______ deutsche Literatur.'",
    options: ["für", "an", "über", "auf"],
    correct: 0, explanation: "El verbo 'sich interessieren' rige siempre la preposición 'für' (+ Acusativo)."
  },
  {
    id: 15, question: "Cláusulas Relativas: 'Der Mann, ______ dort steht, ist mein Vater.'",
    options: ["der", "den", "dem", "das"],
    correct: 0, explanation: "El pronombre relativo se refiere a 'Der Mann' (masculino) y es el sujeto (Nominativo) de la cláusula subordinada."
  },
  {
    id: 16, question: "Business German: ¿Cuál es la despedida formal estándar en un correo electrónico (Email)?",
    options: ["Viele Grüße", "Tschüss", "Mit freundlichen Grüßen", "Liebe Grüße"],
    correct: 2, explanation: "'Mit freundlichen Grüßen' (Con saludos amistosos/cordiales) es el estándar formal B2/C1 en negocios."
  },
  {
    id: 17, question: "Inglés/Alemán Médico: El médico te dice 'Sie müssen dieses Medikament verschreiben lassen'. ¿Qué significa?",
    options: ["Debes tomarte la medicina.", "Debes dejar que te prescriban este medicamento.", "Debes comprar la medicina en la farmacia.", "Debes tirar el medicamento."],
    correct: 1, explanation: "'verschreiben' significa prescribir/recetar. 'Lassen' actúa como verbo causativo."
  },
  {
    id: 18, question: "Small Talk: Si alguien te dice 'Schönes Wochenende!', la mejor respuesta es:",
    options: ["Ebenso! / Gleichfalls!", "Bitte sehr!", "Gern geschehen!", "Tut mir leid."],
    correct: 0, explanation: "'Ebenso' o 'Gleichfalls' significa 'Igualmente'."
  },
  {
    id: 19, question: "Debate B2/C1: Para expresar una opinión formal, en lugar de decir 'Ich denke...', es mejor decir:",
    options: ["Ich weiß, dass...", "Ich bin der Auffassung, dass...", "Vielleicht...", "Es ist so, dass..."],
    correct: 1, explanation: "'Ich bin der Auffassung/Ansicht, dass...' denota un nivel académico/profesional avanzado."
  },
  {
    id: 20, question: "Restaurant: Para pedir cortésmente la cuenta, debes decir:",
    options: ["Ich will zahlen!", "Die Rechnung, bitte.", "Ich hätte gern die Rechnung, bitte.", "Bringen Sie mir Geld."],
    correct: 2, explanation: "'Ich hätte gern' (Konjunktiv II) es la forma más cortés e idiomática de pedir algo en un restaurante."
  },
  {
    id: 21, question: "Futuro II (Zukunft II): 'Bis morgen ______ ich die Arbeit ______ ______.'",
    options: ["werde / gemacht / haben", "wird / haben / gemacht", "werde / machen / sein", "habe / gemacht / werden"],
    correct: 0, explanation: "Futur II expresa que algo se habrá completado: werden + participio II + haben/sein."
  },
  {
    id: 22, question: "Customer Service: Si un cliente se queja, la respuesta más profesional es:",
    options: ["Das ist nicht mein Problem.", "Es tut mir leid für die Unannehmlichkeiten.", "Sie sind falsch.", "Was möchten Sie von mir?"],
    correct: 1, explanation: "'Es tut mir leid für die Unannehmlichkeiten' (Lamento los inconvenientes) es vocabulario estándar de servicio al cliente C1."
  }
];

// --- PLAN DE ESTUDIO (22 MÓDULOS - PROGRESIÓN DE A1 A C2) ---
const syllabus = [
  { week: 1, title: "Módulo I: Alemán Básico 1", focus: "A1 Básico", desc: "Saludos, Fonética y Presentaciones.", time: "4h" },
  { week: 2, title: "Módulo II: El Género y Casos Base", focus: "A1 Básico", desc: "Artículos y Nominativo vs Acusativo.", time: "5h" },
  { week: 3, title: "Módulo III: El Temido Dativo", focus: "A2 Intermedio", desc: "Objetos indirectos y preposiciones iniciales.", time: "6h" },
  { week: 4, title: "Módulo IV: Verbos Separables", focus: "A2 Intermedio", desc: "Trennbare Verben y estructura de oración.", time: "5.5h" },
  { week: 5, title: "Módulo V: Tiempos del Pasado", focus: "A2 Intermedio", desc: "Perfekt (hablado) y Präteritum (escrito).", time: "7h" },
  { week: 6, title: "Módulo VI: Nebensätze", focus: "B1 Intermedio", desc: "Oraciones subordinadas (weil, dass, wenn).", time: "6.5h" },
  { week: 7, title: "Módulo VII: Wechselpräpositionen", focus: "B1 Intermedio", desc: "Acusativo (dirección) vs Dativo (posición).", time: "7h" },
  { week: 8, title: "Módulo VIII: Adjektivdeklination", focus: "B1 Intermedio", desc: "Las terminaciones de los adjetivos alemanes.", time: "8h" },
  { week: 9, title: "Módulo IX: Voz Pasiva", focus: "B1/B2 Avanzado", desc: "Werden + Partizip II y sus tiempos.", time: "7.5h" },
  { week: 10, title: "Módulo X: Konjunktiv II", focus: "B2 Avanzado", desc: "Hipotéticos, deseos y máxima cortesía.", time: "8h" },
  { week: 11, title: "Módulo XI: N-Deklination y Genitivo", focus: "B2 Avanzado", desc: "Sustantivos débiles y caso posesivo.", time: "6h" },
  { week: 12, title: "Módulo XII: Relativsätze", focus: "B2 Avanzado", desc: "Cláusulas relativas complejas.", time: "7h" },
  { week: 13, title: "Módulo XIII: Social Dynamics", focus: "Roleplay B2", desc: "Small Talk y pragmática social alemana.", time: "5h" },
  { week: 14, title: "Módulo XIV: Travel & Airport", focus: "Roleplay B2", desc: "Fluidez en aeropuertos (Flughafen) y trenes.", time: "6h" },
  { week: 15, title: "Módulo XV: Retail & Supermarkt", focus: "Roleplay B2", desc: "Vocabulario de compras cotidianas.", time: "5.5h" },
  { week: 16, title: "Módulo XVI: Business German I", focus: "Negocios C1", desc: "Formalidades, correos y 'Sehr geehrte...'", time: "8h" },
  { week: 17, title: "Módulo XVII: Business German II", focus: "Negocios C1", desc: "Reuniones, agendas y negociación.", time: "7.5h" },
  { week: 18, title: "Módulo XVIII: Medical German", focus: "ESP C1", desc: "Visita al médico, síntomas y anatomía.", time: "6h" },
  { week: 19, title: "Módulo XIX: Expresión de Opiniones", focus: "Debate C1", desc: "Argumentación formal: 'Ich bin der Auffassung'.", time: "7h" },
  { week: 20, title: "Módulo XX: Storytelling Narrativo", focus: "Fluidez C1", desc: "Dominio de Präteritum vs Plusquamperfekt.", time: "6.5h" },
  { week: 21, title: "Módulo XXI: Restaurant Experience", focus: "Pragmática C1", desc: "Konjunktiv II aplicado: Quejas y Elogios.", time: "5.5h" },
  { week: 22, title: "Módulo XXII: Customer Escalation", focus: "Roleplay C2", desc: "Resolución de conflictos y disculpas formales.", time: "8h" }
];

// --- EL ARSENAL: CONTENIDO PROFUNDO DE LOS MÓDULOS ---
const lessonModules = {
  1: {
    title: "Alemán Básico 1: Saludos y Presentaciones",
    theory: { title: "Fonética y Primeras Palabras", content: "BIENVENIDO AL ALEMÁN (A1)\nEl alemán es muy fonético. Las letras con puntitos se llaman Umlauts: \n- 'ä' suena como una 'e' abierta.\n- 'ö' pon boca de 'o' y di 'e'.\n- 'ü' pon boca de 'u' y di 'i'.\n- 'ß' (Eszett) suena como una doble 's' fuerte.\n\nSALUDOS (Begrüßungen)\n- Informal (Du-Form): 'Hallo!', 'Hi', 'Tschüss' (Adiós).\n- Formal (Sie-Form): 'Guten Morgen' (hasta 10am), 'Guten Tag' (hasta 6pm), 'Auf Wiedersehen' (Adiós).\n\nPRESENTARSE\n- Ich heiße [Nombre] (Yo me llamo...)\n- Ich komme aus [País] (Yo vengo de...)" },
    reading: { title: "Diálogo de Presentación", text: "Herr Schmidt: Guten Morgen! Mein Name ist Thomas Schmidt. Wie heißen Sie?\nAnna: Guten Morgen, Herr Schmidt. Ich heiße Anna Müller. Ich komme aus Spanien.\nHerr Schmidt: Freut mich, Frau Müller. Herzlich willkommen in Deutschland!", question: "¿Qué registro de formalidad están usando?", options: ["Informal (Du)", "Formal (Sie)", "Están peleando", "Familiar"], correct: 1 },
    speaking: { title: "Primera Presentación", phrase: "Guten Tag, mein Name ist [Tu Nombre]. Ich komme aus Spanien und ich lerne Deutsch. Freut mich, Sie kennenzulernen.", tip: "Presta atención a la 'ch' en 'Ich'. Suena como un ligero siseo de gato, no como la 'ch' española." },
    writing: { title: "Tu Perfil", prompt: "Redacta un breve saludo formal. Di buenos días, preséntate, di de dónde vienes y despídete.", mockFeedback: "Excelente. Usaste correctamente 'Guten Tag, ich heiße...'. Recuerda que todos los sustantivos en alemán empiezan con Mayúscula." }
  },
  2: {
    title: "El Género y Casos Base: Nom vs Akkusativ",
    theory: { title: "Der, Die, Das y el Objeto Directo", content: "LOS 3 GÉNEROS (Nominativo - Sujetos)\n- Masculino: der Mann (el hombre)\n- Femenino: die Frau (la mujer)\n- Neutro: das Kind (el niño)\n\nEL ACUSATIVO (Objeto Directo)\nCuando la acción recae sobre algo (ver, comprar, tener), usamos el Acusativo. La buena noticia: ¡Solo cambia el Masculino!\n- Nominativo: DER Mann (El hombre es alto).\n- Acusativo: Ich sehe DEN Mann (Yo veo al hombre).\nFemenino y Neutro se quedan igual (die -> die, das -> das).\n\nVERBOS QUE PIDEN ACUSATIVO\nhaben (tener), brauchen (necesitar), suchen (buscar), sehen (ver)." },
    reading: { title: "De Compras", text: "Ich bin im Supermarkt. Ich suche den Apfel (masculino), die Banane (femenino) und das Brot (neutro). Ich habe den Apfel gefunden, aber ich brauche auch den Saft (masculino).", question: "¿Por qué 'Apfel' y 'Saft' usan 'den' en el texto?", options: ["Porque son plurales.", "Porque son el objeto directo (Acusativo) de verbos como buscar y necesitar.", "Porque son femeninos.", "Es un error tipográfico."], correct: 1 },
    speaking: { title: "Fluidez Acusativa", phrase: "Entschuldigung, ich suche den Bahnhof. Sehen Sie den Zug dort drüben? Ich brauche unbedingt den Fahrplan.", tip: "Une la pronunciación: 'suche-den', 'brauche-den'. El alemán fluye conectando consonantes y vocales." },
    writing: { title: "Completar Oraciones", prompt: "Escribe 3 oraciones usando 'Ich brauche...' (Yo necesito). Usa 1 sustantivo masculino (Computer), 1 femenino (Lampe) y 1 neutro (Buch).", mockFeedback: "Bien hecho: 'Ich brauche den Computer. Ich brauche die Lampe. Ich brauche das Buch.' ¡Solo el masculino cambia a DEN!" }
  },
  3: {
    title: "El Temido Dativo: Objeto Indirecto",
    theory: { title: "Receptor de la Acción", content: "EL DATIVO (Objeto Indirecto)\nResponde a la pregunta '¿A quién?'. En el Dativo, TODOS los artículos cambian:\n- Masculino: der -> DEM\n- Neutro: das -> DEM\n- Femenino: die -> DER\n- Plural: die -> DEN (+ n al final del sustantivo)\n\nEJEMPLOS\n- Ich gebe DEM Mann das Buch. (Le doy el libro al hombre).\n- Ich helfe DER Frau. (Ayudo a la mujer).\n\nPREPOSICIONES QUE SIEMPRE PIDEN DATIVO\naus (de/origen), bei (junto a/en casa de), mit (con), nach (hacia/después de), seit (desde), von (de), zu (hacia)." },
    reading: { title: "Una Carta a un Amigo", text: "Hallo Markus! Ich komme gerade von dem Arzt. Ich helfe meiner Mutter mit dem Garten. Später fahre ich mit dem Auto zu der Arbeit. Bis bald!", question: "En la frase 'mit dem Auto', ¿por qué se usa 'dem'?", options: ["Porque Auto es masculino.", "Porque 'mit' siempre exige caso Dativo, y Auto es neutro (das -> dem).", "Porque está al final de la oración.", "Porque rige Acusativo."], correct: 1 },
    speaking: { title: "Preposiciones Activas", phrase: "Ich fahre jeden Tag mit dem Bus zur Arbeit. Nach der Arbeit treffe ich mich mit meinen Freunden bei dem neuen Restaurant.", tip: "Nota cómo 'zu der' se contrae a 'zur', y 'bei dem' a 'beim'. Suena mucho más natural al hablar." },
    writing: { title: "El Dador y el Receptor", prompt: "Traduce al alemán: 'El hombre (Der Mann) le da (gibt) el libro (das Buch) a la mujer (die Frau)'.", mockFeedback: "'Der Mann gibt DER Frau das Buch'. Perfecto. 'Die Frau' cambia a 'der Frau' porque es la receptora (Dativo)." }
  },
  4: {
    title: "Verbos Separables: Trennbare Verben",
    theory: { title: "Prefijos que vuelan", content: "VERBOS SEPARABLES (Trennbare Verben)\nEn alemán, muchos verbos tienen un prefijo que cambia su significado (ej. auf|stehen = levantarse, an|rufen = llamar).\n\nLA REGLA DE ORO\nCuando conjugas un verbo separable en Presente, el prefijo se separa y VUELA al final de la oración.\n- Verbo: einkaufen (comprar).\n- Oración: Ich kaufe heute im Supermarkt EIN. (Yo compro hoy en el supermercado).\n- Verbo: fernsehen (ver televisión).\n- Oración: Wir sehen jeden Abend im Wohnzimmer FERN.\n\nCON VERBOS MODALES\nSi usas un verbo modal (können, müssen, wollen), el verbo separable NO se separa y va al final en infinitivo.\n- Ich muss heute einkaufen." },
    reading: { title: "La Rutina Diaria", text: "Mein Tag beginnt früh. Ich stehe um 7 Uhr auf. Dann ziehe ich mich an und frühstücke. Um 8 Uhr fahre ich ab. Abends komme ich nach Hause zurück und sehe ein bisschen fern.", question: "¿Qué verbo base pertenece al prefijo separable 'auf' en 'Ich stehe um 7 Uhr auf'?", options: ["aufziehen", "stehen (aufstehen)", "aufwachen", "aufkommen"], correct: 1 },
    speaking: { title: "Relato de Rutina", phrase: "Normalerweise wache ich sehr früh auf. Ich bereite mein Frühstück vor, rufe meine Mutter an, und dann fängt meine Arbeit an.", tip: "Haz una ligera pausa antes de soltar el prefijo al final. 'Ich rufe meine Mutter... an'." },
    writing: { title: "Construyendo la Separación", prompt: "Usa el verbo 'einladen' (invitar) para decir: 'Yo invito a mis amigos hoy'. (amigos = meine Freunde, hoy = heute).", mockFeedback: "'Ich lade heute meine Freunde ein.' Excelente uso de la separación del prefijo 'ein-' al final de la oración." }
  },
  5: {
    title: "Tiempos del Pasado: Perfekt vs Präteritum",
    theory: { title: "Hablado vs Escrito", content: "DAS PERFEKT (Pasado Conversacional)\nEs el rey del lenguaje hablado. Se forma con el auxiliar (Haben o Sein) + Participio II al final.\n- Haben (90%): Ich HABE Pizza GEGESSEN.\n- Sein (Movimiento o cambio de estado): Ich BIN nach Berlin GEFAHREN.\n\nDAS PRÄTERITUM (Pasado Narrativo/Escrito)\nSe usa en libros, noticias y cuentos. Sin embargo, en el lenguaje hablado sí usamos Präteritum para 'sein' (war) y 'haben' (hatte).\n- Perfekt: Ich bin in Berlin gewesen (Suena raro, muy largo).\n- Präteritum: Ich WAR in Berlin (Mucho más natural).\n- Perfekt: Ich habe ein Auto gehabt.\n- Präteritum: Ich HATTE ein Auto." },
    reading: { title: "Un Fin de Semana de Locos", text: "Letztes Wochenende war super. Am Freitag bin ich ins Kino gegangen. Danach habe ich eine Pizza gegessen. Am Samstag hatte ich viel Zeit, also habe ich mein Zimmer aufgeräumt.", question: "¿Por qué se usa 'bin ... gegangen' en lugar de 'habe ... gegangen'?", options: ["Porque 'gehen' es irregular.", "Porque implica movimiento de A hacia B, lo cual exige el auxiliar 'sein'.", "Porque es plural.", "Es intercambiable."], correct: 1 },
    speaking: { title: "Relato del Pasado", phrase: "Gestern war ich ziemlich müde. Ich bin sehr spät aufgewacht, habe schnell einen Kaffee getrunken und bin sofort zur Arbeit gefahren.", tip: "La entonación debe bajar en el participio al final de cada cláusula ('aufgewacht', 'getrunken', 'gefahren')." },
    writing: { title: "Transformación Temporal", prompt: "Cambia estas dos frases al pasado (Perfekt o Präteritum según aplique): 1) Ich spiele Fußball. 2) Ich bin krank.", mockFeedback: "1) 'Ich habe Fußball gespielt' (Perfekt). 2) 'Ich war krank' (Präteritum de sein). ¡Muy bien!" }
  },
  6: {
    title: "Nebensätze: Oraciones Subordinadas",
    theory: { title: "El Verbo al Final", content: "LA SINTAXIS DE LAS SUBORDINADAS\nEn las oraciones principales (Hauptsatz), el verbo conjugado va en la Posición 2. PERO, en las oraciones subordinadas (Nebensatz), la conjunción empuja el verbo conjugado ¡hasta el final absoluto!\n\nCONJUNCIONES SUBORDINANTES CLAVE\n- weil (porque - razón): Ich lerne Deutsch, WEIL ich in Berlin LEBE.\n- dass (que - conexión): Ich glaube, DASS das Wetter heute gut IST.\n- wenn (si/cuando - condición temporal): WENN ich Zeit HABE, gehe ich ins Kino.\n\n¿Y los verbos separables en una Nebensatz?\n¡Se vuelven a juntar! -> '...weil ich früh AUFSTEHE'." },
    reading: { title: "Excusas en la Oficina", text: "Chef, ich kann heute leider nicht zur Arbeit kommen, weil ich sehr krank bin. Ich hoffe, dass mein Kollege meine Schicht übernehmen kann. Wenn ich mich morgen besser fühle, bin ich wieder da.", question: "¿Qué posición ocupan los verbos conjugados 'bin', 'kann' y 'fühle' en sus respectivas oraciones?", options: ["Posición 2.", "La primera posición.", "Al final absoluto de la cláusula subordinada.", "Antes del sujeto."], correct: 2 },
    speaking: { title: "Argumentación Básica", phrase: "Ich denke, dass Deutsch eine sehr logische Sprache ist. Ich lerne jeden Tag, weil ich nächstes Jahr nach Deutschland reisen möchte. Wenn ich fleißig bin, werde ich es schaffen.", tip: "Haz una pausa después de la coma antes de 'dass', 'weil' o 'wenn'. El énfasis va en el verbo final." },
    writing: { title: "Uniendo Ideas", prompt: "Une estas oraciones usando 'weil' (porque): 'Ich bleibe heute zu Hause.' + 'Ich habe keine Zeit.'", mockFeedback: "Correcto: 'Ich bleibe heute zu Hause, WEIL ich keine Zeit HABE.' El verbo 'habe' viaja al final." }
  },
  7: {
    title: "Wechselpräpositionen: Movimiento vs Estática",
    theory: { title: "Acusativo o Dativo, tú decides", content: "WECHSELPRÄPOSITIONEN (Preposiciones Cambiantes)\nSon 9 preposiciones: in, an, auf, neben, hinter, über, unter, vor, zwischen. Ellas rigen ACUSATIVO si hay un cambio de lugar o dirección, y DATIVO si no hay movimiento (ubicación estática).\n\nLA REGLA: WOHIN? vs WO?\n- Wohin? (¿Hacia dónde? - Acción/Dirección) -> ACUSATIVO.\n  Ej: Ich lege das Buch AUF DEN Tisch. (Pongo el libro sobre la mesa).\n- Wo? (¿Dónde? - Estado/Ubicación) -> DATIVO.\n  Ej: Das Buch liegt AUF DEM Tisch. (El libro está sobre la mesa).\n\nVERBOS PAREADOS\n- legen (poner, Acus.) vs liegen (estar acostado/situado, Dat.)\n- stellen (colocar de pie, Acus.) vs stehen (estar de pie, Dat.)" },
    reading: { title: "Organizando el Salón", text: "Ich stelle die neue Lampe neben das Sofa (Akk). Jetzt steht die Lampe neben dem Sofa (Dat). Danach hänge ich das Bild an die Wand (Akk). Das Bild hängt nun an der Wand (Dat).", question: "¿Por qué la misma preposición 'neben' cambia el artículo de 'das' a 'dem'?", options: ["Por el género.", "Por la regla Wohin (Acusativo de movimiento) vs Wo (Dativo de estado).", "Es un plural.", "Para sonar más formal."], correct: 1 },
    speaking: { title: "Descripción Espacial", phrase: "Stell das Glas bitte auf den Tisch. Danke! Jetzt steht das Glas auf dem Tisch, genau zwischen dem Teller und der Flasche.", tip: "Pronuncia con claridad la diferencia entre 'auf DEN' (movimiento) y 'auf DEM' (estático)." },
    writing: { title: "Wo oder Wohin?", prompt: "Traduce estas dos acciones: 1) Yo voy al cine (ins = in das Kino). 2) Yo estoy en el cine (im = in dem Kino).", mockFeedback: "1) Ich gehe ins (in das) Kino (Akkusativ - Movimiento). 2) Ich bin im (in dem) Kino (Dativ - Estático)." }
  },
  8: {
    title: "Adjektivdeklination: Las Terminaciones",
    theory: { title: "El Arte de Combinar Adjetivos", content: "LA DECLINACIÓN DE ADJETIVOS (B1)\nEn alemán, los adjetivos que van ANTES del sustantivo reciben una terminación. Depende de 3 factores: Género, Caso y Artículo.\n\nTRES REGLAS DE ORO (Aproximación fácil)\n1. CON artículo definido (der, die, das): El artículo ya hizo el trabajo sucio. El adjetivo solo toma '-e' o '-en' (En Dativo/Genitivo siempre es '-en').\n  Ej: Der schönE Mann. / Mit dem schönEN Mann.\n2. CON artículo indefinido (ein, eine): El adjetivo debe mostrar el género en nominativo.\n  Ej: Ein schönER Mann (Masculino). Ein schönES Haus (Neutro).\n3. SIN artículo: El adjetivo asume las terminaciones de 'der, die, das'.\n  Ej: KaltES Wasser (das Wasser)." },
    reading: { title: "El Catálogo de Moda", text: "Wir bieten eine große Auswahl an. Suchen Sie einen eleganten Anzug für das wichtige Meeting? Oder vielleicht ein bequemes Kleid für einen heißen Sommertag? Bei uns finden Sie tolle Angebote.", question: "¿Por qué dice 'einen elegantEN Anzug'?", options: ["Plural.", "Es acusativo masculino con artículo indefinido (einen), el adjetivo toma la terminación '-en'.", "Es nominativo neutro.", "Es genitivo."], correct: 1 },
    speaking: { title: "Descripciones Precisas", phrase: "Ich hätte gern ein großes Bier, einen starken Kaffee und ein kleines Stück von diesem leckeren Schokoladenkuchen, bitte.", tip: "Articula exageradamente las terminaciones '-es', '-en' para fijarlas en tu memoria muscular." },
    writing: { title: "Ropa y Colores", prompt: "Aplica las terminaciones. 1) Un perro negro (ein schwarz__ Hund - Nominativo). 2) Compro un coche rápido (ein schnell__ Auto - Acusativo neutro).", mockFeedback: "1) Ein schwarzER Hund (masculino nom). 2) Ein schnellES Auto (neutro acusativo)." }
  },
  9: {
    title: "Voz Pasiva: Werden + Partizip II",
    theory: { title: "El Foco en la Acción", content: "DAS PASSIV (Voz Pasiva B1/B2)\nSe utiliza cuando NO importa QUIÉN hace la acción, sino la acción misma. \nSe forma con el verbo auxiliar 'werden' (ser/convertirse) conjugado + Participio II al final.\n\nEJEMPLOS POR TIEMPO\n- Präsens (Presente): Das Auto WIRD in Deutschland GEBAUT. (El auto es construido...)\n- Präteritum (Pasado): Das Auto WURDE 1990 GEBAUT. (El auto fue construido...)\n- Perfekt (Pasado Hablado): Das Auto IST gebaut WORDEN. (El auto ha sido construido...)\n\nAGENTE (Von o Durch)\nSi quieres mencionar quién lo hizo, usa 'von' (+ Dativo) para personas, o 'durch' (+ Acusativo) para medios/causas.\n- Das Buch wird VON DEM Autor geschrieben." },
    reading: { title: "Noticias de la Ciudad", text: "Gestern Nacht wurde die Hauptbank der Stadt ausgeraubt. Die Polizei wurde sofort alarmiert. Der Täter ist noch nicht gefasst worden, aber das Gebäude wird derzeit gründlich untersucht.", question: "¿Qué tiempo pasivo es 'ist ... gefasst worden'?", options: ["Presente Pasivo", "Präteritum Pasivo", "Perfekt Pasivo", "Plusquamperfekt Pasivo"], correct: 2 },
    speaking: { title: "Reporte Formal", phrase: "Die neuen Regelungen werden ab sofort streng kontrolliert. Das Formular muss bis morgen ausgefüllt werden, andernfalls wird eine Strafe verhängt.", tip: "Mantén un tono periodístico y desapasionado. Enfatiza los auxiliares 'werden/wird' y los participios." },
    writing: { title: "Transformación a Pasiva", prompt: "Convierte a voz pasiva: 'Der Mechaniker repariert das Auto' (El mecánico repara el coche).", mockFeedback: "'Das Auto WIRD (von dem Mechaniker) REPARIERT.' Excelente. 'Das Auto' pasa a ser el sujeto." }
  },
  10: {
    title: "Konjunktiv II: Deseos y Máxima Cortesía",
    theory: { title: "El Modo de la Irrealidad", content: "KONJUNKTIV II (B2)\nEquivale al Condicional y Subjuntivo español. Se usa para deseos (Ich hätte gern...), hipótesis irreales (Wenn ich Millionär wäre...) y cortesía extrema (Könnten Sie...?).\n\n¿CÓMO SE FORMA?\nLa mayoría de los verbos usan la fórmula: WÜRDE + Infinitivo al final.\n- Ich WÜRDE gern nach Japan REISEN. (Me gustaría viajar a Japón).\n\nVERBOS FUERTES CON PROPIA FORMA\nHaben, Sein y Modales tienen su propia forma con Umlaut (diéresis):\n- haben -> ich hätte (yo tendría / yo quisiera)\n- sein -> ich wäre (yo sería / estaría)\n- können -> ich könnte (yo podría)\n- müssen -> ich müsste (yo debería)" },
    reading: { title: "La Carta de Reclamo Ideal", text: "Sehr geehrte Damen und Herren, ich würde mich sehr freuen, wenn Sie mir mein Geld zurückerstatten könnten. Ansonsten müsste ich leider meinen Anwalt einschalten. Ich wäre Ihnen für eine schnelle Antwort dankbar.", question: "¿Por qué el remitente usa el Konjunktiv II en esta queja?", options: ["Porque no sabe alemán.", "Para ser extremadamente cortés y mantener un tono diplomático profesional.", "Porque es una acción del pasado.", "Para insultar sutilmente."], correct: 1 },
    speaking: { title: "El Cliente Exigente pero Educado", phrase: "Entschuldigen Sie die Störung. Ich hätte eine kurze Frage. Könnten Sie mir vielleicht sagen, wo ich das Büro des Direktors finden würde? Das wäre wirklich sehr freundlich von Ihnen.", tip: "La entonación debe ser suave y ascendente. El Konjunktiv II es el arma secreta de la educación europea." },
    writing: { title: "Sueños Hipotéticos", prompt: "Completa la hipótesis: Si yo tuviera tiempo (Wenn ich Zeit hätte), yo viajaría a Alemania (...würde ich...).", mockFeedback: "'Wenn ich Zeit hätte, WÜRDE ich nach Deutschland REISEN.' ¡Perfecto! Recuerda la inversión verbo-verbo alrededor de la coma: '...hätte, würde...'." }
  },
  11: {
    title: "N-Deklination y Casos Avanzados",
    theory: { title: "El Genitivo y los Sustantivos Débiles", content: "N-DEKLINATION (Sustantivos Débiles)\nCiertos sustantivos masculinos (normalmente los que terminan en -e, o profesiones latinas/griegas en -ist, -ent, -ant) reciben una '-n' o '-en' extra en todos los casos EXCEPTO en el Nominativo.\n- Nom: Der Student lernt. / Der Junge spielt.\n- Akkusativ: Ich sehe den StudentEN. / Ich rufe den JungeN.\n- Dativ: Ich spreche mit dem StudentEN. / Ich helfe dem JungeN.\n\nDAS GENITIV (El Caso de Posesión)\nResponde a '¿De quién?'.\n- Masculino/Neutro (der/das -> DES + -s): Das Auto DES VaterS.\n- Femenino/Plural (die -> DER): Das Haus DER Frau." },
    reading: { title: "El Informe Policial", text: "Laut Aussage des Zeugen (Genitivo N-Dek), stand das Auto des Präsidenten in der Nähe des Parks. Die Polizei vernahm den Polizisten, der den Vorfall beobachtet hatte.", question: "Identifica por qué 'des Zeugen' tiene terminaciones tan extrañas.", options: ["Es plural.", "Es Genitivo (des) de un sustantivo débil 'Zeuge' que exige N-Deklination (-n).", "Es acusativo.", "Es un error tipográfico."], correct: 1 },
    speaking: { title: "Discurso Académico", phrase: "Die Meinung des Experten ist von großer Bedeutung. Wir müssen den Praktikanten und den Präsidenten in die Diskussion einbeziehen.", tip: "Pronuncia claramente la '-en' final en 'Experten', 'Praktikanten' y 'Präsidenten'. Son marcas de alta competencia B2." },
    writing: { title: "Posesión y Debilidad", prompt: "Traduce: 'La bolsa (Die Tasche) del cliente (Kunde)'. Pista: Kunde pertenece a la N-Deklination.", mockFeedback: "'Die Tasche des Kunden.' Excelente. Usa el artículo Genitivo 'des' y añade la '-n' a 'Kunde'." }
  },
  12: {
    title: "Relativsätze: Cláusulas Relativas",
    theory: { title: "Conectando Ideas", content: "RELATIVSÄTZE (B2)\nSon oraciones subordinadas (verbo al final!) que dan más información sobre un sustantivo mencionado.\nEl pronombre relativo toma su GÉNERO del sustantivo que reemplaza, pero su CASO depende de su función en la nueva oración.\n\nEJEMPLOS\n- Nominativo: Der Mann, DER dort steht, ist mein Bruder.\n  (El hombre [que está ahí] es mi hermano. 'Que' es el sujeto).\n- Acusativo: Das Buch, DAS ich lese, ist interessant.\n  (El libro [que yo leo] es interesante. 'Que' es el objeto que yo leo).\n- Dativo: Die Frau, DER ich helfe, ist nett.\n  (La mujer [a la que yo ayudo] es amable. 'Helfen' rige Dativo).\n- Genitivo: Der Mann, DESSEN Auto kaputt ist... (El hombre cuyo auto...)" },
    reading: { title: "Recomendaciones de Cine", text: "Gestern habe ich einen Film gesehen, der unglaublich spannend war. Der Schauspieler, den ich schon immer bewundert habe, spielte die Hauptrolle. Die Frau, der er im Film das Leben rettete, gewann später einen Oscar.", question: "¿Por qué usa 'der' para la mujer en 'Die Frau, der er... rettete'?", options: ["Porque 'Frau' es masculino.", "Porque el pronombre relativo asume el caso Dativo exigido por el verbo 'retten/helfen' en la cláusula.", "Porque es plural.", "Es un pronombre demostrativo."], correct: 1 },
    speaking: { title: "Precisión Relativa", phrase: "Das ist das Projekt, an dem wir seit Monaten arbeiten. Die Kollegen, mit denen ich gestern gesprochen habe, sind sehr optimistisch.", tip: "Presta atención a las preposiciones antes del relativo: 'an dem', 'mit denen'. Esta estructura suena extremadamente nativa." },
    writing: { title: "El Pronombre Correcto", prompt: "Completa la frase: 'El ordenador (Der Computer), que (____) compré ayer, es rápido (ist schnell).'", mockFeedback: "'Der Computer, DEN ich gestern gekauft habe, ist schnell.' ¡Muy bien! Usaste 'den' porque el ordenador es el objeto directo (Acusativo) de tu acción de comprar." }
  },
  13: {
    title: "Social Dynamics: Small Talk en Alemán",
    theory: { title: "Reglas de Interacción", content: "SMALL TALK EN ALEMANIA\nA diferencia de la cultura latina, el 'Small Talk' en DACH (Alemania, Austria, Suiza) es más directo, breve y estructurado. No se hacen preguntas hiper-personales al inicio.\n\nTEMAS SEGUROS (Sichere Themen)\n- El clima: 'Schönes Wetter heute, oder?'\n- El fin de semana: 'Haben Sie Pläne für das Wochenende?'\n- El trayecto: 'Haben Sie gut hierher gefunden?'\n\nLA REGLA DEL PING-PONG\nNunca respondas con un simple 'Ja' o 'Gut'.\n- ¿Wie geht es Ihnen?\n- Danke, gut. Und Ihnen? (Bien, gracias. ¿Y a usted?)" },
    reading: { title: "Análisis de Caso: En la Máquina de Café", text: "Herr Meier: Hallo Frau Schmidt, na, schon Feierabend?\nFrau Schmidt: Hallo Herr Meier. Leider noch nicht, ich habe noch ein Meeting. Und bei Ihnen? Sind Sie schon fertig?\nHerr Meier: Fast. Ich muss nur noch eine E-Mail schreiben. Dann gehe ich ins Wochenende.\nFrau Schmidt: Das klingt gut. Schönes Wochenende schon mal!", question: "¿Qué hace Frau Schmidt para mantener viva la conversación?", options: ["Habla de su vida personal profunda.", "Usa la regla del Ping-Pong devolviendo la pregunta ('Und bei Ihnen? Sind Sie schon fertig?').", "Ignora a Herr Meier.", "Se despide inmediatamente."], correct: 1 },
    speaking: { title: "Shadowing (Fluidez)", phrase: "Hallo! Schönes Wetter heute, nicht wahr? Haben Sie gut hierher gefunden? Die Verkehrslage in der Innenstadt war ja heute Morgen wieder eine Katastrophe.", tip: "La frase 'nicht wahr?' (¿verdad?) o 'oder?' al final de la frase es típica para invitar al otro a hablar." },
    writing: { title: "Simulador IA: Casual Encounter", prompt: "INSTRUCCIÓN PARA IA: Eres un colega en la oficina en Múnich. Preséntate e inicia un Small Talk sobre el clima frío. Yo responderé aplicando la regla del Ping-Pong.", mockFeedback: "Feedback del Simulador: Sehr gut! \n***Mejora***: En lugar de decir 'Ja, es ist kalt', suena más idiomático decir 'Da haben Sie recht, es ist wirklich eiskalt heute. Hoffentlich wird es am Wochenende besser. Was haben Sie am Wochenende vor?'" }
  },
  14: {
    title: "Airport & Travel: Roleplay Aeropuerto",
    theory: { title: "Reglas de Interacción", content: "VOCABULARIO DEL AEROPUERTO (Flughafen)\n- Der Flug / Die Flüge: El vuelo.\n- Das Gepäck / Handgepäck: Equipaje / Equipaje de mano.\n- Die Bordkarte: Tarjeta de embarque.\n- Der Flugsteig (Gate): Puerta de embarque.\n- Verspätung haben: Tener retraso.\n\nINTERACCIONES EN EL CHECK-IN\n- 'Haben Sie Gepäck zum Aufgeben?' (¿Tiene equipaje para facturar?)\n- 'Haben Sie das Gepäck selbst gepackt?' (¿Empacó el equipaje usted mismo?)\n\nRESOLUCIÓN DE PROBLEMAS\n- 'Mein Flug wurde storniert.' (Mi vuelo fue cancelado).\n- 'Ich habe meinen Anschlussflug verpasst.' (Perdí mi vuelo de conexión)." },
    reading: { title: "Análisis de Caso: Übergepäck", text: "Mitarbeiter: Ihr Koffer wiegt leider 25 Kilo. Das Limit liegt bei 23 Kilo. Sie haben Übergepäck.\nPassagier: Oh, das wusste ich nicht. Kann ich vielleicht zwei Kilo in mein Handgepäck umpacken?\nMitarbeiter: Ja, das können Sie gerne tun. Der Tisch zum Umpacken ist gleich dort drüben.", question: "¿Cómo soluciona el pasajero el problema de exceso de peso?", options: ["Paga una multa.", "Tira las cosas a la basura.", "Pasa (reempaca) 2 kilos a su equipaje de mano (Handgepäck).", "Cancela el vuelo."], correct: 2 },
    speaking: { title: "Shadowing (Fluidez)", phrase: "Guten Tag! Hier ist mein Reisepass und meine Buchungsbestätigung. Ich habe nur einen Koffer zum Aufgeben und ein Stück Handgepäck. Könnte ich bitte einen Gangplatz bekommen?", tip: "Pronuncia las palabras compuestas con seguridad: 'Buchungsbestätigung', 'Handgepäck', 'Gangplatz' (asiento de pasillo)." },
    writing: { title: "Simulador IA: Airport Roleplay", prompt: "INSTRUCCIÓN PARA IA: Eres un agente de Lufthansa. Dime que mi vuelo tiene 'Verspätung' (retraso) de 3 horas. Yo te exigiré un vale de comida (Essensgutschein) de forma educada.", mockFeedback: "Feedback del Simulador: Gut gemacht! \n***Mejora***: Para sonar aún más cortés (C1), usa el Konjunktiv II: 'Da der Flug 3 Stunden Verspätung hat, WÜRDE ich gern wissen, ob mir ein Essensgutschein ZUSTEHT.'" }
  },
  15: {
    title: "Retail & Supermarkt: Compras en Alemán",
    theory: { title: "Reglas de Interacción", content: "LA CULTURA DEL SUPERMERCADO ALEMÁN\n¡Las cajeras en Alemania son extremadamente rápidas! Debes estar preparado para empacar tus cosas a la velocidad de la luz.\n\nVOCABULARIO CLAVE\n- Die Tüte: Bolsa (de plástico o papel).\n- Der Pfand: Sistema de retorno de botellas.\n- Im Angebot: En oferta.\n- Bar oder mit Karte?: ¿Efectivo o con tarjeta?\n- Kassenbon (Der Bon): El recibo / ticket de compra.\n\nPREGUNTAS COMUNES\n- 'Haben Sie eine Payback-Karte?' (¿Tiene tarjeta de puntos?)\n- 'Brauchen Sie den Bon?' (¿Necesita el ticket?)" },
    reading: { title: "Análisis de Caso: An der Kasse", text: "Kassiererin: Hallo. Das macht dann 24 Euro und 50 Cent, bitte. Haben Sie eine Kundenkarte?\nKunde: Nein, habe ich nicht. Ich zahle mit Karte, bitte.\nKassiererin: Gerne. Bitte Karte einstecken... Danke. Brauchen Sie den Bon?\nKunde: Ja, bitte. Schönen Tag noch!\nKassiererin: Danke, gleichfalls!", question: "¿Por qué el cliente dice 'Ich zahle mit Karte, bitte'?", options: ["Para indicar que quiere pagar con tarjeta de crédito/débito.", "Porque no tiene suficiente dinero.", "Para preguntar el precio.", "Porque quiere la tarjeta de puntos."], correct: 0 },
    speaking: { title: "Shadowing (Fluidez)", phrase: "Entschuldigung, könnten Sie mir sagen, wo ich glutenfreie Produkte finde? Ach, und ich suche noch frische Hefe. Ist die hier im Kühlregal oder beim Backzeug?", tip: "Habla con ritmo fluido. 'Entschuldigung' es la forma universal de llamar la atención de un empleado del supermercado." },
    writing: { title: "Simulador IA: Grocery Run", prompt: "INSTRUCCIÓN PARA IA: Eres empleado en un Aldi. Pregúntame si necesito ayuda. Yo te preguntaré dónde está el agua sin gas (stilles Wasser) y cómo funciona la máquina de Pfand.", mockFeedback: "Feedback del Simulador: Sehr realistisch! \n***Vocabulario Sugerido***: 'Stilles Wasser' es correcto. Para la máquina de Pfand, puedes preguntar: 'Wo befindet sich der Pfandautomat, bitte?'" }
  },
  16: {
    title: "Business German I: Formalidades y Correos",
    theory: { title: "Reglas de Interacción", content: "EL LENGUAJE CORPORATIVO (C1)\nEn los negocios, el alemán exige una precisión y formalidad absolutas. Se usa estrictamente la forma 'Sie' (Usted), incluso con colegas de otros departamentos, hasta que se ofrezca explícitamente el 'Du'.\n\nESTRUCTURA DE UN EMAIL FORMAL\n1. Saludo: 'Sehr geehrte Damen und Herren,' (Si no sabes el nombre) / 'Sehr geehrter Herr [Apellido],' / 'Sehr geehrte Frau [Apellido],'\n2. Introducción (minúscula inicial tras la coma del saludo): 'ich schreibe Ihnen bezüglich...' (Le escribo con respecto a...)\n3. Desarrollo: Claro y directo, sin rodeos emocionales.\n4. Despedida: 'Mit freundlichen Grüßen' (Sin coma al final en alemán).\n\nVOCABULARIO CLAVE\n- Im Voraus vielen Dank (Gracias de antemano).\n- Im Anhang finden Sie... (Adjunto encontrará...)" },
    reading: { title: "Análisis de Caso: Solicitud de Reunión", text: "Sehr geehrte Frau Müller,\n\nich beziehe mich auf unser Telefonat von letzter Woche. Im Anhang finden Sie den überarbeiteten Projektplan. Wären Sie am kommenden Dienstag für ein kurzes Meeting verfügbar?\n\nMit freundlichen Grüßen\nLukas Weber", question: "¿Qué significa 'Im Anhang finden Sie...'?", options: ["Nos vemos en el anexo.", "En el documento adjunto encontrará...", "El proyecto está cancelado.", "Saludos cordiales."], correct: 1 },
    speaking: { title: "Shadowing (Fluidez)", phrase: "Sehr geehrter Herr Direktor, bezugnehmend auf Ihre letzte E-Mail möchte ich Ihnen mitteilen, dass das Projekt erfolgreich abgeschlossen wurde. Für weitere Rückfragen stehe ich Ihnen jederzeit gern zur Verfügung.", tip: "Tono formal y profesional. 'Bezugnehmend auf' (Con referencia a) eleva tu nivel automáticamente a C1/C2." },
    writing: { title: "Simulador IA: E-Mail Drafting", prompt: "INSTRUCCIÓN PARA IA: Actúa como evaluador. Redactaré un correo formal a 'Herr Schmidt' pidiendo posponer nuestra reunión (verschieben) para el viernes porque estoy enfermo (krank). Evalúa mi formalidad.", mockFeedback: "Feedback del Simulador: \n***Corrección***: 'Guten Morgen Herr Schmidt' es muy informal. Usa 'Sehr geehrter Herr Schmidt,'. \nTu frase 'Ich möchte unser Meeting auf Freitag verschieben, weil ich krank bin' es correcta, pero en nivel C1 diríamos: 'Aus gesundheitlichen Gründen muss ich unser Meeting leider auf Freitag verschieben.'" }
  },
  17: {
    title: "Business German II: Reuniones y Negociación",
    theory: { title: "Reglas de Interacción", content: "DIRIGIR UNA REUNIÓN (Das Meeting leiten)\n- 'Lassen Sie uns beginnen.' (Empecemos).\n- 'Kommen wir nun zum nächsten Punkt auf der Tagesordnung.' (Pasemos al siguiente punto del orden del día).\n\nNEGOCIAR (Verhandeln)\nPara negociar con éxito en alemán, debes presentar hechos concretos, no emociones.\n- 'Ich verstehe Ihren Standpunkt, jedoch...' (Entiendo su punto de vista, sin embargo...)\n- 'Das ist ein faires Angebot, aber wir müssen die Lieferzeiten anpassen.' (Es una oferta justa, pero debemos ajustar los plazos de entrega).\n\nEXPRESAR ACUERDO/DESACUERDO\n- Acuerdo: 'Da stimme ich Ihnen voll und ganz zu.' (Estoy totalmente de acuerdo con usted).\n- Desacuerdo formal: 'Das sehe ich etwas anders, weil...' (Yo lo veo algo distinto, porque...)" },
    reading: { title: "Análisis de Caso: Der Kompromiss", text: "Partner A: Wenn wir das Volumen erhöhen, erwarten wir einen Preisnachlass von 10%.\nPartner B: Ein Rabatt von 10% ist wirtschaftlich nicht machbar. Wir könnten Ihnen jedoch 5% anbieten und die Versandkosten übernehmen. Wäre das für Sie ein akzeptabler Kompromiss?", question: "¿Qué contrapuesta ofrece Partner B?", options: ["Acepta el 10% de descuento.", "Rechaza todo y termina la reunión.", "Ofrece un 5% de descuento más la asunción de los gastos de envío.", "Propone subir los precios."], correct: 2 },
    speaking: { title: "Shadowing (Fluidez)", phrase: "Wenn ich kurz einhaken dürfte: Meiner Meinung nach sollten wir die Budgetplanung für das zweite Quartal noch einmal überdenken. Die aktuellen Zahlen rechtfertigen diese Investition derzeit nicht.", tip: "La frase 'Wenn ich kurz einhaken dürfte' (Si me permite interrumpir brevemente) es esencial para tomar la palabra en reuniones ejecutivas." },
    writing: { title: "Simulador IA: Boardroom Pitch", prompt: "INSTRUCCIÓN PARA IA: Eres un potencial socio inversor (Herr Braun). Yo quiero convencerte de invertir en mi software. Rebate mis argumentos pidiendo cifras exactas. Practicaremos 'Verhandeln' (negociar).", mockFeedback: "Feedback del Simulador: \n***Sugerencia***: Usaste 'Es ist eine gute Idee'. En alemán corporativo de alto nivel, cambia a 'Dies stellt einen enormen strategischen Vorteil dar' (Esto representa una enorme ventaja estratégica)." }
  },
  18: {
    title: "Medical German: Síntomas y Doctores",
    theory: { title: "Reglas de Interacción", content: "VOCABULARIO MÉDICO (Medizinisches Deutsch)\nAl visitar un consultorio médico (die Arztpraxis) o urgencias (die Notaufnahme), la precisión es vital.\n\nSÍNTOMAS (Symptome)\n- 'Ich habe Kopfschmerzen / Bauchschmerzen' (Tengo dolor de cabeza / de barriga).\n- 'Mir ist schwindelig.' (Tengo mareos).\n- 'Mir ist übel.' (Tengo náuseas).\n- 'Ich habe Fieber.' (Tengo fiebre).\n\nPROCEDIMIENTOS\n- Eine Überweisung geben: Dar un volante/derivación para un especialista.\n- Ein Rezept ausstellen: Emitir una receta médica.\n- Sich krankschreiben lassen: Obtener la baja médica (Arbeitsunfähigkeitsbescheinigung / AU).\n\nANATOMÍA BÁSICA\nDer Kopf (cabeza), das Herz (corazón), der Magen (estómago), die Lunge (pulmón)." },
    reading: { title: "Análisis de Caso: Beim Hausarzt", text: "Arzt: Guten Tag, was fehlt Ihnen denn?\nPatient: Guten Tag, Herr Doktor. Ich habe seit drei Tagen starke Halsschmerzen und Husten. Gestern Abend hatte ich auch leichtes Fieber.\nArzt: Ich werde Sie untersuchen. Bitte machen Sie den Mund weit auf. Aha, Ihr Hals ist stark gerötet. Ich schreibe Sie für drei Tage krank und stelle Ihnen ein Rezept für Antibiotika aus.", question: "¿Qué le da el médico al paciente al final?", options: ["Solo un consejo.", "La baja médica (krankschreiben) por 3 días y una receta (Rezept) para antibióticos.", "Lo manda al hospital.", "Una derivación (Überweisung)."], correct: 1 },
    speaking: { title: "Shadowing (Fluidez)", phrase: "Guten Tag. Ich bräuchte dringend einen Termin. Mir ist seit gestern furchtbar übel und ich habe stechende Schmerzen in der rechten Brustseite. Könnte ich heute noch vorbeikommen?", tip: "Pronuncia 'stechende Schmerzen' (dolores punzantes) y 'übel' con énfasis. Es importante transmitir la urgencia." },
    writing: { title: "Simulador IA: Praxis Roleplay", prompt: "INSTRUCCIÓN PARA IA: Eres un médico alemán (Hausarzt). Yo soy el paciente. Te diré que tengo migrañas terribles (Migräne) y necesito pedir la baja médica para mi trabajo. Inicia la consulta preguntando qué me pasa.", mockFeedback: "Feedback del Simulador: Excelente desempeño. \n***Mejora de Vocabulario***: En lugar de decir 'Ich kann nicht arbeiten', di 'Ich brauche eine Krankschreibung / eine Arbeitsunfähigkeitsbescheinigung für meinen Arbeitgeber'. Es el término técnico exacto." }
  },
  19: {
    title: "Debate Académico: Expresión de Opiniones",
    theory: { title: "Reglas de Interacción", content: "ARGUMENTACIÓN AVANZADA (C1)\nDebatir en alemán no implica levantar la voz, sino usar conectores lógicos y lenguaje estructurado.\n\nINTRODUCIR OPINIONES\n- Nivel B1: 'Ich denke, dass...'\n- Nivel C1: 'Ich bin der festen Überzeugung, dass...' (Tengo la firme convicción de que...)\n- Nivel C1: 'Meiner Auffassung nach...' (Según mi punto de vista...)\n\nCONCEDER UN PUNTO (Zustimmen und Einschränken)\n- 'Zwar ist es richtig, dass..., aber...' (Si bien es cierto que..., pero...)\n- 'Ich gebe Ihnen in diesem Punkt recht, dennoch...' (Le doy la razón en este punto, no obstante...)\n\nCONECTORES RETÓRICOS\n- Folglich (En consecuencia)\n- Andererseits (Por otro lado)\n- Nichtsdestotrotz (Sin embargo / A pesar de ello)" },
    reading: { title: "Análisis de Caso: Debate sobre IA", text: "Teilnehmer A: Die künstliche Intelligenz wird unweigerlich zu Massenarbeitslosigkeit führen.\nTeilnehmer B: Zwar ist es nicht von der Hand zu weisen, dass bestimmte Berufsfelder automatisiert werden, nichtsdestotrotz lehrt uns die Geschichte, dass technologische Revolutionen stets auch neue, komplexere Arbeitsplätze schaffen.", question: "¿Qué técnica argumentativa usa el Teilnehmer B?", options: ["Insulta al oponente.", "Concede parcialmente el punto (Zwar...) pero introduce un contraargumento histórico (nichtsdestotrotz...).", "Cambia de tema.", "Está 100% de acuerdo."], correct: 1 },
    speaking: { title: "Shadowing (Fluidez)", phrase: "Lassen Sie mich dazu Folgendes sagen: Meiner Ansicht nach greift dieses Argument zu kurz. Wir müssen nicht nur die kurzfristigen Kosten betrachten, sondern vielmehr die langfristigen ökologischen Auswirkungen in Betracht ziehen.", tip: "Habla con autoridad académica. Haz pausas dramáticas después de 'Lassen Sie mich dazu Folgendes sagen:' (Déjeme decir lo siguiente al respecto:)." },
    writing: { title: "Simulador IA: Oxford Debate", prompt: "INSTRUCCIÓN PARA IA: Eres mi oponente en un debate sobre 'El trabajo remoto'. Tú argumentas que destruye la productividad. Yo usaré frases C1 para conceder parte de tu punto y refutarlo. Comienza tu argumento.", mockFeedback: "Feedback del Simulador: ¡Gran contraataque! \n***Mejora***: Usaste muy bien 'Zwar..., aber'. Para elevarlo aún más, podrías usar la expresión 'Es ist nicht von der Hand zu weisen, dass...' (No se puede negar que...)." }
  },
  20: {
    title: "Storytelling Narrativo: Tiempos C1",
    theory: { title: "Reglas de Interacción", content: "NARRACIÓN AVANZADA (Plusquamperfekt)\nPara contar anécdotas atractivas, los hablantes C1 dominan la cronología del pasado. Si cuentas algo en Präteritum/Perfekt, y necesitas referirte a algo que ocurrió AÚN ANTES, usas el Plusquamperfekt (Pasado Anterior).\n\nESTRUCTURA PLUSQUAMPERFEKT\nAuxiliar en pasado (hatte / war) + Participio II al final.\n- 'Als ich am Bahnhof ankam (Präteritum), WAR der Zug schon ABGEFAHREN (Plusquamperfekt).' (Cuando llegué, el tren YA HABÍA partido).\n\nCONECTORES TEMPORALES DE NARRACIÓN\n- Nachdem (Después de que - exige Plusquamperfekt): 'Nachdem ich gegessen hatte, ging ich schlafen.'\n- Plötzlich (De repente).\n- Zu meinem Erstaunen (Para mi sorpresa)." },
    reading: { title: "Análisis de Caso: Ein schrecklicher Tag", text: "Es war ein Katastrophen-Tag. Als ich im Büro ankam, bemerkte ich, dass ich meinen Laptop zu Hause vergessen hatte. Das Meeting hatte bereits begonnen! Zu meinem Erstaunen war mein Chef gar nicht wütend, weil der Beamer ebenfalls kaputtgegangen war.", question: "¿Qué acción ocurrió primero cronológicamente?", options: ["Llegar a la oficina.", "Olvidar la laptop en casa (hatte ... vergessen).", "Quejarse con el jefe.", "La ruptura del proyector."], correct: 1 },
    speaking: { title: "Shadowing (Fluidez)", phrase: "Stell dir vor, was mir gestern passiert ist! Nachdem ich stundenlang an der Präsentation gearbeitet hatte, stürzte plötzlich mein Computer ab. Ich hatte natürlich kein Backup gemacht. Es war ein absoluter Albtraum!", tip: "Pon emoción en la voz. Acentúa 'abgestürzt' (se colgó) y 'Albtraum' (pesadilla)." },
    writing: { title: "Simulador IA: Die Anekdote", prompt: "INSTRUCCIÓN PARA IA: Estamos en una pausa de café virtual. Te contaré una historia cómica usando 'Nachdem' y el Plusquamperfekt sobre cómo me perdí en Múnich. Reacciona y corrige mis tiempos verbales si es necesario.", mockFeedback: "Feedback del Simulador: \n***Corrección Temporal***: Dijiste 'Nachdem ich aus dem Zug stieg'. ¡Recuerda la regla! 'Nachdem' requiere Plusquamperfekt: 'Nachdem ich aus dem Zug GESTIEGEN WAR, merkte ich, dass ich in der falschen Stadt war!'" }
  },
  21: {
    title: "Restaurant Experience: Pragmática C1",
    theory: { title: "Reglas de Interacción", content: "CORTESÍA SUPERIOR (Gehobene Gastronomie)\nEn un buen restaurante, la diplomacia al hacer peticiones o quejas es clave. Se usa exhaustivamente el Konjunktiv II.\n\nPEDIR RECOMENDACIONES Y MARIDAJE\n- 'Was könnten Sie uns als Vorspeise empfehlen?' (¿Qué podría recomendarnos como entrada?)\n- 'Welcher Wein würde am besten zu diesem Gericht passen?' (¿Qué vino iría mejor con este plato?)\n\nRECLAMACIONES EDUCADAS (Reklamationen)\nNunca digas 'Das ist kalt!'. Usa mitigadores:\n- 'Entschuldigen Sie, aber mein Steak ist leider etwas zu durchgebraten. Ich hatte es medium-rare bestellt.' (Disculpe, pero mi filete está algo muy hecho...)\n- 'Könnten Sie das vielleicht noch einmal aufwärmen?' (¿Podría tal vez recalentarlo?)" },
    reading: { title: "Análisis de Caso: Beim Sommelier", text: "Gast: Herr Ober, der Fisch ist wirklich vorzüglich. Allerdings scheint der Weißwein, den Sie uns gebracht haben, Korkgeschmack zu haben.\nKellner: Oh, das bedauere ich sehr, mein Herr. Ich werde die Flasche sofort zurücknehmen und Ihnen selbstverständlich eine neue bringen. Bitte entschuldigen Sie die Unannehmlichkeiten.", question: "¿Cómo aborda el cliente el problema del vino?", options: ["Grita al camarero.", "Elogia la comida primero y usa un tono mitigado ('scheint... zu haben') para señalar que el vino sabe a corcho.", "Pide la cuenta inmediatamente.", "Se bebe el vino en silencio."], correct: 1 },
    speaking: { title: "Shadowing (Fluidez)", phrase: "Entschuldigen Sie bitte, könnten Sie noch einmal an unseren Tisch kommen? Das Risotto ist geschmacklich hervorragend, aber es ist leider nur lauwarm. Wäre es möglich, das noch einmal kurz in die Küche zu geben?", tip: "Aplica el 'Sándwich de Queja': Disculpa -> Elogio -> Problema (suavizado con 'leider' y 'lauwarm') -> Solución en Konjunktiv II." },
    writing: { title: "Simulador IA: Fine Dining", prompt: "INSTRUCCIÓN PARA IA: Eres el camarero (Kellner) de un restaurante en Viena con estrella Michelin. Yo soy un cliente con alergia a los frutos secos (Nüsse). Sugiéreme platos y luego cometerás un error para que yo practique una queja formal.", mockFeedback: "Feedback del Simulador: Sehr gut! \n***Mejora***: Cuando pides la cuenta, en lugar de decir 'Ich will bezahlen', en este nivel de restaurante debes decir 'Wir würden dann gern zahlen, bitte' o 'Die Rechnung, bitte'." }
  },
  22: {
    title: "Customer Escalation: B2B Troubleshooting",
    theory: { title: "Reglas de Interacción", content: "RESOLUCIÓN DE CONFLICTOS CORPORATIVOS (B2B)\nCuando falla un servicio entre empresas (downtime, incumplimiento), la comunicación debe ser asertiva, legalmente precisa y orientada a soluciones.\n\nVOCABULARIO TÉCNICO B2B\n- Der Ausfall / Die Störung: La caída / interrupción del servicio.\n- Die Vertragsverletzung: Incumplimiento de contrato.\n- Die Entschädigung / Rückerstattung: Compensación / Reembolso.\n- Den Fall eskalieren: Escalar el caso (a un supervisor).\n\nFRASES DE ASERTIVIDAD C1/C2\n- 'Dieser anhaltende Serverausfall stellt einen klaren Verstoß gegen unser Service Level Agreement (SLA) dar.' (Esta caída continua representa una clara violación a nuestro SLA).\n- 'Ich muss darauf bestehen, dass dieser Fall umgehend an den Vorgesetzten eskaliert wird.' (Debo insistir en que este caso sea escalado inmediatamente al supervisor)." },
    reading: { title: "Análisis de Caso: Beschwerde-E-Mail", text: "Sehr geehrtes Support-Team,\nhiermit melde ich eine kritische Störung. Unsere Systeme sind seit über vier Stunden offline, was zu erheblichen finanziellen Einbußen führt. Wir erwarten eine sofortige Stellungnahme und eine proportionale Rückerstattung der monatlichen Gebühren gemäß Abschnitt 4 unseres Vertrages. Ich bitte um Eskalation an das Tier-3-Team.", question: "¿Qué exige exactamente el cliente debido a las pérdidas financieras?", options: ["Un nuevo contrato.", "Una declaración inmediata y un reembolso proporcional de las tarifas mensuales.", "Despedir al soporte técnico.", "Cancelar el servicio para siempre."], correct: 1 },
    speaking: { title: "Shadowing (Fluidez)", phrase: "Ich schätze Ihre Entschuldigung, aber Empathie wird unsere Umsatzverluste nicht ausgleichen. Das Problem besteht nun seit Dienstag. Ich fordere, dass Sie dieses Ticket unverzüglich an das Eskalationsteam weiterleiten.", tip: "Tono inamovible, profesional y frío. Articula perfectamente 'Umsatzverluste' (pérdidas de ingresos) y 'unverzüglich' (inmediatamente)." },
    writing: { title: "Simulador IA: B2B Call", prompt: "INSTRUCCIÓN PARA IA: Eres un representante de Cloud Service de SAP. Yo te llamo como cliente B2B muy molesto porque los servidores cayeron durante el Black Friday. Practicaremos exigencias corporativas y tú intentarás calmarme ofreciendo soluciones.", mockFeedback: "Feedback del Simulador: ¡Excelente firmeza corporativa! \n***Vocabulario C2***: En vez de decir 'wir verlieren viel Geld', usaste brillantemente 'wir erleiden erhebliche finanzielle Einbußen'. ¡Tu nivel de negociación B2B en alemán es excepcional!" }
  }
};

// --- COMPONENTE NOTIFICACIÓN (TOAST) ---
const Toast = ({ message, onClose }) => {
  if (!message) return null;
  return (
    <div className="fixed bottom-8 right-8 bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl z-50 flex items-center gap-4 animate-in slide-in-from-bottom-5">
      <CheckCircle className="w-6 h-6 text-emerald-400" />
      <span className="font-medium">{message}</span>
      <button onClick={onClose} className="ml-4 text-slate-400 hover:text-white transition-colors">
        <X className="w-5 h-5" />
      </button>
    </div>
  );
};

export default function App() {
  const [view, setView] = useState('home'); 
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(1); 
  const [toastMessage, setToastMessage] = useState(null);

  // --- ESTADOS DE PERSISTENCIA (FIREBASE) ---
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [completedWeeks, setCompletedWeeks] = useState([]);
  const [hasCompletedEval, setHasCompletedEval] = useState(false);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  React.useEffect(() => {
    if (!auth) { setLoadingAuth(false); return; }
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (error) {
        console.error("Error de Auth", error);
        setLoadingAuth(false);
      }
    };
    initAuth();

    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoadingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  React.useEffect(() => {
    if (!user || !db) return;
    const progressRef = doc(db, 'artifacts', appId, 'users', user.uid, 'progress', 'main');
    
    const unsubscribe = onSnapshot(progressRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setCompletedWeeks(data.completedWeeks || []);
        
        if (data.hasCompletedEval) {
          setHasCompletedEval(true);
          setScore(data.score || 0);
          if (view === 'home') setView('dashboard');
        }
      }
    }, (err) => console.error("Error cargando progreso:", err));
    
    return () => unsubscribe();
  }, [user, view]);

  const saveProgress = async (newData) => {
    if (!user || !db) return;
    const progressRef = doc(db, 'artifacts', appId, 'users', user.uid, 'progress', 'main');
    await setDoc(progressRef, newData, { merge: true });
  };

  const handleCompleteWeek = () => {
    const newCompleted = [...completedWeeks];
    if (!newCompleted.includes(activeWeek)) {
      newCompleted.push(activeWeek);
      setCompletedWeeks(newCompleted);
      saveProgress({ completedWeeks: newCompleted });
      showToast("¡Módulo certificado y guardado en la nube!");
    }
    setView('dashboard');
  };

  const handleStartEval = () => {
    setView('eval');
    setCurrentQuestion(0);
    setScore(0);
  };

  const handleAnswer = (selectedIndex) => {
    let currentScore = score;
    if (selectedIndex === evaluationQuestions[currentQuestion].correct) {
      currentScore = score + 1;
      setScore(currentScore);
    }
    
    if (currentQuestion < evaluationQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      saveProgress({ hasCompletedEval: true, score: currentScore });
      setView('result');
    }
  };

  const getLevelAssessment = () => {
    if (score >= 18) return "¡Nivel C1/C2 Avanzado! Dominas la gramática compleja, la declinación y el Konjunktiv II. Este diplomado te servirá para perfeccionar pragmática y fluidez en tiempo real.";
    if (score >= 12) return "Nivel B1/B2 Intermedio. Tienes una base sólida, pero los simuladores y la gramática avanzada destrozarán tus inseguridades al hablar. ¡Prepárate para dar el salto!";
    return "Nivel A1/A2 Básico. ¡El momento perfecto para empezar! Completa los primeros módulos para dominar los casos (Der, Die, Das, Dativo) y pronto estarás hablando alemán con confianza.";
  };

  // --- ESTADOS DE LA LECCIÓN ---
  const [activeWeek, setActiveWeek] = useState(null);
  const [lessonTab, setLessonTab] = useState('theory'); 
  const [readingAnswered, setReadingAnswered] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [writingText, setWritingText] = useState('');
  const [writingFeedback, setWritingFeedback] = useState(null);

  const openLesson = (weekNum) => {
    if (!lessonModules[weekNum]) {
      showToast("Dieses Modul befindet sich im Aufbau (En construcción).");
      return;
    }
    setActiveWeek(weekNum);
    setLessonTab('theory');
    setReadingAnswered(false);
    setWritingText('');
    setWritingFeedback(null);
    setView('lesson');
  };

  const simulateRecording = () => {
    setIsRecording(true);
    setTimeout(() => {
      setIsRecording(false);
      showToast("¡Audio capturado y evaluado con éxito!");
    }, 3000);
  };

  const submitWriting = () => {
    if(writingText.length < 15) {
      showToast("Por favor, desarrolla más tu respuesta para activar el simulador IA (Mínimo 15 caracteres).");
      return;
    }
    setWritingFeedback("Procesando análisis pragmático, semántico y gramática alemana...");
    setTimeout(() => {
      setWritingFeedback(lessonModules[activeWeek]?.writing?.mockFeedback);
      showToast("Evaluación del Tutor IA recibida.");
    }, 2500);
  };

  if (loadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-amber-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-amber-200 pb-12 relative overflow-hidden">
      
      {/* Toast Notification */}
      <Toast message={toastMessage} onClose={() => setToastMessage(null)} />

      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex flex-wrap justify-between items-center sticky top-0 z-20 shadow-sm gap-4">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView(hasCompletedEval ? 'dashboard' : 'home')}>
          <Award className="w-8 h-8 text-amber-500" />
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-600 to-red-600">
            Deutsch Mastery PRO
          </span>
        </div>
        <div className="flex items-center gap-4">
          {user && (
            <div className="hidden sm:flex items-center gap-2 text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
              <User className="w-4 h-4" />
              ID: {user.uid.slice(0, 8)}...
            </div>
          )}
          {(view === 'dashboard' || view === 'lesson') && (
            <div className="flex items-center gap-2 bg-slate-900 text-white px-4 py-1.5 rounded-full font-bold text-sm shadow-md">
              <Flame className="w-4 h-4 text-orange-400 fill-current" />
              Tage: {streak}
            </div>
          )}
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-6 mt-8">
        
        {/* --- VIEW: HOME --- */}
        {view === 'home' && (
          <div className="text-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="inline-block bg-slate-900 text-white px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase mb-4 shadow-sm border border-slate-700">
              Inmersión Total (22 Módulos A1 a C2)
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-slate-900 leading-tight tracking-tight">
              De Cero a Experto <br className="hidden md:block"/> Sin Salir de Casa.
            </h1>
            <p className="text-lg text-slate-600 max-w-3xl mx-auto font-medium leading-relaxed">
              El programa definitivo de Alemán. Combina las bases gramaticales (Der, Die, Das) con un arsenal de Simuladores de Rol hiperrealistas que exigirán tu máxima fluidez bajo presión.
            </p>
            
            <div className="grid md:grid-cols-4 gap-6 mt-12 mb-12 text-left">
              <div className="bg-white p-6 rounded-3xl shadow-lg border border-slate-100 hover:-translate-y-1 transition-transform">
                <div className="bg-amber-50 w-12 h-12 rounded-2xl flex items-center justify-center mb-4">
                  <BrainCircuit className="text-amber-600 w-6 h-6" />
                </div>
                <h3 className="font-extrabold text-lg mb-2 text-slate-900">Gramática Estructural</h3>
                <p className="text-slate-500 text-sm">Desde Casos (Nominativo, Acusativo, Dativo) hasta N-Deklination y Pasiva.</p>
              </div>
              <div className="bg-white p-6 rounded-3xl shadow-lg border border-slate-100 hover:-translate-y-1 transition-transform">
                <div className="bg-red-50 w-12 h-12 rounded-2xl flex items-center justify-center mb-4">
                  <Target className="text-red-600 w-6 h-6" />
                </div>
                <h3 className="font-extrabold text-lg mb-2 text-slate-900">Alemán Clínico</h3>
                <p className="text-slate-500 text-sm">Terminología médica, visitas al Hausarzt, síntomas y recetas.</p>
              </div>
              <div className="bg-white p-6 rounded-3xl shadow-lg border border-slate-100 hover:-translate-y-1 transition-transform">
                <div className="bg-slate-50 w-12 h-12 rounded-2xl flex items-center justify-center mb-4">
                  <Briefcase className="text-slate-800 w-6 h-6" />
                </div>
                <h3 className="font-extrabold text-lg mb-2 text-slate-900">Business Deutsch</h3>
                <p className="text-slate-500 text-sm">Negociaciones B2B, correos formales (Sehr geehrte...) y reuniones corporativas.</p>
              </div>
              <div className="bg-white p-6 rounded-3xl shadow-lg border border-slate-100 hover:-translate-y-1 transition-transform">
                <div className="bg-emerald-50 w-12 h-12 rounded-2xl flex items-center justify-center mb-4">
                  <MessageCircle className="text-emerald-600 w-6 h-6" />
                </div>
                <h3 className="font-extrabold text-lg mb-2 text-slate-900">Simuladores IA</h3>
                <p className="text-slate-500 text-sm">Aeropuertos, supermercados, Small Talk y debates con Inteligencia Artificial.</p>
              </div>
            </div>

            <button 
              onClick={() => hasCompletedEval ? setView('dashboard') : handleStartEval()}
              className="bg-amber-500 hover:bg-amber-600 text-white text-lg font-bold py-5 px-12 rounded-full shadow-2xl transition-all hover:scale-105"
            >
              {hasCompletedEval ? "Ingresar al Campus Virtual" : "Iniciar Examen de Ubicación (22 Preguntas)"}
            </button>
          </div>
        )}

        {/* --- VIEW: EVALUATION --- */}
        {view === 'eval' && (
          <div className="max-w-3xl mx-auto bg-white p-10 rounded-3xl shadow-xl border border-slate-100 animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black text-slate-900">Diagnóstico Lingüístico (A1 - C2)</h2>
              <span className="text-xs font-bold bg-amber-100 text-amber-700 px-3 py-1 rounded-full uppercase tracking-wider">
                Frage {currentQuestion + 1} / {evaluationQuestions.length}
              </span>
            </div>
            
            <div className="mb-10">
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-amber-500 transition-all duration-500 ease-out"
                  style={{ width: `${((currentQuestion) / evaluationQuestions.length) * 100}%` }}
                ></div>
              </div>
            </div>

            <p className="text-xl font-bold mb-8 whitespace-pre-line leading-relaxed text-slate-800">
              {evaluationQuestions[currentQuestion].question}
            </p>

            <div className="space-y-4">
              {evaluationQuestions[currentQuestion].options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswer(index)}
                  className="w-full text-left p-5 rounded-2xl border-2 border-slate-100 hover:border-amber-500 hover:bg-amber-50 hover:shadow-md transition-all font-medium text-slate-700 text-lg"
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* --- VIEW: RESULTS --- */}
        {view === 'result' && (
          <div className="text-center max-w-2xl mx-auto bg-white p-12 rounded-3xl shadow-xl border border-slate-100 animate-in fade-in duration-500">
            <div className="w-24 h-24 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <Award className="w-12 h-12 fill-current" />
            </div>
            <h2 className="text-4xl font-black mb-2 text-slate-900">Análisis Global Completado</h2>
            <p className="text-6xl font-black text-amber-600 mb-8">
              {score} <span className="text-3xl text-slate-300">/ {evaluationQuestions.length}</span>
            </p>
            
            <div className="bg-slate-50 p-8 rounded-3xl mb-10 text-left border border-slate-200">
              <h3 className="font-black text-slate-900 mb-3 text-lg uppercase tracking-wide">Reporte del Sistema:</h3>
              <p className="text-slate-700 leading-relaxed text-lg">
                {getLevelAssessment()}
              </p>
            </div>

            <button 
              onClick={() => setView('dashboard')}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xl font-bold py-5 px-8 rounded-2xl shadow-xl transition-all hover:scale-[1.02]"
            >
              Desbloquear los 22 Módulos
            </button>
          </div>
        )}

        {/* --- VIEW: DASHBOARD --- */}
        {view === 'dashboard' && (
          <div className="animate-in fade-in duration-700 space-y-12">
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-slate-900 p-10 rounded-[2rem] text-white shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-amber-600 rounded-full filter blur-[100px] opacity-30 translate-x-1/2 -translate-y-1/2"></div>
              <div className="relative z-10 w-full md:w-2/3">
                <h2 className="text-4xl font-black mb-3">Campus Virtual: 22 Módulos</h2>
                <p className="text-amber-100 text-lg mb-6 max-w-xl">El programa integral. Domina las bases desde A1 (Módulos 1-5), construye tu nivel B1/B2 (Módulos 6-12) y ejecuta en el mundo real mediante los Simuladores Conversacionales C1/C2 (Módulos 13-22).</p>
                
                {/* Barra de Progreso a 22 Módulos */}
                <div className="w-full bg-slate-800 rounded-full h-3 border border-slate-700 max-w-xl">
                  <div className="bg-gradient-to-r from-red-500 via-amber-500 to-yellow-400 h-3 rounded-full transition-all duration-1000" style={{ width: `${(completedWeeks.length / 22) * 100}%` }}></div>
                </div>
                <p className="text-sm text-slate-400 mt-2 font-bold uppercase tracking-widest">{completedWeeks.length} de 22 módulos completados</p>
              </div>
            </div>

            {/* Syllabus Grid Interactiva */}
            <div>
              <h3 className="text-2xl font-black mb-8 flex items-center gap-3 text-slate-900">
                <BookOpen className="text-amber-600 w-8 h-8" />
                Módulos del Diplomado
              </h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {syllabus.map((week, idx) => {
                  const isCompleted = completedWeeks.includes(week.week);
                  const isAvailable = lessonModules[week.week] !== undefined;
                  
                  return (
                    <button 
                      key={idx} 
                      onClick={() => openLesson(week.week)}
                      className={`text-left bg-white p-6 rounded-[1.5rem] border-2 flex flex-col gap-4 transition-all group ${
                        !isAvailable ? 'border-dashed border-slate-200 opacity-60 cursor-not-allowed' :
                        isCompleted ? 'border-emerald-400 shadow-emerald-50 hover:-translate-y-1 cursor-pointer hover:shadow-xl' : 
                        'border-slate-100 hover:border-amber-500 cursor-pointer hover:-translate-y-1 hover:shadow-xl'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl transition-colors shadow-sm ${
                          !isAvailable ? 'bg-slate-100 text-slate-400' :
                          isCompleted ? 'bg-emerald-500 text-white' : 'bg-amber-50 text-amber-600 group-hover:bg-amber-500 group-hover:text-white'
                        }`}>
                          {isCompleted ? <CheckCircle className="w-7 h-7" /> : `M${week.week}`}
                        </div>
                        <div className="flex items-center gap-1 text-xs font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-md">
                          <Clock className="w-3 h-3" /> {week.time}
                        </div>
                      </div>
                      <div>
                        <div className={`text-xs font-black mb-1 uppercase tracking-widest ${
                          !isAvailable ? 'text-slate-400' :
                          isCompleted ? 'text-emerald-600' : 'text-amber-600'
                        }`}>
                          {!isAvailable ? 'Gesperrt (Bloqueado)' : isCompleted ? 'Erledigt (Completado)' : week.focus}
                        </div>
                        <h4 className={`text-lg font-bold mb-2 leading-tight transition-colors ${
                          !isAvailable ? 'text-slate-500' :
                          isCompleted ? 'text-slate-800' : 'text-slate-900 group-hover:text-amber-700'
                        }`}>{week.title}</h4>
                        <p className="text-slate-600 text-sm leading-relaxed font-medium">{week.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* --- VIEW: INTERACTIVE LESSON (EL AULA VIRTUAL) --- */}
        {view === 'lesson' && lessonModules[activeWeek] && (
          <div className="animate-in slide-in-from-bottom-8 duration-500">
            {/* Cabecera de la Lección */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setView('dashboard')}
                  className="p-3 bg-slate-100 hover:bg-slate-200 hover:text-amber-600 rounded-full transition-all text-slate-600"
                >
                  <ArrowLeft className="w-6 h-6" />
                </button>
                <div>
                  <p className="text-sm font-black text-amber-600 uppercase tracking-widest mb-1">Modul {activeWeek}</p>
                  <h2 className="text-2xl font-black text-slate-900">{lessonModules[activeWeek].title}</h2>
                </div>
              </div>
            </div>

            {/* Pestañas de Navegación del Laboratorio */}
            <div className="flex flex-wrap gap-2 mb-8 bg-slate-900 p-2 rounded-[1.5rem] shadow-xl">
              {[
                { id: 'theory', icon: BookOpen, label: activeWeek >= 13 ? 'Reglas de Interacción' : 'Bases Teóricas' },
                { id: 'reading', icon: FileText, label: activeWeek >= 13 ? 'Análisis de Caso' : 'Análisis Textual' },
                { id: 'speaking', icon: Mic, label: 'Shadowing (Fluidez)' },
                { id: 'writing', icon: activeWeek >= 13 ? MessageCircle : Edit3, label: activeWeek >= 13 ? 'Simulador IA' : 'Laboratorio Estructural' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setLessonTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-4 rounded-[1.2rem] font-bold text-sm transition-all flex-1 justify-center min-w-[150px] ${lessonTab === tab.id ? 'bg-amber-500 text-white shadow-lg scale-[1.02]' : 'text-slate-400 hover:bg-white/10 hover:text-white'}`}
                >
                  <tab.icon className="w-5 h-5" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Contenido Dinámico según Pestaña */}
            <div className="bg-white p-8 md:p-12 rounded-[2rem] shadow-lg border border-slate-100 min-h-[500px]">
              
              {/* TAB: TEORÍA */}
              {lessonTab === 'theory' && (
                <div className="animate-in fade-in">
                  <h3 className="text-3xl font-black mb-8 text-slate-900 flex items-center gap-3">
                    <BrainCircuit className="text-amber-500 w-8 h-8" />
                    {lessonModules[activeWeek].theory.title}
                  </h3>
                  <div className="prose prose-lg max-w-none">
                    <div className="whitespace-pre-line text-slate-700 leading-relaxed bg-slate-50 p-8 rounded-3xl border border-slate-200 font-medium text-lg">
                      {lessonModules[activeWeek].theory.content}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: READING */}
              {lessonTab === 'reading' && (
                <div className="animate-in fade-in space-y-8">
                  <h3 className="text-3xl font-black text-slate-900 flex items-center gap-3">
                    <Target className="text-amber-500 w-8 h-8" />
                    {lessonModules[activeWeek].reading.title}
                  </h3>
                  <div className="bg-slate-900 p-8 rounded-3xl shadow-xl border-t-8 border-red-600">
                    <p className="text-xl text-slate-200 leading-loose font-serif">
                      "{lessonModules[activeWeek].reading.text}"
                    </p>
                  </div>
                  
                  <div className="pt-6">
                    <p className="text-xl font-bold mb-6 text-slate-900">{lessonModules[activeWeek].reading.question}</p>
                    <div className="space-y-4">
                      {lessonModules[activeWeek].reading.options.map((opt, idx) => (
                        <button 
                          key={idx}
                          onClick={() => setReadingAnswered(idx)}
                          className={`w-full text-left p-6 rounded-2xl border-2 transition-all font-medium text-lg ${
                            readingAnswered === idx 
                              ? (idx === lessonModules[activeWeek].reading.correct 
                                  ? 'border-emerald-500 bg-emerald-50 text-emerald-900 shadow-md' 
                                  : 'border-red-400 bg-red-50 text-red-900')
                              : 'border-slate-200 hover:border-amber-400 hover:shadow-sm'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                    {readingAnswered !== false && readingAnswered === lessonModules[activeWeek].reading.correct && (
                      <div className="mt-8 p-6 bg-emerald-100 border border-emerald-200 text-emerald-900 rounded-2xl font-bold flex items-center gap-3 text-lg animate-in zoom-in-95">
                        <CheckCircle className="w-8 h-8" /> Richtig! (¡Correcto!). Has asimilado la lógica del texto.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB: SPEAKING */}
              {lessonTab === 'speaking' && (
                <div className="animate-in fade-in text-center max-w-4xl mx-auto py-4">
                  <h3 className="text-3xl font-black mb-4 text-slate-900">{lessonModules[activeWeek].speaking.title}</h3>
                  <p className="text-amber-700 font-bold mb-10 text-lg bg-amber-50 py-3 px-6 rounded-full inline-block border border-amber-100">
                    Instrucción de Práctica: {lessonModules[activeWeek].speaking.tip}
                  </p>
                  
                  <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-10 rounded-[2.5rem] mb-10 shadow-2xl relative overflow-hidden text-left border-l-8 border-yellow-500">
                    <Volume2 className="w-10 h-10 text-amber-400 mb-6 opacity-50" />
                    <p className="text-3xl font-medium leading-relaxed font-serif">
                      "{lessonModules[activeWeek].speaking.phrase}"
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row justify-center gap-4">
                    <button className="flex items-center justify-center gap-3 bg-white border-2 border-slate-200 hover:border-amber-500 hover:text-amber-600 text-slate-700 font-black py-4 px-8 rounded-2xl transition-all text-lg">
                      <PlayCircle className="w-6 h-6" /> Escuchar Emisión Original
                    </button>
                    <button 
                      onClick={simulateRecording}
                      disabled={isRecording}
                      className={`flex items-center justify-center gap-3 font-black py-4 px-8 rounded-2xl shadow-xl transition-all text-lg ${isRecording ? 'bg-red-500 animate-pulse text-white scale-105 shadow-red-500/50' : 'bg-amber-500 hover:bg-amber-600 text-white hover:scale-105 shadow-amber-500/30'}`}
                    >
                      <Mic className="w-6 h-6" /> {isRecording ? 'Auswertung läuft... (Evaluando)' : 'Iniciar Shadowing (Grabar)'}
                    </button>
                  </div>
                </div>
              )}

              {/* TAB: WRITING / ROLEPLAY */}
              {lessonTab === 'writing' && (
                <div className="animate-in fade-in space-y-8">
                  <h3 className="text-3xl font-black text-slate-900 flex items-center gap-3">
                    {activeWeek >= 13 ? <MessageCircle className="text-amber-500 w-8 h-8" /> : <Edit3 className="text-amber-500 w-8 h-8" />}
                    {lessonModules[activeWeek].writing.title}
                  </h3>
                  <div className="bg-red-50 border-l-8 border-red-500 p-6 rounded-r-2xl shadow-sm">
                    <p className="text-red-900 font-bold text-lg flex gap-3">
                      <span className="uppercase tracking-widest text-red-600 text-sm mt-1">Prompt:</span> 
                      {lessonModules[activeWeek].writing.prompt}
                    </p>
                  </div>

                  <div className="relative">
                    <textarea 
                      value={writingText}
                      onChange={(e) => setWritingText(e.target.value)}
                      placeholder={activeWeek >= 13 ? "Inicia la interacción o responde al rol en alemán aquí..." : "Redacta tu análisis o traducción al alemán aquí..."}
                      className="w-full h-64 p-6 border-2 border-slate-200 rounded-3xl focus:border-amber-500 focus:ring-4 focus:ring-amber-100 outline-none transition-all resize-none text-slate-800 text-xl font-medium shadow-inner leading-relaxed"
                    ></textarea>
                    <div className="absolute bottom-4 right-4 text-sm font-bold text-slate-400 bg-white px-3 py-1 rounded-lg border border-slate-100">
                      Wörter: {writingText.split(/\s+/).filter(w => w.length > 0).length}
                    </div>
                  </div>

                  <button 
                    onClick={submitWriting}
                    className="flex items-center justify-center gap-3 w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white font-black py-4 px-10 rounded-2xl transition-all text-lg hover:shadow-xl"
                  >
                    <Send className="w-6 h-6" /> {activeWeek >= 13 ? "Senden (Enviar al Simulador)" : "Procesar Análisis"}
                  </button>

                  {writingFeedback && (
                    <div className="mt-8 p-8 bg-gradient-to-br from-amber-50 to-red-50 border-2 border-amber-200 rounded-3xl shadow-lg animate-in slide-in-from-bottom-4">
                      <h4 className="font-black text-amber-900 flex items-center gap-3 mb-4 text-xl">
                        <BrainCircuit className="w-8 h-8 text-amber-600" /> Antwort der KI (Respuesta del Tutor IA)
                      </h4>
                      <div className="w-full h-[1px] bg-amber-200 mb-4"></div>
                      <p className="text-amber-950 whitespace-pre-line leading-relaxed text-lg font-medium">
                        {writingFeedback}
                      </p>
                    </div>
                  )}
                </div>
              )}

            </div>
            
            {/* Botón para guardar progreso de la lección */}
            <div className="mt-8 flex justify-end">
              <button
                onClick={handleCompleteWeek}
                className="flex items-center gap-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black py-4 px-8 rounded-2xl shadow-lg transition-all hover:scale-105"
              >
                <CheckCircle className="w-6 h-6" />
                {completedWeeks.includes(activeWeek) ? 'Bereits erledigt (Volver al Campus)' : 'Zertifikat erhalten (Certificar Módulo)'}
              </button>
            </div>

          </div>
        )}

      </main>
    </div>
  );
}