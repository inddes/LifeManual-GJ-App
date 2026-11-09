import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { Navigation } from './components/Navigation';
import { Footer } from './components/Footer';
import { VapiAIWidget } from './components/VapiAIWidget';
import { Home } from './pages/Home';
import { SignUp } from './pages/SignUp';
import { SignIn } from './pages/SignIn';
import { Mindfulness } from './pages/Mindfulness';
import { Meditation } from './pages/Meditation';
import { StepIn } from './pages/StepIn';
import { SoulRejuvenation } from './pages/SoulRejuvenation';
import { About } from './pages/About';
import { Contact } from './pages/Contact';
import { PrivacyPolicy } from './pages/PrivacyPolicy';
import { TermsOfService } from './pages/TermsOfService';
import { WisdomJourneyPage } from './pages/WisdomJourneyPage';


function AppContent() {
  const location = useLocation();
  const showFooter = location.pathname === '/';

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/mindfulness" element={<Mindfulness />} />
          <Route path="/meditation" element={<Meditation />} />
          <Route path="/stepin" element={<StepIn />} />
          <Route path="/soul-rejuvenation" element={<SoulRejuvenation />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />
          <Route path="/wisdom/:slug" element={<WisdomJourneyPage />} />
        </Routes>
      </main>
      {showFooter && <Footer />}
      <VapiAIWidget />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
