import React from 'react';
import styled from 'styled-components';

const InventoryCardContainer = styled.div`
  background-color: #fff;
  padding: 1rem;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  text-align: center;
  cursor: pointer;
  &:hover {
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
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
`;

const ItemPrice = styled.p`
  margin: 0;
  color: #666;
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