// Names: every Fagi gets a given name and two surnames, the first from her
// father and the second from her mother (the Spanish custom), so a family can
// be read off the names alone: siblings share both surnames, cousins one.
//
// Short names from many languages. The draws use a random stream of their
// own, never Math.random: naming someone must not shift the stream a seeded
// batch run replays (research/), so a run is the same with or without names.

const FEMALE = [
  // Spanish, Portuguese, Catalan, Basque, Galician
  'Ana', 'Eva', 'Inés', 'Lía', 'Luz', 'Sol', 'Mar', 'Paz', 'Rosa', 'Alba', 'Nora', 'Irene', 'Lola', 'Pilar',
  'Nerea', 'Ane', 'Maite', 'Uxue', 'Iria', 'Uxía', 'Rut', 'Bia', 'Leda', 'Nuria', 'Aina', 'Júlia', 'Mireia',
  // Italian, French, Romanian
  'Gia', 'Lucia', 'Chiara', 'Nina', 'Zoé', 'Lou', 'Léa', 'Anaïs', 'Maëlle', 'Ioana', 'Oana', 'Ilinca',
  // English, Irish, Welsh, Scottish
  'Ada', 'Ivy', 'Maud', 'Ruth', 'Jane', 'Nell', 'Aoife', 'Niamh', 'Siân', 'Cerys', 'Isla', 'Ailsa',
  // German, Dutch, Nordic, Finnish, Icelandic
  'Greta', 'Ilse', 'Anke', 'Femke', 'Saar', 'Liv', 'Siri', 'Ebba', 'Tove', 'Freja', 'Aino', 'Aada', 'Sigrún',
  // Slavic, Baltic, Hungarian, Greek
  'Vera', 'Olga', 'Lada', 'Mila', 'Zora', 'Iva', 'Ewa', 'Daša', 'Rasa', 'Laima', 'Réka', 'Emese', 'Eleni', 'Zoi',
  // Turkish, Arabic, Persian, Hebrew, Armenian, Georgian
  'Elif', 'Ayla', 'Deniz', 'Nur', 'Layla', 'Hana', 'Dunia', 'Sara', 'Yara', 'Mina', 'Shirin', 'Noa', 'Tamar',
  'Talia', 'Ani', 'Nare', 'Nino', 'Eka',
  // African languages
  'Amara', 'Ayo', 'Nia', 'Zola', 'Ife', 'Ada', 'Asha', 'Imani', 'Zuri', 'Thandi', 'Lindiwe', 'Abeba', 'Makeda',
  // South and Southeast Asian
  'Asha', 'Diya', 'Isha', 'Mira', 'Tara', 'Uma', 'Riya', 'Anh', 'Linh', 'Mai', 'Lan', 'Dewi', 'Sari', 'Mali',
  // East Asian
  'Mei', 'Lin', 'Xiu', 'Yue', 'Hana', 'Yuki', 'Aiko', 'Rin', 'Emi', 'Ji-woo', 'Min', 'Seo', 'Nari',
  // Indigenous languages of the Americas, Pacific
  'Killa', 'Nayra', 'Yaku', 'Inti', 'Ayelén', 'Aiyana', 'Kaya', 'Itzel', 'Xóchitl', 'Nahima', 'Moana', 'Leilani', 'Mere',
];

