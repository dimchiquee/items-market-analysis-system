import React from 'react';
import styled from 'styled-components';

const NavbarContainer = styled.nav`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  height: 60px;
  padding: 0 2rem;
  background-color: #282633;
  color: #E0E0E0;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1001; /* Higher than sidebar */
  box-sizing: border-box;
  border-bottom: 1px solid #4A475C;
`;

const NavLinks = styled.div`
  display: flex;
  gap: 2rem;
`;

const NavLink = styled.a`
  color: #E0E0E0;
  text-decoration: none;
  font-size: 1.1rem;
  font-weight: 500;
  transition: color 0.2s ease;
  &:hover {
    color: #7C3AED;
  }
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const Username = styled.span`
  white-space: nowrap;
  font-weight: 500;
`;

const Avatar = styled.img`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  flex-shrink: 0;
  border: 2px solid #4A475C;
`;

const LogoutButton = styled.button`
  background-color: transparent;
  color: #EF4444;
  border: 1px solid #EF4444;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: background-color 0.2s ease, color 0.2s ease;
  &:hover {
    background-color: #EF4444;
    color: #fff;
  }
`;

const CurrencySelect = styled.select`
  padding: 0.5rem;
  border-radius: 8px;
  border: 1px solid #4A475C;
  background-color: #323040;
  color: #E0E0E0;
  cursor: pointer;
  &:focus {
    outline: none;
    border-color: #7C3AED;
  }
`;

const Navbar = ({ user, currency, setCurrency }) => {
  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    window.location.href = '/';
  };


  return (
    <NavbarContainer>
      <NavLinks>
        <NavLink href="/dashboard">Главная</NavLink>
        <NavLink href="/favorites">Избранное</NavLink>
        <NavLink href="/popular">Популярное</NavLink>
        <NavLink href="/search">Поиск</NavLink>
      </NavLinks>
      {user && (
        <UserInfo>
        <CurrencySelect value={currency} onChange={(e) => setCurrency(e.target.value)}>
          <option value="$">USD ($)</option>
          <option value="₽">RUB (₽)</option>
          <option value="€">EUR (€)</option>
          <option value="¥JPY">JPY (¥)</option>
          <option value="¥CNY">CNY (¥)</option>
        </CurrencySelect>
          <Username>{user.username}</Username>
          <Avatar src={user.avatar} alt="User Avatar" />
          <LogoutButton onClick={handleLogout}>Выйти</LogoutButton>
        </UserInfo>
      )}
    </NavbarContainer>
  );
};

export default Navbar;