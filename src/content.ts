import { extraCopy, locales, pageSlugs, type Locale } from './i18n';
export { languageMeta, locales, type Locale } from './i18n';

export type PageKey =
  | 'home'
  | 'products'
  | 'wholesale'
  | 'about'
  | 'truffles'
  | 'blog'
  | 'contact'
  | 'faq'
  | 'privacy'
  | 'terms'
  | 'cookies'
  | `product:${string}`
  | `truffle:${string}`
  | `article:${string}`;

const baseCopy = {
  bg: {
    nav: { home: 'Начало', products: 'Продукти', truffles: 'Трюфели', wholesale: 'За ресторанти', about: 'За нас', blog: 'Журнал', contact: 'Контакт' },
    cta: 'B2B запитване',
    heroEyebrow: 'ДИВИ ТРЮФЕЛИ ЗА ПРОФЕСИОНАЛНИ КУХНИ',
    heroTitle: 'Вкусът на дивата природа.',
    heroText: 'Сезонни балкански трюфели за менюта с характер. Подбираме сорта и градацията според кухнята ви, после потвърждаваме наличност и оферта.',
    discover: 'Разгледайте селекцията',
    origin: 'От сърцето на Балканите',
    featured: 'Трюфели за менюто на сезона',
    featuredIntro: 'Четири характерни вида, с наличност и градация според текущата реколта.',
    viewAll: 'Вижте всички продукти',
    species: 'Под земята. В своя сезон.',
    speciesText: 'Всеки вид трюфел има свой ритъм, аромат и място на масата. Открийте какво го прави различен.',
    reasonsEyebrow: 'НАШАТА ФИЛОСОФИЯ',
    reasonsTitle: 'Рядка природа. Честен произход.',
    reasonsText: 'Работим в ритъма на гората, с уважение към хората, които я познават най-добре.',
    reasons: [
      ['Локални тероари', 'Подбрани райони в България и Балканите, с характерни почви и естествени гори.'],
      ['Ръчен подбор', 'Всеки трюфел се проверява внимателно за свежест, зрялост и чист аромат.'],
      ['В точния момент', 'Сезонното събиране и бързата обработка запазват естествения характер на продукта.'],
    ],
    landscapeEyebrow: 'ДИВОТО СИ ИМА АДРЕС',
    landscapeTitle: 'Балканска земя. Необикновен характер.',
    landscapeText: 'Варовикови склонове, стари дъбови гори и променлив планински климат създават условия за трюфели с ясно изразен произход.',
    processEyebrow: 'ОТ ГОРАТА ДО ВАШАТА КУХНЯ',
    processTitle: 'Събран с грижа. Подбран с опит.',
    processText: 'Работим с хора, които разчитат земята по миризмата на почвата и поведението на обученото куче. Следва внимателна селекция и подготовка за доставка.',
    quality: 'Свежест без компромис',
    qualityText: 'Трюфелът е жив, сезонен продукт. Обработваме малки количества и съобразяваме всяка заявка с реалната наличност.',
    faqTitle: 'Често задавани въпроси',
    faq: [
      ['Откъде произхождат трюфелите?', 'Подбираме диви трюфели от България и други подходящи райони на Балканите. Конкретният произход зависи от вида и сезона.'],
      ['Как се определя наличността?', 'Трюфелите се събират сезонно. Потвърждаваме наличност, вид и размер след запитване, според актуалната реколта.'],
      ['Как се съхраняват пресните трюфели?', 'Съхранявайте ги в хладилник, в затворен съд с абсорбираща хартия, и я сменяйте ежедневно. Най-добре използвайте възможно най-скоро.'],
    ],
    finalTitle: 'Вашето следващо меню започва в гората.',
    finalText: 'Кажете ни какъв сорт и количество търсите. Ще върнем конкретен отговор за наличност, градация и доставка.',
    footerText: 'Диви трюфели и вкусове с балкански произход. Подбрани с уважение към земята и сезона.',
    imageCredits: 'Автори и лицензи на снимките',
    productsTitle: 'Селекция за професионални кухни',
    productsIntro: 'Пресни трюфели от Балканите, предлагани сезонно с потвърдена наличност и градация. Цената зависи от сорта, размера и реколтата.',
    wholesaleTitle: 'Трюфели, подбрани за вашето меню.',
    wholesaleIntro: 'Снабдяване за ресторанти с пресни трюфели от Балканите. Споделете сорта, ориентировъчното количество и срока; ще отговорим с наличност и индивидуална оферта.',
    wholesaleEyebrow: 'ЗА РЕСТОРАНТИ И ПРОФЕСИОНАЛНИ КУХНИ',
    wholesalePoints: [['Сорт според менюто', 'Черен, бял, летен и бургундски трюфел според сезона.'], ['Градация по заявка', 'Уточняваме калибър и предпочитания с всяка поръчка.'], ['Оферта според реколтата', 'Потвърждаваме реалната наличност и цена преди заявката.']],
    wholesaleFormTitle: 'Поискайте B2B оферта',
    wholesaleFormText: 'Споделете нуждите на кухнята си. Запитването е без ангажимент.',
    quoteStatus: 'Подготвяме заявката…',
    quoteMissingEmail: 'Формата е готова, но локалният сайт няма настроен имейл за получаване. Добавете VITE_CONTACT_EMAIL в .env.local.',
    quoteOpened: 'Отворихме имейл с попълнената заявка. Прегледайте я и натиснете Send.',
    aboutTitle: 'Хора, земя и добър усет.',
    aboutText: 'Truffle Balkans свързва богатите трюфелни тероари на Балканите с готвачи и ценители, които искат да знаят какво има в чинията им — и откъде идва.',
    trufflesTitle: 'Запознайте се с трюфелите',
    blogTitle: 'Бележки от гората и кухнята',
    contactTitle: 'Нека поговорим за трюфели.',
    contactText: 'За сезонна наличност, размери и B2B предложения, изпратете ни съобщение.',
    faqPageTitle: 'Вашите въпроси за трюфелите',
    form: { name: 'Име и фамилия', email: 'Работен имейл', phone: 'Телефон', company: 'Ресторант / компания', message: 'Бележка към запитването', send: 'Изпрати запитване', sent: 'Заявката е подготвена.', product: 'Търсен трюфел', quantity: 'Ориентировъчно количество', quantityHint: 'например 500 г на доставка', country: 'Държава за доставка', delivery: 'Желана дата за доставка', selectProduct: 'Изберете вид' },
    availability: 'Сезонна наличност', originLabel: 'Произход', season: 'Сезон', grade: 'Подбор', inquire: 'Запитайте за цена', learn: 'Научете повече',
    back: 'Обратно към всички', related: 'Може да ви бъде интересно', freshness: 'Свежестта е сезонна',
    navMore: 'Повече', allProducts: 'Продукти', contactNote: 'Работим по заявка и потвърждаваме всяка наличност лично.',
  },
  en: {
    nav: { home: 'Home', products: 'Truffles for chefs', truffles: 'Truffle guide', wholesale: 'For restaurants', about: 'Our story', blog: 'Journal', contact: 'Contact' },
    cta: 'Wholesale enquiry',
    heroEyebrow: 'WILD TRUFFLES FOR PROFESSIONAL KITCHENS',
    heroTitle: 'A taste of the wild.',
    heroText: 'Seasonal Balkan truffles for menus with character. Tell us about your kitchen and we will confirm the right species, grade and current availability.',
    discover: 'Browse the selection',
    origin: 'From the heart of the Balkans',
    featured: 'For the menu in season',
    featuredIntro: 'Four distinct truffle varieties, with grades and availability confirmed against the current harvest.',
    viewAll: 'Explore all products',
    species: 'Beneath the soil. In their season.',
    speciesText: 'Every truffle has its own rhythm, aroma and place at the table. Discover what sets each one apart.',
    reasonsEyebrow: 'WHAT WE BELIEVE',
    reasonsTitle: 'Wild by nature. Clear by origin.',
    reasonsText: 'We work with the forest’s rhythm and the people who know it best.',
    reasons: [
      ['Local terroir', 'Selected landscapes in Bulgaria and the Balkans, shaped by distinctive soils and native woodland.'],
      ['Hand-selected', 'Every truffle is assessed for freshness, maturity and a clean, expressive aroma.'],
      ['At the right moment', 'Seasonal harvesting and careful handling help preserve each truffle’s natural character.'],
    ],
    landscapeEyebrow: 'WILD HAS AN ADDRESS',
    landscapeTitle: 'Balkan soil. Singular character.',
    landscapeText: 'Limestone hills, old oak woodland and a varied mountain climate create the conditions for truffles with a clear sense of place.',
    processEyebrow: 'FROM WOODLAND TO KITCHEN',
    processTitle: 'Found with care. Chosen with experience.',
    processText: 'We work with people who read the forest through its soil and the instincts of a trained dog. Each find is then carefully graded and prepared for delivery.',
    quality: 'Freshness, without compromise',
    qualityText: 'A truffle is a living, seasonal ingredient. We handle small quantities and match every enquiry to real-time availability.',
    faqTitle: 'A few good questions',
    faq: [
      ['Where do your truffles come from?', 'We select wild truffles from Bulgaria and other suitable Balkan landscapes. Exact provenance depends on the species and season.'],
      ['How is availability confirmed?', 'Truffles are harvested seasonally. We confirm species, size and availability after an enquiry, based on the current harvest.'],
      ['How should fresh truffles be stored?', 'Keep them refrigerated in a sealed container lined with absorbent paper, changing the paper daily. Enjoy as soon as possible.'],
    ],
    finalTitle: 'Your next menu begins in the forest.',
    finalText: 'Tell us the variety and volume you need. We will reply with specific availability, grading and delivery options.',
    footerText: 'Wild truffles and flavours from the Balkans. Selected with respect for the land and the season.',
    imageCredits: 'Image credits and licences',
    productsTitle: 'A selection for professional kitchens',
    productsIntro: 'Fresh truffles from the Balkans, offered by season with availability and grade confirmed. Pricing depends on variety, size and harvest.',
    wholesaleTitle: 'Truffles selected for your menu.',
    wholesaleIntro: 'Fresh Balkan truffles for restaurants. Tell us the variety, approximate quantity and timing; we will reply with current availability and a tailored quotation.',
    wholesaleEyebrow: 'FOR RESTAURANTS AND PROFESSIONAL KITCHENS',
    wholesalePoints: [['Variety for your menu', 'Black, white, summer and Burgundy truffles, as the season allows.'], ['Grading to order', 'We discuss preferred size and grade with every enquiry.'], ['Quoted to the harvest', 'Current availability and pricing are confirmed before you order.']],
    wholesaleFormTitle: 'Request a wholesale quote',
    wholesaleFormText: 'Tell us what your kitchen needs. There is no obligation.',
    quoteStatus: 'Preparing your enquiry…',
    quoteMissingEmail: 'The form is ready, but no receiving email is configured locally. Add VITE_CONTACT_EMAIL to .env.local.',
    quoteOpened: 'An email draft with your enquiry is open. Review it and press Send.',
    aboutTitle: 'People, place and a good instinct.',
    aboutText: 'Truffle Balkans connects the region’s remarkable terroirs with chefs and curious cooks who want to know what is on their plate — and where it comes from.',
    trufflesTitle: 'Meet the truffles',
    blogTitle: 'Notes from woodland and kitchen',
    contactTitle: 'Let’s talk truffles.',
    contactText: 'For current availability, grades or wholesale enquiries, send us a note.',
    faqPageTitle: 'Questions about truffles',
    form: { name: 'Full name', email: 'Work email', phone: 'Phone', company: 'Restaurant / company', message: 'Notes for your enquiry', send: 'Request a quotation', sent: 'Your enquiry is ready.', product: 'Truffle variety', quantity: 'Approximate quantity', quantityHint: 'e.g. 500 g per delivery', country: 'Delivery country', delivery: 'Preferred delivery date', selectProduct: 'Choose a variety' },
    availability: 'Seasonal availability', originLabel: 'Origin', season: 'Season', grade: 'Selection', inquire: 'Enquire for pricing', learn: 'Discover more',
    back: 'Back to all', related: 'You may also like', freshness: 'Freshness follows the season',
    navMore: 'More', allProducts: 'Products', contactNote: 'We work to order and personally confirm every availability.',
  },
  it: {
    nav: { home: 'Home', products: 'Tartufi per chef', truffles: 'Guida ai tartufi', wholesale: 'Per ristoranti', about: 'Chi siamo', blog: 'Diario', contact: 'Contatti' },
    cta: 'Richiesta B2B',
    heroEyebrow: 'TARTUFI SELVATICI PER CUCINE PROFESSIONALI',
    heroTitle: 'Il sapore della natura.',
    heroText: 'Tartufi balcanici di stagione per menu dal carattere distintivo. Raccontaci la tua cucina: confermeremo varietà, calibro e disponibilità.',
    discover: 'Scopri la selezione',
    origin: 'Dal cuore dei Balcani',
    featured: 'Per il menu di stagione',
    featuredIntro: 'Quattro varietà dal carattere distinto, con calibro e disponibilità confermati secondo il raccolto.',
    viewAll: 'Scopri tutti i prodotti',
    species: 'Sotto terra. Nella loro stagione.',
    speciesText: 'Ogni tartufo ha un proprio ritmo, profumo e posto in tavola. Scopri cosa rende ciascuno unico.',
    reasonsEyebrow: 'LA NOSTRA FILOSOFIA',
    reasonsTitle: 'Natura autentica. Origine chiara.',
    reasonsText: 'Seguiamo il ritmo del bosco e ci affidiamo a chi lo conosce davvero.',
    reasons: [
      ['Territori locali', 'Aree selezionate in Bulgaria e nei Balcani, tra terreni particolari e boschi autoctoni.'],
      ['Selezione manuale', 'Ogni tartufo viene valutato per freschezza, maturazione e profumo autentico.'],
      ['Al momento giusto', 'La raccolta stagionale e la cura nella lavorazione preservano il carattere naturale del prodotto.'],
    ],
    landscapeEyebrow: 'LA NATURA HA UN INDIRIZZO',
    landscapeTitle: 'Terra balcanica. Carattere unico.',
    landscapeText: 'Colline calcaree, antiche querce e un clima montano variegato creano le condizioni per tartufi dalla provenienza riconoscibile.',
    processEyebrow: 'DAL BOSCO ALLA CUCINA',
    processTitle: 'Trovato con cura. Scelto con esperienza.',
    processText: 'Collaboriamo con chi legge il bosco attraverso il terreno e l’istinto di un cane addestrato. Ogni tartufo viene poi selezionato e preparato con attenzione.',
    quality: 'Freschezza, senza compromessi',
    qualityText: 'Il tartufo è un prodotto vivo e stagionale. Lavoriamo piccole quantità e confermiamo ogni richiesta in base alla disponibilità reale.',
    faqTitle: 'Domande frequenti',
    faq: [
      ['Da dove provengono i tartufi?', 'Selezioniamo tartufi selvatici dalla Bulgaria e da altri territori adatti dei Balcani. La provenienza varia secondo la specie e la stagione.'],
      ['Come viene confermata la disponibilità?', 'I tartufi si raccolgono stagionalmente. Confermiamo specie, calibro e disponibilità dopo la richiesta, secondo il raccolto attuale.'],
      ['Come si conservano i tartufi freschi?', 'Conservali in frigorifero, in un contenitore chiuso con carta assorbente da cambiare ogni giorno. Gustali il prima possibile.'],
    ],
    finalTitle: 'Il prossimo menu nasce nel bosco.',
    finalText: 'Indicaci varietà e quantità desiderate. Ti risponderemo con disponibilità, calibro e opzioni di consegna.',
    footerText: 'Tartufi selvatici e sapori dei Balcani. Selezionati con rispetto per la terra e la stagione.',
    imageCredits: 'Crediti e licenze delle immagini',
    productsTitle: 'Una selezione per cucine professionali',
    productsIntro: 'Tartufi freschi dei Balcani, disponibili secondo la stagione e con calibro da confermare. Il prezzo varia secondo varietà, pezzatura e raccolto.',
    wholesaleTitle: 'Tartufi scelti per il tuo menu.',
    wholesaleIntro: 'Tartufi freschi dei Balcani per ristoranti. Indicaci varietà, quantità orientativa e tempi; ti risponderemo con disponibilità e un preventivo dedicato.',
    wholesaleEyebrow: 'PER RISTORANTI E CUCINE PROFESSIONALI',
    wholesalePoints: [['La varietà per il tuo menu', 'Tartufo nero, bianco, estivo e di Borgogna secondo la stagione.'], ['Calibro su richiesta', 'Concordiamo dimensioni e selezione con ogni richiesta.'], ['Preventivo secondo il raccolto', 'Disponibilità e prezzo attuali si confermano prima dell’ordine.']],
    wholesaleFormTitle: 'Richiedi un preventivo B2B',
    wholesaleFormText: 'Raccontaci le esigenze della tua cucina. Senza impegno.',
    quoteStatus: 'Preparazione della richiesta…',
    quoteMissingEmail: 'Il modulo è pronto, ma in locale non è configurata un’email. Aggiungi VITE_CONTACT_EMAIL in .env.local.',
    quoteOpened: 'Si è aperta un’email con la richiesta compilata. Controllala e premi Invia.',
    aboutTitle: 'Persone, territorio e buon istinto.',
    aboutText: 'Truffle Balkans avvicina i territori straordinari della regione a chef e appassionati che vogliono sapere cosa c’è nel piatto — e da dove arriva.',
    trufflesTitle: 'Alla scoperta dei tartufi',
    blogTitle: 'Appunti dal bosco e dalla cucina',
    contactTitle: 'Parliamo di tartufi.',
    contactText: 'Per disponibilità, calibro o richieste all’ingrosso, scrivici.',
    faqPageTitle: 'Le tue domande sui tartufi',
    form: { name: 'Nome e cognome', email: 'Email di lavoro', phone: 'Telefono', company: 'Ristorante / azienda', message: 'Note per la richiesta', send: 'Richiedi un preventivo', sent: 'La richiesta è pronta.', product: 'Varietà di tartufo', quantity: 'Quantità orientativa', quantityHint: 'es. 500 g per consegna', country: 'Paese di consegna', delivery: 'Data di consegna preferita', selectProduct: 'Scegli una varietà' },
    availability: 'Disponibilità stagionale', originLabel: 'Provenienza', season: 'Stagione', grade: 'Selezione', inquire: 'Richiedi un prezzo', learn: 'Scopri di più',
    back: 'Torna a tutti', related: 'Potrebbe interessarti', freshness: 'La freschezza segue la stagione',
    navMore: 'Altro', allProducts: 'Prodotti', contactNote: 'Lavoriamo su richiesta e confermiamo personalmente ogni disponibilità.',
  },
} as const;

