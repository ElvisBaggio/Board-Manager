import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Roadmap from './pages/Roadmap';
import StrategicCanvas from './pages/StrategicCanvas';
import StrategicChoices from './pages/StrategicChoices';
import MetricsCascade from './pages/MetricsCascade';
import Analytics from './pages/Analytics';
import AdminPanel from './pages/AdminPanel';

export default function App() {
    return (
        <AuthProvider>
            <div className="app-background" />
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route
                    path="/"
                    element={
                        <ProtectedRoute>
                            <Dashboard />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/board/:id"
                    element={<Navigate to="canvas" replace />}
                />
                <Route
                    path="/board/:id/canvas"
                    element={
                        <ProtectedRoute>
                            <StrategicCanvas />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/board/:id/choices"
                    element={
                        <ProtectedRoute>
                            <StrategicChoices />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/board/:id/roadmap"
                    element={
                        <ProtectedRoute>
                            <Roadmap />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/board/:id/metrics"
                    element={
                        <ProtectedRoute>
                            <MetricsCascade />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/board/:id/analytics"
                    element={
                        <ProtectedRoute>
                            <Analytics />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/admin"
                    element={
                        <ProtectedRoute>
                            <AdminPanel />
                        </ProtectedRoute>
                    }
                />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </AuthProvider>
    );
}
