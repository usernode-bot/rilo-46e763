/* Rilo's words, in English and Spanish, and the ideas offered on the quick
 * start. Kept out of app.js so the tests can load it directly, the same way
 * insights.js is shared.
 *
 * Every user-facing string lives in STRINGS.en and STRINGS.es with the same
 * keys. A parameterised entry is a function so each language builds its own
 * sentence. New copy goes in both languages. */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.RiloI18n = api;
})(typeof window !== 'undefined' ? window : null, function () {
  'use strict';

  var MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  var MONTHS_ES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

  function ageEn(months, name) {
    if (months < 0) return 'Before ' + name + "'s birthday";
    if (months === 0) return 'Under 1 month';
    var y = Math.floor(months / 12);
    var m = months % 12;
    var yPart = y === 1 ? '1 year' : y > 1 ? y + ' years' : '';
    var mPart = m === 1 ? '1 month' : m > 1 ? m + ' months' : '';
    if (!y) return mPart;
    if (!m) return yPart;
    return yPart + ' ' + mPart;
  }
  function ageEs(months, name) {
    if (months < 0) return 'Antes del cumpleaños de ' + name;
    if (months === 0) return 'Menos de 1 mes';
    var y = Math.floor(months / 12);
    var m = months % 12;
    var yPart = y === 1 ? '1 año' : y > 1 ? y + ' años' : '';
    var mPart = m === 1 ? '1 mes' : m > 1 ? m + ' meses' : '';
    if (!y) return mPart;
    if (!m) return yPart;
    return yPart + ' y ' + mPart;
  }

  var STRINGS = {
    en: {
      retry: 'Retry',
      couldNotLoad: function (name) { return name ? 'Couldn’t load ' + name + '’s words.' : 'Couldn’t load the words.'; },
      nothingLost: 'Nothing you saved is lost. Check your connection and try again.',
      somethingWrong: 'Something went wrong. Try again.',
      makeAccount: 'Make an account to keep entries.',
      keepIt: 'Keep it',
      delete: 'Delete',
      cancel: 'Cancel',
      done: 'Done',
      skip: 'Skip',
      add: 'Add',
      optional: 'optional',
      saveChanges: 'Save changes',
      detailsSaved: 'Details saved',
      saved: 'Saved',
      addedEntry: function (label) { return 'Added ' + label; },
      addedEntries: function (n) { return 'Added ' + n + (n === 1 ? ' entry' : ' entries'); },
      deletedEntry: function (label) { return 'Deleted ' + label; },
      deleteConfirmTitle: function (label) { return 'Delete “' + label + '”?'; },
      deleteConfirmBody: function (name, shared) {
        return 'This removes it from ' + name + '’s log and word count. Its notes and journey go too.' +
          (shared ? ' The other languages stay.' : '');
      },
      couldNotDelete: 'Could not delete it. Try again.',
      couldNotAddLanguage: 'Could not add the language.',
      appLanguage: 'App language',
      englishOption: 'English',
      spanishOption: 'Español',
      stepOf: function (step) { return 'Step ' + step + ' of 2'; },

      welcomeTitle: 'Every little word,<br>in every language.',
      welcomeSub: 'Tell us about your little one. You can change this anytime.',
      childName: 'Child’s name',
      nameLabel: 'Name',
      setupNamePlaceholder: 'e.g. Luna',
      birthMonth: 'Birth month',
      year: 'Year',
      languagesAtHome: 'Languages at home',
      otherChip: '+ Other',
      anotherLanguage: 'Another language',
      addLanguagePlaceholder: 'e.g. Portuguese',
      startWordList: 'Start the word list',
      startNameList: function (name) { return 'Start ' + name + '’s word list'; },
      addNameError: 'Add your child’s name.',

      langNames: { en: 'English', es: 'Spanish', asl: 'ASL', fr: 'French' },

      kinds: {
        word: {
          one: 'Word', many: 'Words', the: 'The word', eg: 'e.g. ball',
          how: function (name) { return 'How ' + name + ' says it'; },
          hint: 'e.g. “ba” for ball',
        },
        sound: {
          one: 'Sound', many: 'Sounds', the: 'The animal or thing', eg: 'e.g. cow or car',
          how: function (name) { return 'The sound ' + name + ' makes'; },
          hint: 'e.g. moo, vroom',
        },
        sign: {
          one: 'Sign', many: 'Signs', the: 'What the sign means', eg: 'e.g. more',
          how: function (name) { return 'How ' + name + ' signs it'; },
          hint: 'e.g. taps fingertips together',
        },
      },
      mastery: {
        emerging: { label: 'Emerging', hint: 'Tried it once or twice' },
        practicing: { label: 'Practicing', hint: 'Uses it with a nudge' },
        mastered: { label: 'Mastered', hint: 'Says it on their own' },
      },
      alreadyLearned: 'Already learned',
      stagingDemo: 'Staging demo',
      quickTitle: function (name) { return 'What does ' + name + ' already do?'; },
      quickSub: function (name) {
        return 'Tap everything ' + name + ' already says or signs. Rilo keeps them as already learned, with no date. ' +
          'Tap a pick’s stage to show how well ' + name + ' says it, like Emerging for “wa” for water.';
      },
      ideasFor: function (band, name) {
        var label = band === 36 ? '3 years and up' : 'about ' + band + ' months';
        return 'Ideas for ' + label + ', like ' + name + '.';
      },
      moreIdeas: 'More ideas',
      everyIdea: 'That’s every idea for now. Add anything else from Home.',
      doneAdd: function (n) { return 'Done, add ' + n + (n === 1 ? ' entry' : ' entries'); },
      stageAria: function (label, stage) { return 'Stage for ' + label + ': ' + stage; },

      navHome: 'Home',
      navLog: 'Log',
      navInsights: 'Insights',
      mainNav: 'Main navigation',
      addEntryAria: 'Add a word, sound or sign',
      profileAria: function (name) { return name + '’s profile and settings'; },

      heroAria: 'Total words, sounds and signs',
      wordsSoFar: function (name) { return name + '’s words so far'; },
      thisWeek: function (n) { return '+' + n + ' this week'; },
      across: function (langs) { return 'across ' + langs; },
      everyFirstCounts: 'Every first counts',
      categoriesAria: 'Categories',
      recent: 'Recent',
      seeAll: 'See all',
      emptyHomeTitle: function (name) { return name + '’s word story starts here.'; },
      emptyHomeSub: 'Add the first word, sound or sign you have heard.',
      addWord: 'Add a word',

      entryKindLanguage: function (kind, language) { return kind + (language ? ' · ' + language : ''); },
      entryAria: function (kind, label, says, language, stage, when) {
        return kind + ': ' + label + (says ? ', ' + says : '') + (language ? ', ' + language : '') +
          ', ' + stage + ', ' + when;
      },

      all: 'All',
      thisMonth: 'This month',
      noLanguage: 'No language',
      logTitle: function (name) { return name + '’s log'; },
      searchLabel: 'Search words, sounds, signs and notes',
      searchPlaceholder: 'Search words, signs, notes',
      filterAria: 'Filter entries',
      entriesCount: function (n) { return n + (n === 1 ? ' entry' : ' entries'); },
      foundCount: function (n) { return n + ' found'; },
      noEntriesTitle: 'No entries yet.',
      noEntriesSub: 'Every word, sound and sign you add shows up here, grouped by age.',
      addEntry: 'Add an entry',
      nothingMatchesTitle: 'Nothing matches yet.',
      nothingMatchesSub: 'Try another search or filter, or add something new.',
      alreadyLearnedGroup: 'Already learned',

      backToLog: 'Back to the log',
      notHereTitle: 'This entry isn’t here any more.',
      notHereSub: 'It may have been deleted.',
      edit: 'Edit',
      editEntry: 'Edit entry',
      firstNoticed: 'First noticed',
      masteryLabel: 'Mastery',
      notes: 'Notes',
      source: 'Source',
      journeyTitle: function (name, kind) {
        return name + '’s journey with this ' + (kind === 'sign' ? 'sign' : kind === 'sound' ? 'sound' : 'word');
      },
      noticed: function (date) { return 'Noticed ' + date; },
      signsIt: function (name, desc) { return name + ' signs it: ' + desc; },
      saysIt: function (name, desc) { return name + ' says <i>“' + desc + '”</i>'; },
      inOtherLanguages: 'In other languages',
      addAnotherLanguage: 'Add another language',
      deleteLabel: function (label) { return 'Delete ' + label; },
      deleteEntry: 'Delete entry',

      insights: 'Insights',
      wordGrowth: 'Word growth',
      newThisWeek: 'new this week',
      newIn: function (month) { return 'new in ' + month; },
      total: function (n) { return 'Total ' + n; },
      showGrowthBy: 'Show growth by',
      week: 'Week',
      month: 'Month',
      chartByWeek: function (parts) { return 'Words, sounds and signs in total by week: ' + parts; },
      chartByMonth: function (parts) { return 'Words, sounds and signs in total by month: ' + parts; },
      weekOf: function (day, month, total) { return 'week of ' + day + ' ' + month + ' ' + total; },
      monthTotal: function (month, total) { return month + ' ' + total; },
      startedWith: function (n, month) { return 'Started with ' + n + ' already learned in ' + month + '.'; },
      weekByWeek: 'Week by week',
      monthByMonth: 'Month by month',
      fullHistory: ' · full history',
      thWeekOf: 'Week of',
      thMonth: 'Month',
      thNew: 'New',
      thTotal: 'Total',
      byLanguage: 'By language',
      languageNote: function (name) {
        return 'A word that ' + name + ' says in two languages counts once in each, like <b>water</b> and <b>agua</b>.';
      },
      languagesShowHere: 'Languages show here once entries have one.',
      acrossLanguages: 'Across languages',
      acrossNote: function (name) {
        return 'Each of these counts once in ' + name + '’s total. Mastery counts each language on its own.';
      },
      acrossEmpty: function (name) {
        return 'When ' + name + ' has a word in more than one language, link them on one entry and it shows here.';
      },
      playIdeas: 'Play ideas for this week',
      playIdea: 'Play idea',
      logAKind: function (kind) { return 'Log a ' + kind; },
      playFinePrint: 'Every child finds words at their own pace. These are ideas, not targets.',
      suggestions: [
        {
          tag: 'Words · bath time', title: 'Name what floats', icon: 'duck', tone: 'blush', kind: 'word',
          body: function (n) { return 'Name each toy as it bobs up, in every language you speak at home. Pause and let ' + n + ' try first.'; },
          detail: 'Hold up one toy at a time and name it slowly, then wait. Repeat whatever comes back as if it was perfect, then say the whole word once more. Try the same toy in each of your languages on different days.',
        },
        {
          tag: 'Signs · snack time', title: 'Sign and say together', icon: 'wave', tone: 'butter', kind: 'sign',
          body: function () { return 'Pair “more” and “all done” with the spoken words so both stick.'; },
          detail: 'Make the sign and say the word at the same moment, every time the moment comes up. There is no need to ask for the sign back. Respond warmly to any way your child lets you know.',
        },
        {
          tag: 'Sounds · anytime', title: 'Leave a gap in the song', icon: 'music', tone: 'sky', kind: 'sound',
          body: function (n) { return 'Sing a favorite and stop before the last word or animal sound. Wait, ' + n + ' may fill it in.'; },
          detail: 'Pick a song with animals or a repeating line. After a few rounds, pause before the last sound and look expectant. A moo, a clap or a giggle all count as taking a turn.',
        },
      ],

      profile: 'Profile',
      about: function (name) { return 'A little about ' + name; },
      ageToday: function (age) { return age + ' today'; },
      born: function (monthYear) { return 'Born ' + monthYear; },
      editProfile: 'Edit child profile',
      languageStory: function (name) { return name + '’s language story'; },
      entriesLangs: function (n, l) {
        return n + (n === 1 ? ' entry' : ' entries') + ' · ' + l + (l === 1 ? ' language' : ' languages');
      },
      aboutParagraph: 'Words, sounds and signs are tracked side by side. Mastery is yours to set: emerging, practicing or mastered.',
      seeInsights: 'See insights',

      editDetails: 'Edit details',
      agesFromMonth: 'Ages count from the birth month.',
      newFor: function (name) { return 'New for ' + name; },
      entryType: 'Entry type',
      language: 'Language',
      howWell: function (name) { return 'How well does ' + name + ' use it?'; },
      notesPlaceholder: 'Where were you? What prompted it?',
      saveTo: function (name) { return 'Save to ' + name + '’s words'; },
      writeWord: 'Write the word.',
      nameAnimal: 'Name the animal or thing.',
      writeSign: 'Write what the sign means.',
      pickDate: 'Pick a date.',
      sameInAnother: function (kind) { return 'Same ' + kind + ' in another language'; },
      notesOptional: 'Notes optional',
      linkedWith: 'Linked with',
      unlink: 'Unlink',
      youAlreadyHave: 'You already have',
      link: 'Link',
      searchEntries: function (name, kindMany) { return 'Search ' + name + '’s ' + kindMany.toLowerCase(); },
      searchLinkAria: 'Search entries to link',
      noMatching: function (kindMany) { return 'No matching ' + kindMany.toLowerCase() + ' yet.'; },
      linkToEntry: '+ Link to an entry',
      languageAria: 'Language',
      newLanguage: 'New language',
      alreadyLearnedHint: 'Already learned. Change the date only if you remember when.',
      wasAge: function (name, age) { return name + ' was ' + age; },

      months: MONTHS_EN,
      monthsShort: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      formatAge: ageEn,
      todayLabel: 'Today',
    },
    es: {
      retry: 'Reintentar',
      couldNotLoad: function (name) { return name ? 'No se pudieron cargar las palabras de ' + name + '.' : 'No se pudieron cargar las palabras.'; },
      nothingLost: 'No se ha perdido nada de lo que guardaste. Revisa tu conexión e inténtalo de nuevo.',
      somethingWrong: 'Algo salió mal. Inténtalo de nuevo.',
      makeAccount: 'Crea una cuenta para guardar las entradas.',
      keepIt: 'Conservarla',
      delete: 'Eliminar',
      cancel: 'Cancelar',
      done: 'Listo',
      skip: 'Omitir',
      add: 'Añadir',
      optional: 'opcional',
      saveChanges: 'Guardar cambios',
      detailsSaved: 'Datos guardados',
      saved: 'Guardado',
      addedEntry: function (label) { return 'Añadido ' + label; },
      addedEntries: function (n) { return 'Añadidas ' + n + (n === 1 ? ' entrada' : ' entradas'); },
      deletedEntry: function (label) { return 'Eliminado ' + label; },
      deleteConfirmTitle: function (label) { return '¿Eliminar “' + label + '”?'; },
      deleteConfirmBody: function (name, shared) {
        return 'Esto lo quita del registro y del contador de ' + name + '. También se van sus notas y su recorrido.' +
          (shared ? ' Los demás idiomas se quedan.' : '');
      },
      couldNotDelete: 'No se pudo eliminar. Inténtalo de nuevo.',
      couldNotAddLanguage: 'No se pudo añadir el idioma.',
      appLanguage: 'Idioma de la app',
      englishOption: 'English',
      spanishOption: 'Español',
      stepOf: function (step) { return 'Paso ' + step + ' de 2'; },

      welcomeTitle: 'Cada pequeña palabra,<br>en cada idioma.',
      welcomeSub: 'Cuéntanos sobre tu peque. Puedes cambiarlo cuando quieras.',
      childName: 'Nombre del peque',
      nameLabel: 'Nombre',
      setupNamePlaceholder: 'p. ej. Luna',
      birthMonth: 'Mes de nacimiento',
      year: 'Año',
      languagesAtHome: 'Idiomas en casa',
      otherChip: '+ Otro',
      anotherLanguage: 'Otro idioma',
      addLanguagePlaceholder: 'p. ej. portugués',
      startWordList: 'Empezar la lista de palabras',
      startNameList: function (name) { return 'Empezar la lista de ' + name; },
      addNameError: 'Añade el nombre de tu peque.',

      langNames: { en: 'Inglés', es: 'Español', asl: 'ASL', fr: 'Francés' },

      kinds: {
        word: {
          one: 'Palabra', many: 'Palabras', the: 'La palabra', eg: 'p. ej. pelota',
          how: function (name) { return 'Cómo dice ' + name; },
          hint: 'p. ej. “ba” para pelota',
        },
        sound: {
          one: 'Sonido', many: 'Sonidos', the: 'El animal o la cosa', eg: 'p. ej. vaca o coche',
          how: function (name) { return 'El sonido que hace ' + name; },
          hint: 'p. ej. mu, brum',
        },
        sign: {
          one: 'Seña', many: 'Señas', the: 'Qué significa la seña', eg: 'p. ej. más',
          how: function (name) { return 'Cómo lo señala ' + name; },
          hint: 'p. ej. junta las yemas de los dedos',
        },
      },
      mastery: {
        emerging: { label: 'Empezando', hint: 'Lo intentó una o dos veces' },
        practicing: { label: 'Practicando', hint: 'Lo usa con ayuda' },
        mastered: { label: 'Lo domina', hint: 'Lo dice sin ayuda' },
      },
      alreadyLearned: 'Ya aprendido',
      stagingDemo: 'Demo de staging',
      quickTitle: function (name) { return '¿Qué hace ya ' + name + '?'; },
      quickSub: function (name) {
        return 'Toca todo lo que ' + name + ' ya dice o señala. Rilo lo guarda como ya aprendido, sin fecha. ' +
          'Toca la etapa de una opción para mostrar qué tan bien lo dice ' + name + ', como Empezando para “wa” en agua.';
      },
      ideasFor: function (band, name) {
        var label = band === 36 ? '3 años o más' : 'unos ' + band + ' meses';
        return 'Ideas para ' + label + ', como ' + name + '.';
      },
      moreIdeas: 'Más ideas',
      everyIdea: 'Esas son todas las ideas por ahora. Añade lo demás desde Inicio.',
      doneAdd: function (n) { return 'Listo, añadir ' + n; },
      stageAria: function (label, stage) { return 'Etapa de ' + label + ': ' + stage; },

      navHome: 'Inicio',
      navLog: 'Registro',
      navInsights: 'Avances',
      mainNav: 'Navegación principal',
      addEntryAria: 'Añadir una palabra, un sonido o una seña',
      profileAria: function (name) { return 'Perfil y ajustes de ' + name; },

      heroAria: 'Total de palabras, sonidos y señas',
      wordsSoFar: function (name) { return 'Las palabras de ' + name + ' hasta ahora'; },
      thisWeek: function (n) { return '+' + n + ' esta semana'; },
      across: function (langs) { return 'en ' + langs; },
      everyFirstCounts: 'Cada primera vez cuenta',
      categoriesAria: 'Categorías',
      recent: 'Recientes',
      seeAll: 'Ver todo',
      emptyHomeTitle: function (name) { return 'La historia de palabras de ' + name + ' empieza aquí.'; },
      emptyHomeSub: 'Añade la primera palabra, el primer sonido o la primera seña que hayas oído.',
      addWord: 'Añadir una palabra',

      entryKindLanguage: function (kind, language) { return kind + (language ? ' · ' + language : ''); },
      entryAria: function (kind, label, says, language, stage, when) {
        return kind + ': ' + label + (says ? ', ' + says : '') + (language ? ', ' + language : '') +
          ', ' + stage + ', ' + when;
      },

      all: 'Todo',
      thisMonth: 'Este mes',
      noLanguage: 'Sin idioma',
      logTitle: function (name) { return 'Registro de ' + name; },
      searchLabel: 'Buscar palabras, sonidos, señas y notas',
      searchPlaceholder: 'Buscar palabras, señas, notas',
      filterAria: 'Filtrar entradas',
      entriesCount: function (n) { return n + (n === 1 ? ' entrada' : ' entradas'); },
      foundCount: function (n) { return n + ' encontradas'; },
      noEntriesTitle: 'Aún no hay entradas.',
      noEntriesSub: 'Cada palabra, sonido y seña que añadas aparece aquí, agrupada por edad.',
      addEntry: 'Añadir una entrada',
      nothingMatchesTitle: 'Nada coincide todavía.',
      nothingMatchesSub: 'Prueba otra búsqueda o filtro, o añade algo nuevo.',
      alreadyLearnedGroup: 'Ya aprendido',

      backToLog: 'Volver al registro',
      notHereTitle: 'Esta entrada ya no está aquí.',
      notHereSub: 'Puede que se haya eliminado.',
      edit: 'Editar',
      editEntry: 'Editar entrada',
      firstNoticed: 'Notado por primera vez',
      masteryLabel: 'Dominio',
      notes: 'Notas',
      source: 'Origen',
      journeyTitle: function (name, kind) {
        return 'El recorrido de ' + name + ' con esta ' + (kind === 'sign' ? 'seña' : kind === 'sound' ? 'palabra' : 'palabra');
      },
      noticed: function (date) { return 'Notado el ' + date; },
      signsIt: function (name, desc) { return name + ' lo señala: ' + desc; },
      saysIt: function (name, desc) { return name + ' dice <i>“' + desc + '”</i>'; },
      inOtherLanguages: 'En otros idiomas',
      addAnotherLanguage: 'Añadir otro idioma',
      deleteLabel: function (label) { return 'Eliminar ' + label; },
      deleteEntry: 'Eliminar entrada',

      insights: 'Avances',
      wordGrowth: 'Crecimiento de palabras',
      newThisWeek: 'nuevas esta semana',
      newIn: function (month) { return 'nuevas en ' + month; },
      total: function (n) { return 'Total ' + n; },
      showGrowthBy: 'Mostrar crecimiento por',
      week: 'Semana',
      month: 'Mes',
      chartByWeek: function (parts) { return 'Palabras, sonidos y señas en total por semana: ' + parts; },
      chartByMonth: function (parts) { return 'Palabras, sonidos y señas en total por mes: ' + parts; },
      weekOf: function (day, month, total) { return 'semana del ' + day + ' de ' + month + ' ' + total; },
      monthTotal: function (month, total) { return month + ' ' + total; },
      startedWith: function (n, month) { return 'Empezó con ' + n + ' ya aprendidas en ' + month + '.'; },
      weekByWeek: 'Semana a semana',
      monthByMonth: 'Mes a mes',
      fullHistory: ' · historial completo',
      thWeekOf: 'Semana del',
      thMonth: 'Mes',
      thNew: 'Nuevas',
      thTotal: 'Total',
      byLanguage: 'Por idioma',
      languageNote: function (name) {
        return 'Una palabra que ' + name + ' dice en dos idiomas cuenta una vez en cada uno, como <b>water</b> y <b>agua</b>.';
      },
      languagesShowHere: 'Los idiomas aparecen aquí cuando las entradas tienen uno.',
      acrossLanguages: 'Entre idiomas',
      acrossNote: function (name) {
        return 'Cada una de estas cuenta una vez en el total de ' + name + '. El dominio cuenta cada idioma por separado.';
      },
      acrossEmpty: function (name) {
        return 'Cuando ' + name + ' tenga una palabra en más de un idioma, vincúlalas en una entrada y aparecerá aquí.';
      },
      playIdeas: 'Ideas de juego para esta semana',
      playIdea: 'Idea de juego',
      logAKind: function (kind) { return 'Registrar ' + kind; },
      playFinePrint: 'Cada peque encuentra sus palabras a su ritmo. Son ideas, no metas.',
      suggestions: [
        {
          tag: 'Palabras · hora del baño', title: 'Nombra lo que flota', icon: 'duck', tone: 'blush', kind: 'word',
          body: function (n) { return 'Nombra cada juguete mientras flota, en cada idioma que hablen en casa. Haz una pausa y deja que ' + n + ' lo intente primero.'; },
          detail: 'Levanta un juguete a la vez y nómbralo despacio, luego espera. Repite lo que diga como si fuera perfecto y después di la palabra completa otra vez. Prueba el mismo juguete en cada idioma en días distintos.',
        },
        {
          tag: 'Señas · hora de la merienda', title: 'Señala y di a la vez', icon: 'wave', tone: 'butter', kind: 'sign',
          body: function () { return 'Combina “más” y “se acabó” con las palabras habladas para que se queden las dos.'; },
          detail: 'Haz la seña y di la palabra en el mismo momento, cada vez que surja la ocasión. No hace falta pedir la seña de vuelta. Responde con cariño a cualquier forma en que tu peque te lo haga saber.',
        },
        {
          tag: 'Sonidos · cualquier momento', title: 'Deja un hueco en la canción', icon: 'music', tone: 'sky', kind: 'sound',
          body: function (n) { return 'Canta una canción favorita y para antes de la última palabra o sonido de animal. Espera, ' + n + ' puede completarlo.'; },
          detail: 'Elige una canción con animales o una frase que se repita. Después de unas rondas, haz una pausa antes del último sonido y mira con expectativa. Un mu, un aplauso o una risita cuentan como turno.',
        },
      ],

      profile: 'Perfil',
      about: function (name) { return 'Un poco sobre ' + name; },
      ageToday: function (age) { return age + ' hoy'; },
      born: function (monthYear) { return 'Nació en ' + monthYear; },
      editProfile: 'Editar perfil del peque',
      languageStory: function (name) { return 'La historia de idiomas de ' + name; },
      entriesLangs: function (n, l) {
        return n + (n === 1 ? ' entrada' : ' entradas') + ' · ' + l + (l === 1 ? ' idioma' : ' idiomas');
      },
      aboutParagraph: 'Palabras, sonidos y señas se siguen lado a lado. El dominio lo pones tú: empezando, practicando o lo domina.',
      seeInsights: 'Ver avances',

      editDetails: 'Editar datos',
      agesFromMonth: 'Las edades cuentan desde el mes de nacimiento.',
      newFor: function (name) { return 'Nuevo para ' + name; },
      entryType: 'Tipo de entrada',
      language: 'Idioma',
      howWell: function (name) { return '¿Qué tan bien lo usa ' + name + '?'; },
      notesPlaceholder: '¿Dónde estaban? ¿Qué lo provocó?',
      saveTo: function (name) { return 'Guardar en las palabras de ' + name; },
      writeWord: 'Escribe la palabra.',
      nameAnimal: 'Nombra el animal o la cosa.',
      writeSign: 'Escribe qué significa la seña.',
      pickDate: 'Elige una fecha.',
      sameInAnother: function (kind) {
        if (kind === 'sonido') return 'El mismo sonido en otro idioma';
        if (kind === 'seña') return 'La misma seña en otro idioma';
        return 'La misma palabra en otro idioma';
      },
      notesOptional: 'Notas opcionales',
      linkedWith: 'Vinculada con',
      unlink: 'Desvincular',
      youAlreadyHave: 'Ya tienes',
      link: 'Vincular',
      searchEntries: function (name, kindMany) { return 'Buscar ' + kindMany.toLowerCase() + ' de ' + name; },
      searchLinkAria: 'Buscar entradas para vincular',
      noMatching: function (kindMany) { return 'Aún no hay ' + kindMany.toLowerCase() + ' que coincidan.'; },
      linkToEntry: '+ Vincular a una entrada',
      languageAria: 'Idioma',
      newLanguage: 'Nuevo idioma',
      alreadyLearnedHint: 'Ya aprendido. Cambia la fecha solo si recuerdas cuándo.',
      wasAge: function (name, age) { return name + ' tenía ' + age; },

      months: MONTHS_ES,
      monthsShort: ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'],
      formatAge: ageEs,
      todayLabel: 'Hoy',
    },
  };

  // The server validates in English and shows its message verbatim. The page
  // maps each exact message to its Spanish wording when Español is chosen.
  var SERVER_ERRORS_ES = {
    'Add a name between 1 and 40 characters.': 'Añade un nombre de 1 a 40 caracteres.',
    'Pick a birth month and year.': 'Elige un mes y un año de nacimiento.',
    'Pick a month between January 1990 and this one.': 'Elige un mes entre enero de 1990 y este.',
    'Pick English or Spanish.': 'Elige inglés o español.',
    'Type a language name between 1 and 30 characters.': 'Escribe un nombre de idioma de 1 a 30 caracteres.',
    'Choose Word, Sound or Sign.': 'Elige Palabra, Sonido o Seña.',
    'Keep how it sounds under 80 characters.': 'Mantén el sonido en menos de 80 caracteres.',
    'Keep the note under 280 characters.': 'Mantén la nota en menos de 280 caracteres.',
    'Pick a date.': 'Elige una fecha.',
    'Pick a date on or after the birthday.': 'Elige una fecha igual o posterior al cumpleaños.',
    'Pick a date no later than today.': 'Elige una fecha que no sea posterior a hoy.',
    'Choose one of your languages.': 'Elige uno de tus idiomas.',
    'Choose one of your entries to link to.': 'Elige una de tus entradas para vincular.',
    'Link it to an entry of the same type.': 'Vincúlala con una entrada del mismo tipo.',
    'First not found.': 'No se encontró la entrada.',
    'Choose at least one first to add.': 'Elige al menos una primera palabra para añadir.',
    'Add up to 200 at a time.': 'Añade hasta 200 a la vez.',
    "Add your child's name and birthday first.": 'Añade primero el nombre y el cumpleaños de tu peque.',
    'One of the picks is missing its word, animal or sign.': 'A una de las opciones le falta la palabra, el animal o la seña.',
    'Something went wrong. Try again.': 'Algo salió mal. Inténtalo de nuevo.',
    'Not authenticated': 'No has iniciado sesión.',
  };

  // ── Ideas ────────────────────────────────────────────────────────────
  // Each idea belongs to the age band where most children reach it. `id` is
  // stable and keys a pick. `category` is one of the server's categories.
  function idea(id, band, kind, category, en, es) {
    return { id: id, band: band, kind: kind, category: category, en: en, es: es };
  }
  var IDEAS = [
    // About 12 months: 24 words, 9 sounds, 3 signs, most common first.
    idea('12-w-mama', 12, 'word', 'people', { label: 'mama' }, { label: 'mamá' }),
    idea('12-w-dada', 12, 'word', 'people', { label: 'dada' }, { label: 'papá' }),
    idea('12-w-ball', 12, 'word', 'play', { label: 'ball' }, { label: 'pelota' }),
    idea('12-w-milk', 12, 'word', 'food', { label: 'milk' }, { label: 'leche' }),
    idea('12-w-bye', 12, 'word', 'actions', { label: 'bye' }, { label: 'adiós' }),
    idea('12-w-no', 12, 'word', 'actions', { label: 'no' }, { label: 'no' }),
    idea('12-w-uhoh', 12, 'word', 'actions', { label: 'uh-oh' }, { label: 'ay' }),
    idea('12-w-kitty', 12, 'word', 'animals', { label: 'kitty' }, { label: 'gatito' }),
    idea('12-w-dog', 12, 'word', 'animals', { label: 'dog' }, { label: 'perro' }),
    idea('12-w-book', 12, 'word', 'play', { label: 'book' }, { label: 'libro' }),
    idea('12-w-more', 12, 'word', 'actions', { label: 'more' }, { label: 'más' }),
    idea('12-w-hi', 12, 'word', 'actions', { label: 'hi' }, { label: 'hola' }),
    idea('12-w-banana', 12, 'word', 'food', { label: 'banana' }, { label: 'plátano' }),
    idea('12-w-eat', 12, 'word', 'food', { label: 'eat' }, { label: 'comer' }),
    idea('12-w-alldone', 12, 'word', 'actions', { label: 'all done' }, { label: 'se acabó' }),
    idea('12-w-bottle', 12, 'word', 'food', { label: 'bottle' }, { label: 'biberón' }),
    idea('12-w-hat', 12, 'word', 'body', { label: 'hat' }, { label: 'gorro' }),
    idea('12-w-bird', 12, 'word', 'animals', { label: 'bird' }, { label: 'pájaro' }),
    idea('12-w-juice', 12, 'word', 'food', { label: 'juice' }, { label: 'jugo' }),
    idea('12-w-duck', 12, 'word', 'animals', { label: 'duck' }, { label: 'pato' }),
    idea('12-w-sock', 12, 'word', 'body', { label: 'sock' }, { label: 'calcetín' }),
    idea('12-w-up', 12, 'word', 'actions', { label: 'up' }, { label: 'arriba' }),
    idea('12-w-down', 12, 'word', 'actions', { label: 'down' }, { label: 'abajo' }),
    idea('12-w-apple', 12, 'word', 'food', { label: 'apple' }, { label: 'manzana' }),
    idea('12-s-cow', 12, 'sound', 'animals', { label: 'cow', sounds_like: 'moo' }, { label: 'vaca', sounds_like: 'mu' }),
    idea('12-s-dog', 12, 'sound', 'animals', { label: 'dog', sounds_like: 'woof woof' }, { label: 'perro', sounds_like: 'guau guau' }),
    idea('12-s-car', 12, 'sound', 'transport', { label: 'car', sounds_like: 'vroom' }, { label: 'coche', sounds_like: 'brum' }),
    idea('12-s-cat', 12, 'sound', 'animals', { label: 'cat', sounds_like: 'meow' }, { label: 'gato', sounds_like: 'miau' }),
    idea('12-s-sheep', 12, 'sound', 'animals', { label: 'sheep', sounds_like: 'baa' }, { label: 'oveja', sounds_like: 'be' }),
    idea('12-s-duck', 12, 'sound', 'animals', { label: 'duck', sounds_like: 'quack' }, { label: 'pato', sounds_like: 'cuac' }),
    idea('12-s-ambulance', 12, 'sound', 'transport', { label: 'ambulance', sounds_like: 'wee-o wee-o' }, { label: 'ambulancia', sounds_like: 'nino nino' }),
    idea('12-s-horn', 12, 'sound', 'transport', { label: 'horn', sounds_like: 'beep beep' }, { label: 'claxon', sounds_like: 'pip pip' }),
    idea('12-s-train', 12, 'sound', 'transport', { label: 'train', sounds_like: 'choo choo' }, { label: 'tren', sounds_like: 'chu chu' }),
    idea('12-g-more', 12, 'sign', 'actions', { label: 'more', sounds_like: 'Taps fingertips together' }, { label: 'más', sounds_like: 'Junta las yemas de los dedos' }),
    idea('12-g-milk', 12, 'sign', 'food', { label: 'milk', sounds_like: 'Squeezes a fist' }, { label: 'leche', sounds_like: 'Aprieta el puño' }),
    idea('12-g-alldone', 12, 'sign', 'actions', { label: 'all done', sounds_like: 'Twists both hands' }, { label: 'se acabó', sounds_like: 'Gira las dos manos' }),

    // About 18 months.
    idea('18-w-water', 18, 'word', 'food', { label: 'water' }, { label: 'agua' }),
    idea('18-w-shoes', 18, 'word', 'body', { label: 'shoes' }, { label: 'zapatos' }),
    idea('18-w-bath', 18, 'word', 'home', { label: 'bath' }, { label: 'baño' }),
    idea('18-w-cookie', 18, 'word', 'food', { label: 'cookie' }, { label: 'galleta' }),
    idea('18-w-nose', 18, 'word', 'body', { label: 'nose' }, { label: 'nariz' }),
    idea('18-w-night', 18, 'word', 'home', { label: 'night-night' }, { label: 'a dormir' }),
    idea('18-w-puppy', 18, 'word', 'animals', { label: 'puppy' }, { label: 'perrito' }),
    idea('18-w-spoon', 18, 'word', 'food', { label: 'spoon' }, { label: 'cuchara' }),
    idea('18-w-baby', 18, 'word', 'people', { label: 'baby' }, { label: 'bebé' }),
    idea('18-w-eyes', 18, 'word', 'body', { label: 'eyes' }, { label: 'ojos' }),
    idea('18-w-ears', 18, 'word', 'body', { label: 'ears' }, { label: 'orejas' }),
    idea('18-w-teeth', 18, 'word', 'body', { label: 'teeth' }, { label: 'dientes' }),
    idea('18-w-hands', 18, 'word', 'body', { label: 'hands' }, { label: 'manos' }),
    idea('18-w-feet', 18, 'word', 'body', { label: 'feet' }, { label: 'pies' }),
    idea('18-w-cheese', 18, 'word', 'food', { label: 'cheese' }, { label: 'queso' }),
    idea('18-w-bread', 18, 'word', 'food', { label: 'bread' }, { label: 'pan' }),
    idea('18-w-egg', 18, 'word', 'food', { label: 'egg' }, { label: 'huevo' }),
    idea('18-w-rice', 18, 'word', 'food', { label: 'rice' }, { label: 'arroz' }),
    idea('18-w-bear', 18, 'word', 'animals', { label: 'bear' }, { label: 'oso' }),
    idea('18-w-fish', 18, 'word', 'animals', { label: 'fish' }, { label: 'pez' }),
    idea('18-w-truck', 18, 'word', 'transport', { label: 'truck' }, { label: 'camión' }),
    idea('18-w-teddy', 18, 'word', 'play', { label: 'teddy' }, { label: 'osito' }),
    idea('18-w-inside', 18, 'word', 'actions', { label: 'inside' }, { label: 'adentro' }),
    idea('18-w-grandma', 18, 'word', 'people', { label: 'grandma' }, { label: 'abuela' }),
    idea('18-s-pig', 18, 'sound', 'animals', { label: 'pig', sounds_like: 'oink' }, { label: 'cerdo', sounds_like: 'oink' }),
    idea('18-s-train', 18, 'sound', 'transport', { label: 'train', sounds_like: 'choo choo' }, { label: 'tren', sounds_like: 'chu chu' }),
    idea('18-s-ambulance', 18, 'sound', 'transport', { label: 'ambulance', sounds_like: 'wee-o wee-o' }, { label: 'ambulancia', sounds_like: 'nino nino' }),
    idea('18-s-horse', 18, 'sound', 'animals', { label: 'horse', sounds_like: 'neigh' }, { label: 'caballo', sounds_like: 'jii' }),
    idea('18-s-bird', 18, 'sound', 'animals', { label: 'bird', sounds_like: 'tweet tweet' }, { label: 'pájaro', sounds_like: 'pío pío' }),
    idea('18-s-monkey', 18, 'sound', 'animals', { label: 'monkey', sounds_like: 'ooh ooh' }, { label: 'mono', sounds_like: 'u u' }),
    idea('18-s-motorcycle', 18, 'sound', 'transport', { label: 'motorcycle', sounds_like: 'vroom vroom' }, { label: 'moto', sounds_like: 'brum brum' }),
    idea('18-s-doorbell', 18, 'sound', 'home', { label: 'doorbell', sounds_like: 'ding dong' }, { label: 'timbre', sounds_like: 'ding dong' }),
    idea('18-s-rain', 18, 'sound', 'outside', { label: 'rain', sounds_like: 'pitter patter' }, { label: 'lluvia', sounds_like: 'plic plic' }),
    idea('18-g-please', 18, 'sign', 'actions', { label: 'please', sounds_like: 'Rubs chest in a circle' }, { label: 'por favor', sounds_like: 'Frota el pecho en círculo' }),
    idea('18-g-eat', 18, 'sign', 'food', { label: 'eat', sounds_like: 'Taps fingers to mouth' }, { label: 'comer', sounds_like: 'Toca la boca con los dedos' }),
    idea('18-g-bye', 18, 'sign', 'actions', { label: 'bye', sounds_like: 'Opens and closes a hand' }, { label: 'adiós', sounds_like: 'Abre y cierra la mano' }),

    // About 24 months.
    idea('24-w-thankyou', 24, 'word', 'actions', { label: 'thank you' }, { label: 'gracias' }),
    idea('24-w-mine', 24, 'word', 'actions', { label: 'mine' }, { label: 'mío' }),
    idea('24-w-open', 24, 'word', 'actions', { label: 'open' }, { label: 'abre' }),
    idea('24-w-outside', 24, 'word', 'outside', { label: 'outside' }, { label: 'afuera' }),
    idea('24-w-bubbles', 24, 'word', 'play', { label: 'bubbles' }, { label: 'burbujas' }),
    idea('24-w-moon', 24, 'word', 'outside', { label: 'moon' }, { label: 'luna' }),
    idea('24-w-star', 24, 'word', 'outside', { label: 'star' }, { label: 'estrella' }),
    idea('24-w-stop', 24, 'word', 'actions', { label: 'stop' }, { label: 'para' }),
    idea('24-w-go', 24, 'word', 'actions', { label: 'go' }, { label: 'vamos' }),
    idea('24-w-help', 24, 'word', 'actions', { label: 'help' }, { label: 'ayuda' }),
    idea('24-w-play', 24, 'word', 'play', { label: 'play' }, { label: 'jugar' }),
    idea('24-w-read', 24, 'word', 'play', { label: 'read' }, { label: 'leer' }),
    idea('24-w-draw', 24, 'word', 'play', { label: 'draw' }, { label: 'dibuja' }),
    idea('24-w-car', 24, 'word', 'transport', { label: 'car' }, { label: 'coche' }),
    idea('24-w-bus', 24, 'word', 'transport', { label: 'bus' }, { label: 'autobús' }),
    idea('24-w-rain', 24, 'word', 'outside', { label: 'rain' }, { label: 'lluvia' }),
    idea('24-w-flower', 24, 'word', 'outside', { label: 'flower' }, { label: 'flor' }),
    idea('24-w-tree', 24, 'word', 'outside', { label: 'tree' }, { label: 'árbol' }),
    idea('24-w-door', 24, 'word', 'home', { label: 'door' }, { label: 'puerta' }),
    idea('24-w-light', 24, 'word', 'home', { label: 'light' }, { label: 'luz' }),
    idea('24-w-bed', 24, 'word', 'home', { label: 'bed' }, { label: 'cama' }),
    idea('24-w-cup', 24, 'word', 'food', { label: 'cup' }, { label: 'vaso' }),
    idea('24-w-fork', 24, 'word', 'food', { label: 'fork' }, { label: 'tenedor' }),
    idea('24-w-hot', 24, 'word', 'words', { label: 'hot' }, { label: 'caliente' }),
    idea('24-s-bee', 24, 'sound', 'animals', { label: 'bee', sounds_like: 'buzz' }, { label: 'abeja', sounds_like: 'bzz' }),
    idea('24-s-frog', 24, 'sound', 'animals', { label: 'frog', sounds_like: 'ribbit' }, { label: 'rana', sounds_like: 'croac' }),
    idea('24-s-plane', 24, 'sound', 'transport', { label: 'plane', sounds_like: 'neeee' }, { label: 'avión', sounds_like: 'nnnn' }),
    idea('24-s-siren', 24, 'sound', 'transport', { label: 'siren', sounds_like: 'wee-o wee-o' }, { label: 'sirena', sounds_like: 'nino nino' }),
    idea('24-s-owl', 24, 'sound', 'animals', { label: 'owl', sounds_like: 'hoo hoo' }, { label: 'búho', sounds_like: 'uu uu' }),
    idea('24-s-lion', 24, 'sound', 'animals', { label: 'lion', sounds_like: 'roar' }, { label: 'león', sounds_like: 'grrr' }),
    idea('24-s-boat', 24, 'sound', 'transport', { label: 'boat', sounds_like: 'toot toot' }, { label: 'barco', sounds_like: 'tuu tuu' }),
    idea('24-s-wind', 24, 'sound', 'outside', { label: 'wind', sounds_like: 'whoosh' }, { label: 'viento', sounds_like: 'fiuuu' }),
    idea('24-s-drum', 24, 'sound', 'play', { label: 'drum', sounds_like: 'boom boom' }, { label: 'tambor', sounds_like: 'pom pom' }),
    idea('24-g-thankyou', 24, 'sign', 'actions', { label: 'thank you', sounds_like: 'Touches chin then outward' }, { label: 'gracias', sounds_like: 'Toca la barbilla y extiende la mano' }),
    idea('24-g-help', 24, 'sign', 'actions', { label: 'help', sounds_like: 'Fist on open palm' }, { label: 'ayuda', sounds_like: 'Puño sobre la palma abierta' }),
    idea('24-g-play', 24, 'sign', 'play', { label: 'play', sounds_like: 'Shakes both hands' }, { label: 'jugar', sounds_like: 'Sacude las dos manos' }),

    // 3 years and up.
    idea('36-w-loveyou', 36, 'word', 'people', { label: 'I love you' }, { label: 'te quiero' }),
    idea('36-w-whatsthat', 36, 'word', 'words', { label: 'what’s that?' }, { label: '¿qué es eso?' }),
    idea('36-w-red', 36, 'word', 'words', { label: 'red' }, { label: 'rojo' }),
    idea('36-w-friend', 36, 'word', 'people', { label: 'friend' }, { label: 'amigo' }),
    idea('36-w-onetwo', 36, 'word', 'words', { label: 'one, two' }, { label: 'uno, dos' }),
    idea('36-w-why', 36, 'word', 'words', { label: 'why?' }, { label: '¿por qué?' }),
    idea('36-w-look', 36, 'word', 'actions', { label: 'look' }, { label: 'mira' }),
    idea('36-w-big', 36, 'word', 'words', { label: 'big' }, { label: 'grande' }),
    idea('36-w-small', 36, 'word', 'words', { label: 'small' }, { label: 'pequeño' }),
    idea('36-w-blue', 36, 'word', 'words', { label: 'blue' }, { label: 'azul' }),
    idea('36-w-yellow', 36, 'word', 'words', { label: 'yellow' }, { label: 'amarillo' }),
    idea('36-w-green', 36, 'word', 'words', { label: 'green' }, { label: 'verde' }),
    idea('36-w-three', 36, 'word', 'words', { label: 'three' }, { label: 'tres' }),
    idea('36-w-count', 36, 'word', 'play', { label: 'count' }, { label: 'contar' }),
    idea('36-w-sing', 36, 'word', 'play', { label: 'sing' }, { label: 'cantar' }),
    idea('36-w-dance', 36, 'word', 'play', { label: 'dance' }, { label: 'bailar' }),
    idea('36-w-happy', 36, 'word', 'words', { label: 'happy' }, { label: 'feliz' }),
    idea('36-w-sad', 36, 'word', 'words', { label: 'sad' }, { label: 'triste' }),
    idea('36-w-tired', 36, 'word', 'words', { label: 'tired' }, { label: 'cansado' }),
    idea('36-w-hungry', 36, 'word', 'food', { label: 'hungry' }, { label: 'hambre' }),
    idea('36-w-thirsty', 36, 'word', 'food', { label: 'thirsty' }, { label: 'sed' }),
    idea('36-w-wait', 36, 'word', 'actions', { label: 'wait' }, { label: 'espera' }),
    idea('36-w-again', 36, 'word', 'actions', { label: 'again' }, { label: 'otra vez' }),
    idea('36-w-myturn', 36, 'word', 'actions', { label: 'my turn' }, { label: 'mi turno' }),
    idea('36-s-snake', 36, 'sound', 'animals', { label: 'snake', sounds_like: 'hiss' }, { label: 'serpiente', sounds_like: 'sss' }),
    idea('36-s-clock', 36, 'sound', 'home', { label: 'clock', sounds_like: 'tick tock' }, { label: 'reloj', sounds_like: 'tic tac' }),
    idea('36-s-phone', 36, 'sound', 'home', { label: 'phone', sounds_like: 'ring ring' }, { label: 'teléfono', sounds_like: 'ring ring' }),
    idea('36-s-tiger', 36, 'sound', 'animals', { label: 'tiger', sounds_like: 'roar' }, { label: 'tigre', sounds_like: 'grrr' }),
    idea('36-s-helicopter', 36, 'sound', 'transport', { label: 'helicopter', sounds_like: 'chop chop' }, { label: 'helicóptero', sounds_like: 'chop chop' }),
    idea('36-s-rooster', 36, 'sound', 'animals', { label: 'rooster', sounds_like: 'cock-a-doodle-doo' }, { label: 'gallo', sounds_like: 'quiquiriquí' }),
    idea('36-s-donkey', 36, 'sound', 'animals', { label: 'donkey', sounds_like: 'hee-haw' }, { label: 'burro', sounds_like: 'ija jia' }),
    idea('36-s-kettle', 36, 'sound', 'home', { label: 'kettle', sounds_like: 'piiii' }, { label: 'tetera', sounds_like: 'piiii' }),
    idea('36-s-thunder', 36, 'sound', 'outside', { label: 'thunder', sounds_like: 'boom' }, { label: 'trueno', sounds_like: 'bum' }),
    idea('36-g-friend', 36, 'sign', 'people', { label: 'friend', sounds_like: 'Hooks two fingers together' }, { label: 'amigo', sounds_like: 'Engancha dos dedos' }),
    idea('36-g-love', 36, 'sign', 'people', { label: 'love', sounds_like: 'Crosses both arms on the chest' }, { label: 'te quiero', sounds_like: 'Cruza los brazos sobre el pecho' }),
    idea('36-g-book', 36, 'sign', 'play', { label: 'book', sounds_like: 'Opens both palms like a book' }, { label: 'libro', sounds_like: 'Abre las palmas como un libro' }),
  ];

  var BATCH = 12;
  var BANDS = [12, 18, 24, 36];

  function bandFor(months) {
    if (months < 15) return 12;
    if (months < 21) return 18;
    if (months < 30) return 24;
    return 36;
  }
  // The child's band first, then younger bands nearest first, then older
  // bands nearest first.
  function bandOrder(band) {
    var i = BANDS.indexOf(band);
    var younger = BANDS.slice(0, i).reverse();
    var older = BANDS.slice(i + 1);
    return [band].concat(younger, older);
  }
  // The flat ordered list: each band in turn, in batches of eight words,
  // three sounds and one sign, each kind most common first.
  function ideasFor(months) {
    var list = [];
    bandOrder(bandFor(months)).forEach(function (band) {
      var of = IDEAS.filter(function (idea) { return idea.band === band; });
      var words = of.filter(function (idea) { return idea.kind === 'word'; });
      var sounds = of.filter(function (idea) { return idea.kind === 'sound'; });
      var signs = of.filter(function (idea) { return idea.kind === 'sign'; });
      for (var i = 0; i < 3; i++) {
        list = list.concat(
          words.slice(i * 8, i * 8 + 8),
          sounds.slice(i * 3, i * 3 + 3),
          signs.slice(i, i + 1)
        );
      }
    });
    return list;
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