export const copy = { ...baseCopy, ...extraCopy } as const;
export type Copy = (typeof copy)[Locale];

type LocalizedPage = { slug: string; title: string; description: string; body: string };
type TruffleId = 'black-truffle' | 'white-truffle' | 'summer-truffle' | 'burgundy-truffle';

export const truffleIds: TruffleId[] = ['black-truffle', 'white-truffle', 'summer-truffle', 'burgundy-truffle'];

export const truffles: Record<Locale, Record<TruffleId, LocalizedPage & { season: string; image: string; note: string }>> = {
  bg: {
    'black-truffle': { slug: 'black-truffle', title: 'Черен трюфел', description: 'Землист и дълбок, черният трюфел носи аромат на горска почва, лешник и топлина.', body: 'Черният трюфел е ценен заради своя многопластов аромат, който се разгръща особено добре при леко затопляне. Настърган върху прясна паста, яйца или сезонни кореноплодни, той добавя дълбочина, без да отнема характера на ястието.', season: 'Есен · зима', image: 'black-truffle', note: 'Дълбок аромат, фина сладост' },
    'white-truffle': { slug: 'white-truffle', title: 'Бял трюфел', description: 'Редък и деликатен аромат, който се разкрива най-добре без термична обработка.', body: 'Белият трюфел се сервира суров, нарязан на фини люспи непосредствено преди поднасяне. Неговият свеж аромат е най-добър върху топли, семпли ястия, които оставят пространството на продукта.', season: 'Есен · ранна зима', image: 'white-truffle', note: 'Фин аромат, най-добре суров' },
    'summer-truffle': { slug: 'summer-truffle', title: 'Летен трюфел', description: 'По-лек, с нотки на ядки и свежа горска земя; приятен избор за топлите месеци.', body: 'Летният трюфел е достъпен в по-дълъг сезон и има по-деликатен вкус от зимните си роднини. Нарязан на тънко или добавен към масло и сосове, той е чудесно начало за запознаване със света на трюфелите.', season: 'Късна пролет · лято', image: 'summer-truffle', note: 'Нежен, ядков характер' },
    'burgundy-truffle': { slug: 'burgundy-truffle', title: 'Бургундски трюфел', description: 'Елегантен есенен трюфел с аромат на ядки и подчертано балансиран характер.', body: 'Бургундският трюфел, познат и като есенен черен трюфел, предлага добре разпознаваем аромат и гъвкавост в кухнята. Подхожда на ризото, картофи, дивеч и ароматни сирена.', season: 'Късно лято · есен', image: 'burgundy-truffle', note: 'Фин баланс и топли нотки' },
  },
  en: {
    'black-truffle': { slug: 'black-truffle', title: 'Black truffle', description: 'Earthy and layered, black truffle carries notes of woodland soil, hazelnut and warmth.', body: 'Black truffle is prized for a layered aroma that opens beautifully with gentle warmth. Shaved over fresh pasta, eggs or seasonal roots, it lends depth without crowding the character of a dish.', season: 'Autumn · winter', image: 'black-truffle', note: 'Deep aroma, delicate sweetness' },
    'white-truffle': { slug: 'white-truffle', title: 'White truffle', description: 'Rare and delicate, its expressive aroma is best enjoyed without heat.', body: 'White truffle is served raw, shaved at the table just before eating. Its fresh aroma is at its best over simple, warm dishes that leave room for the ingredient to speak.', season: 'Autumn · early winter', image: 'white-truffle', note: 'Fine aroma, best served raw' },
    'summer-truffle': { slug: 'summer-truffle', title: 'Summer truffle', description: 'Lighter, with notes of hazelnut and fresh woodland earth; an easy choice for warmer months.', body: 'Summer truffle has a longer season and a gentler flavour than its winter relatives. Thinly sliced or folded into butter and sauces, it is a welcoming introduction to the world of truffles.', season: 'Late spring · summer', image: 'summer-truffle', note: 'Gentle, nutty character' },
    'burgundy-truffle': { slug: 'burgundy-truffle', title: 'Burgundy truffle', description: 'An elegant autumn truffle with a nutty aroma and a beautifully balanced character.', body: 'The Burgundy truffle, also known as autumn black truffle, brings a distinctive aroma and versatility to the kitchen. It pairs naturally with risotto, potatoes, game and aromatic cheeses.', season: 'Late summer · autumn', image: 'burgundy-truffle', note: 'Balanced and warmly aromatic' },
  },
  it: {
    'black-truffle': { slug: 'tartufo-nero', title: 'Tartufo nero', description: 'Intenso e terroso, il tartufo nero profuma di bosco, nocciola e calore.', body: 'Il tartufo nero è apprezzato per il suo profumo complesso, che si apre con un calore delicato. Grattugiato su pasta fresca, uova o ortaggi di stagione, dona profondità senza coprire il piatto.', season: 'Autunno · inverno', image: 'black-truffle', note: 'Aroma profondo, dolcezza delicata' },
    'white-truffle': { slug: 'tartufo-bianco', title: 'Tartufo bianco', description: 'Raro e delicato, dà il meglio di sé senza cottura.', body: 'Il tartufo bianco si serve crudo, affettato al momento. Il suo profumo fresco accompagna piatti caldi e semplici che lasciano spazio alla qualità dell’ingrediente.', season: 'Autunno · inizio inverno', image: 'white-truffle', note: 'Profumo fine, da servire crudo' },
    'summer-truffle': { slug: 'tartufo-estivo', title: 'Tartufo estivo', description: 'Più delicato, con note di nocciola e bosco fresco: ideale nei mesi più caldi.', body: 'Il tartufo estivo ha una stagione più lunga e un sapore gentile. A lamelle sottili oppure in un burro aromatico, è un ottimo primo incontro con il mondo dei tartufi.', season: 'Tarda primavera · estate', image: 'summer-truffle', note: 'Carattere gentile e nocciolato' },
    'burgundy-truffle': { slug: 'tartufo-di-borgogna', title: 'Tartufo di Borgogna', description: 'Un elegante tartufo autunnale, dal profumo di nocciola e carattere equilibrato.', body: 'Il tartufo di Borgogna, detto anche tartufo nero autunnale, ha un aroma riconoscibile e una grande versatilità. Si abbina a risotti, patate, selvaggina e formaggi aromatici.', season: 'Fine estate · autunno', image: 'burgundy-truffle', note: 'Equilibrato e avvolgente' },
  },
  fr: {
    'black-truffle': { slug: 'truffe-noire', title: 'Truffe noire', description: 'Profonde et terreuse, la truffe noire évoque la forêt, la noisette et les sous-bois.', body: 'La truffe noire révèle toute sa complexité avec une chaleur douce. Râpée sur des pâtes fraîches, des œufs ou des légumes de saison, elle apporte de la profondeur sans masquer le plat.', season: 'Automne · hiver', image: 'black-truffle', note: 'Arôme profond, douceur délicate' },
    'white-truffle': { slug: 'truffe-blanche', title: 'Truffe blanche', description: 'Rare et délicate, elle exprime pleinement son parfum sans cuisson.', body: 'La truffe blanche se sert crue, en fines lamelles au dernier moment. Son parfum délicat accompagne les plats chauds et simples qui lui laissent toute sa place.', season: 'Automne · début d’hiver', image: 'white-truffle', note: 'Parfum fin, à servir cru' },
    'summer-truffle': { slug: 'truffe-d-ete', title: 'Truffe d’été', description: 'Plus douce, aux notes de noisette et de terre fraîche, elle accompagne les beaux jours.', body: 'La truffe d’été bénéficie d’une saison plus longue et d’un goût délicat. En fines lamelles ou mêlée au beurre, elle est une belle introduction à l’univers des truffes.', season: 'Fin du printemps · été', image: 'summer-truffle', note: 'Caractère doux et gourmand' },
    'burgundy-truffle': { slug: 'truffe-de-bourgogne', title: 'Truffe de Bourgogne', description: 'Une truffe d’automne élégante, aux notes de noisette et à l’équilibre subtil.', body: 'La truffe de Bourgogne, aussi appelée truffe de la Saint-Jean, offre un parfum net et une belle polyvalence. Elle accompagne risottos, pommes de terre, gibier et fromages affinés.', season: 'Fin d’été · automne', image: 'burgundy-truffle', note: 'Équilibre fin, notes chaleureuses' },
  },
  de: {
    'black-truffle': { slug: 'schwarze-trueffel', title: 'Schwarze Trüffel', description: 'Erdig und vielschichtig, mit Noten von Waldboden, Haselnuss und Wärme.', body: 'Bei sanfter Wärme entfaltet die schwarze Trüffel ihr vielschichtiges Aroma. Fein gehobelt über frischer Pasta, Ei oder saisonalem Gemüse bringt sie Tiefe, ohne den Eigengeschmack des Gerichts zu überdecken.', season: 'Herbst · Winter', image: 'black-truffle', note: 'Kräftiges Aroma, feine Süße' },
    'white-truffle': { slug: 'weisse-trueffel', title: 'Weiße Trüffel', description: 'Selten und fein im Aroma; am besten ohne Hitze serviert.', body: 'Weiße Trüffel wird roh und erst kurz vor dem Servieren in feinen Scheiben gehobelt. Ihr Duft passt zu warmen, schlichten Gerichten, die dem Produkt Raum lassen.', season: 'Herbst · Frühwinter', image: 'white-truffle', note: 'Feines Aroma, roh serviert' },
    'summer-truffle': { slug: 'sommertrueffel', title: 'Sommertrüffel', description: 'Milder mit nussigen Noten und frischem Waldboden, ideal für die warme Jahreszeit.', body: 'Sommertrüffel hat eine längere Saison und ein zurückhaltenderes Aroma als Winterarten. Fein gehobelt oder in Butter und Saucen entfaltet sie ihren eigenen, sanften Charakter.', season: 'Spätfrühling · Sommer', image: 'summer-truffle', note: 'Mild und nussig' },
    'burgundy-truffle': { slug: 'burgundertrueffel', title: 'Burgundertrüffel', description: 'Eine elegante Herbsttrüffel mit nussigem Duft und ausgewogenem Charakter.', body: 'Die Burgundertrüffel, auch Herbsttrüffel genannt, ist aromatisch und vielseitig. Sie passt zu Risotto, Kartoffeln, Wild und würzigem Käse.', season: 'Spätsommer · Herbst', image: 'burgundy-truffle', note: 'Ausgewogen mit warmen Noten' },
  },
};

