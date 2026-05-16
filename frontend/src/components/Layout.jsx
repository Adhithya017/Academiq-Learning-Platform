import Sidebar from './Sidebar';
import Navbar from './Navbar';

export default function Layout({ children, title }) {
  return (
    <div className="min-h-screen bg-surface dot-grid">
      <Sidebar />
      <Navbar title={title} />
      <main className="ml-64 pt-16 min-h-screen">
        <div className="p-6 animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  );
}
