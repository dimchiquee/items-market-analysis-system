import React from 'react';
import styled from 'styled-components';

const SidebarContainer = styled.div`
  width: 250px;
  background-color: #1b2838;
  color: #c7d5e0;
  padding: 1rem;
  position: fixed;
  height: 100vh;
  top: 60px;
  left: 0;
`;

const FilterSection = styled.div`
  margin-bottom: 2rem;
`;

const FilterTitle = styled.h3`
  margin: 0 0 1rem 0;
  font-size: 1.2rem;
`;

const Select = styled.select`
  width: 100%;
  padding: 0.5rem;
  background-color: #2a475e;
  color: #c7d5e0;
  border: none;
  border-radius: 4px;
`;

const Sidebar = ({ onSort, onFilter }) => {
  return (
    <SidebarContainer>
      <FilterSection>
        <FilterTitle>Выберите игру</FilterTitle>
        <Select onChange={(e) => onFilter('game', e.target.value)} defaultValue="">
          <option value="" disabled>Выберите игру</option>
          <option value="730">CS:GO</option>
          <option value="570">Dota 2</option>
        </Select>
      </FilterSection>
      <FilterSection>
        <FilterTitle>Сортировка</FilterTitle>
        <Select onChange={(e) => onSort(e.target.value)}>
          <option value="">Без сортировки</option>
          <option value="price_asc">Цена: по возрастанию</option>
          <option value="price_desc">Цена: по убыванию</option>
        </Select>
      </FilterSection>
    </SidebarContainer>
  );
};

export default Sidebar;