import React from 'react';
import styled from 'styled-components';

const NavbarContainer = styled.nav`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 1rem 2rem;
  background-color: #171a21;
  color: #fff;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1000;
  box-sizing: border-box;
`;

const NavLinks = styled.div`
  display: flex;
  gap: 2rem;
`;

const NavLink = styled.a`
  color: #fff;
  text-decoration: none;
  font-size: 1.1rem;
  &:hover {
    color: #66c0f4;
  }
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  max-width: 300px;
`;

const Username = styled.span`
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const Avatar = styled.img`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  flex-shrink: 0;
`;

const LogoutButton = styled.button`
  background-color: #171a25;
  color: #fff;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  &:hover {
    background-color: #ff3333;
  }
`;

const Navbar = ({ user }) => {
  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    window.location.href = '/';
  };

  return (
    <NavbarContainer>
      <NavLinks>
        <NavLink href="/dashboard">Главная</NavLink>
        <NavLink href="#">Избранное</NavLink>
        <NavLink href="#">Популярное</NavLink>
        <NavLink href="#">Поиск</NavLink>
      </NavLinks>
      {user && (
        <UserInfo>
          <Username>{user.username}</Username>
          <Avatar src={user.avatar} alt="User Avatar" />
          <LogoutButton onClick={handleLogout}>Выйти</LogoutButton>
        </UserInfo>
      )}
    </NavbarContainer>
  );
};

export default Navbar;