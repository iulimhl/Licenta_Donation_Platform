import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/common/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import Home from "./pages/Home";
import Donations from "./pages/Donations";
import Needs from "./pages/Needs";
import PostNeed from "./pages/PostNeed";
import PostDonation from "./pages/PostDonation";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import Messages from "./pages/Messages";
import Chat from "./pages/Chat";
import EditNeed from "./pages/EditNeed";
import EditDonation from "./pages/EditDonation";
import MapPage from "./pages/Map";

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/donations" element={<Donations />} />
        <Route path="/needs" element={<Needs />} />
        <Route path="/map" element={<MapPage />} />

        <Route
          path="/postdonation"
          element={
            <ProtectedRoute>
              <PostDonation />
            </ProtectedRoute>
          }
        />

        <Route
          path="/postneed"
          element={
            <ProtectedRoute>
              <PostNeed />
            </ProtectedRoute>
          }
        />

        <Route
          path="/editneed/:id"
          element={
            <ProtectedRoute>
              <EditNeed />
            </ProtectedRoute>
          }
        />

        <Route path="/editdonation/:id" element={<ProtectedRoute><EditDonation /></ProtectedRoute>} />

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        <Route
          path="/messages"
          element={
            <ProtectedRoute>
              <Messages />
            </ProtectedRoute>
          }
        />

        <Route
          path="/chat/:otherEmail"
          element={
            <ProtectedRoute>
              <Chat />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Layout>
  );
}