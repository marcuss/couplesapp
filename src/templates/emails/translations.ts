/**
 * Email Template Translations
 * i18n translations for email templates in all supported languages
 */

import { LanguageCode, EmailTranslations } from './types';

export const invitationTranslations: Record<LanguageCode, EmailTranslations> = {
  en: {
    subject: "You've been invited to join CouplePlan! 💕",
    greeting: "Hi there!",
    message: "{{inviterName}} has invited you to join CouplePlan — the app for couples to plan their life together.",
    buttonText: "Accept Invitation",
    expiresText: "This invitation will expire in {{expiresInDays}} days.",
    footer: "With love,\nThe CouplePlan Team",
    welcomeMessage: "",
    features: [],
    getStarted: "",
  },
  es: {
    subject: "¡Has sido invitado a unirte a CouplePlan! 💕",
    greeting: "¡Hola!",
    message: "{{inviterName}} te ha invitado a unirte a CouplePlan — la aplicación para que las parejas planifiquen su vida juntas.",
    buttonText: "Aceptar Invitación",
    expiresText: "Esta invitación expirará en {{expiresInDays}} días.",
    footer: "Con cariño,\nEl Equipo de CouplePlan",
    welcomeMessage: "",
    features: [],
    getStarted: "",
  },
  fr: {
    subject: "Vous avez été invité à rejoindre CouplePlan ! 💕",
    greeting: "Bonjour !",
    message: "{{inviterName}} vous a invité à rejoindre CouplePlan — l'application pour que les couples planifient leur vie ensemble.",
    buttonText: "Accepter l'Invitation",
    expiresText: "Cette invitation expirera dans {{expiresInDays}} jours.",
    footer: "Avec amour,\nL'équipe CouplePlan",
    welcomeMessage: "",
    features: [],
    getStarted: "",
  },
  nl: {
    subject: "Je bent uitgenodigd om CouplePlan te joinen! 💕",
    greeting: "Hallo!",
    message: "{{inviterName}} heeft je uitgenodigd om CouplePlan te joinen — de app voor stellen om hun leven samen te plannen.",
    buttonText: "Uitnodiging Accepteren",
    expiresText: "Deze uitnodiging verloopt over {{expiresInDays}} dagen.",
    footer: "Met liefde,\nHet CouplePlan Team",
    welcomeMessage: "",
    features: [],
    getStarted: "",
  },
  zh: {
    subject: "您被邀请加入 CouplePlan！💕",
    greeting: "您好！",
    message: "{{inviterName}} 邀请您加入 CouplePlan —— 情侣共同规划生活的应用。",
    buttonText: "接受邀请",
    expiresText: "此邀请将在 {{expiresInDays}} 天后过期。",
    footer: "爱你的，\nCouplePlan 团队",
    welcomeMessage: "",
    features: [],
    getStarted: "",
  },
  ko: {
    subject: "CouplePlan에 초대받으셨습니다! 💕",
    greeting: "안녕하세요!",
    message: "{{inviterName}}님이 CouplePlan에 초대했습니다 — 커플이 함께 삶을 계획하는 앱입니다.",
    buttonText: "초대 수락",
    expiresText: "이 초대는 {{expiresInDays}}일 후에 만료됩니다.",
    footer: "사랑을 담아,\nCouplePlan 팀",
    welcomeMessage: "",
    features: [],
    getStarted: "",
  },
  it: {
    subject: "Sei stato invitato a unirti a CouplePlan! 💕",
    greeting: "Ciao!",
    message: "{{inviterName}} ti ha invitato a unirti a CouplePlan — l'app per le coppie che vogliono pianificare la loro vita insieme.",
    buttonText: "Accetta Invito",
    expiresText: "Questo invito scadrà tra {{expiresInDays}} giorni.",
    footer: "Con amore,\nIl Team di CouplePlan",
    welcomeMessage: "",
    features: [],
    getStarted: "",
  },
};

