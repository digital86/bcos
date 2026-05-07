import React, { useState, useEffect } from 'react';

interface EmailObfuscatorProps {
  email: string;
  className?: string;
  children?: React.ReactNode;
}

/**
 * A component that helps protect email addresses from spam harvesters 
 * by rendering them dynamically after mounting and obfuscating the mailto link.
 */
const EmailObfuscator: React.FC<EmailObfuscatorProps> = ({ email, className, children }) => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleClick = (e: React.MouseEvent) => {
    if (!isClient) return;
    e.preventDefault();
    // Reconstruct email to avoid static mailto links in HTML
    window.location.href = `mailto:${email}`;
  };

  // Simple obfuscation for SSR or before hydration
  const obfuscatedDisplay = email.replace('@', ' [at] ').replace(/\./g, ' [dot] ');

  return (
    <a
      href={isClient ? `mailto:${email}` : '#'}
      onClick={handleClick}
      className={className}
    >
      {children || (isClient ? email : obfuscatedDisplay)}
    </a>
  );
};

export default EmailObfuscator;
