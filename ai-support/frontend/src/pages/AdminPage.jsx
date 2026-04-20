import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from '../components/admin/AdminLayout';
import Dashboard from '../components/admin/Dashboard';
import DocumentUpload from '../components/admin/DocumentUpload';
import ConversationsList from '../components/admin/ConversationsList';
import Settings from '../components/admin/Settings';

export default function AdminPage() {
  return (
    <AdminLayout>
      <Routes>
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="documents" element={<DocumentUpload />} />
        <Route path="conversations" element={<ConversationsList />} />
        <Route path="settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Routes>
    </AdminLayout>
  );
}
