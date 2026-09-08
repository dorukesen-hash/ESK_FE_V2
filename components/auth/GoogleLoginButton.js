const API_URL = process.env.NEXT_PUBLIC_API_URL;

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47c-.28 1.5-1.13 2.77-2.4 3.62v3h3.88c2.27-2.09 3.57-5.17 3.57-8.81z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.07 7.94-2.92l-3.88-3c-1.08.72-2.45 1.15-4.06 1.15-3.12 0-5.77-2.11-6.71-4.94H1.28v3.1C3.26 21.3 7.31 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.29 14.29A7.2 7.2 0 0 1 4.9 12c0-.8.14-1.57.39-2.29V6.61H1.28A11.98 11.98 0 0 0 0 12c0 1.94.46 3.77 1.28 5.39l4.01-3.1z"
      />
      <path
        fill="#EA4335"
        d="M12 4.77c1.77 0 3.35.61 4.6 1.8l3.44-3.44C17.94 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.28 6.61l4.01 3.1C6.23 6.88 8.88 4.77 12 4.77z"
      />
    </svg>
  );
}

// Routes straight to the backend's own OAuth entry point
// (ESK_API/routes/authRouter.js: GET /auth/google, passport-google-oauth20) -
// there is nothing for the frontend to orchestrate itself, since Google
// redirects the browser back to ESK_API's callback, which sets the same
// httpOnly cookies /auth/login does and then bounces to /auth/profile
// (see app/auth/profile/page.js for why that route exists on this side).
export function GoogleLoginButton() {
  if (!API_URL) return null;

  return (
    <a
      href={`${API_URL}/auth/google`}
      className="inline-flex h-12 w-full items-center justify-center gap-3 rounded-full border border-border text-sm font-semibold text-text-primary transition-colors hover:border-primary"
    >
      <GoogleIcon />
      Continue with Google
    </a>
  );
}
