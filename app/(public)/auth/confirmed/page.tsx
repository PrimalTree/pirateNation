export default function ConfirmedPage() {
  return (
    <div className="mx-auto max-w-md space-y-4">
      <h1 className="text-3xl font-bold">Email Confirmed</h1>
      <p className="text-zinc-400">
        Thanks for confirming your email. You can now sign in to your account.
      </p>
      <a
        href="/auth/signin"
        className="inline-flex items-center rounded-xl bg-ecu-gold px-4 py-2 font-semibold text-black hover:opacity-90"
      >
        Go to Sign In
      </a>
    </div>
  );
}

