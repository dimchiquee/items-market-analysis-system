import React from 'react';
import { useEffect, useState } from 'react';
import styled from 'styled-components';
import axios from 'axios';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import 'chartjs-plugin-zoom';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const DashboardContainer = styled.div`
  display: flex;
  min-height: 100vh;
  padding-top: 60px;
`;

const MainContent = styled.div`
  flex-grow: 1;
  padding: 2rem;
  background-color: #f0f0f0;
  margin-left: 250px;
`;

const InventoryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
`;

const InventoryCard = styled.div`
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

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
`;

const ModalContent = styled.div`
  background: #fff;
  padding: 2rem;
  border-radius: 8px;
  width: 600px;
  max-width: 90%;
  text-align: center;
`;

const ChartContainer = styled.div`
  height: 300px;
  width: 100%;
  position: relative;
`;

const ModalButton = styled.button`
  background-color: ${props => props.primary ? '#66c0f4' : '#d8000c'};
  color: #fff;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  margin: 0.5rem;
  &:hover {
    background-color: ${props => props.primary ? '#8ed1ff' : '#ff3333'};
  }
`;

const ErrorMessage = styled.div`
  padding: 1rem;
  background-color: #ffcccc;
  border-radius: 4px;
  color: #d8000c;
  text-align: center;
`;

const PriceTable = styled.div`
  margin: 1rem 0;
  text-align: left;
`;

const LoadPricesButton = styled.button`
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

