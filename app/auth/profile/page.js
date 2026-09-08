import { GoogleAuthRedirect } from '@/components/auth/GoogleAuthRedirect';

// The backend's Google OAuth callback (ESK_API/routes/authRouter.js,
// GET /auth/google/callback) has this exact path hardcoded as its
// post-login redirect target and sets the same httpOnly cookies
// /auth/login does before sending the browser here - this route only
// exists so that hardcoded redirect lands somewhere real instead of a
// 404, then hands off to /account once AuthBootstrap picks up the
// session from those cookies.
export default function GoogleAuthProfilePage() {
  return <GoogleAuthRedirect />;
}
