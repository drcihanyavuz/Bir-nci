import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import AppLayout from './components/AppLayout';

import PublicLanding from './pages/PublicLanding';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ResetPassword from './pages/ResetPassword';
import PublicResults from './pages/PublicResults';
import LearnMore from './pages/LearnMore';
import Contact from './pages/Contact';
import Dashboard from './pages/Dashboard';
import CompetitionList from './pages/CompetitionList';
import JoinCompetition from './pages/JoinCompetition';
import CompetitionRoom from './pages/CompetitionRoom';
import BuyInci from './pages/BuyInci';
import Chat from './pages/Chat';
import Survey from './pages/Survey';
import Kvkk from './pages/Kvkk';
import Terms from './pages/Terms';

import NewCompetition from './pages/admin/NewCompetition';
import AddQuestions from './pages/admin/AddQuestions';
import AdminTiebreak from './pages/admin/AdminTiebreak';
import AdminChat from './pages/admin/AdminChat';
import AdminSurvey from './pages/admin/AdminSurvey';
import AdminPackages from './pages/admin/AdminPackages';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminContactMessages from './pages/admin/AdminContactMessages';
import AdminPastCompetitions from './pages/admin/AdminPastCompetitions';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppLayout>
          <Routes>
            {/* Herkese açık sayfalar */}
            <Route path="/" element={<PublicLanding />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/results" element={<PublicResults />} />
            <Route path="/yarismayi-ogrenelim" element={<LearnMore />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/kvkk" element={<Kvkk />} />
            <Route path="/kullanim-kosullari" element={<Terms />} />

            {/* Giriş yapmış üyeler */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/competitions"
              element={
                <ProtectedRoute>
                  <CompetitionList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/competitions/:competitionId/join"
              element={
                <ProtectedRoute>
                  <JoinCompetition />
                </ProtectedRoute>
              }
            />
            <Route
              path="/competitions/:competitionId"
              element={
                <ProtectedRoute>
                  <CompetitionRoom />
                </ProtectedRoute>
              }
            />
            <Route
              path="/buy-inci"
              element={
                <ProtectedRoute>
                  <BuyInci />
                </ProtectedRoute>
              }
            />
            <Route
              path="/chat"
              element={
                <ProtectedRoute>
                  <Chat />
                </ProtectedRoute>
              }
            />
            <Route
              path="/survey"
              element={
                <ProtectedRoute>
                  <Survey />
                </ProtectedRoute>
              }
            />

            {/* Sadece admin */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminRoute>
                    <AdminDashboard />
                  </AdminRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/contact-messages"
              element={
                <ProtectedRoute>
                  <AdminRoute>
                    <AdminContactMessages />
                  </AdminRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/past-competitions"
              element={
                <ProtectedRoute>
                  <AdminRoute>
                    <AdminPastCompetitions />
                  </AdminRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/competitions/new"
              element={
                <ProtectedRoute>
                  <AdminRoute>
                    <NewCompetition />
                  </AdminRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/competitions/:competitionId/questions"
              element={
                <ProtectedRoute>
                  <AdminRoute>
                    <AddQuestions />
                  </AdminRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/tiebreak"
              element={
                <ProtectedRoute>
                  <AdminRoute>
                    <AdminTiebreak />
                  </AdminRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/chat"
              element={
                <ProtectedRoute>
                  <AdminRoute>
                    <AdminChat />
                  </AdminRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/survey"
              element={
                <ProtectedRoute>
                  <AdminRoute>
                    <AdminSurvey />
                  </AdminRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/packages"
              element={
                <ProtectedRoute>
                  <AdminRoute>
                    <AdminPackages />
                  </AdminRoute>
                </ProtectedRoute>
              }
            />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </AuthProvider>
  );
}
