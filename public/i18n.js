/* Rilo's two languages and its ideas: shared by the browser and the tests.
 *
 * STRINGS.en / STRINGS.es hold the same keys; a parameterised entry is a
 * function. Every piece of copy on the screen goes through t() in app.js, so
 * a screen is never half translated. IDEAS is the quick start's catalogue,
 * tagged by the age band most children reach it and by kind.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.RiloI18n = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var STRINGS = {};

  STRINGS.en = {
    appLanguage: 'App language',
    english: 'English',
    spanish: 'Español',

    // Welcome
    welcomeTitle1: 'Every little word,',
    welcomeTitle2: 'in every language.',
    welcomeSub: 'Tell us about your little one. You can change this anytime.',
    childName: 'Child’s name',
    namePlaceholder: 'e.g. Luna',
    birthMonth: 'Birth month',
    year: 'Year',
    languagesAtHome: 'Languages at home',
    otherLanguage: '+ Other',
    anotherLanguage: 'Another language',
    otherPlaceholder: 'e.g. Portuguese',
    add: 'Add',
    startWordList: 'Start the word list',
    startNameWordList: function (name) { return 'Start ' + name + '’s word list'; },
    nameRequired: 'Add your child’s name.',
    stepOf: function (n) { return 'Step ' + n + ' of 2'; },
    setupLangEn: 'English', setupLangEs: 'Spanish', setupLangAsl: 'ASL', setupLangFr: 'French',

    // Loading and errors
    loading: 'Loading',
    errorLoad: function (who) {
      return who ? 'Couldn’t load ' + who + '’s words.' : 'Couldn’t load the words.';
    },
    errorLoadBody: 'Nothing you saved is lost. Check your connection and try again.',
    retry: 'Retry',
    genericError: 'Something went wrong. Try again.',
    accountRequired: 'Make an account to keep entries.',

    // Quick start
    quickTitle: function (name) { return 'What does ' + name + ' already do?'; },
    quickBody: function (name) {
      return 'Tap everything ' + name + ' already says or signs. Rilo keeps them as already learned, with no date. ' +
        'Tap a pick’s stage to show how well ' + name + ' says it, like Emerging for “wa” for water.';
    },
    ideasFor: function (band, name) {
      var label = band === 12 ? 'about 12 months'
        : band === 18 ? 'about 18 months'
        : band === 24 ? 'about 24 months'
        : '3 years and up';
      return 'Ideas for ' + label + ', like ' + name + '.';
    },
    moreIdeas: 'More ideas',
    everyIdea: 'That’s every idea for now. Add anything else from Home.',
    done: 'Done',
    doneAdd: function (n) { return 'Done, add ' + n + (n === 1 ? ' entry' : ' entries'); },
    skip: 'Skip',
    stageFor: function (label, stage) { return 'Stage for ' + label + ': ' + stage; },
    addedCount: function (n) { return 'Added ' + n + (n === 1 ? ' entry' : ' entries'); },

    // Kinds and stages
    kindWord: 'Word', kindWords: 'Words', kindWordThe: 'The word', kindWordEg: 'e.g. ball',
    kindWordHow: function (name) { return 'How ' + name + ' says it'; },
    kindWordHint: 'e.g. “ba” for ball',
    kindSound: 'Sound', kindSounds: 'Sounds', kindSoundThe: 'The animal or thing', kindSoundEg: 'e.g. cow or car',
    kindSoundHow: function (name) { return 'The sound ' + name + ' makes'; },
    kindSoundHint: 'e.g. moo, vroom',
    kindSign: 'Sign', kindSigns: 'Signs', kindSignThe: 'What the sign means', kindSignEg: 'e.g. more',
    kindSignHow: function (name) { return 'How ' + name + ' signs it'; },
    kindSignHint: 'e.g. taps fingertips together',
    emerging: 'Emerging', emergingHint: 'Tried it once or twice',
    practicing: 'Practicing', practicingHint: 'Uses it with a nudge',
    mastered: 'Mastered', masteredHint: 'Says it on their own',

    // Dates and ages
    monthNames: ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'],
    today: 'Today',
    formatAge: function (months, name) {
      if (months < 0) return 'Before ' + name + '’s birthday';
      if (months === 0) return 'Under 1 month';
      var y = Math.floor(months / 12);
      var m = months % 12;
      var yPart = y === 1 ? '1 year' : y > 1 ? y + ' years' : '';
      var mPart = m === 1 ? '1 month' : m > 1 ? m + ' months' : '';
      if (!y) return mPart;
      if (!m) return yPart;
      return yPart + ' ' + mPart;
    },
    bornOn: function (month, year) { return 'born ' + month + ' ' + year; },
    born: function (month, year) { return 'Born ' + month + ' ' + year; },
    ageToday: function (age) { return age + ' today'; },
    and: '&',
    entryAria: function (kind, label, says, lang, stage, when) {
      return kind + ': ' + label + (says ? ', ' + says : '') + (lang ? ', ' + lang : '') +
        ', ' + stage + ', ' + when;
    },
    alreadyLearned: 'Already learned',

    // Navigation
    navLabel: 'Main navigation',
    navHome: 'Home', navLog: 'Log', navInsights: 'Insights',
    addEntryAria: 'Add a word, sound or sign',
    profileAria: function (name) { return name + '’s profile and settings'; },

    // Home
    wordsSoFar: function (name) { return name + '’s words so far'; },
    thisWeek: function (n) { return '+' + n + ' this week'; },
    across: function (langs) { return 'across ' + langs; },
    everyFirst: 'Every first counts',
    categories: 'Categories',
    recent: 'Recent',
    seeAll: 'See all',
    emptyHome: function (name) { return name + '’s word story starts here.'; },
    emptyHomeBody: 'Add the first word, sound or sign you have heard.',
    addAWord: 'Add a word',
    addAnEntry: 'Add an entry',

    // Log
    logTitle: function (name) { return name + '’s log'; },
    searchLabel: 'Search words, sounds, signs and notes',
    searchPlaceholder: 'Search words, signs, notes',
    filterLabel: 'Filter entries',
    filterAll: 'All',
    thisMonth: 'This month',
    noLanguage: 'No language',
    entryCount: function (n) { return n + (n === 1 ? ' entry' : ' entries'); },
    foundCount: function (n) { return n + ' found'; },
    emptyLog: 'No entries yet.',
    emptyLogBody: 'Every word, sound and sign you add shows up here, grouped by age.',
    noMatch: 'Nothing matches yet.',
    noMatchBody: 'Try another search or filter, or add something new.',
    stagingDemo: 'Staging demo',

    // Entry
    backToLog: 'Back to the log',
    goneTitle: 'This entry isn’t here any more.',
    goneBody: 'It may have been deleted.',
    edit: 'Edit',
    signsIt: function (name, how) { return name + ' signs it: ' + how; },
    saysHow: function (name, how) { return name + ' says <i>“' + how + '”</i>'; },
    noticedOn: function (date) { return 'Noticed ' + date; },
    firstNoticed: 'First noticed',
    mastery: 'Mastery',
    notes: 'Notes',
    source: 'Source',
    journeyTitle: function (name, kind) { return name + '’s journey with this ' + kind; },
    inOtherLanguages: 'In other languages',
    addAnotherLanguage: 'Add another language',
    deleteEntry: 'Delete entry',
    deleteLabel: function (label) { return 'Delete ' + label; },
    deleteTitle: function (label) { return 'Delete “' + label + '”?'; },
    deleteBody: function (name) {
      return 'This removes it from ' + name + '’s log and word count. Its notes and journey go too.';
    },
    deleteBodyOthers: ' The other languages stay.',
    keepIt: 'Keep it',
    delete: 'Delete',
    deleted: function (label) { return 'Deleted ' + label; },
    deleteFailed: 'Could not delete it. Try again.',

    // Insights
    insights: 'Insights',
    wordGrowth: 'Word growth',
    newThisWeek: 'new this week',
    newIn: function (month) { return 'new in ' + month; },
    total: function (n) { return 'Total ' + n; },
    showGrowthBy: 'Show growth by',
    week: 'Week',
    month: 'Month',
    chartWeek: function (items) { return 'Words, sounds and signs in total by week: ' + items; },
    chartMonth: function (items) { return 'Words, sounds and signs in total by month: ' + items; },
    weekOf: function (day, month) { return 'week of ' + day + ' ' + month; },
    startedWith: function (n, month) { return 'Started with ' + n + ' already learned in ' + month + '.'; },
    weekByWeek: 'Week by week',
    monthByMonth: 'Month by month',
    fullHistory: ' · full history',
    weekOfHead: 'Week of',
    monthHead: 'Month',
    newHead: 'New',
    totalHead: 'Total',
    byLanguage: 'By language',
    byLanguageEmpty: 'Languages show here once entries have one.',
    byLanguageNote: function (name) {
      return 'A word that ' + name + ' says in two languages counts once in each, like <b>water</b> and <b>agua</b>.';
    },
    acrossLanguages: 'Across languages',
    acrossNote: function (name) {
      return 'Each of these counts once in ' + name + '’s total. Mastery counts each language on its own.';
    },
    acrossEmpty: function (name) {
      return 'When ' + name + ' has a word in more than one language, link them on one entry and it shows here.';
    },
    playIdeas: 'Play ideas for this week',
    playPace: 'Every child finds words at their own pace. These are ideas, not targets.',
    playIdea: 'Play idea',
    playTag1: 'Words · bath time', playTitle1: 'Name what floats',
    playBody1: function (n) { return 'Name each toy as it bobs up, in every language you speak at home. Pause and let ' + n + ' try first.'; },
    playDetail1: 'Hold up one toy at a time and name it slowly, then wait. Repeat whatever comes back as if it was perfect, then say the whole word once more. Try the same toy in each of your languages on different days.',
    playTag2: 'Signs · snack time', playTitle2: 'Sign and say together',
    playBody2: function () { return 'Pair “more” and “all done” with the spoken words so both stick.'; },
    playDetail2: 'Make the sign and say the word at the same moment, every time the moment comes up. There is no need to ask for the sign back. Respond warmly to any way your child lets you know.',
    playTag3: 'Sounds · anytime', playTitle3: 'Leave a gap in the song',
    playBody3: function (n) { return 'Sing a favorite and stop before the last word or animal sound. Wait, ' + n + ' may fill it in.'; },
    playDetail3: 'Pick a song with animals or a repeating line. After a few rounds, pause before the last sound and look expectant. A moo, a clap or a giggle all count as taking a turn.',
    logA: function (kind) { return 'Log a ' + kind; },

    // Profile
    profile: 'Profile',
    aboutName: function (name) { return 'A little about ' + name; },
    editChildProfile: 'Edit child profile',
    languageStory: function (name) { return name + '’s language story'; },
    storyCount: function (entries, langs) {
      return entries + (entries === 1 ? ' entry' : ' entries') + ' · ' +
        langs + (langs === 1 ? ' language' : ' languages');
    },
    storyBody: 'Words, sounds and signs are tracked side by side. Mastery is yours to set: emerging, practicing or mastered.',
    seeInsights: 'See insights',

    // Child sheet
    cancel: 'Cancel',
    editDetails: 'Edit details',
    name: 'Name',
    agesFromMonth: 'Ages count from the birth month.',
    saveChanges: 'Save changes',
    detailsSaved: 'Details saved',

    // Entry sheet
    editEntry: 'Edit entry',
    newFor: function (name) { return 'New for ' + name; },
    entryType: 'Entry type',
    language: 'Language',
    optional: 'optional',
    notesPlaceholder: 'Where were you? What prompted it?',
    howWell: function (name) { return 'How well does ' + name + ' use it?'; },
    saveTo: function (name) { return 'Save to ' + name + '’s words'; },
    pickDate: 'Pick a date.',
    nameTheThing: 'Name the animal or thing.',
    writeSign: 'Write what the sign means.',
    writeWord: 'Write the word.',
    saved: 'Saved',
    added: function (label) { return 'Added ' + label; },
    sameInAnother: function (kind) { return 'Same ' + kind + ' in another language'; },
    linkedWith: 'Linked with',
    unlink: 'Unlink',
    youAlreadyHave: 'You already have',
    link: 'Link',
    searchEntries: function (name, plural) { return 'Search ' + name + '’s ' + plural; },
    searchEntriesAria: 'Search entries to link',
    noMatching: function (plural) { return 'No matching ' + plural + ' yet.'; },
    newLanguage: 'New language',
    newLanguagePlaceholder: 'e.g. Portuguese',
    couldNotAddLanguage: 'Could not add the language.',
    linkToEntry: '+ Link to an entry',
    keepLearnedNote: 'Already learned. Change the date only if you remember when.',
    wasAge: function (name, age) { return name + ' was ' + age; },
    plusNewLanguage: '+ New language',
    wordsPlural: 'words', soundsPlural: 'sounds', signsPlural: 'signs',
    minimize: 'Minimize',
  };

  STRINGS.es = {
    appLanguage: 'Idioma de la app',
    english: 'English',
    spanish: 'Español',

    welcomeTitle1: 'Cada palabra,',
    welcomeTitle2: 'en cada idioma.',
    welcomeSub: 'Cuéntanos sobre tu peque. Puedes cambiarlo cuando quieras.',
    childName: 'Nombre del niño',
    namePlaceholder: 'p. ej. Luna',
    birthMonth: 'Mes de nacimiento',
    year: 'Año',
    languagesAtHome: 'Idiomas en casa',
    otherLanguage: '+ Otro',
    anotherLanguage: 'Otro idioma',
    otherPlaceholder: 'p. ej. Portugués',
    add: 'Añadir',
    startWordList: 'Empezar la lista',
    startNameWordList: function (name) { return 'Empezar la lista de ' + name; },
    nameRequired: 'Escribe el nombre de tu niño.',
    stepOf: function (n) { return 'Paso ' + n + ' de 2'; },
    setupLangEn: 'Inglés', setupLangEs: 'Español', setupLangAsl: 'ASL', setupLangFr: 'Francés',

    loading: 'Cargando',
    errorLoad: function (who) {
      return 'No se pudieron cargar las palabras de ' + (who || 'tu peque') + '.';
    },
    errorLoadBody: 'No se perdió nada de lo que guardaste. Revisa tu conexión e inténtalo de nuevo.',
    retry: 'Reintentar',
    genericError: 'Algo salió mal. Inténtalo de nuevo.',
    accountRequired: 'Crea una cuenta para guardar las entradas.',

    quickTitle: function (name) { return '¿Qué hace ya ' + name + '?'; },
    quickBody: function (name) {
      return 'Toca todo lo que ' + name + ' ya dice o señala. Rilo lo guarda como ya aprendido, sin fecha. ' +
        'Toca la etapa de una elección para mostrar qué tan bien lo dice ' + name + ', como Empezando para “wa” en lugar de agua.';
    },
    ideasFor: function (band, name) {
      var label = band === 12 ? 'unos 12 meses'
        : band === 18 ? 'unos 18 meses'
        : band === 24 ? 'unos 24 meses'
        : '3 años o más';
      return 'Ideas para ' + label + ', como ' + name + '.';
    },
    moreIdeas: 'Más ideas',
    everyIdea: 'Esas son todas las ideas por ahora. Añade lo demás desde Inicio.',
    done: 'Listo',
    doneAdd: function (n) { return 'Listo, añadir ' + n; },
    skip: 'Omitir',
    stageFor: function (label, stage) { return 'Etapa para ' + label + ': ' + stage; },
    addedCount: function (n) { return 'Añadidas ' + n + (n === 1 ? ' entrada' : ' entradas'); },

    kindWord: 'Palabra', kindWords: 'Palabras', kindWordThe: 'La palabra', kindWordEg: 'p. ej. pelota',
    kindWordHow: function (name) { return 'Cómo lo dice ' + name; },
    kindWordHint: 'p. ej. “ba” en lugar de pelota',
    kindSound: 'Sonido', kindSounds: 'Sonidos', kindSoundThe: 'El animal o la cosa', kindSoundEg: 'p. ej. vaca o coche',
    kindSoundHow: function (name) { return 'El sonido que hace ' + name; },
    kindSoundHint: 'p. ej. mu, brum',
    kindSign: 'Seña', kindSigns: 'Señas', kindSignThe: 'Qué significa la seña', kindSignEg: 'p. ej. más',
    kindSignHow: function (name) { return 'Cómo lo señala ' + name; },
    kindSignHint: 'p. ej. junta las puntas de los dedos',
    emerging: 'Empezando', emergingHint: 'Lo intentó una o dos veces',
    practicing: 'Practicando', practicingHint: 'Lo usa con ayuda',
    mastered: 'Lo domina', masteredHint: 'Lo dice solo',

    monthNames: ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
      'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'],
    today: 'Hoy',
    formatAge: function (months, name) {
      if (months < 0) return 'Antes del cumpleaños de ' + name;
      if (months === 0) return 'Menos de 1 mes';
      var y = Math.floor(months / 12);
      var m = months % 12;
      var yPart = y === 1 ? '1 año' : y > 1 ? y + ' años' : '';
      var mPart = m === 1 ? '1 mes' : m > 1 ? m + ' meses' : '';
      if (!y) return mPart;
      if (!m) return yPart;
      return yPart + ' y ' + mPart;
    },
    bornOn: function (month, year) { return 'nació en ' + month + ' de ' + year; },
    born: function (month, year) { return 'Nació en ' + month + ' de ' + year; },
    ageToday: function (age) { return age + ' hoy'; },
    and: 'y',
    entryAria: function (kind, label, says, lang, stage, when) {
      return kind + ': ' + label + (says ? ', ' + says : '') + (lang ? ', ' + lang : '') +
        ', ' + stage + ', ' + when;
    },
    alreadyLearned: 'Ya aprendido',

    navLabel: 'Navegación principal',
    navHome: 'Inicio', navLog: 'Registro', navInsights: 'Avances',
    addEntryAria: 'Añadir una palabra, un sonido o una seña',
    profileAria: function (name) { return 'Perfil y ajustes de ' + name; },

    wordsSoFar: function (name) { return 'Las palabras de ' + name + ' hasta ahora'; },
    thisWeek: function (n) { return '+' + n + ' esta semana'; },
    across: function (langs) { return 'en ' + langs; },
    everyFirst: 'Cada primera vez cuenta',
    categories: 'Categorías',
    recent: 'Recientes',
    seeAll: 'Ver todo',
    emptyHome: function (name) { return 'La historia de palabras de ' + name + ' empieza aquí.'; },
    emptyHomeBody: 'Añade la primera palabra, sonido o seña que hayas escuchado.',
    addAWord: 'Añadir una palabra',
    addAnEntry: 'Añadir una entrada',

    logTitle: function (name) { return 'Registro de ' + name; },
    searchLabel: 'Buscar palabras, sonidos, señas y notas',
    searchPlaceholder: 'Buscar palabras, señas, notas',
    filterLabel: 'Filtrar entradas',
    filterAll: 'Todo',
    thisMonth: 'Este mes',
    noLanguage: 'Sin idioma',
    entryCount: function (n) { return n + (n === 1 ? ' entrada' : ' entradas'); },
    foundCount: function (n) { return n + ' encontradas'; },
    emptyLog: 'Todavía no hay entradas.',
    emptyLogBody: 'Cada palabra, sonido o seña que añadas aparece aquí, agrupada por edad.',
    noMatch: 'Nada coincide todavía.',
    noMatchBody: 'Prueba otra búsqueda o filtro, o añade algo nuevo.',
    stagingDemo: 'Demo de staging',

    backToLog: 'Volver al registro',
    goneTitle: 'Esta entrada ya no está aquí.',
    goneBody: 'Puede que se haya borrado.',
    edit: 'Editar',
    signsIt: function (name, how) { return name + ' lo señala: ' + how; },
    saysHow: function (name, how) { return name + ' dice <i>“' + how + '”</i>'; },
    noticedOn: function (date) { return 'Notado el ' + date; },
    firstNoticed: 'Primera vez',
    mastery: 'Progreso',
    notes: 'Notas',
    source: 'Origen',
    journeyTitle: function (name, kind) {
      var k = kind === 'sign' ? 'seña' : kind === 'sound' ? 'sonido' : 'palabra';
      return 'El camino de ' + name + ' con esta ' + k;
    },
    inOtherLanguages: 'En otros idiomas',
    addAnotherLanguage: 'Añadir otro idioma',
    deleteEntry: 'Borrar entrada',
    deleteLabel: function (label) { return 'Borrar ' + label; },
    deleteTitle: function (label) { return '¿Borrar “' + label + '”?'; },
    deleteBody: function (name) {
      return 'Esto lo quita del registro y del total de ' + name + '. Sus notas y su camino también se van.';
    },
    deleteBodyOthers: ' Los otros idiomas se quedan.',
    keepIt: 'Conservarla',
    delete: 'Borrar',
    deleted: function (label) { return 'Se borró ' + label; },
    deleteFailed: 'No se pudo borrar. Inténtalo de nuevo.',

    insights: 'Avances',
    wordGrowth: 'Crecimiento de palabras',
    newThisWeek: 'nuevas esta semana',
    newIn: function (month) { return 'nuevas en ' + month; },
    total: function (n) { return 'Total ' + n; },
    showGrowthBy: 'Ver el crecimiento por',
    week: 'Semana',
    month: 'Mes',
    chartWeek: function (items) { return 'Palabras, sonidos y señas en total por semana: ' + items; },
    chartMonth: function (items) { return 'Palabras, sonidos y señas en total por mes: ' + items; },
    weekOf: function (day, month) { return 'semana del ' + day + ' de ' + month; },
    startedWith: function (n, month) { return 'Empezó con ' + n + ' ya aprendidas en ' + month + '.'; },
    weekByWeek: 'Semana a semana',
    monthByMonth: 'Mes a mes',
    fullHistory: ' · historial completo',
    weekOfHead: 'Semana del',
    monthHead: 'Mes',
    newHead: 'Nuevas',
    totalHead: 'Total',
    byLanguage: 'Por idioma',
    byLanguageEmpty: 'Los idiomas aparecen aquí cuando las entradas tienen uno.',
    byLanguageNote: function (name) {
      return 'Una palabra que ' + name + ' dice en dos idiomas cuenta una vez en cada uno, como <b>water</b> y <b>agua</b>.';
    },
    acrossLanguages: 'Entre idiomas',
    acrossNote: function (name) {
      return 'Cada una cuenta una vez en el total de ' + name + '. El progreso cuenta cada idioma por separado.';
    },
    acrossEmpty: function (name) {
      return 'Cuando ' + name + ' tenga una palabra en más de un idioma, enlázalas en una entrada y aparecerán aquí.';
    },
    playIdeas: 'Ideas de juego para esta semana',
    playPace: 'Cada niño encuentra sus palabras a su ritmo. Son ideas, no metas.',
    playIdea: 'Idea de juego',
    playTag1: 'Palabras · la hora del baño', playTitle1: 'Nombra lo que flota',
    playBody1: function (n) { return 'Nombra cada juguete al salir a flote, en cada idioma que hablen en casa. Haz una pausa y deja que ' + n + ' lo intente primero.'; },
    playDetail1: 'Levanta un juguete a la vez y nómbralo despacio, luego espera. Repite lo que salga como si fuera perfecto y di la palabra completa una vez más. Prueba el mismo juguete en cada idioma en días distintos.',
    playTag2: 'Señas · la hora de la merienda', playTitle2: 'Señala y di a la vez',
    playBody2: function () { return 'Junta “más” y “se acabó” con las palabras habladas para que se queden las dos.'; },
    playDetail2: 'Haz la seña y di la palabra en el mismo momento, cada vez que surja. No hace falta pedir la seña de vuelta. Responde con cariño a cualquier forma en que tu niño te lo diga.',
    playTag3: 'Sonidos · cualquier momento', playTitle3: 'Deja un hueco en la canción',
    playBody3: function (n) { return 'Canta una favorita y para antes de la última palabra o sonido de animal. Espera, ' + n + ' puede completarlo.'; },
    playDetail3: 'Elige una canción con animales o una frase que se repita. Después de unas rondas, haz una pausa antes del último sonido y mira con expectativa. Un mu, un aplauso o una risa cuentan como turno.',
    logA: function (kind) {
      var k = kind === 'sign' ? 'una seña' : kind === 'sound' ? 'un sonido' : 'una palabra';
      return 'Registrar ' + k;
    },

    profile: 'Perfil',
    aboutName: function (name) { return 'Un poco sobre ' + name; },
    editChildProfile: 'Editar el perfil',
    languageStory: function (name) { return 'La historia de idiomas de ' + name; },
    storyCount: function (entries, langs) {
      return entries + (entries === 1 ? ' entrada' : ' entradas') + ' · ' +
        langs + (langs === 1 ? ' idioma' : ' idiomas');
    },
    storyBody: 'Las palabras, los sonidos y las señas se siguen uno al lado del otro. El progreso lo pones tú: empezando, practicando o lo domina.',
    seeInsights: 'Ver avances',

    cancel: 'Cancelar',
    editDetails: 'Editar datos',
    name: 'Nombre',
    agesFromMonth: 'Las edades cuentan desde el mes de nacimiento.',
    saveChanges: 'Guardar cambios',
    detailsSaved: 'Datos guardados',

    editEntry: 'Editar entrada',
    newFor: function (name) { return 'Nuevo para ' + name; },
    entryType: 'Tipo de entrada',
    language: 'Idioma',
    optional: 'opcional',
    notesPlaceholder: '¿Dónde estaban? ¿Qué lo provocó?',
    howWell: function (name) { return '¿Qué tan bien lo usa ' + name + '?'; },
    saveTo: function (name) { return 'Guardar en las palabras de ' + name; },
    pickDate: 'Elige una fecha.',
    nameTheThing: 'Nombra el animal o la cosa.',
    writeSign: 'Escribe qué significa la seña.',
    writeWord: 'Escribe la palabra.',
    saved: 'Guardado',
    added: function (label) { return 'Se añadió ' + label; },
    sameInAnother: function (kind) { return 'La misma ' + kind + ' en otro idioma'; },
    linkedWith: 'Enlazada con',
    unlink: 'Desenlazar',
    youAlreadyHave: 'Ya tienes',
    link: 'Enlazar',
    searchEntries: function (name, plural) { return 'Buscar ' + plural + ' de ' + name; },
    searchEntriesAria: 'Buscar entradas para enlazar',
    noMatching: function (plural) { return 'Todavía no hay ' + plural + ' que coincidan.'; },
    newLanguage: 'Nuevo idioma',
    newLanguagePlaceholder: 'p. ej. Portugués',
    couldNotAddLanguage: 'No se pudo añadir el idioma.',
    linkToEntry: '+ Enlazar a una entrada',
    keepLearnedNote: 'Ya aprendido. Cambia la fecha solo si recuerdas cuándo fue.',
    wasAge: function (name, age) { return name + ' tenía ' + age; },
    plusNewLanguage: '+ Nuevo idioma',
    wordsPlural: 'palabras', soundsPlural: 'sonidos', signsPlural: 'señas',
    minimize: 'Minimizar',
  };

  // The server answers in English; this shows the same message in Spanish.
  var SERVER_ERRORS_ES = {
    'Add a name between 1 and 40 characters.': 'Añade un nombre de 1 a 40 caracteres.',
    'Pick a birth month and year.': 'Elige un mes y un año de nacimiento.',
    'Pick a month between January 1990 and this one.': 'Elige un mes entre enero de 1990 y este.',
    'Pick English or Spanish.': 'Elige English o Español.',
    'Type a language name between 1 and 30 characters.': 'Escribe un idioma de 1 a 30 caracteres.',
    'Choose Word, Sound or Sign.': 'Elige Palabra, Sonido o Seña.',
    'Name the animal or thing.': 'Nombra el animal o la cosa.',
    'Write what the sign means.': 'Escribe qué significa la seña.',
    'Write the word.': 'Escribe la palabra.',
    'Keep how it sounds under 80 characters.': 'Mantén el sonido en menos de 80 caracteres.',
    'Keep the note under 280 characters.': 'Mantén la nota en menos de 280 caracteres.',
    'Pick a date.': 'Elige una fecha.',
    "Add your child's name and birthday first.": 'Añade primero el nombre y la fecha de nacimiento.',
    'Pick a date on or after the birthday.': 'Elige una fecha en o después del nacimiento.',
    'Pick a date no later than today.': 'Elige una fecha no posterior a hoy.',
    'Choose one of your languages.': 'Elige uno de tus idiomas.',
    'Choose one of your entries to link to.': 'Elige una de tus entradas para enlazar.',
    'Link it to an entry of the same type.': 'Enlázala a una entrada del mismo tipo.',
    'Choose at least one first to add.': 'Elige al menos una entrada.',
    'Add up to 200 at a time.': 'Añade hasta 200 a la vez.',
    'One of the picks is missing its word, animal or sign.': 'A una elección le falta la palabra, el animal o la seña.',
    'First not found.': 'No se encontró la entrada.',
    'Something went wrong. Try again.': 'Algo salió mal. Inténtalo de nuevo.',
    'Not authenticated': 'No has iniciado sesión.',
  };

  // ── The ideas catalogue ───────────────────────────────────────────────
  // Each band is authored most common first: words, then sounds, then signs.
  // A batch is 8 words, 3 sounds and 1 sign. `cat` is the server's category.
  function w(band, n, en, es, cat) {
    return { id: band + '-w-' + n, band: band, kind: 'word', category: cat, en: { label: en }, es: { label: es } };
  }
  function s(band, n, en, es, enSays, esSays, cat) {
    return { id: band + '-s-' + n, band: band, kind: 'sound', category: cat, en: { label: en, sounds_like: enSays }, es: { label: es, sounds_like: esSays } };
  }
  function g(band, n, en, es, enSays, esSays, cat) {
    return { id: band + '-g-' + n, band: band, kind: 'sign', category: cat, en: { label: en, sounds_like: enSays }, es: { label: es, sounds_like: esSays } };
  }

  var IDEAS = [
    // About 12 months
    w(12, 1, 'mama', 'mamá', 'people'), w(12, 2, 'dada', 'papá', 'people'),
    w(12, 3, 'ball', 'pelota', 'play'), w(12, 4, 'milk', 'leche', 'food'),
    w(12, 5, 'bye', 'adiós', 'actions'), w(12, 6, 'no', 'no', 'actions'),
    w(12, 7, 'uh-oh', 'ay', 'actions'), w(12, 8, 'kitty', 'michi', 'animals'),
    w(12, 9, 'dog', 'perro', 'animals'), w(12, 10, 'book', 'libro', 'play'),
    w(12, 11, 'more', 'más', 'actions'), w(12, 12, 'water', 'agua', 'food'),
    w(12, 13, 'hi', 'hola', 'actions'), w(12, 14, 'up', 'arriba', 'actions'),
    w(12, 15, 'banana', 'plátano', 'food'), w(12, 16, 'apple', 'manzana', 'food'),
    w(12, 17, 'bubbles', 'burbujas', 'play'), w(12, 18, 'shoe', 'zapato', 'body'),
    w(12, 19, 'hat', 'gorro', 'body'), w(12, 20, 'bath', 'baño', 'home'),
    w(12, 21, 'bird', 'pájaro', 'animals'), w(12, 22, 'cookie', 'galleta', 'food'),
    w(12, 23, 'nose', 'nariz', 'body'), w(12, 24, 'night-night', 'a dormir', 'home'),
    s(12, 1, 'cow', 'vaca', 'moo', 'mu', 'animals'),
    s(12, 2, 'dog', 'perro', 'woof woof', 'guau guau', 'animals'),
    s(12, 3, 'cat', 'gato', 'meow', 'miau', 'animals'),
    s(12, 4, 'sheep', 'oveja', 'baa', 'beee', 'animals'),
    s(12, 5, 'duck', 'pato', 'quack', 'cuac', 'animals'),
    s(12, 6, 'car', 'coche', 'vroom', 'brum', 'transport'),
    s(12, 7, 'ambulance', 'ambulancia', 'wee-o wee-o', 'nino nino', 'transport'),
    s(12, 8, 'horn', 'claxon', 'beep beep', 'pip pip', 'transport'),
    s(12, 9, 'bird', 'pájaro', 'tweet', 'pío', 'animals'),
    g(12, 1, 'more', 'más', 'Taps fingertips together', 'Junta las puntas de los dedos', 'actions'),
    g(12, 2, 'milk', 'leche', 'Squeezes a fist', 'Aprieta el puño', 'food'),
    g(12, 3, 'all done', 'se acabó', 'Twists both hands', 'Gira las dos manos', 'actions'),

    // About 18 months
    w(18, 1, 'shoes', 'zapatos', 'body'), w(18, 2, 'socks', 'calcetines', 'body'),
    w(18, 3, 'juice', 'jugo', 'food'), w(18, 4, 'cheese', 'queso', 'food'),
    w(18, 5, 'spoon', 'cuchara', 'food'), w(18, 6, 'cup', 'vaso', 'food'),
    w(18, 7, 'baby', 'bebé', 'people'), w(18, 8, 'grandma', 'abuela', 'people'),
    w(18, 9, 'grandpa', 'abuelo', 'people'), w(18, 10, 'eat', 'comer', 'food'),
    w(18, 11, 'please', 'por favor', 'actions'), w(18, 12, 'down', 'abajo', 'actions'),
    w(18, 13, 'open', 'abre', 'actions'), w(18, 14, 'duck', 'pato', 'animals'),
    w(18, 15, 'pig', 'cerdo', 'animals'), w(18, 16, 'cow', 'vaca', 'animals'),
    w(18, 17, 'fish', 'pez', 'animals'), w(18, 18, 'truck', 'camión', 'transport'),
    w(18, 19, 'keys', 'llaves', 'home'), w(18, 20, 'light', 'luz', 'home'),
    w(18, 21, 'door', 'puerta', 'home'), w(18, 22, 'blanket', 'cobija', 'home'),
    w(18, 23, 'mine', 'mío', 'actions'), w(18, 24, 'sit', 'siéntate', 'actions'),
    s(18, 1, 'pig', 'cerdo', 'oink', 'oink', 'animals'),
    s(18, 2, 'train', 'tren', 'choo choo', 'chu chu', 'transport'),
    s(18, 3, 'rooster', 'gallo', 'cock-a-doodle-doo', 'quiquiriquí', 'animals'),
    s(18, 4, 'motorcycle', 'moto', 'vroom vroom', 'brum brum', 'transport'),
    s(18, 5, 'bus', 'autobús', 'honk honk', 'pip pip', 'transport'),
    s(18, 6, 'rain', 'lluvia', 'pitter patter', 'plic plic', 'outside'),
    s(18, 7, 'doorbell', 'timbre', 'ding dong', 'tin tin', 'home'),
    s(18, 8, 'monkey', 'mono', 'ooh ooh ah ah', 'u u a a', 'animals'),
    s(18, 9, 'tiger', 'tigre', 'roar', 'grrr', 'animals'),
    g(18, 1, 'please', 'por favor', 'Taps a flat hand on the chest', 'Se da golpecitos en el pecho', 'actions'),
    g(18, 2, 'eat', 'comer', 'Taps fingers to mouth', 'Junta los dedos y los lleva a la boca', 'food'),
    g(18, 3, 'bye', 'adiós', 'Opens and closes a hand', 'Abre y cierra la mano', 'actions'),

    // About 24 months
    w(24, 1, 'thank you', 'gracias', 'actions'), w(24, 2, 'outside', 'afuera', 'outside'),
    w(24, 3, 'moon', 'luna', 'outside'), w(24, 4, 'star', 'estrella', 'outside'),
    w(24, 5, 'flower', 'flor', 'outside'), w(24, 6, 'tree', 'árbol', 'outside'),
    w(24, 7, 'sun', 'sol', 'outside'), w(24, 8, 'rain', 'lluvia', 'outside'),
    w(24, 9, 'cloud', 'nube', 'outside'), w(24, 10, 'teddy', 'osito', 'play'),
    w(24, 11, 'blocks', 'bloques', 'play'), w(24, 12, 'puzzle', 'rompecabezas', 'play'),
    w(24, 13, 'car', 'coche', 'transport'), w(24, 14, 'plane', 'avión', 'transport'),
    w(24, 15, 'boat', 'barco', 'transport'), w(24, 16, 'home', 'casa', 'home'),
    w(24, 17, 'bed', 'cama', 'home'), w(24, 18, 'sleep', 'dormir', 'home'),
    w(24, 19, 'hand', 'mano', 'body'), w(24, 20, 'feet', 'pies', 'body'),
    w(24, 21, 'eyes', 'ojos', 'body'), w(24, 22, 'ears', 'orejas', 'body'),
    w(24, 23, 'hair', 'pelo', 'body'), w(24, 24, 'tired', 'cansado', 'actions'),
    s(24, 1, 'bee', 'abeja', 'buzz', 'bzz', 'animals'),
    s(24, 2, 'frog', 'rana', 'ribbit', 'croac', 'animals'),
    s(24, 3, 'plane', 'avión', 'nnnn', 'nnnn', 'transport'),
    s(24, 4, 'clock', 'reloj', 'tick tock', 'tic tac', 'home'),
    s(24, 5, 'owl', 'búho', 'hoo hoo', 'uu uu', 'animals'),
    s(24, 6, 'horse', 'caballo', 'neigh', 'iiiii', 'animals'),
    s(24, 7, 'lion', 'león', 'roar', 'grrr', 'animals'),
    s(24, 8, 'thunder', 'trueno', 'boom', 'bum', 'outside'),
    s(24, 9, 'drum', 'tambor', 'boom boom', 'pom pom', 'play'),
    g(24, 1, 'thank you', 'gracias', 'Flat hand from the chin forward', 'Mano plana desde la barbilla hacia adelante', 'actions'),
    g(24, 2, 'help', 'ayuda', 'A fist on a flat palm, both up', 'Un puño sobre una palma abierta, ambos arriba', 'actions'),
    g(24, 3, 'play', 'jugar', 'Thumbs and pinkies out, shake', 'Pulgares y meñiques fuera, sacude', 'play'),

    // 3 years and up
    w(36, 1, 'I love you', 'te quiero', 'actions'), w(36, 2, 'what’s that?', '¿qué es eso?', 'actions'),
    w(36, 3, 'red', 'rojo', 'words'), w(36, 4, 'blue', 'azul', 'words'),
    w(36, 5, 'yellow', 'amarillo', 'words'), w(36, 6, 'green', 'verde', 'words'),
    w(36, 7, 'one', 'uno', 'words'), w(36, 8, 'two', 'dos', 'words'),
    w(36, 9, 'three', 'tres', 'words'), w(36, 10, 'friend', 'amigo', 'people'),
    w(36, 11, 'drink', 'tomar', 'food'), w(36, 12, 'bread', 'pan', 'food'),
    w(36, 13, 'egg', 'huevo', 'food'), w(36, 14, 'rice', 'arroz', 'food'),
    w(36, 15, 'ice cream', 'helado', 'food'), w(36, 16, 'movie', 'película', 'play'),
    w(36, 17, 'park', 'parque', 'outside'), w(36, 18, 'school', 'escuela', 'outside'),
    w(36, 19, 'doctor', 'doctor', 'people'), w(36, 20, 'big', 'grande', 'words'),
    w(36, 21, 'small', 'pequeño', 'words'), w(36, 22, 'hot', 'caliente', 'words'),
    w(36, 23, 'cold', 'frío', 'words'), w(36, 24, 'happy', 'feliz', 'actions'),
    s(36, 1, 'snake', 'serpiente', 'hiss', 'sss', 'animals'),
    s(36, 2, 'phone', 'teléfono', 'ring ring', 'rin rin', 'home'),
    s(36, 3, 'whistle', 'silbato', 'too too', 'fiu fiu', 'play'),
    s(36, 4, 'wind', 'viento', 'whoosh', 'fuuu', 'outside'),
    s(36, 5, 'helicopter', 'helicóptero', 'chop chop', 'taca taca', 'transport'),
    s(36, 6, 'elephant', 'elefante', 'trumpet', 'prrr', 'animals'),
    s(36, 7, 'wolf', 'lobo', 'awoo', 'auuu', 'animals'),
    s(36, 8, 'hammer', 'martillo', 'bang bang', 'pam pam', 'home'),
    s(36, 9, 'water', 'agua', 'glug glug', 'glu glu', 'outside'),
    g(36, 1, 'friend', 'amigo', 'Hooks index fingers together', 'Engancha los dedos índices', 'people'),
    g(36, 2, 'love', 'te quiero', 'Crosses arms over the chest', 'Cruza los brazos sobre el pecho', 'actions'),
    g(36, 3, 'book', 'libro', 'Opens both hands like a book', 'Abre las dos manos como un libro', 'play'),
  ];

  var BATCH = 12;

  // The band a child of this many whole months is offered first.
  function bandFor(months) {
    if (months < 15) return 12;
    if (months < 21) return 18;
    if (months < 30) return 24;
    return 36;
  }
  // The child's own band, then younger bands nearest first, then older ones.
  var ORDERS = {
    12: [12, 18, 24, 36],
    18: [18, 12, 24, 36],
    24: [24, 18, 12, 36],
    36: [36, 24, 18, 12],
  };
  function bandOrder(band) { return ORDERS[band] || ORDERS[12]; }

  function bandLists(band) {
    var of = IDEAS.filter(function (idea) { return idea.band === band; });
    return {
      words: of.filter(function (i) { return i.kind === 'word'; }),
      sounds: of.filter(function (i) { return i.kind === 'sound'; }),
      signs: of.filter(function (i) { return i.kind === 'sign'; }),
    };
  }
  // Every idea in the order the quick start reveals them, a dozen at a time:
  // eight words, three sounds and one sign in each batch.
  function ideasFor(months) {
    var out = [];
    bandOrder(bandFor(months)).forEach(function (band) {
      var lists = bandLists(band);
      for (var i = 0; i < 3; i++) {
        out = out.concat(lists.words.slice(i * 8, i * 8 + 8));
        out = out.concat(lists.sounds.slice(i * 3, i * 3 + 3));
        out = out.concat(lists.signs.slice(i, i + 1));
      }
    });
    return out;
  }

  return {
    STRINGS: STRINGS,
    SERVER_ERRORS_ES: SERVER_ERRORS_ES,
    IDEAS: IDEAS,
    BATCH: BATCH,
    bandFor: bandFor,
    bandOrder: bandOrder,
    ideasFor: ideasFor,
  };
});
