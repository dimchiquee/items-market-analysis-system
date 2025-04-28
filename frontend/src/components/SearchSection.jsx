import React, { useState } from 'react';
import styled from 'styled-components';
import axios from 'axios';

const SearchSectionContainer = styled.div`
  margin-top: 2rem;
`;

const SectionTitle = styled.h2`
  font-size: 1.5rem;
  margin-bottom: 1rem;
`;

const SearchForm = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  align-items: center;
`;

const SearchInput = styled.input`
  padding: 0.5rem;
  font-size: 1rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  width: 300px;
`;

const GameSelector = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const GameButton = styled.button`
  background-color: ${props => (props.active ? '#66c0f4' : '#2a475e')};
  color: #fff;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  &:hover {
    background-color: ${props => (props.active ? '#8ed1ff' : '#3b5a77')};
  }
`;

const SearchButton = styled.button`
  background-color: #66c0f4;
  color: #fff;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  &:hover {
    background-color: #8ed1ff;
  }
  &:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }
`;

const SearchGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
`;

const SearchCard = styled.div`
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

const ItemLink = styled.a`
  text-decoration: none;
  color: inherit;
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

const AddToFavoritesButton = styled.button`
  background-color: #66c0f4;
  color: #fff;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 0.5rem;
  &:hover {
    background-color: #8ed1ff;
  }
  &:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }
`;

const Message = styled.div`
  padding: 0.5rem;
  background-color: ${props => props.success ? '#ccffcc' : '#ffcccc'};
  border-radius: 4px;
  color: ${props => props.success ? '#008000' : '#d8000c'};
  text-align: center;
  margin-top: 0.5rem;
`;

const ErrorMessage = styled.div`
  padding: 1rem;
  background-color: #ffcccc;
  border-radius: 4px;
  color: #d8000c;
  text-align: center;
`;

const NoResultsMessage = styled.div`
  padding: 1rem;
  color: #666;
  text-align: center;
`;

const SearchSection = ({ currency }) => {
  const [game, setGame] = useState('730');
  const [query, setQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [searchItems, setSearchItems] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [favoritesMessage, setFavoritesMessage] = useState({});

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

  const fetchSearchItems = async (appid, searchQuery) => {
    if (!searchQuery.trim()) {
      setSearchItems([]);
      setError(null);
      setSubmittedQuery('');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await axios.get('http://localhost:8000/auth/search_items', {
        params: { appid, query: searchQuery }
      });
      console.log('Search items response:', response.data.items);
      const itemsWithAppid = response.data.items.map(item => ({
        ...item,
        appid: appid
      }));
      setSearchItems(itemsWithAppid || []);
      setSubmittedQuery(searchQuery);
    } catch (error) {
      console.error('Failed to fetch search items:', error);
      setError('Не удалось выполнить поиск. Попробуйте позже.');
      setSearchItems([]);
      setSubmittedQuery(searchQuery);
    } finally {
      setLoading(false);
    }
  };

  const checkIfItemInFavorites = async (item) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.get('http://localhost:8000/auth/favorites', { params: { token } });
      const favorites = response.data.items;
      const itemKey = item.market_hash_name || item.name;
      return favorites.some(fav =>
        fav.appid === item.appid && fav.market_hash_name === itemKey
      );
    } catch (error) {
      console.error('Failed to check favorites:', error);
      return false;
    }
  };

  const addToFavorites = async (item) => {
    console.log('Adding to favorites:', item);
    if (!item.appid) {
      setFavoritesMessage(prev => ({
        ...prev,
        [item.name]: { text: 'Ошибка: отсутствует appid', success: false }
      }));
      setTimeout(() => {
        setFavoritesMessage(prev => ({ ...prev, [item.name]: null }));
      }, 3000);
      return;
    }

    const itemKey = item.market_hash_name || item.name;

    const isAlreadyInFavorites = await checkIfItemInFavorites(item);
    if (isAlreadyInFavorites) {
      setFavoritesMessage(prev => ({
        ...prev,
        [itemKey]: { text: 'Этот предмет уже в избранном!', success: false }
      }));
      setTimeout(() => {
        setFavoritesMessage(prev => ({ ...prev, [itemKey]: null }));
      }, 3000);
      return;
    }

    try {
      const token = localStorage.getItem('auth_token');
      const itemToAdd = {
        ...item,
        market_hash_name: itemKey
      };
      await axios.post('http://localhost:8000/auth/favorites/add', itemToAdd, {
        params: { token }
      });
      setFavoritesMessage(prev => ({
        ...prev,
        [itemKey]: { text: 'Предмет добавлен в избранное!', success: true }
      }));
      setTimeout(() => {
        setFavoritesMessage(prev => ({ ...prev, [itemKey]: null }));
      }, 3000);
    } catch (error) {
      console.error('Failed to add to favorites:', error);
      setFavoritesMessage(prev => ({
        ...prev,
        [itemKey]: { text: 'Ошибка при добавлении в избранное', success: false }
      }));
      setTimeout(() => {
        setFavoritesMessage(prev => ({ ...prev, [itemKey]: null }));
      }, 3000);
    }
  };

  const handleSearch = () => {
    fetchSearchItems(game, query);
  };

  const handleSearchChange = (e) => {
    setQuery(e.target.value);
  };

  return (
    <SearchSectionContainer>
      <SectionTitle>Поиск предметов</SectionTitle>
      <SearchForm>
        <SearchInput
          type="text"
          value={query}
          onChange={handleSearchChange}
          placeholder="Введите название предмета..."
        />
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
        <SearchButton onClick={handleSearch} disabled={loading}>
          {loading ? 'Поиск...' : 'Искать'}
        </SearchButton>
      </SearchForm>
      {error ? (
        <ErrorMessage>{error}</ErrorMessage>
      ) : loading ? (
        <NoResultsMessage>Загрузка...</NoResultsMessage>
      ) : searchItems.length === 0 && submittedQuery.trim() ? (
        <NoResultsMessage>Ничего не найдено. Попробуйте изменить запрос.</NoResultsMessage>
      ) : (
        <SearchGrid>
          {searchItems.map((item, index) => {
            const itemKey = item.market_hash_name || item.name;
            return (
              <SearchCard key={`${item.name}-${index}`}>
                <ItemLink
                  href={item.item_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ItemImage src={item.icon_url} alt={item.name} />
                  <ItemName>{item.name}</ItemName>
                  <ItemPrice>{convertPrice(item.price)}</ItemPrice>
                </ItemLink>
                <AddToFavoritesButton onClick={() => addToFavorites(item)}>
                  Добавить в избранное
                </AddToFavoritesButton>
                {favoritesMessage[itemKey] && (
                  <Message success={favoritesMessage[itemKey].success}>
                    {favoritesMessage[itemKey].text}
                  </Message>
                )}
              </SearchCard>
            );
          })}
        </SearchGrid>
      )}
    </SearchSectionContainer>
  );
};

export default SearchSection;