export const articles: Record<Locale, Record<string, LocalizedPage & { date: string; image: string; paragraphs: string[] }>> = {
  bg: {
    storage: { slug: 'fresh-truffle-storage', title: 'Как да съхраняваме пресни трюфели', description: 'Краткият живот на свежия трюфел е част от чара му. Ето как да запазите аромата му у дома.', body: 'Практичен наръчник за свежестта', date: '12.09.2025', image: 'summer-truffle', paragraphs: ['Свежият трюфел не е продукт за дълго съхранение — ароматът му е най-пълноценен скоро след събирането. У дома дръжте трюфела в хладилник, в малък затворен стъклен съд.', 'Поставете го върху чиста абсорбираща хартия и я сменяйте всеки ден, за да ограничите излишната влага. Не го мийте предварително; почистете го внимателно непосредствено преди употреба.', 'Най-добрият съвет е и най-прост: планирайте ястието си скоро. Тънко настърган върху топла паста или яйца, пресният трюфел не се нуждае от сложна подготовка.'] },
    'black-and-white': { slug: 'black-vs-white-truffle', title: 'Черен и бял трюфел: каква е разликата?', description: 'Два ценени трюфела, различен аромат и различен начин на сервиране.', body: 'Два характера, еднакво сезонни', date: '03.10.2025', image: 'photo-1551183053-bf91a1d81141', paragraphs: ['Черният и белият трюфел се различават не само по цвят. Ароматът, сезонът и начинът на употреба в кухнята имат значение при избора.', 'Черният трюфел обикновено понася леко затопляне и добавя земна дълбочина към паста и сосове. Белият е по-деликатен и най-често се сервира суров, на фини люспи върху топло ястие.', 'Няма универсално по-добър избор — важни са сезонът, свежестта и ястието, което приготвяте.'] },
    'balkan-truffles': { slug: 'truffles-of-the-balkans', title: 'Трюфелите на Балканите', description: 'Разнообразни тероари, вековни гори и тиха работа в сърцето на природата.', body: 'Вкус, оформен от мястото', date: '21.10.2025', image: 'photo-1448375240586-882707db888b', paragraphs: ['Балканският полуостров съчетава варовикови почви, разнообразни гори и климатични условия, които се променят от долината до планината.', 'Трюфелите растат в естествена симбиоза с определени дървета. Откриването им изисква познаване на терена, подходящ сезон и обучено куче.', 'Разказът за всеки трюфел започва от почвата. Ясният произход и грижливият подбор помагат на готвача да избере продукт, който отговаря на менюто и момента.'] },
  },
  en: {
    storage: { slug: 'storing-fresh-truffles', title: 'How to store fresh truffles', description: 'A fresh truffle’s short life is part of its charm. Here is how to preserve its aroma at home.', body: 'A practical guide to freshness', date: '12 Sep 2025', image: 'summer-truffle', paragraphs: ['Fresh truffles are not made for long storage; their aroma is at its best soon after harvest. At home, keep a truffle refrigerated in a small, sealed glass container.', 'Set it on clean absorbent paper and replace the paper daily to reduce excess moisture. Do not wash it in advance; brush it gently just before use.', 'The best advice is also the simplest: plan to enjoy it soon. Shaved over warm pasta or eggs, a fresh truffle needs very little preparation.'] },
    'black-and-white': { slug: 'black-vs-white-truffle', title: 'Black and white truffles: what is the difference?', description: 'Two celebrated truffles, with distinct aromas and different ways of serving.', body: 'Two characters, both seasonal', date: '03 Oct 2025', image: 'photo-1551183053-bf91a1d81141', paragraphs: ['Black and white truffles differ in more than colour. Their aroma, season and best use in the kitchen all matter when choosing between them.', 'Black truffle usually welcomes gentle warmth, bringing earthy depth to pasta and sauces. White truffle is more delicate and is typically served raw, shaved over a warm dish.', 'There is no universally better choice. Season, freshness and the dish you are preparing should guide you.'] },
    'balkan-truffles': { slug: 'balkan-truffles', title: 'Truffles of the Balkans', description: 'Distinctive terroirs, old forests and careful work in the heart of nature.', body: 'Flavour shaped by place', date: '21 Oct 2025', image: 'photo-1448375240586-882707db888b', paragraphs: ['The Balkan peninsula brings together limestone soils, varied woodland and a climate that changes from valley to mountain.', 'Truffles grow in natural partnership with particular trees. Finding them calls for knowledge of the land, the right season and a trained dog.', 'Every truffle’s story begins in the soil. Clear provenance and thoughtful selection help a chef choose an ingredient for the menu and the moment.'] },
  },
  it: {
    storage: { slug: 'conservare-i-tartufi-freschi', title: 'Come conservare i tartufi freschi', description: 'La breve vita di un tartufo fresco è parte del suo fascino. Ecco come proteggerne il profumo.', body: 'Una guida pratica alla freschezza', date: '12 set 2025', image: 'summer-truffle', paragraphs: ['Il tartufo fresco non è un prodotto da conservare a lungo: il suo profumo è più intenso poco dopo la raccolta. A casa, tienilo in frigorifero in un piccolo contenitore di vetro chiuso.', 'Appoggialo su carta assorbente pulita e cambiala ogni giorno. Non lavarlo in anticipo; puliscilo delicatamente poco prima di usarlo.', 'Il consiglio migliore è il più semplice: gustalo presto. A lamelle sottili su pasta calda o uova, il tartufo fresco non richiede preparazioni elaborate.'] },
    'black-and-white': { slug: 'tartufo-nero-e-bianco', title: 'Tartufo nero e bianco: qual è la differenza?', description: 'Due tartufi pregiati, profumi distinti e modi diversi di servirli.', body: 'Due caratteri, entrambi stagionali', date: '03 ott 2025', image: 'photo-1551183053-bf91a1d81141', paragraphs: ['La differenza tra tartufo nero e bianco non è solo nel colore. Profumo, stagione e utilizzo in cucina contano nella scelta.', 'Il tartufo nero si presta a un calore delicato e regala profondità a pasta e salse. Il bianco è più delicato e si serve di solito crudo, a lamelle su un piatto caldo.', 'Non esiste una scelta migliore in assoluto: stagione, freschezza e ricetta sono le guide più utili.'] },
    'balkan-truffles': { slug: 'tartufi-dei-balcani', title: 'I tartufi dei Balcani', description: 'Territori diversi, boschi antichi e un lavoro attento nel cuore della natura.', body: 'Un sapore che nasce dal territorio', date: '21 ott 2025', image: 'photo-1448375240586-882707db888b', paragraphs: ['La penisola balcanica unisce terreni calcarei, boschi diversi e condizioni climatiche che cambiano dalla valle alla montagna.', 'I tartufi crescono in simbiosi naturale con alcune specie arboree. Per trovarli servono conoscenza del territorio, stagione giusta e un cane addestrato.', 'La storia di ogni tartufo comincia dal terreno. Provenienza chiara e selezione attenta aiutano lo chef a scegliere l’ingrediente giusto per il menu e il momento.'] },
  },
  fr: {
    storage: { slug: 'conserver-truffes-fraiches', title: 'Comment conserver les truffes fraîches', description: 'La fraîcheur fait partie du caractère de la truffe. Voici comment préserver son parfum chez vous.', body: 'Quelques gestes pour préserver le parfum', date: '12 sept. 2025', image: 'summer-truffle', paragraphs: ['La truffe fraîche se conserve peu de temps : son parfum est le plus expressif juste après la récolte. À la maison, placez-la au réfrigérateur dans un petit récipient en verre fermé.', 'Posez-la sur du papier absorbant propre et changez-le chaque jour pour limiter l’humidité. Ne la lavez pas à l’avance ; brossez-la délicatement juste avant de la préparer.', 'Le meilleur conseil est simple : dégustez-la rapidement. Quelques lamelles sur des pâtes chaudes ou des œufs suffisent à la mettre en valeur.'] },
    'black-and-white': { slug: 'truffe-noire-ou-blanche', title: 'Truffe noire ou blanche : quelles différences ?', description: 'Deux variétés recherchées, des parfums et des usages bien distincts.', body: 'Deux variétés, deux façons de les servir', date: '3 oct. 2025', image: 'black-truffle', paragraphs: ['La différence entre truffe noire et truffe blanche ne tient pas seulement à la couleur. Le parfum, la saison et la préparation comptent aussi.', 'La truffe noire supporte une chaleur douce et apporte de la profondeur aux pâtes et aux sauces. Plus délicate, la truffe blanche est généralement servie crue, en fines lamelles.', 'Il n’existe pas de meilleur choix dans l’absolu : la saison, la fraîcheur et le plat guident la sélection.'] },
    'balkan-truffles': { slug: 'truffes-des-balkans', title: 'Les truffes des Balkans', description: 'Des terroirs variés, des forêts anciennes et un savoir-faire proche de la nature.', body: 'Un goût façonné par le lieu', date: '21 oct. 2025', image: 'photo-1448375240586-882707db888b', paragraphs: ['La péninsule balkanique réunit sols calcaires, forêts diverses et climats qui changent d’une vallée à l’autre.', 'Les truffes vivent en symbiose naturelle avec certains arbres. Leur recherche demande une bonne connaissance du terrain, la bonne saison et un chien dressé.', 'L’histoire de chaque truffe commence dans son sol. Une origine claire et une sélection attentive aident les chefs à choisir le bon produit pour leur menu.'] },
  },
  de: {
    storage: { slug: 'frische-trueffel-aufbewahren', title: 'Frische Trüffel richtig aufbewahren', description: 'Frische gehört zum Charakter der Trüffel. So bleibt ihr Aroma zu Hause möglichst lange erhalten.', body: 'So bleibt das Aroma erhalten', date: '12. Sep. 2025', image: 'summer-truffle', paragraphs: ['Frische Trüffel sind nur kurz haltbar; ihr Aroma ist direkt nach der Ernte am ausgeprägtesten. Zu Hause lagern Sie die Trüffel im Kühlschrank in einem kleinen, geschlossenen Glasbehälter.', 'Legen Sie sie auf sauberes Küchenpapier und wechseln Sie dieses täglich, damit sich keine Feuchtigkeit staut. Waschen Sie die Trüffel nicht vorab, sondern bürsten Sie sie erst unmittelbar vor der Verwendung vorsichtig ab.', 'Am besten genießen Sie sie bald. Fein über warme Pasta oder Ei gehobelt, braucht frische Trüffel nur wenig Vorbereitung.'] },
    'black-and-white': { slug: 'schwarze-oder-weisse-trueffel', title: 'Schwarze oder weiße Trüffel: der Unterschied', description: 'Zwei begehrte Sorten mit unterschiedlichem Aroma und Einsatz in der Küche.', body: 'Zwei Sorten, zwei Arten des Genießens', date: '3. Okt. 2025', image: 'black-truffle', paragraphs: ['Schwarze und weiße Trüffel unterscheiden sich nicht nur in der Farbe. Aroma, Saison und Zubereitung sind ebenfalls verschieden.', 'Schwarze Trüffel entfaltet ihr erdiges Aroma auch bei sanfter Wärme und passt zu Pasta und Saucen. Die feinere weiße Trüffel wird meist roh über warme Gerichte gehobelt.', 'Die passende Wahl hängt von Erntezeit, Frische und dem Gericht ab, das Sie servieren möchten.'] },
    'balkan-truffles': { slug: 'trueffel-vom-balkan', title: 'Trüffel vom Balkan', description: 'Vielfältige Böden, alte Wälder und sorgfältige Arbeit im Einklang mit der Natur.', body: 'Aroma, geprägt von seiner Herkunft', date: '21. Okt. 2025', image: 'photo-1448375240586-882707db888b', paragraphs: ['Die Balkanhalbinsel vereint kalkhaltige Böden, unterschiedliche Waldlandschaften und ein Klima, das sich von Tal zu Tal verändert.', 'Trüffel wachsen in natürlicher Partnerschaft mit bestimmten Baumarten. Ihre Suche verlangt Ortskenntnis, den richtigen Zeitpunkt und einen ausgebildeten Hund.', 'Die Geschichte jeder Trüffel beginnt im Boden. Eine nachvollziehbare Herkunft und sorgfältige Auswahl helfen Küchen, passend zur Saison einzukaufen.'] },
  },
};

