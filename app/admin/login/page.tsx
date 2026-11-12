import { LoginForm } from "@/components/AdminAuth";

export default function AdminLogin() {
  return (
    <div className="py-16">
      <LoginForm />
      <p className="mt-4 text-center text-xs text-navy/50">Only the admin account can sign in. Clients never need a login.</p>
    </div>
  );
}
