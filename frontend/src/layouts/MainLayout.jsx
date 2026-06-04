import { Outlet } from 'react-router-dom'
import Navbar from '../components/common/Navbar'
import Footer from '../components/common/Footer'
import ChatWidget from '../components/chat/ChatWidget'

const MainLayout = () => {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_top,#f8f5ef,transparent_35%),linear-gradient(to_bottom,#faf7f2,#f6f7fb)] text-neutral-900 dark:bg-[radial-gradient(circle_at_top,#1a1408,transparent_22%),linear-gradient(to_bottom,#09090b,#0f1117)] dark:text-white">
      <div className="pointer-events-none absolute inset-0 opacity-60">
        <div className="absolute left-0 top-0 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute right-0 top-40 h-80 w-80 rounded-full bg-neutral-300/20 blur-3xl dark:bg-white/5" />
      </div>

      <div className="relative z-10">
        <Navbar />

        <main className="min-h-[calc(100vh-140px)]">
          <Outlet />
        </main>

        <Footer />
      </div>

      <ChatWidget />
    </div>
  )
}

export default MainLayout