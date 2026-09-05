export default async function ResetPasswordPage({ params }) {
  const { token } = await params;
  return (
    <main className="p-8">
      <h1 className="text-2xl font-semibold">Reset password</h1>
      <p className="text-slate-600">Reset form placeholder for token {token}.</p>
    </main>
  );
}