const MALE = [
  // Spanish, Portuguese, Catalan, Basque, Galician
  'Leo', 'Hugo', 'Pau', 'Iker', 'Unai', 'Aitor', 'Íñigo', 'Mateo', 'Tomás', 'Bruno', 'Dario', 'Ciro', 'Joan',
  'Pol', 'Oriol', 'Xoán', 'Brais', 'Iago', 'Rui', 'João', 'Tiago', 'Nuno', 'Luca', 'Raúl', 'Íker', 'Blas',
  // Italian, French, Romanian
  'Enzo', 'Marco', 'Dino', 'Gino', 'Élie', 'Noé', 'Théo', 'Jules', 'Rémi', 'Loïc', 'Radu', 'Mihai', 'Ionel',
  // English, Irish, Welsh, Scottish
  'Tom', 'Ned', 'Sam', 'Jack', 'Finn', 'Cian', 'Oisín', 'Dáire', 'Rhys', 'Emrys', 'Ewan', 'Angus',
  // German, Dutch, Nordic, Finnish, Icelandic
  'Otto', 'Kurt', 'Jan', 'Joost', 'Bram', 'Sem', 'Nils', 'Leif', 'Odd', 'Arvid', 'Eino', 'Aarne', 'Ari', 'Björn',
  // Slavic, Baltic, Hungarian, Greek
  'Ivan', 'Igor', 'Oleg', 'Luka', 'Marek', 'Borys', 'Janis', 'Aras', 'Bence', 'Levente', 'Nikos', 'Stavros',
  // Turkish, Arabic, Persian, Hebrew, Armenian, Georgian
  'Emre', 'Can', 'Kaan', 'Omar', 'Ali', 'Sami', 'Karim', 'Nabil', 'Darius', 'Kian', 'Omer', 'Eitan', 'Aram',
  'Davit', 'Levan', 'Giorgi',
  // African languages
  'Kofi', 'Kwame', 'Ade', 'Obi', 'Tayo', 'Juma', 'Baraka', 'Sipho', 'Themba', 'Tafari', 'Yonas', 'Idris',
  // South and Southeast Asian
  'Ravi', 'Arun', 'Dev', 'Veer', 'Kiran', 'Anil', 'Minh', 'Bao', 'Duc', 'Budi', 'Arif', 'Somchai',
  // East Asian
  'Wei', 'Jun', 'Hao', 'Long', 'Kai', 'Ren', 'Sora', 'Taro', 'Ken', 'Min-jun', 'Joon', 'Hyun',
  // Indigenous languages of the Americas, Pacific
  'Amaru', 'Kusi', 'Tupac', 'Lautaro', 'Nahuel', 'Tahoma', 'Ahiga', 'Tlaloc', 'Cuauh', 'Maui', 'Keanu', 'Nikau', 'Tane',
];

const SURNAMES = [
  // Spanish, Portuguese, Catalan, Basque, Galician
  'Gil', 'Paz', 'Luna', 'Sol', 'Mora', 'Vega', 'Ruiz', 'Soto', 'Ríos', 'Cruz', 'León', 'Rey', 'Prado', 'Campos',
  'Ortiz', 'Nieto', 'Rojas', 'Silva', 'Costa', 'Rocha', 'Lopes', 'Serra', 'Puig', 'Roig', 'Font', 'Vidal',
  'Etxe', 'Aguirre', 'Ibarra', 'Zubiri', 'Arana', 'Otero', 'Castro', 'Novo', 'Lema', 'Quiroga',
  // Italian, French, Romanian
  'Rossi', 'Conti', 'Greco', 'Fiore', 'Bruni', 'Russo', 'Leroy', 'Moreau', 'Petit', 'Roux', 'Blanc', 'Faure',
  'Popa', 'Stan', 'Dinu', 'Lupu',
  // English, Irish, Welsh, Scottish
  'Hill', 'Wood', 'Moss', 'Lake', 'Stone', 'Fox', 'Reed', 'Hale', 'Kane', 'Quinn', 'Doyle', 'Byrne', 'Rees',
  'Lloyd', 'Evans', 'Ross', 'Grant', 'Fraser',
  // German, Dutch, Nordic, Finnish, Icelandic
  'Berg', 'Frei', 'Klein', 'Vogel', 'Wolf', 'Brandt', 'Visser', 'Smit', 'Bakker', 'Dahl', 'Lund', 'Holm',
  'Strand', 'Berglund', 'Lahti', 'Virta', 'Koski', 'Salo', 'Eyre',
  // Slavic, Baltic, Hungarian, Greek
  'Novak', 'Horvat', 'Kral', 'Petrov', 'Sokol', 'Orlov', 'Volkov', 'Kowal', 'Lis', 'Ozols', 'Kalnins', 'Kovács',
  'Szabó', 'Tóth', 'Papas', 'Kostas',
  // Turkish, Arabic, Persian, Hebrew, Armenian, Georgian
  'Kaya', 'Demir', 'Şahin', 'Yıldız', 'Aydın', 'Haddad', 'Nasser', 'Saleh', 'Mansour', 'Karimi', 'Tehrani',
  'Levi', 'Cohen', 'Mizrahi', 'Sarkis', 'Aram', 'Beridze', 'Kapanadze',
  // African languages
  'Okafor', 'Adeyemi', 'Mensah', 'Boateng', 'Diallo', 'Keita', 'Toure', 'Moyo', 'Dube', 'Ndlovu', 'Kamau',
  'Otieno', 'Tesfaye', 'Bekele',
  // South and Southeast Asian
  'Rao', 'Shah', 'Iyer', 'Das', 'Bose', 'Nair', 'Nguyen', 'Tran', 'Pham', 'Le', 'Santos', 'Reyes', 'Tan', 'Lim',
  // East Asian
  'Wang', 'Li', 'Zhang', 'Chen', 'Liu', 'Zhou', 'Sato', 'Ito', 'Mori', 'Ono', 'Abe', 'Kato', 'Kim', 'Park', 'Choi', 'Han',
  // Indigenous languages of the Americas, Pacific
  'Mamani', 'Quispe', 'Condori', 'Huanca', 'Coñuecar', 'Nahuelpan', 'Painemal', 'Tzul', 'Ahau', 'Kealoha', 'Ngata', 'Tui',
];

