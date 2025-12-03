// Main App Component
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { WalletProvider } from './contexts/WalletContext';
import { Navbar } from './components/Navbar';
import { Landing } from './pages/Landing';
import { Discover } from './pages/Discover';
import { PassDetail } from './pages/PassDetail';
import { TicketDetail } from './pages/TicketDetail';
import { CreatorDashboard } from './pages/CreatorDashboard';
import { UserDashboard } from './pages/UserDashboard';
import { CertificatePage } from './pages/CertificatePage';
import { Analytics } from './pages/Analytics';
import { ReferralPage } from './pages/ReferralPage';
import { About } from './pages/About';
import { FAQ } from './pages/FAQ';
import './App.css';

function App() {
  return (
    <WalletProvider>
      <Router>
        <div className="min-h-screen">
          <Navbar />
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/discover" element={<Discover />} />
            <Route path="/pass/:id" element={<PassDetail />} />
            <Route path="/ticket/:id" element={<TicketDetail />} />
            <Route path="/creator" element={<CreatorDashboard />} />
            <Route path="/dashboard" element={<UserDashboard />} />
            <Route path="/certificates" element={<CertificatePage />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/referrals" element={<ReferralPage />} />
            <Route path="/about" element={<About />} />
            <Route path="/faq" element={<FAQ />} />
          </Routes>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#1e293b',
                color: '#fff',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              },
            }}
          />
        </div>
      </Router>
    </WalletProvider>
  );
}

export default App;
