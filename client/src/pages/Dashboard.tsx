import { useAuthStore } from "../store/auth";

export default function Dashboard() {
  const { user, logout } = useAuthStore();
  return (
    <div className="min-h-screen bg-zinc-950 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Mirror</h1>
          <button onClick={logout} className="text-zinc-400 hover:text-white text-sm">Sign out</button>
        </div>
        <p className="text-zinc-400">Welcome, {user?.name} · <span className="text-violet-400">{user?.role}</span></p>
        <p className="text-zinc-600 mt-4 text-sm">Dashboard coming in Day 2 →</p>
      </div>
    </div>
  );
}