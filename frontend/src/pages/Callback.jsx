import React from 'react';
import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

const Callback = ({ setIsAuthenticated }) => {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      localStorage.setItem('auth_token', token);
      setIsAuthenticated(true);
      window.location.href = '/dashboard';
    }
  }, [searchParams, setIsAuthenticated]);

  return <div>Processing login...</div>;
};

export default Callback;