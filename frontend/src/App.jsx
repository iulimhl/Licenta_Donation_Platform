import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/common/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
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
import DonationDetails from "./pages/DonationDetails";
import NeedDetails from "./pages/NeedDetails";
import OrganizationProfile from "./pages/OrganizationProfile";
import AdminVerification from "./pages/AdminVerification";
import EditProfile from "./pages/EditProfile";
import UserPublicProfile from "./pages/UserPublicProfile";

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/donations" element={<Donations />} />
        <Route path="/needs" element={<Needs />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/need/:id" element={<NeedDetails />} />
        <Route path="/organization/:email" element={<OrganizationProfile />} />
        <Route path="/user/:email" element={<UserPublicProfile />} />

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

        <Route
          path="/editdonation/:id"
          element={
            <ProtectedRoute>
              <EditDonation />
            </ProtectedRoute>
          }
        />

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

        <Route path="/donation/:id" element={<DonationDetails />} />

        <Route
          path="/admin/verifications"
          element={
            <AdminRoute>
              <AdminVerification />
            </AdminRoute>
          }
        />

        <Route
          path="/edit-profile"
          element={
            <ProtectedRoute>
              <EditProfile />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Layout>
  );
}
