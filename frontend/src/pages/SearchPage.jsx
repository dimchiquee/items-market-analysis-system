import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import axios from 'axios';
import Navbar from '../components/Navbar';
import SearchSection from '../components/SearchSection';

const SearchPageContainer = styled.div`
  display: flex;
  min-height: 100vh;
  padding-top: 60px;
`;

const MainContent = styled.div`
  flex-grow: 1;
  padding: 2rem;
  background-color: #f0f0f0;
`;

const SearchPage = () => {
  const [user, setUser] = useState(null);
  const [currency, setCurrency] = useState('$');

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
    <SearchPageContainer>
      <Navbar user={user} currency={currency} setCurrency={setCurrency} />
      <MainContent>
        <SearchSection currency={currency} />
      </MainContent>
    </SearchPageContainer>
  );
};

export default SearchPage;