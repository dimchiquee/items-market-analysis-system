import React from 'react';
import styled from 'styled-components';

const InventoryCardContainer = styled.div`
  background-color: #282633;
  padding: 1rem;
  border-radius: 8px;
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  text-align: center;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
  }
`;

const ItemImage = styled.img`
  width: 100%;
  max-height: 150px;
  object-fit: contain;
`;

const ItemName = styled.p`
  margin: 0.5rem 0;
  font-size: 1rem;
  color: #c9c9c9;
  font-weight: 500;
`;

const ItemPrice = styled.p`
  margin: 0;
  color: #c9c9c9;
  font-size: 0.9rem;
`;

const InventoryCard = ({ item, onClick, convertPrice }) => {
  return (
    <InventoryCardContainer onClick={() => onClick(item)}>
      <ItemImage src={item.icon_url} alt={item.name} />
      <ItemName>{item.name}</ItemName>
      <ItemPrice>{convertPrice ? convertPrice(item.steam_price) : item.steam_price}</ItemPrice>
    </InventoryCardContainer>
  );
};

export default InventoryCard;