const staticKeys: PageKey[] = ['home', 'products', 'wholesale', 'about', 'truffles', 'blog', 'contact', 'faq', 'privacy', 'terms', 'cookies'];

export function allPageKeys(): PageKey[] {
  return [...staticKeys, ...truffleIds.flatMap((id) => [`product:${id}` as PageKey, `truffle:${id}` as PageKey]), ...Object.keys(articles.en).map((id) => `article:${id}` as PageKey)];
}

export function pathFor(locale: Locale, key: PageKey): string {
  if (key === 'home') return `/${locale}/`;
  const [group, id] = key.split(':');
  if (group === 'product' || group === 'truffle') return `/${locale}/${group === 'product' ? pageSlugs[locale].products : pageSlugs[locale].truffles}/${truffles[locale][id as TruffleId].slug}`;
  if (group === 'article') return `/${locale}/${pageSlugs[locale].blog}/${articles[locale][id].slug}`;
  return `/${locale}/${pageSlugs[locale][key] ?? key}`;
}

export function keyForPath(pathname: string): { locale: Locale; key: PageKey } | null {
  const cleanPath = pathname.replace(/\/+$/, '') || '/';
  const locale = cleanPath.split('/')[1] as Locale;
  if (!locales.includes(locale)) return null;
  for (const key of allPageKeys()) if (pathFor(locale, key).replace(/\/+$/, '') === cleanPath) return { locale, key };
  return null;
}

