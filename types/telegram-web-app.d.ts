type TelegramWebAppUser = {
  id?: number | string;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
};

type TelegramWebApp = {
  initData: string;
  initDataUnsafe?: {
    user?: TelegramWebAppUser;
    auth_date?: number;
    hash?: string;
    [key: string]: unknown;
  };
  ready: () => void;
  expand: () => void;
  openTelegramLink?: (url: string) => void;
  colorScheme?: "light" | "dark";
};

interface Window {
  Telegram?: {
    WebApp?: TelegramWebApp;
  };
}
