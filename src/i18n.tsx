import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type Locale = "es" | "ca" | "en" | "eu";

type TranslationDict = Record<Locale, Record<string, string>>;

const translations: TranslationDict = {
  es: {
    "lang.es": "Castellano",
    "lang.ca": "Catala",
    "lang.en": "English",
    "lang.eu": "Euskara",

    "nav.results": "Resultados",
    "nav.vote": "Votar",
    "nav.admin": "Admin",
    "nav.back": "Volver",
    "nav.backHome": "Volver al inicio",
    "nav.language": "Idioma",

    "common.by": "por {author}",
    "common.sendVotes": "Enviar votos",
    "common.sending": "Enviando...",
    "common.error": "Error",
    "common.delete": "Eliminar",

    "index.heroTitle": "Los pintxos mas locos",
    "index.heroSubtitle": "Descubre los pintxos que compiten en AITORTILLA y vota sin piedad",
    "index.emptyTitle": "Aun no hay pintxos registrados",
    "index.emptySubtitle": "Los pintxos apareceran aqui cuando el organizador los publique",
    "index.footerMotto": "que gane el mejor pintxo",

    "vote.welcomeTitle": "Bienvenido!",
    "vote.welcomeDescription": "Elige un pintxo por cada categoria",
    "vote.closedTitle": "Votacion cerrada",
    "vote.closedDescription": "La votacion ha finalizado. Gracias por participar!",
    "vote.accessTitle": "Accede para votar",
    "vote.accessDescription": "Introduce tu codigo de acceso para votar",
    "vote.codePlaceholder": "Tu codigo (ej: ABC123)",
    "vote.validating": "Validando...",
    "vote.access": "Acceder",
    "vote.headerTitle": "Votar",
    "vote.selectedCount": "{selected}/{total} categorias seleccionadas",
    "vote.noDishes": "No hay pintxos para votar",
    "vote.selectionDone": "Seleccion hecha (editable)",
    "vote.deselect": "Deseleccionar",
    "vote.choose": "Elegir este pintxo",
    "vote.codeUsedTitle": "Codigo ya utilizado",
    "vote.codeUsedDescription": "Este codigo ya envio sus votos y no permite rectificaciones.",
    "vote.invalidCodeTitle": "Codigo invalido",
    "vote.invalidCodeDescription": "Verifica tu codigo de acceso",
    "vote.validationErrorDescription": "No se pudo validar el codigo",
    "vote.missingCategoriesTitle": "Faltan categorias por votar",
    "vote.missingCategoriesDescription": "Debes seleccionar un pintxo en las {total} categorias antes de enviar.",
    "vote.votesSentTitle": "Votos enviados",
    "vote.sendErrorTitle": "Error al enviar votos",
    "vote.sendErrorDescription": "Intentalo de nuevo",

    "results.unavailableTitle": "Resultados no disponibles",
    "results.unavailableDescription": "Los resultados se publicaran cuando el organizador lo decida",
    "results.title": "Resultados",
    "results.noVotesInCategory": "Sin votos en esta categoria",

    "adminLogin.title": "Panel de Administracion",
    "adminLogin.subtitle": "Acceso solo para organizadores",
    "adminLogin.email": "Email",
    "adminLogin.password": "Contrasena",
    "adminLogin.signingIn": "Entrando...",
    "adminLogin.signIn": "Entrar",
    "adminLogin.accessErrorTitle": "Error de acceso",

    "admin.title": "Admin",
    "admin.logout": "Salir",
    "admin.loading": "Cargando...",
    "admin.tab.dishes": "Pintxos",
    "admin.tab.categories": "Categorias",
    "admin.tab.codes": "Codigos",
    "admin.tab.results": "Resultados",
    "admin.tab.settings": "Ajustes",

    "admin.dishes.addTitle": "Anadir pintxo",
    "admin.dishes.name": "Nombre del pintxo",
    "admin.dishes.author": "Autor / Chef",
    "admin.dishes.description": "Descripcion",
    "admin.dishes.photo": "Foto del pintxo",
    "admin.dishes.useCamera": "Usar camara (si disponible)",
    "admin.dishes.photoSelected": "Foto seleccionada: {name}",
    "admin.dishes.addButton": "Anadir pintxo",
    "admin.dishes.added": "Pintxo anadido",
    "admin.dishes.deleted": "Pintxo eliminado",

    "admin.categories.addTitle": "Anadir categoria",
    "admin.categories.name": "Nombre",
    "admin.categories.description": "Descripcion (opcional)",
    "admin.categories.placeholder": "Ej: Mejor sabor",
    "admin.categories.addButton": "Anadir categoria",
    "admin.categories.added": "Categoria anadida",

    "admin.codes.generateTitle": "Generar codigos de acceso",
    "admin.codes.quantity": "Cantidad",
    "admin.codes.generateButton": "Generar",
    "admin.codes.copyAll": "Copiar todos",
    "admin.codes.generated": "{count} codigos generados",
    "admin.codes.copied": "Codigos copiados al portapapeles",
    "admin.codes.reopen": "Rectificar",
    "admin.codes.reopening": "Reabriendo...",
    "admin.codes.reopenedTitle": "Codigo reabierto",
    "admin.codes.reopenedDescription": "Ya puede volver a votar desde cero.",

    "admin.results.summary": "Total de votos: {total} | Likes: {likes}",
    "admin.results.showLegal": "mostrar votos legales",
    "admin.results.showAdjusted": "Mostrar votos ajustados",
    "admin.results.showingLegalHint": "Mostrando solo votos reales de usuarios (sin ajustes manuales del admin).",
    "admin.results.noVotes": "Sin votos",

    "admin.settings.votingOpenTitle": "Votacion abierta",
    "admin.settings.votingOpenDescription": "Permite que los votantes emitan sus votos",
    "admin.settings.publishResultsTitle": "Publicar resultados",
    "admin.settings.publishResultsDescription": "Hace visibles los resultados en la pagina publica",

    "notFound.message": "Oops! Pagina no encontrada",
    "notFound.returnHome": "Volver al inicio",
  },
  ca: {
    "lang.es": "Castellano",
    "lang.ca": "Catala",
    "lang.en": "English",
    "lang.eu": "Euskara",

    "nav.results": "Resultats",
    "nav.vote": "Votar",
    "nav.admin": "Admin",
    "nav.back": "Tornar",
    "nav.backHome": "Tornar a l'inici",
    "nav.language": "Idioma",

    "common.by": "per {author}",
    "common.sendVotes": "Enviar vots",
    "common.sending": "Enviant...",
    "common.error": "Error",
    "common.delete": "Eliminar",

    "index.heroTitle": "Els pintxos mes bojos",
    "index.heroSubtitle": "Descobreix els pintxos que competeixen a AITORTILLA i vota sense pietat",
    "index.emptyTitle": "Encara no hi ha pintxos registrats",
    "index.emptySubtitle": "Els pintxos apareixeran aqui quan l'organitzador els publiqui",
    "index.footerMotto": "que guanyi el millor pintxo",

    "vote.welcomeTitle": "Benvingut!",
    "vote.welcomeDescription": "Tria un pintxo per cada categoria",
    "vote.closedTitle": "Votacio tancada",
    "vote.closedDescription": "La votacio ha finalitzat. Gracies per participar!",
    "vote.accessTitle": "Accedeix per votar",
    "vote.accessDescription": "Introdueix el teu codi d'acces per votar",
    "vote.codePlaceholder": "El teu codi (ex: ABC123)",
    "vote.validating": "Validant...",
    "vote.access": "Accedir",
    "vote.headerTitle": "Votar",
    "vote.selectedCount": "{selected}/{total} categories seleccionades",
    "vote.noDishes": "No hi ha pintxos per votar",
    "vote.selectionDone": "Seleccio feta (editable)",
    "vote.deselect": "Desseleccionar",
    "vote.choose": "Escollir aquest pintxo",
    "vote.codeUsedTitle": "Codi ja utilitzat",
    "vote.codeUsedDescription": "Aquest codi ja va enviar els seus vots i no permet rectificacions.",
    "vote.invalidCodeTitle": "Codi invalid",
    "vote.invalidCodeDescription": "Verifica el teu codi d'acces",
    "vote.validationErrorDescription": "No s'ha pogut validar el codi",
    "vote.missingCategoriesTitle": "Falten categories per votar",
    "vote.missingCategoriesDescription": "Has de seleccionar un pintxo a les {total} categories abans d'enviar.",
    "vote.votesSentTitle": "Vots enviats",
    "vote.sendErrorTitle": "Error en enviar vots",
    "vote.sendErrorDescription": "Torna-ho a provar",

    "results.unavailableTitle": "Resultats no disponibles",
    "results.unavailableDescription": "Els resultats es publicaran quan l'organitzador ho decideixi",
    "results.title": "Resultats",
    "results.noVotesInCategory": "Sense vots en aquesta categoria",

    "adminLogin.title": "Panell d'Administracio",
    "adminLogin.subtitle": "Acces nomes per organitzadors",
    "adminLogin.email": "Email",
    "adminLogin.password": "Contrasenya",
    "adminLogin.signingIn": "Entrant...",
    "adminLogin.signIn": "Entrar",
    "adminLogin.accessErrorTitle": "Error d'acces",

    "admin.title": "Admin",
    "admin.logout": "Sortir",
    "admin.loading": "Carregant...",
    "admin.tab.dishes": "Pintxos",
    "admin.tab.categories": "Categories",
    "admin.tab.codes": "Codis",
    "admin.tab.results": "Resultats",
    "admin.tab.settings": "Ajustos",

    "admin.dishes.addTitle": "Afegir pintxo",
    "admin.dishes.name": "Nom del pintxo",
    "admin.dishes.author": "Autor / Xef",
    "admin.dishes.description": "Descripcio",
    "admin.dishes.photo": "Foto del pintxo",
    "admin.dishes.useCamera": "Usar camera (si disponible)",
    "admin.dishes.photoSelected": "Foto seleccionada: {name}",
    "admin.dishes.addButton": "Afegir pintxo",
    "admin.dishes.added": "Pintxo afegit",
    "admin.dishes.deleted": "Pintxo eliminat",

    "admin.categories.addTitle": "Afegir categoria",
    "admin.categories.name": "Nom",
    "admin.categories.description": "Descripcio (opcional)",
    "admin.categories.placeholder": "Ex: Millor sabor",
    "admin.categories.addButton": "Afegir categoria",
    "admin.categories.added": "Categoria afegida",

    "admin.codes.generateTitle": "Generar codis d'acces",
    "admin.codes.quantity": "Quantitat",
    "admin.codes.generateButton": "Generar",
    "admin.codes.copyAll": "Copiar tots",
    "admin.codes.generated": "{count} codis generats",
    "admin.codes.copied": "Codis copiats al porta-retalls",
    "admin.codes.reopen": "Rectificar",
    "admin.codes.reopening": "Reobrint...",
    "admin.codes.reopenedTitle": "Codi reobert",
    "admin.codes.reopenedDescription": "Ja pot tornar a votar des de zero.",

    "admin.results.summary": "Total de vots: {total} | Likes: {likes}",
    "admin.results.showLegal": "mostrar vots legals",
    "admin.results.showAdjusted": "Mostrar vots ajustats",
    "admin.results.showingLegalHint": "Mostrant nomes vots reals d'usuaris (sense ajustos manuals de l'admin).",
    "admin.results.noVotes": "Sense vots",

    "admin.settings.votingOpenTitle": "Votacio oberta",
    "admin.settings.votingOpenDescription": "Permet que els votants emetin els seus vots",
    "admin.settings.publishResultsTitle": "Publicar resultats",
    "admin.settings.publishResultsDescription": "Fa visibles els resultats a la pagina publica",

    "notFound.message": "Oops! Pagina no trobada",
    "notFound.returnHome": "Tornar a l'inici",
  },

  en: {
    "lang.es": "Castellano",
    "lang.ca": "Catala",
    "lang.en": "English",
    "lang.eu": "Euskara",

    "nav.results": "Results",
    "nav.vote": "Vote",
    "nav.admin": "Admin",
    "nav.back": "Back",
    "nav.backHome": "Back to home",
    "nav.language": "Language",

    "common.by": "by {author}",
    "common.sendVotes": "Submit votes",
    "common.sending": "Submitting...",
    "common.error": "Error",
    "common.delete": "Delete",

    "index.heroTitle": "The wildest pintxos",
    "index.heroSubtitle": "Discover the pintxos competing in AITORTILLA and vote with no mercy",
    "index.emptyTitle": "No pintxos registered yet",
    "index.emptySubtitle": "Pintxos will appear here when the organizer publishes them",
    "index.footerMotto": "may the best pintxo win",

    "vote.welcomeTitle": "Welcome!",
    "vote.welcomeDescription": "Pick one pintxo per category",
    "vote.closedTitle": "Voting closed",
    "vote.closedDescription": "Voting has ended. Thanks for participating!",
    "vote.accessTitle": "Enter to vote",
    "vote.accessDescription": "Enter your access code to vote",
    "vote.codePlaceholder": "Your code (e.g. ABC123)",
    "vote.validating": "Validating...",
    "vote.access": "Enter",
    "vote.headerTitle": "Vote",
    "vote.selectedCount": "{selected}/{total} categories selected",
    "vote.noDishes": "No pintxos available to vote",
    "vote.selectionDone": "Selection done (editable)",
    "vote.deselect": "Unselect",
    "vote.choose": "Choose this pintxo",
    "vote.codeUsedTitle": "Code already used",
    "vote.codeUsedDescription": "This code has already submitted votes and cannot be edited.",
    "vote.invalidCodeTitle": "Invalid code",
    "vote.invalidCodeDescription": "Please verify your access code",
    "vote.validationErrorDescription": "Could not validate the code",
    "vote.missingCategoriesTitle": "Missing category votes",
    "vote.missingCategoriesDescription": "You must select one pintxo in all {total} categories before submitting.",
    "vote.votesSentTitle": "Votes submitted",
    "vote.sendErrorTitle": "Error submitting votes",
    "vote.sendErrorDescription": "Please try again",

    "results.unavailableTitle": "Results not available",
    "results.unavailableDescription": "Results will be published when the organizer decides",
    "results.title": "Results",
    "results.noVotesInCategory": "No votes in this category",

    "adminLogin.title": "Admin Panel",
    "adminLogin.subtitle": "Access for organizers only",
    "adminLogin.email": "Email",
    "adminLogin.password": "Password",
    "adminLogin.signingIn": "Signing in...",
    "adminLogin.signIn": "Sign in",
    "adminLogin.accessErrorTitle": "Access error",

    "admin.title": "Admin",
    "admin.logout": "Logout",
    "admin.loading": "Loading...",
    "admin.tab.dishes": "Pintxos",
    "admin.tab.categories": "Categories",
    "admin.tab.codes": "Codes",
    "admin.tab.results": "Results",
    "admin.tab.settings": "Settings",

    "admin.dishes.addTitle": "Add pintxo",
    "admin.dishes.name": "Pintxo name",
    "admin.dishes.author": "Author / Chef",
    "admin.dishes.description": "Description",
    "admin.dishes.photo": "Pintxo photo",
    "admin.dishes.useCamera": "Use camera (if available)",
    "admin.dishes.photoSelected": "Selected photo: {name}",
    "admin.dishes.addButton": "Add pintxo",
    "admin.dishes.added": "Pintxo added",
    "admin.dishes.deleted": "Pintxo deleted",

    "admin.categories.addTitle": "Add category",
    "admin.categories.name": "Name",
    "admin.categories.description": "Description (optional)",
    "admin.categories.placeholder": "e.g. Best flavor",
    "admin.categories.addButton": "Add category",
    "admin.categories.added": "Category added",

    "admin.codes.generateTitle": "Generate access codes",
    "admin.codes.quantity": "Quantity",
    "admin.codes.generateButton": "Generate",
    "admin.codes.copyAll": "Copy all",
    "admin.codes.generated": "{count} codes generated",
    "admin.codes.copied": "Codes copied to clipboard",
    "admin.codes.reopen": "Reopen",
    "admin.codes.reopening": "Reopening...",
    "admin.codes.reopenedTitle": "Code reopened",
    "admin.codes.reopenedDescription": "It can vote again from scratch.",

    "admin.results.summary": "Total votes: {total} | Likes: {likes}",
    "admin.results.showLegal": "show legal votes",
    "admin.results.showAdjusted": "Show adjusted votes",
    "admin.results.showingLegalHint": "Showing only real user votes (without admin manual adjustments).",
    "admin.results.noVotes": "No votes",

    "admin.settings.votingOpenTitle": "Voting open",
    "admin.settings.votingOpenDescription": "Allows voters to submit votes",
    "admin.settings.publishResultsTitle": "Publish results",
    "admin.settings.publishResultsDescription": "Makes results visible on the public page",

    "notFound.message": "Oops! Page not found",
    "notFound.returnHome": "Return to home",
  },

  eu: {
    "lang.es": "Castellano",
    "lang.ca": "Catala",
    "lang.en": "English",
    "lang.eu": "Euskara",

    "nav.results": "Emaitzak",
    "nav.vote": "Bozkatu",
    "nav.admin": "Admin",
    "nav.back": "Itzuli",
    "nav.backHome": "Hasierara itzuli",
    "nav.language": "Hizkuntza",

    "common.by": "{author}k egina",
    "common.sendVotes": "Botoak bidali",
    "common.sending": "Bidaltzen...",
    "common.error": "Errorea",
    "common.delete": "Ezabatu",

    "index.heroTitle": "Pintxorik eroenak",
    "index.heroSubtitle": "Ezagutu AITORTILLAko pintxo lehiakideak eta bozkatu errukirik gabe",
    "index.emptyTitle": "Oraindik ez dago pintxorik erregistratuta",
    "index.emptySubtitle": "Pintxoak hemen agertuko dira antolatzaileak argitaratzen dituenean",
    "index.footerMotto": "irabaz dezala pintxo onenak",

    "vote.welcomeTitle": "Ongi etorri!",
    "vote.welcomeDescription": "Aukeratu pintxo bat kategoria bakoitzean",
    "vote.closedTitle": "Bozketa itxita",
    "vote.closedDescription": "Bozketa amaitu da. Eskerrik asko parte hartzeagatik!",
    "vote.accessTitle": "Sartu bozkatzeko",
    "vote.accessDescription": "Sartu zure sarbide kodea bozkatzeko",
    "vote.codePlaceholder": "Zure kodea (adib. ABC123)",
    "vote.validating": "Egiaztatzen...",
    "vote.access": "Sartu",
    "vote.headerTitle": "Bozkatu",
    "vote.selectedCount": "{selected}/{total} kategoria hautatuta",
    "vote.noDishes": "Ez dago bozkatzeko pintxorik",
    "vote.selectionDone": "Hautaketa egina (editagarria)",
    "vote.deselect": "Desautatu",
    "vote.choose": "Pintxo hau aukeratu",
    "vote.codeUsedTitle": "Kodea erabilita dago",
    "vote.codeUsedDescription": "Kode honek botoak bidali ditu jada eta ezin da zuzendu.",
    "vote.invalidCodeTitle": "Kode baliogabea",
    "vote.invalidCodeDescription": "Egiaztatu zure sarbide kodea",
    "vote.validationErrorDescription": "Ezin izan da kodea egiaztatu",
    "vote.missingCategoriesTitle": "Kategoriak bozkatu gabe daude",
    "vote.missingCategoriesDescription": "Bidali aurretik {total} kategorietan pintxo bat hautatu behar duzu.",
    "vote.votesSentTitle": "Botoak bidalita",
    "vote.sendErrorTitle": "Errorea botoak bidaltzean",
    "vote.sendErrorDescription": "Saiatu berriro",

    "results.unavailableTitle": "Emaitzak ez daude eskuragarri",
    "results.unavailableDescription": "Emaitzak antolatzaileak erabakitzen duenean argitaratuko dira",
    "results.title": "Emaitzak",
    "results.noVotesInCategory": "Kategoria honetan ez dago botorik",

    "adminLogin.title": "Administrazio Panela",
    "adminLogin.subtitle": "Antolatzaileentzako sarbidea bakarrik",
    "adminLogin.email": "Emaila",
    "adminLogin.password": "Pasahitza",
    "adminLogin.signingIn": "Sartzen...",
    "adminLogin.signIn": "Sartu",
    "adminLogin.accessErrorTitle": "Sarbide errorea",

    "admin.title": "Admin",
    "admin.logout": "Irten",
    "admin.loading": "Kargatzen...",
    "admin.tab.dishes": "Pintxoak",
    "admin.tab.categories": "Kategoriak",
    "admin.tab.codes": "Kodeak",
    "admin.tab.results": "Emaitzak",
    "admin.tab.settings": "Ezarpenak",

    "admin.dishes.addTitle": "Pintxoa gehitu",
    "admin.dishes.name": "Pintxoaren izena",
    "admin.dishes.author": "Egilea / Chef-a",
    "admin.dishes.description": "Deskribapena",
    "admin.dishes.photo": "Pintxoaren argazkia",
    "admin.dishes.useCamera": "Kamera erabili (eskuragarri badago)",
    "admin.dishes.photoSelected": "Hautatutako argazkia: {name}",
    "admin.dishes.addButton": "Pintxoa gehitu",
    "admin.dishes.added": "Pintxoa gehituta",
    "admin.dishes.deleted": "Pintxoa ezabatuta",

    "admin.categories.addTitle": "Kategoria gehitu",
    "admin.categories.name": "Izena",
    "admin.categories.description": "Deskribapena (aukerakoa)",
    "admin.categories.placeholder": "adib. Zapore onena",
    "admin.categories.addButton": "Kategoria gehitu",
    "admin.categories.added": "Kategoria gehituta",

    "admin.codes.generateTitle": "Sarbide kodeak sortu",
    "admin.codes.quantity": "Kopurua",
    "admin.codes.generateButton": "Sortu",
    "admin.codes.copyAll": "Guztiak kopiatu",
    "admin.codes.generated": "{count} kode sortuta",
    "admin.codes.copied": "Kodeak arbelean kopiatuta",
    "admin.codes.reopen": "Zuzendu",
    "admin.codes.reopening": "Berrirekitzen...",
    "admin.codes.reopenedTitle": "Kodea berrirekita",
    "admin.codes.reopenedDescription": "Berriro bozka dezake hasieratik.",

    "admin.results.summary": "Boto guztiak: {total} | Likes: {likes}",
    "admin.results.showLegal": "erakutsi boto legalak",
    "admin.results.showAdjusted": "Erakutsi boto egokituak",
    "admin.results.showingLegalHint": "Erabiltzaileen benetako botoak bakarrik erakusten dira (adminen doikuntzarik gabe).",
    "admin.results.noVotes": "Botorik ez",

    "admin.settings.votingOpenTitle": "Bozketa irekita",
    "admin.settings.votingOpenDescription": "Bozkatzaileei botoak ematea ahalbidetzen du",
    "admin.settings.publishResultsTitle": "Emaitzak argitaratu",
    "admin.settings.publishResultsDescription": "Emaitzak orri publikoan ikusgarri egiten ditu",

    "notFound.message": "Oops! Orria ez da aurkitu",
    "notFound.returnHome": "Hasierara itzuli",
  },
};

type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

const STORAGE_KEY = "aitortilla.locale";

function interpolate(template: string, vars?: Record<string, string | number>) {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, key) => String(vars[key] ?? ""));
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("es");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as Locale | null;
    if (saved && ["es", "ca", "en", "eu"].includes(saved)) {
      setLocaleState(saved);
    }
  }, []);

  const setLocale = (next: Locale) => {
    setLocaleState(next);
    localStorage.setItem(STORAGE_KEY, next);
  };

  const value = useMemo<I18nContextValue>(() => {
    return {
      locale,
      setLocale,
      t: (key, vars) => {
        const dict = translations[locale] ?? translations.ca;
        const fallback = translations.es[key] ?? key;
        return interpolate(dict[key] ?? fallback, vars);
      },
    };
  }, [locale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
