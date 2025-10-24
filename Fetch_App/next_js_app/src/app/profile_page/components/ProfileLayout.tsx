import { ReactNode } from "react";

interface ProfileLayoutProps {
  children: ReactNode;
}

export default function ProfileLayout({ children }: ProfileLayoutProps) {
  return (
    <main className="min-h-screen bg-gradient-to-br from-[#FFFDFB] to-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Your Profile
          </h1>
          <p className="text-gray-600">
            Manage your learning and teaching journey
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {children}
        </div>
      </div>
    </main>
  );
}
