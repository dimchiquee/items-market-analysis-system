import styled from 'styled-components';
import React from 'react';

const LoginContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #f0f2f5;
`;

const LoginButton = styled.button`
  padding: 12px 24px;
  font-size: 16px;
  background-color: #282633;
  color: #E0E0E0;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  transition: background-color 0.2s ease, transform 0.2s ease;
  &:hover {
    background-color: #323040;
    transform: translateY(-2px);
  }
`;

const Login = () => {
const handleSteamLogin = () => {
  window.location.href = 'http://localhost:8000/auth/steam/login';
};

  return (
    <LoginContainer>
      <LoginButton onClick={handleSteamLogin}>Login with Steam</LoginButton>
    </LoginContainer>
  );
};

export default Login;