// Every list without repeats (a name can belong to two languages).
const uniq = (list) => [...new Set(list)];
export const NAMES = { female: uniq(FEMALE), male: uniq(MALE), surnames: uniq(SURNAMES) };

// mulberry32, seeded from the clock once: a stream nobody else reads.
let seed = (Date.now() ^ 0x5f3759df) >>> 0;
function rnd() {
  seed = (seed + 0x6d2b79f5) >>> 0;
  let x = seed;
  x = Math.imul(x ^ (x >>> 15), x | 1);
  x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
  return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
}
const pick = (list) => list[Math.floor(rnd() * list.length)];

// For tests: the same names every time.
export function seedNames(value) { seed = value >>> 0; }

// A given name for this sex; either list without one (SEX off).
export function givenName(sex) {
  if (sex === 'female') return pick(NAMES.female);
  if (sex === 'male') return pick(NAMES.male);
  return pick(rnd() < 0.5 ? NAMES.female : NAMES.male);
}

// Someone with no known parents (a founder): two surnames of her own.
// `first` is the one she passes on to her children.
export function founderName(sex) {
  const first = pick(NAMES.surnames);
  let second = pick(NAMES.surnames);
  if (second === first) second = pick(NAMES.surnames);
  return { given: givenName(sex), first, second };
}

// A newborn: her own given name, her father's first surname and her
// mother's first surname. A parent who is unknown leaves a surname of her own.
export function childName(sex, father, mother) {
  let given = givenName(sex);
  // Not the same name as a parent: the family would read it as the parent.
  for (let i = 0; i < 4 && (given === father?.given || given === mother?.given); i++) given = givenName(sex);
  return {
    given,
    first: father?.first ?? pick(NAMES.surnames),
    second: mother?.first ?? pick(NAMES.surnames),
  };
}

// 'Ana Rossi Kaya'. Without a name, '#id' (or '—').
export function fullName(fagi) {
  const n = fagi?.name;
  if (!n) return fagi?.id != null ? `#${fagi.id}` : '—';
  return [n.given, n.first, n.second].filter(Boolean).join(' ');
}

// Just the given name: where there is little room (labels over the map).
export function shortName(fagi) {
  const n = fagi?.name;
  if (!n) return fagi?.id != null ? String(fagi.id) : '';
  return n.given;
}
