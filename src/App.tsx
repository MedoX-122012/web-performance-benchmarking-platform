import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import Header from '@components/Header';

const Home = lazy(() => import('@pages/Home'));
const Dashboard = lazy(() => import('@pages/Dashboard'));
const Report = lazy(() => import('@pages/Report'));
const History = lazy(() => import('@pages/History'));
const Compare = lazy(() => import('@pages/Compare'));

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-400">Loading...</p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/report/:id" element={<Report />} />
            <Route path="/history" element={<History />} />
            <Route path="/compare" element={<Compare />} />
          </Routes>
        </Suspense>
      </main>
    </div>
  );
}
