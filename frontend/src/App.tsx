import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { ToastContainer } from '@/components/ui/Toast';
import { Dashboard } from '@/pages/Dashboard';
import { ProjectCreate } from '@/pages/ProjectCreate';
import { ProjectWorkflow } from '@/pages/ProjectWorkflow';
import { ProjectList } from '@/pages/ProjectList';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/projects" element={<ProjectList />} />
          <Route path="/projects/create" element={<ProjectCreate />} />
          <Route path="/projects/:id/workflow" element={<ProjectWorkflow />} />
        </Routes>
      </Layout>
      <ToastContainer />
    </Router>
  );
}

export default App;
