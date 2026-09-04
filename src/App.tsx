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
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 32, height: 32, border: '2px solid var(--border-color)', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-muted)' }}>Loading...</p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <Header />
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '1.5rem' }}>
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
