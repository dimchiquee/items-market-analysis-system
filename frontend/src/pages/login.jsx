import styled from 'styled-components';
import React from 'react';

const LoginContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #f0f0f0;
`;

const LoginButton = styled.button`
  padding: 12px 24px;
  font-size: 16px;
  background-color: #171a21;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  &:hover {
    background-color: #2a2f3a;
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