export function truffleFor(key: PageKey, locale: Locale): (typeof truffles)[Locale][TruffleId] | undefined {
  if (!key.startsWith('product:') && !key.startsWith('truffle:')) return undefined;
  return truffles[locale][key.split(':')[1] as TruffleId];
}

export function articleFor(key: PageKey, locale: Locale) {
  return key.startsWith('article:') ? articles[locale][key.split(':')[1]] : undefined;
}

export function titleFor(key: PageKey, locale: Locale): string {
  const t = copy[locale];
  const product = truffleFor(key, locale);
  const article = articleFor(key, locale);
  const legalTitles = {
    bg: { privacy: 'Поверителност', terms: 'Общи условия', cookies: 'Бисквитки' },
    en: { privacy: 'Privacy policy', terms: 'Terms & conditions', cookies: 'Cookie policy' },
    it: { privacy: 'Privacy', terms: 'Termini e condizioni', cookies: 'Cookie' },
    fr: { privacy: 'Confidentialité', terms: 'Conditions générales', cookies: 'Cookies' },
    de: { privacy: 'Datenschutz', terms: 'AGB', cookies: 'Cookies' },
  } satisfies Record<Locale, Record<'privacy' | 'terms' | 'cookies', string>>;
  if (product) return product.title;
  if (article) return article.title;
  const titles: Record<string, string> = {
    home: 'Wild Balkan truffles', products: t.productsTitle, wholesale: t.wholesaleTitle, about: t.aboutTitle,
    truffles: t.trufflesTitle, blog: t.blogTitle, contact: t.contactTitle,
    faq: t.faqPageTitle, privacy: legalTitles[locale].privacy, terms: legalTitles[locale].terms, cookies: legalTitles[locale].cookies,
  };
  return titles[key] ?? t.heroTitle;
}

