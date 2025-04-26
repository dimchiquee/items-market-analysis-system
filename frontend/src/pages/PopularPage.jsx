import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import axios from 'axios';
import Navbar from '../components/Navbar';
import PopularSection from '../components/PopularSection';

const PopularPageContainer = styled.div`
  display: flex;
  min-height: 100vh;
  padding-top: 60px;
`;

const MainContent = styled.div`
  flex-grow: 1;
  padding: 2rem;
  background-color: #f0f0f0;
`;

const RefreshButton = styled.button`
  background-color: #66c0f4;
  color: #fff;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  margin-bottom: 1rem;
  &:hover {
    background-color: #8ed1ff;
  }
  &:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }
`;

const LoadingText = styled.p`
  color: #666;
  margin-bottom: 1rem;
`;

const PopularPage = () => {
  const [user, setUser] = useState(null);
  const [currency, setCurrency] = useState('$');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      window.location.href = '/';
      return;
    }

    axios.get('http://localhost:8000/auth/verify', { params: { token } })
      .then(response => {
        setUser(response.data);
      })
      .catch(error => {
        console.error('Error:', error);
        if (error.response?.status === 401) {
          localStorage.removeItem('auth_token');
          window.location.href = '/';
        }
      });
  }, []);

  return (
    <PopularPageContainer>
      <Navbar user={user} currency={currency} setCurrency={setCurrency} />
      <MainContent>
        <PopularSection currency={currency} setLoading={setLoading} />
        {loading && <LoadingText>Загрузка новых предметов...</LoadingText>}
      </MainContent>
    </PopularPageContainer>
  );
};

export default PopularPage;