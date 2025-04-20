import React from 'react';
import { useEffect, useState, useRef } from 'react';
import styled from 'styled-components';
import axios from 'axios';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

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
  overflow: hidden;
`;

const ModalContent = styled.div`
  background: #fff;
  padding: 2rem;
  border-radius: 8px;
  width: 700px;
  max-width: 95%;
  max-height: 90vh;
  overflow-y: auto;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const ItemInfoContainer = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;
  @media (max-width: 600px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const ImageWrapper = styled.div`
  flex: 0 0 150px;
`;

const PriceWrapper = styled.div`
  flex: 1;
  text-align: left;
`;

const ChartButtonContainer = styled.div`
  display: flex;
  gap: 1rem;
  align-items: stretch;
  @media (max-width: 600px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const ChartContainer = styled.div`
  flex: 1;
  height: 250px;
  position: relative;
  background-color: #f0f0f0; /* Серый фон для пустого графика */
  canvas {
    max-height: 100% !important;
    max-width: 100% !important;
  }
`;

const ButtonContainer = styled.div`
  flex: 0 0 150px;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  justify-content: center;
`;

const ModalButton = styled.button`
  background-color: ${props => props.primary ? '#66c0f4' : '#d8000c'};
  color: #fff;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  width: 100%;
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
  margin: 0;
`;

const ResetCacheButton = styled.button`
  background-color: #d8000c;
  color: #fff;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  margin-bottom: 1rem;
  &:hover {
    background-color: #ff3333;
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
  const chartRef = useRef(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [chartState, setChartState] = useState({
    xMin: null,
    xMax: null,
    yMin: null,
    yMax: null
  });

  const fetchPrices = async (items, token, useCache = true, forceRefresh = false) => {
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

      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log(`Fetching price for ${item.name} (${item.market_hash_name})`);
      try {
        const response = await axios.get(`http://localhost:8000/auth/price`, {
          params: { token, market_hash_name: item.market_hash_name, appid: item.appid, force_refresh: forceRefresh }
        });
        console.log(`Price response for ${item.name}:`, response.data);
        updatedInventory[i] = { ...item, price: response.data.price };
        cachedPrices[cacheKey] = response.data.price;
      } catch (error) {
        console.error(`Failed to fetch price for ${item.name}:`, error.response ? error.response.data : error.message);
        updatedInventory[i] = { ...item, price: 'N/A' };
        cachedPrices[cacheKey] = 'N/A';
      }

      setLoadedCount(prev => prev + 1);
      setInventory([...updatedInventory]);
      setFilteredInventory([...updatedInventory]);
      localStorage.setItem('price_cache', JSON.stringify(cachedPrices));
    }

    setPriceLoading(false);
  };

  const resetCache = async () => {
    const token = localStorage.getItem('auth_token');
    try {
      localStorage.removeItem('price_cache');
      await axios.get('http://localhost:8000/auth/reset_cache', { params: { token } });
      fetchPrices(inventory, token, false, true);
    } catch (error) {
      console.error('Failed to reset cache:', error.response ? error.response.data : error.message);
    }
  };

  const fetchHistory = async (item, token) => {
    setHistoryLoading(true);
    try {
      const response = await axios.get(`http://localhost:8000/auth/history`, {
        params: { token, market_hash_name: item.market_hash_name, appid: item.appid }
      });
      console.log(`History response for ${item.name}:`, response.data);
      setItemHistory(response.data.history);
      setChartState({ xMin: null, xMax: null, yMin: null, yMax: null });
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
          fetchPrices(inventoryData, token, true, false);
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

  useEffect(() => {
    if (selectedItem) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [selectedItem]);

  const handleChartWheel = (event) => {
    const chart = chartRef.current;
    if (!chart || !itemHistory) return;

    const rect = chart.canvas.getBoundingClientRect();
    const cursorX = event.clientX - rect.left;
    const cursorY = event.clientY - rect.top;

    let xMin = chart.options.scales.x.min ?? 0;
    let xMax = chart.options.scales.x.max ?? itemHistory.length - 1;
    let yMin = chart.options.scales.y.min ?? Math.min(...itemHistory.map(d => parseFloat(d[1]))) * 0.9;
    let yMax = chart.options.scales.y.max ?? Math.max(...itemHistory.map(d => parseFloat(d[1]))) * 1.1;

    const xFraction = cursorX / rect.width;
    const yFraction = 1 - cursorY / rect.height;

    const zoomFactor = event.deltaY < 0 ? 0.9 : 1.1;
    const newXRange = (xMax - xMin) * zoomFactor;
    const newYRange = (yMax - yMin) * zoomFactor;

    const xCenter = xMin + (xMax - xMin) * xFraction;
    const yCenter = yMin + (yMax - yMin) * yFraction;

    xMin = xCenter - (newXRange * xFraction);
    xMax = xCenter + (newXRange * (1 - xFraction));
    yMin = yCenter - (newYRange * yFraction);
    yMax = yCenter + (newYRange * (1 - yFraction));

    xMin = Math.max(0, Math.min(xMin, itemHistory.length - 1));
    xMax = Math.max(0, Math.min(xMax, itemHistory.length - 1));
    yMin = Math.max(0, yMin);
    yMax = Math.max(yMin + 0.01, yMax);

    chart.options.scales.x.min = xMin;
    chart.options.scales.x.max = xMax;
    chart.options.scales.y.min = yMin;
    chart.options.scales.y.max = yMax;

    chart.update();
    setChartState({ xMin, xMax, yMin, yMax });
  };

  const handleMouseDown = (event) => {
    const chart = chartRef.current;
    if (!chart || !itemHistory) return;

    event.preventDefault();
    setIsPanning(true);
    setPanStart({ x: event.clientX, y: event.clientY });
  };

  const handleMouseMove = (event) => {
    if (!isPanning || !chartRef.current || !itemHistory) return;

    const chart = chartRef.current;
    const rect = chart.canvas.getBoundingClientRect();

    const deltaX = event.clientX - panStart.x;
    const deltaY = event.clientY - panStart.y;

    let xMin = chart.options.scales.x.min ?? 0;
    let xMax = chart.options.scales.x.max ?? itemHistory.length - 1;
    let yMin = chart.options.scales.y.min ?? Math.min(...itemHistory.map(d => parseFloat(d[1]))) * 0.9;
    let yMax = chart.options.scales.y.max ?? Math.max(...itemHistory.map(d => parseFloat(d[1]))) * 1.1;

    const xRange = xMax - xMin;
    const yRange = yMax - yMin;
    const xShift = (deltaX / rect.width) * xRange;
    const yShift = (deltaY / rect.height) * yRange;

    xMin -= xShift;
    xMax -= xShift;
    yMin += yShift;
    yMax += yShift;

    xMin = Math.max(0, Math.min(xMin, itemHistory.length - 1));
    xMax = Math.max(0, Math.min(xMax, itemHistory.length - 1));
    yMin = Math.max(0, yMin);
    yMax = Math.max(yMin + 0.01, yMax);

    chart.options.scales.x.min = xMin;
    chart.options.scales.x.max = xMax;
    chart.options.scales.y.min = yMin;
    chart.options.scales.y.max = yMax;

    chart.update();
    setChartState({ xMin, xMax, yMin, yMax });
    setPanStart({ x: event.clientX, y: event.clientY });
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

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
    setChartState({ xMin: null, xMax: null, yMin: null, yMax: null });
  };

  const closeModal = () => {
    setSelectedItem(null);
    setItemHistory(null);
    setChartState({ xMin: null, xMax: null, yMin: null, yMax: null });
  };

  const addToFavorites = (item) => {
    setFavorites(prev => [...prev, item]);
  };

  const predictPrice = (item) => {
    console.log(`Predicting price for ${item.name}`);
  };

  const chartData = itemHistory ? {
    labels: itemHistory.map(data => {
      const [day, month, year] = data[0].split(' ');
      return `${day} ${month} ${year}`;
    }),
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
      x: {
        title: { display: true, text: 'Дата' },
        ticks: {
          maxTicksLimit: 8,
          maxRotation: 45,
          minRotation: 45
        },
        min: chartState.xMin,
        max: chartState.xMax
      },
      y: {
        title: { display: true, text: 'Цена ($)' },
        min: chartState.yMin,
        max: chartState.yMax
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
            <ResetCacheButton
              onClick={resetCache}
              disabled={priceLoading || inventory.length === 0}
            >
              {priceLoading ? 'Сброс кэша...' : 'Сбросить кэш'}
            </ResetCacheButton>
            {priceLoading && (
              <ProgressText>Загружено: {loadedCount}/{totalCount}</ProgressText>
            )}
            <InventoryGrid>
              {filteredInventory.map((item, index) => (
                <InventoryCard key={`${item.classid}-${index}`} onClick={() => handleItemClick(item)}>
                  <ItemImage src={item.icon_url} alt={item.name} />
                  <ItemName>{item.name}</ItemName>
                  <ItemPrice>{item.price || 'Загрузка...'}</ItemPrice>
                </InventoryCard>
              ))}
            </InventoryGrid>
          </>
        )}
        {selectedItem && (
          <ModalOverlay onClick={closeModal}>
            <ModalContent onClick={(e) => e.stopPropagation()}>
              <h2>{selectedItem.name}</h2>
              <ItemInfoContainer>
                <ImageWrapper>
                  <ItemImage src={selectedItem.icon_url} alt={selectedItem.name} />
                </ImageWrapper>
                <PriceWrapper>
                  <PriceTable>
                    <p>Steam: {selectedItem.price || 'N/A'}</p>
                    <p>CS.Money: N/A</p>
                    <p>Tradeit.gg: N/A</p>
                    <p>Market.CSGO: N/A</p>
                  </PriceTable>
                </PriceWrapper>
              </ItemInfoContainer>
              <ChartButtonContainer>
                <ChartContainer>
                  {chartData && (
                    <Line
                      ref={chartRef}
                      data={chartData}
                      options={chartOptions}
                      onWheel={handleChartWheel}
                      onMouseDown={handleMouseDown}
                      onMouseMove={handleMouseMove}
                      onMouseUp={handleMouseUp}
                      onMouseLeave={handleMouseUp}
                    />
                  )}
                </ChartContainer>
                <ButtonContainer>
                  <ModalButton onClick={() => fetchHistory(selectedItem, localStorage.getItem('auth_token'))}>
                    {historyLoading ? 'Загрузка...' : 'Загрузить историю'}
                  </ModalButton>
                  <ModalButton primary onClick={() => addToFavorites(selectedItem)}>
                    Добавить в избранное
                  </ModalButton>
                  <ModalButton onClick={() => predictPrice(selectedItem)}>
                    Прогноз цены
                  </ModalButton>
                  <ModalButton onClick={closeModal}>
                    Закрыть
                  </ModalButton>
                </ButtonContainer>
              </ChartButtonContainer>
            </ModalContent>
          </ModalOverlay>
        )}
      </MainContent>
    </DashboardContainer>
  );
};

export default Dashboard;