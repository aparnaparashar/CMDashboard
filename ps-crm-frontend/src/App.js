import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import Login from './pages/Login';
import Register from './pages/Register';
import CitizenHome from './pages/citizen/CitizenHome';
import AdminDashboard from './pages/admin/AdminDashboard';
import ComplaintsList from './pages/admin/ComplaintsList';
import OfficerManagement from './pages/admin/OfficerManagement';
import AnalyticsReport from './pages/admin/AnalyticsReport';
import AdminProfilePage from './pages/admin/ProfilePage';
import CitizenDashboard from './pages/citizen/CitizenDashboard';
import SubmitComplaint from './pages/citizen/SubmitComplaint';
import TrackComplaint from './pages/citizen/TrackComplaint';
import FeedbackPage from './pages/citizen/FeedbackPage';
import CitizenProfilePage from './pages/citizen/ProfilePage';
import OfficerDashboard from './pages/officer/OfficerDashboard';
import OfficerProfilePage from './pages/officer/ProfilePage';
import PublicDashboard from './pages/public/PublicDashboard';
import Contact from './pages/public/Contact';
import Notifications from './pages/Notifications';
import Chatbot from './components/ui/Chatbot';

const ProtectedRoute = ({ children, roles }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" />;
  return children;
};

function AppContent() {
  const location = useLocation();
  const hideChatbot = location.pathname.startsWith('/admin') || location.pathname.startsWith('/officer');

  return (
    <>
      <Routes>
        {/* Public */}
        <Route path="/" element={<CitizenHome />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/public" element={<PublicDashboard />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/citizen/track" element={<TrackComplaint />} />
        <Route path="/citizen/submit" element={<SubmitComplaint />} />

        {/* Citizen */}
        <Route path="/citizen/home" element={<CitizenHome />} />
        <Route path="/citizen/dashboard" element={<ProtectedRoute roles={['citizen']}><CitizenDashboard /></ProtectedRoute>} />
        <Route path="/citizen/profile" element={<ProtectedRoute roles={['citizen']}><CitizenProfilePage /></ProtectedRoute>} />
        <Route path="/citizen/feedback" element={<ProtectedRoute roles={['citizen']}><FeedbackPage /></ProtectedRoute>} />
        <Route path="/citizen/feedback/:id" element={<ProtectedRoute roles={['citizen']}><FeedbackPage /></ProtectedRoute>} />

        {/* Admin */}
        <Route path="/admin/dashboard" element={<ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/profile" element={<ProtectedRoute roles={['admin']}><AdminProfilePage /></ProtectedRoute>} />
        <Route path="/admin/complaints" element={<ProtectedRoute roles={['admin']}><ComplaintsList /></ProtectedRoute>} />
        <Route path="/admin/officers" element={<ProtectedRoute roles={['admin']}><OfficerManagement /></ProtectedRoute>} />
        <Route path="/admin/analytics" element={<ProtectedRoute roles={['admin']}><AnalyticsReport /></ProtectedRoute>} />

        {/* Officer */}
        <Route path="/officer/dashboard" element={<ProtectedRoute roles={['officer']}><OfficerDashboard /></ProtectedRoute>} />
        <Route path="/officer/profile" element={<ProtectedRoute roles={['officer']}><OfficerProfilePage /></ProtectedRoute>} />

        {/* Shared */}
        <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      {!hideChatbot && <Chatbot />}
    </>
  );
}

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
