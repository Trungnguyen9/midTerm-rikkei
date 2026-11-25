import { Navigate, Route, Routes } from 'react-router-dom';
import AppNavbar from './components/AppNavbar';
import BorrowingsPage from './pages/BorrowingsPage';
import EquipmentsPage from './pages/EquipmentsPage';

export default function App() {
  return (
    <>
      <AppNavbar />
      <main className="container py-4">
        <Routes>
          <Route path="/" element={<EquipmentsPage />} />
          <Route path="/phieu-muon" element={<BorrowingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </>
  );
}