const ProgressText = styled.p`
  margin: 0.5rem 0;
  color: #333;
`;

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [filteredInventory, setFilteredInventory] = useState([]);
  const [filters, setFilters] = useState({ game: '' });
  const [loading, setLoading] = useState(false);
  const [inventoryError, setInventoryError] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [itemHistory, setItemHistory] = useState(null);
  const [priceLoading, setPriceLoading] = useState(false);
  const [loadedCount, setLoadedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  const fetchPrices = async (items, token, useCache = true) => {
    setPriceLoading(true);
    setLoadedCount(0);
    setTotalCount(items.length);

    const cachedPrices = useCache ? JSON.parse(localStorage.getItem('price_cache') || '{}') : {};
    const updatedInventory = [...items];

    for (let i = 0; i < updatedInventory.length; i++) {
      const item = updatedInventory[i];
      const cacheKey = `${item.appid}:${item.market_hash_name}`;

      if (useCache && cachedPrices[cacheKey]) {
        console.log(`Using cached price for ${item.name}: ${cachedPrices[cacheKey]}`);
        updatedInventory[i] = { ...item, price: cachedPrices[cacheKey] };
        setLoadedCount(prev => prev + 1);
        setInventory([...updatedInventory]);
        setFilteredInventory([...updatedInventory]);
        continue;
      }

      await new Promise(resolve => setTimeout(resolve, 2000)); // Задержка 2 секунды
      console.log(`Fetching price for ${item.name} (${item.market_hash_name})`);
      try {
        const response = await axios.get(`http://localhost:8000/auth/price`, {
          params: { token, market_hash_name: item.market_hash_name, appid: item.appid }
        });
        console.log(`Price response for ${item.name}:`, response.data);
        updatedInventory[i] = { ...item, price: response.data.price };
        cachedPrices[cacheKey] = response.data.price; // Сохраняем в кэш
      } catch (error) {
        console.error(`Failed to fetch price for ${item.name}:`, error.response ? error.response.data : error.message);
        updatedInventory[i] = { ...item, price: 'N/A' };
        cachedPrices[cacheKey] = 'N/A';
      }

      setLoadedCount(prev => prev + 1);
      setInventory([...updatedInventory]);
      setFilteredInventory([...updatedInventory]);
      localStorage.setItem('price_cache', JSON.stringify(cachedPrices)); // Сохраняем кэш
    }

    setPriceLoading(false);
  };

  const fetchHistory = async (item, token) => {
    setHistoryLoading(true);
    try {
      const response = await axios.get(`http://localhost:8000/auth/history`, {
        params: { token, market_hash_name: item.market_hash_name, appid: item.appid }
      });
      console.log(`History response for ${item.name}:`, response.data);
      setItemHistory(response.data.history);
    } catch (error) {
      console.error(`Failed to fetch history for ${item.name}:`, error.response ? error.response.data : error.message);
      setItemHistory([]);
    }
    setHistoryLoading(false);
  };

  const loadInventory = (appid) => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      window.location.href = '/';
      return;
    }

    setLoading(true);
    setInventoryError(null);
    axios.get('http://localhost:8000/auth/inventory', { params: { token, appid } })
      .then(response => {
        const inventoryData = response.data;
        if (!inventoryData || inventoryData.length === 0) {
          setInventoryError('Ваш инвентарь для этой игры пуст или недоступен. Проверьте настройки приватности в Steam.');
          setInventory([]);
          setFilteredInventory([]);
        } else {
          setInventory(inventoryData);
          setFilteredInventory(inventoryData);
        }
        setLoading(false);
      })
      .catch(error => {
        console.error('Error:', error);
        if (error.response?.status === 401) {
          localStorage.removeItem('auth_token');
          window.location.href = '/';
        } else {
          setInventoryError('Не удалось загрузить инвентарь. Попробуйте позже.');
          setLoading(false);
        }
      });
  };

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

  useEffect(() => {
    if (filters.game) {
      loadInventory(filters.game);
    }
  }, [filters.game]);

  const handleSort = (sortType) => {
    let sorted = [...filteredInventory];
    if (sortType === 'price_asc') {
      sorted.sort((a, b) => (parseFloat(a.price?.replace('$', '')) || 0) - (parseFloat(b.price?.replace('$', '')) || 0));
    } else if (sortType === 'price_desc') {
      sorted.sort((a, b) => (parseFloat(b.price?.replace('$', '')) || 0) - (parseFloat(a.price?.replace('$', '')) || 0));
    }
    setFilteredInventory(sorted);
  };

  const handleFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleItemClick = (item) => {
    setSelectedItem(item);
    setItemHistory(null);
  };

  const closeModal = () => {
    setSelectedItem(null);
    setItemHistory(null);
  };

  const addToFavorites = (item) => {
    setFavorites(prev => [...prev, item]);
  };

  const predictPrice = (item) => {
    console.log(`Predicting price for ${item.name}`);
  };

  const chartData = itemHistory ? {
    labels: itemHistory.map(data => data[0].split(' ')[0] + ' ' + data[0].split(' ')[1]),
    datasets: [{
      label: 'Цена ($)',
      data: itemHistory.map(data => parseFloat(data[1])),
      fill: false,
      borderColor: '#66c0f4',
      tension: 0.1
    }]
  } : null;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { title: { display: true, text: 'Дата' } },
      y: { title: { display: true, text: 'Цена ($)' } }
    },
    plugins: {
      zoom: {
        pan: {
          enabled: true,
          mode: 'x',
        },
        zoom: {
          wheel: {
            enabled: true,
          },
          pinch: {
            enabled: true,
          },
          mode: 'x',
        }
      }
    }
  };

  return (
    <DashboardContainer>
      <Navbar user={user} />
      <Sidebar onSort={handleSort} onFilter={handleFilter} />
      <MainContent>
        <h1>Ваш инвентарь</h1>
        {!filters.game && !loading ? (
          <p>Выберите игру в боковой панели</p>
        ) : loading ? (
          <p>Загрузка...</p>
        ) : inventoryError ? (
          <ErrorMessage>{inventoryError}</ErrorMessage>
        ) : (
          <>
            <LoadPricesButton
              onClick={() => fetchPrices(inventory, localStorage.getItem('auth_token'), false)}
              disabled={priceLoading || inventory.length === 0}
            >
              {priceLoading ? 'Обновление цен...' : 'Загрузить/Обновить цены'}
            </LoadPricesButton>
            {priceLoading && (
              <ProgressText>Загружено: {loadedCount}/{totalCount}</ProgressText>
            )}
            <InventoryGrid>
              {filteredInventory.map((item, index) => (
                <InventoryCard key={`${item.classid}-${index}`} onClick={() => handleItemClick(item)}>
                  <ItemImage src={item.icon_url} alt={item.name} />
                  <ItemName>{item.name}</ItemName>
                  <ItemPrice>{item.price || 'Ожидание...'}</ItemPrice>
                </InventoryCard>
              ))}
            </InventoryGrid>
          </>
        )}
        {selectedItem && (
          <ModalOverlay onClick={closeModal}>
            <ModalContent onClick={(e) => e.stopPropagation()}>
              <h2>{selectedItem.name}</h2>
              <ItemImage src={selectedItem.icon_url} alt={selectedItem.name} />
              <PriceTable>
                <p>Steam: {selectedItem.price || 'N/A'}</p>
                <p>CS.Money: N/A</p>
                <p>Tradeit.gg: N/A</p>
                <p>Market.CSGO: N/A</p>
              </PriceTable>
              <ModalButton primary onClick={() => addToFavorites(selectedItem)}>
                Добавить в избранное
              </ModalButton>
              <ModalButton onClick={() => predictPrice(selectedItem)}>
                Прогноз цены
              </ModalButton>
              {chartData ? (
                <ChartContainer>
                  <Line data={chartData} options={chartOptions} />
                </ChartContainer>
              ) : (
                <ModalButton onClick={() => fetchHistory(selectedItem, localStorage.getItem('auth_token'))}>
                  {historyLoading ? 'Загрузка...' : 'Загрузить историю'}
                </ModalButton>
              )}
              <ModalButton onClick={closeModal}>Закрыть</ModalButton>
            </ModalContent>
          </ModalOverlay>
        )}
      </MainContent>
    </DashboardContainer>
  );
};

export default Dashboard;