import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import axios from 'axios';

const PopularSectionContainer = styled.div`
  margin-top: 2rem;
`;

const SectionTitle = styled.h2`
  font-size: 1.5rem;
  margin-bottom: 1rem;
`;

const GameSelector = styled.div`
  margin-bottom: 1rem;
`;

const GameButton = styled.button`
  background-color: ${props => (props.active ? '#66c0f4' : '#2a475e')};
  color: #fff;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  margin-right: 0.5rem;
  &:hover {
    background-color: ${props => (props.active ? '#8ed1ff' : '#3b5a77')};
  }
`;

const PopularGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
`;

const PopularCard = styled.a`
  background-color: #fff;
  padding: 1rem;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  text-align: center;
  text-decoration: none;
  color: inherit;
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

const ErrorMessage = styled.div`
  padding: 1rem;
  background-color: #ffcccc;
  border-radius: 4px;
  color: #d8000c;
  text-align: center;
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

const PopularSection = ({ currency, setLoading }) => {
  const [game, setGame] = useState('730');
  const [popularItems, setPopularItems] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLocalLoading] = useState(false);

  const exchangeRate = {
    '$': 1,
    '₽': 95,
    '€': 0.92,
    '¥JPY': 150,
    '¥CNY': 7.10
  };

  const convertPrice = (price) => {
    if (!price || price === 'N/A') return 'N/A';
    const numericPrice = parseFloat(price.replace('$', '')) || 0;
    if (currency === '$') return `${numericPrice.toFixed(2)}${currency}`;

    const priceInUSD = numericPrice;
    const convertedPrice = priceInUSD * exchangeRate[currency];
    return `${convertedPrice.toFixed(2)}${currency === '¥JPY' || currency === '¥CNY' ? currency : currency}`;
  };

  const fetchPopularItems = async (appid, forceRefresh = false) => {
    setLocalLoading(true);
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:8000/auth/popular_items', {
        params: { appid, force_refresh: forceRefresh }
      });
      setPopularItems(response.data.items || []);
      setError(null);
    } catch (error) {
      console.error('Failed to fetch popular items:', error);
      setError('Не удалось загрузить популярные предметы. Попробуйте позже.');
      setPopularItems([]);
    } finally {
      setLocalLoading(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (game) {
      fetchPopularItems(game);
    }
  }, [game, currency]);

  const refreshItems = () => {
    setPopularItems([]);
    fetchPopularItems(game, true);
  };

  return (
    <PopularSectionContainer id="popular-section">
      <RefreshButton onClick={refreshItems} disabled={loading}>
        {loading ? 'Обновление...' : 'Обновить список'}
      </RefreshButton>
      <SectionTitle>Популярное</SectionTitle>
      <GameSelector>
        <GameButton
          active={game === '730'}
          onClick={() => setGame('730')}
        >
          CS2
        </GameButton>
        <GameButton
          active={game === '570'}
          onClick={() => setGame('570')}
        >
          Dota 2
        </GameButton>
      </GameSelector>
      {error ? (
        <ErrorMessage>{error}</ErrorMessage>
      ) : (
        <PopularGrid>
          {popularItems.map((item, index) => (
            <PopularCard
              key={`${item.name}-${index}`}
              href={item.item_url}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ItemImage src={item.icon_url} alt={item.name} />
              <ItemName>{item.name}</ItemName>
              <ItemPrice>{convertPrice(item.price)}</ItemPrice>
            </PopularCard>
          ))}
        </PopularGrid>
      )}
    </PopularSectionContainer>
  );
};

export default PopularSection;