export default function OfflinePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 p-4">
      <div className="text-center">
        <div className="mb-6 text-6xl">📡</div>
        <h1 className="mb-4 text-4xl font-bold text-white">Anda Sedang Offline</h1>
        <p className="mb-8 text-lg text-white/90">
          Sepertinya koneksi internet Anda terputus. Periksa koneksi Anda dan coba lagi.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="rounded-lg bg-white px-8 py-3 font-semibold text-blue-600 transition-transform hover:scale-105 hover:shadow-lg"
        >
          Coba Lagi
        </button>
      </div>
    </div>
  );
}
