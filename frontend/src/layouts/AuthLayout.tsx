import React from 'react';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <div
      className="relative flex min-h-screen items-center justify-center overflow-hidden p-4"
      style={{
        background: 'var(--bg-main-gradient)',
        backgroundAttachment: 'fixed',
      }}
    >
      <div className="pointer-events-none absolute top-[-20%] right-[-15%] h-[50%] w-[50%] rounded-full bg-accent/5 blur-[160px]" />
      <div className="pointer-events-none absolute bottom-[-20%] left-[-15%] h-[50%] w-[50%] rounded-full bg-accent/5 blur-[160px]" />

      <div className="relative z-10 w-full max-w-md">
        {children}
      </div>
    </div>
  );
};

export default AuthLayout;