export function seoFor(locale: Locale, key: PageKey) {
  const product = truffleFor(key, locale);
  const article = articleFor(key, locale);
  const title = key === 'home' ? `${copy[locale].heroTitle} | Truffle Balkans` : `${titleFor(key, locale)} | Truffle Balkans`;
  const description = product?.description ?? article?.description ?? (
    key === 'home' ? copy[locale].heroText :
    key === 'products' ? copy[locale].productsIntro :
    key === 'wholesale' ? copy[locale].wholesaleIntro :
    key === 'about' ? copy[locale].aboutText :
    key === 'contact' ? copy[locale].contactText :
    key === 'truffles' ? copy[locale].speciesText :
    key === 'blog' ? copy[locale].blogTitle :
    copy[locale].faqTitle
  );
  return { title, description };
}

const commonsImages: Record<string, { directory: string; file: string }> = {
  'black-truffle': { directory: 'e/e5', file: 'Diamant_noir_Tuber_melanosporum.jpg' },
  'white-truffle': { directory: '5/51', file: 'Tuber_Magnatum_Pico.jpg' },
  'summer-truffle': { directory: '2/2b', file: 'Black.summer.truffle.arp.jpg' },
  'burgundy-truffle': { directory: 'c/ca', file: 'Truffes_de_Bourgogne_-_Tuber_uncinatum.JPG' },
  'photo-1551183053-bf91a1d81141': { directory: 'e/e5', file: 'Diamant_noir_Tuber_melanosporum.jpg' },
};

export function imageUrl(id: string, width = 1200) {
  const commonsImage = commonsImages[id];
  if (commonsImage) {
    return `https://upload.wikimedia.org/wikipedia/commons/thumb/${commonsImage.directory}/${commonsImage.file}/1280px-${commonsImage.file}`;
  }
  return `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=82`;
}
