import { ResetPasswordView } from '@/components/auth/ResetPasswordView';

export default async function ResetPasswordPage({ params }) {
  const { token } = await params;
  return <ResetPasswordView token={token} />;
}