export const welcomeTranslations: Record<LanguageCode, EmailTranslations> = {
  en: {
    subject: "",
    greeting: "Hi {{name}}!",
    message: "Welcome to CouplePlan! We're excited to have you on board.",
    buttonText: "",
    expiresText: "",
    footer: "With love,\nThe CouplePlan Team",
    welcomeMessage: "Start planning your life together with your partner:",
    features: [
      "Create shared events",
      "Set couple goals",
      "Manage your budget",
      "Track tasks",
    ],
    getStarted: "Get Started",
  },
  es: {
    subject: "",
    greeting: "¡Hola {{name}}!",
    message: "¡Bienvenido a CouplePlan! Estamos emocionados de tenerte a bordo.",
    buttonText: "",
    expiresText: "",
    footer: "Con cariño,\nEl Equipo de CouplePlan",
    welcomeMessage: "Comienza a planificar tu vida junto con tu pareja:",
    features: [
      "Crear eventos compartidos",
      "Establecer metas de pareja",
      "Gestionar tu presupuesto",
      "Seguir tareas",
    ],
    getStarted: "Comenzar",
  },
  fr: {
    subject: "",
    greeting: "Bonjour {{name}} !",
    message: "Bienvenue sur CouplePlan ! Nous sommes ravis de vous accueillir.",
    buttonText: "",
    expiresText: "",
    footer: "Avec amour,\nL'équipe CouplePlan",
    welcomeMessage: "Commencez à planifier votre vie ensemble avec votre partenaire :",
    features: [
      "Créer des événements partagés",
      "Définir des objectifs de couple",
      "Gérer votre budget",
      "Suivre les tâches",
    ],
    getStarted: "Commencer",
  },
  nl: {
    subject: "",
    greeting: "Hallo {{name}}!",
    message: "Welkom bij CouplePlan! We zijn blij dat je erbij bent.",
    buttonText: "",
    expiresText: "",
    footer: "Met liefde,\nHet CouplePlan Team",
    welcomeMessage: "Begin met het plannen van je leven samen met je partner:",
    features: [
      "Gedeelde evenementen maken",
      "Stel doelen voor stellen",
      "Beheer je budget",
      "Volg taken",
    ],
    getStarted: "Aan de Slag",
  },
  zh: {
    subject: "",
    greeting: "您好 {{name}}！",
    message: "欢迎使用 CouplePlan！我们很高兴您能加入。",
    buttonText: "",
    expiresText: "",
    footer: "爱你的，\nCouplePlan 团队",
    welcomeMessage: "开始与您的伴侣一起规划生活：",
    features: [
      "创建共享活动",
      "设定情侣目标",
      "管理预算",
      "跟踪任务",
    ],
    getStarted: "开始使用",
  },
  ko: {
    subject: "",
    greeting: "안녕하세요 {{name}}님!",
    message: "CouplePlan에 오신 것을 환영합니다! 함께하게 되어 기쁩니다.",
    buttonText: "",
    expiresText: "",
    footer: "사랑을 담아,\nCouplePlan 팀",
    welcomeMessage: "파트너와 함께 삶을 계획하기 시작하세요:",
    features: [
      "공유 이벤트 만들기",
      "커플 목표 설정",
      "예산 관리",
      "작업 추적",
    ],
    getStarted: "시작하기",
  },
  it: {
    subject: "",
    greeting: "Ciao {{name}}!",
    message: "Benvenuto su CouplePlan! Siamo entusiasti di averti con noi.",
    buttonText: "",
    expiresText: "",
    footer: "Con amore,\nIl Team di CouplePlan",
    welcomeMessage: "Inizia a pianificare la tua vita insieme al tuo partner:",
    features: [
      "Crea eventi condivisi",
      "Imposta obiettivi di coppia",
      "Gestisci il tuo budget",
      "Tieni traccia delle attività",
    ],
    getStarted: "Inizia",
  },
};

/**
 * Replace template variables in a string
 */
export function interpolate(template: string, variables: Record<string, string | number>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return variables[key] !== undefined ? String(variables[key]) : match;
  });
}
