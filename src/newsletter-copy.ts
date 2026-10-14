import type { Locale } from './i18n';

export const newsletterCopy: Record<Locale, {
  title: string; intro: string; message: string; heading: string; description: string;
  email: string; subscribe: string; sending: string; consent: string; privacy: string;
  success: string; error: string; unavailable: string; checking: string;
  unsubscribe: string; unsubscribeMessage: string; privacyInfo: string;
}> = {
  bg: {
    title: 'Поискайте актуални цени за трюфели.', intro: 'Посочете вида, количеството и държавата за доставка.',
    message: 'Здравейте! Бих искал/а актуални цени за трюфели. Вид: … Количество: … Държава за доставка: …',
    heading: 'Сезонът във вашата поща.', description: 'Абонирайте се за новини от реколтата и актуални наличности.',
    email: 'Вашият имейл', subscribe: 'Абонирайте се', sending: 'Записване…',
    consent: 'Искам да получавам имейли от Esi Truffle EOOD за реколтата и наличностите.', privacy: 'Поверителност',
    success: 'Благодарим! Абонаментът ви е записан.', error: 'Не успяхме да запишем абонамента. Опитайте отново или ни пишете в WhatsApp.',
    unavailable: 'Абонаментът скоро ще е достъпен. За текущи наличности ни пишете в WhatsApp.', checking: 'Подготвяме формата…',
    unsubscribe: 'Поискайте отписване', unsubscribeMessage: 'Здравейте! Искам да се отпиша от имейл бюлетина. Имейл адресът ми е: …',
    privacyInfo: 'При абонамент Esi Truffle EOOD записва вашия имейл, избрания език и датата на съгласието в базата на сайта в Supabase. Използваме ги за новини за реколтата и наличностите. Пазим абонамента, докато не поискате отписване. Можете да поискате отписване и изтриване на адреса чрез WhatsApp.',
  },
  en: {
    title: 'Request current truffle prices.', intro: 'Tell us the species, quantity and delivery country.',
    message: 'Hello! I would like current truffle prices. Species: … Quantity: … Delivery country: …',
    heading: 'The season in your inbox.', description: 'Subscribe for harvest news and current availability.',
    email: 'Your email', subscribe: 'Subscribe', sending: 'Subscribing…',
    consent: 'I would like harvest and availability emails from Esi Truffle EOOD.', privacy: 'Privacy',
    success: 'Thank you! Your subscription has been saved.', error: 'We could not save your subscription. Please try again or message us on WhatsApp.',
    unavailable: 'Email subscriptions will be available soon. For current availability, message us on WhatsApp.', checking: 'Preparing the form…',
    unsubscribe: 'Request to unsubscribe', unsubscribeMessage: 'Hello! I would like to unsubscribe from the newsletter. My email address is: …',
    privacyInfo: 'When you subscribe, Esi Truffle EOOD stores your email, chosen language and consent date in the site’s Supabase database. We use them for harvest and availability news. We retain your subscription until you request removal. You can request to unsubscribe and have your address deleted through WhatsApp.',
  },
  it: {
    title: 'Richiedi i prezzi attuali dei tartufi.', intro: 'Indica specie, quantità e paese di consegna.',
    message: 'Buongiorno! Vorrei i prezzi attuali dei tartufi. Specie: … Quantità: … Paese di consegna: …',
    heading: 'La stagione nella tua posta.', description: 'Iscriviti per le novità del raccolto e le disponibilità attuali.',
    email: 'La tua email', subscribe: 'Iscriviti', sending: 'Iscrizione…',
    consent: 'Desidero ricevere email di Esi Truffle EOOD sul raccolto e le disponibilità.', privacy: 'Privacy',
    success: 'Grazie! La tua iscrizione è stata registrata.', error: 'Non è stato possibile registrare l’iscrizione. Riprova o scrivici su WhatsApp.',
    unavailable: 'Le iscrizioni saranno disponibili a breve. Per le disponibilità attuali, scrivici su WhatsApp.', checking: 'Preparazione del modulo…',
    unsubscribe: 'Richiedi la cancellazione', unsubscribeMessage: 'Buongiorno! Vorrei cancellare l’iscrizione alla newsletter. La mia email è: …',
    privacyInfo: 'Con l’iscrizione, Esi Truffle EOOD registra email, lingua scelta e data del consenso nel database Supabase del sito, per inviare novità sul raccolto e le disponibilità. Conserviamo l’iscrizione fino alla richiesta di cancellazione. Puoi richiedere la cancellazione dell’iscrizione e dell’indirizzo tramite WhatsApp.',
  },
  fr: {
    title: 'Demandez les prix actuels des truffes.', intro: 'Précisez la variété, la quantité et le pays de livraison.',
    message: 'Bonjour ! Je souhaite les prix actuels des truffes. Variété : … Quantité : … Pays de livraison : …',
    heading: 'La saison dans votre boîte mail.', description: 'Abonnez-vous aux nouvelles de la récolte et aux disponibilités.',
    email: 'Votre adresse e-mail', subscribe: 'S’abonner', sending: 'Inscription…',
    consent: 'Je souhaite recevoir les e-mails d’Esi Truffle EOOD sur la récolte et les disponibilités.', privacy: 'Confidentialité',
    success: 'Merci ! Votre inscription a été enregistrée.', error: 'L’inscription n’a pas pu être enregistrée. Réessayez ou écrivez-nous sur WhatsApp.',
    unavailable: 'Les inscriptions seront bientôt disponibles. Pour les disponibilités actuelles, écrivez-nous sur WhatsApp.', checking: 'Préparation du formulaire…',
    unsubscribe: 'Demander la désinscription', unsubscribeMessage: 'Bonjour ! Je souhaite me désinscrire de la newsletter. Mon adresse e-mail est : …',
    privacyInfo: 'Lors de l’inscription, Esi Truffle EOOD enregistre votre e-mail, la langue choisie et la date du consentement dans la base Supabase du site, pour les nouvelles de la récolte et les disponibilités. L’inscription est conservée jusqu’à votre demande de suppression. Vous pouvez demander la désinscription et la suppression de votre adresse via WhatsApp.',
  },
  de: {
    title: 'Fragen Sie aktuelle Trüffelpreise an.', intro: 'Nennen Sie Sorte, Menge und Lieferland.',
    message: 'Guten Tag! Ich möchte aktuelle Trüffelpreise anfragen. Sorte: … Menge: … Lieferland: …',
    heading: 'Die Saison in Ihrem Postfach.', description: 'Abonnieren Sie Neuigkeiten zur Ernte und aktuellen Verfügbarkeit.',
    email: 'Ihre E-Mail-Adresse', subscribe: 'Abonnieren', sending: 'Wird gespeichert…',
    consent: 'Ich möchte E-Mails von Esi Truffle EOOD zu Ernte und Verfügbarkeit erhalten.', privacy: 'Datenschutz',
    success: 'Vielen Dank! Ihr Abonnement wurde gespeichert.', error: 'Das Abonnement konnte nicht gespeichert werden. Versuchen Sie es erneut oder schreiben Sie uns auf WhatsApp.',
    unavailable: 'Das Abonnement ist bald verfügbar. Für aktuelle Bestände schreiben Sie uns auf WhatsApp.', checking: 'Das Formular wird vorbereitet…',
    unsubscribe: 'Abmeldung anfragen', unsubscribeMessage: 'Guten Tag! Ich möchte den Newsletter abbestellen. Meine E-Mail-Adresse lautet: …',
    privacyInfo: 'Bei der Anmeldung speichert Esi Truffle EOOD Ihre E-Mail-Adresse, Sprache und den Zeitpunkt der Einwilligung in der Supabase-Datenbank der Website, für Nachrichten zu Ernte und Verfügbarkeit. Wir speichern die Anmeldung bis zu Ihrer Löschanfrage. Sie können die Abmeldung und Löschung Ihrer Adresse über WhatsApp anfragen.',
  },
};
