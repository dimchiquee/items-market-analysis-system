import React, { useState } from 'react';
import styled from 'styled-components';
import axios from 'axios';

const SearchSectionContainer = styled.div`
  margin-top: 2rem;
`;

const SectionTitle = styled.h2`
  font-size: 1.5rem;
  margin-bottom: 1rem;
  color: #E0E0E0;
`;

const SearchForm = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  align-items: center;
`;

const SearchInput = styled.input`
  padding: 0.75rem 1rem;
  font-size: 1rem;
  border: 1px solid #4A475C;
  background-color: #282633;
  color: #E0E0E0;
  border-radius: 8px;
  width: 300px;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;

  &:focus {
    outline: none;
    border-color: #7C3AED;
    box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.3);
  }
`;

const GameSelector = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const GameButton = styled.button`
  background-color: ${props => (props.active ? '#7C3AED' : 'transparent')};
  color: #fff;
  border: 1px solid #4A475C;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s ease;

  &:hover {
    border-color: #7C3AED;
  }
`;

const SearchButton = styled.button`
  background-color: #7C3AED;
  color: #fff;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: #8B5CF6;
  }
  &:disabled {
    background-color: #4A475C;
    cursor: not-allowed;
  }
`;

const SearchGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1.5rem;
`;

const SearchCard = styled.div`
  background-color: #282633;
  border-radius: 8px;
  border: 1px solid #4A475C;
  text-align: center;
  text-decoration: none;
  color: inherit;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.2);
  }
`;

const ItemLink = styled.a`
  text-decoration: none;
  color: inherit;
  padding: 1rem;
  flex-grow: 1;
`;

const ItemImage = styled.img`
  width: 100%;
  max-height: 150px;
  object-fit: contain;
`;

const ItemName = styled.p`
  margin: 0.5rem 0;
  font-size: 1rem;
  color: #E0E0E0;
  font-weight: 500;
`;

const ItemPrice = styled.p`
  margin: 0;
  color: #9CA3AF;
`;

const AddToFavoritesButton = styled.button`
  background-color: #7C3AED;
  color: #fff;
  border: none;
  padding: 0.75rem 1rem;
  cursor: pointer;
  font-weight: 600;
  transition: background-color 0.2s ease;
  width: 100%;

  &:hover {
    background-color: #8B5CF6;
  }
  &:disabled {
    background-color: #4A475C;
    color: #9CA3AF;
    cursor: not-allowed;
  }
`;

const Message = styled.div`
  padding: 0.5rem;
  background-color: ${props => props.success ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)'};
  border-radius: 8px;
  color: ${props => props.success ? '#22C55E' : '#F87171'};
  border: 1px solid ${props => props.success ? '#22C55E' : '#EF4444'};
  text-align: center;
  margin: 1rem;
`;

const ErrorMessage = styled(Message)`
  background-color: rgba(239, 68, 68, 0.2);
  color: #F87171;
  border: 1px solid #EF4444;
`;

const NoResultsMessage = styled.div`
  padding: 1rem;
  color: #9CA3AF;
  text-align: center;
  font-style: italic;
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