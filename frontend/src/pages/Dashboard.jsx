import React from 'react';
import { useEffect, useState, useRef } from 'react';
import styled from 'styled-components';
import axios from 'axios';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import InventoryCard from '../components/InventoryCard';
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
  background-color: #f0f0f0;
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
  background-color: ${props => props.primary ? '#66c0f4' : props.warning ? '#ffa500' : '#d8000c'};
  color: #fff;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  width: 100%;
  &:hover {
    background-color: ${props => props.primary ? '#8ed1ff' : props.warning ? '#ffcc00' : '#ff3333'};
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

const TotalValue = styled.div`
  background-color: #fff;
  padding: 1rem;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 1rem;
  text-align: center;
  font-size: 1.2rem;
  font-weight: bold;
`;

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [originalInventory, setOriginalInventory] = useState([]);
  const [filteredInventory, setFilteredInventory] = useState([]);
  const [filters, setFilters] = useState({
    game: '',
    cs2: { type: '', rarity: '', wear: '', stattrak: false },
    dota2: { rarity: 'Any', hero: 'Any' }
  });
  const [loading, setLoading] = useState(false);
  const [inventoryError, setInventoryError] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
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
  const [currency, setCurrency] = useState('$');
  const [totalInventoryValueSteam, setTotalInventoryValueSteam] = useState(0);
  const [totalInventoryValueMarket, setTotalInventoryValueMarket] = useState(0);
  const [totalInventoryValueLisSkins, setTotalInventoryValueLisSkins] = useState(0);
  const [isItemInFavorites, setIsItemInFavorites] = useState(false);
  const [favoritesMessage, setFavoritesMessage] = useState('');

  const exchangeRate = {
    '$': 1,
    '₽': 95,
    '€': 0.92,
    '¥JPY': 150,
    '¥CNY': 7.10
  };

  const convertPrice = (price, fromCurrency = '$') => {
    if (!price || price === 'N/A' || price === 'Загрузка...') return price;
    const numericPrice = parseFloat(price.replace('$', '')) || 0;
    if (fromCurrency === currency) return `${numericPrice.toFixed(2)}${currency === '¥JPY' || currency === '¥CNY' ? currency : currency}`;

    const priceInUSD = fromCurrency === '$' ? numericPrice : numericPrice / exchangeRate[fromCurrency];
    const convertedPrice = currency === '$' ? priceInUSD : priceInUSD * exchangeRate[currency];
    return `${convertedPrice.toFixed(2)}${currency === '¥JPY' || currency === '¥CNY' ? currency : currency}`;
  };

  const calculateTotalInventoryValue = () => {
    let totalSteam = 0;
    let totalMarket = 0;
    let totalLisSkins = 0;

    filteredInventory.forEach(item => {
      if (item.steam_price && item.steam_price !== 'N/A' && item.steam_price !== 'Загрузка...') {
        const numericPrice = parseFloat(item.steam_price.replace('$', '')) || 0;
        const priceInSelectedCurrency = currency === '$' ? numericPrice : numericPrice * exchangeRate[currency];
        totalSteam += priceInSelectedCurrency;
      }

      const marketPrice = item.appid === '730' ? item.market_csgo_price : item.market_dota2_price;
      if (marketPrice && marketPrice !== 'N/A' && marketPrice !== 'Загрузка...') {
        const numericMarketPrice = parseFloat(marketPrice.replace('$', '')) || 0;
        const marketPriceInSelectedCurrency = currency === '$' ? numericMarketPrice : numericMarketPrice * exchangeRate[currency];
        totalMarket += marketPriceInSelectedCurrency;
      }

      if (item.lis_skins_price && item.lis_skins_price !== 'N/A' && item.lis_skins_price !== 'Загрузка...') {
        const numericLisSkinsPrice = parseFloat(item.lis_skins_price.replace('$', '')) || 0;
        const lisSkinsPriceInSelectedCurrency = currency === '$' ? numericLisSkinsPrice : numericLisSkinsPrice * exchangeRate[currency];
        totalLisSkins += lisSkinsPriceInSelectedCurrency;
      }
    });

    setTotalInventoryValueSteam(totalSteam.toFixed(2));
    setTotalInventoryValueMarket(totalMarket.toFixed(2));
    setTotalInventoryValueLisSkins(totalLisSkins.toFixed(2));
  };

  const applyFilters = (items) => {
    return items.filter(item => {
      const isCS2 = item.appid === '730';
      const filter = isCS2 ? filters.cs2 : filters.dota2;
      const properties = item.properties || {};

      if (isCS2) {
        return (
          (!filter.type || properties.type === filter.type) &&
          (!filter.rarity || properties.rarity === filter.rarity) &&
          (!filter.wear || properties.wear?.includes(filter.wear)) &&
          (!filter.stattrak || (filter.stattrak && properties.attributes?.includes('stattrak_available')))
        );
      } else {
        return (
          (filter.rarity === 'Any' || !filter.rarity || properties.rarity === filter.rarity) &&
          (filter.hero === 'Any' || !filter.hero || properties.hero === filter.hero)
        );
      }
    });
  };

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
        updatedInventory[i] = { ...item, ...cachedPrices[cacheKey] };
        setLoadedCount(prev => prev + 1);
        setInventory([...updatedInventory]);
        setOriginalInventory([...updatedInventory]);
        continue;
      }

      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log(`Fetching price for ${item.name} (${item.market_hash_name})`);
      try {
        const response = await axios.get(`http://localhost:8000/auth/price`, {
          params: { token, market_hash_name: item.market_hash_name, appid: item.appid, force_refresh: forceRefresh }
        });
        console.log(`Price response for ${item.name}:`, response.data);
        updatedInventory[i] = { ...item, ...response.data };
        cachedPrices[cacheKey] = response.data;
      } catch (error) {
        console.error(`Failed to fetch price for ${item.name}:`, error.response ? error.response.data : error.message);
        if (item.appid === '730') {
          updatedInventory[i] = {
            ...item,
            steam_price: 'N/A',
            market_csgo_price: 'N/A',
            lis_skins_price: 'N/A'
          };
          cachedPrices[cacheKey] = {
            steam_price: 'N/A',
            market_csgo_price: 'N/A',
            lis_skins_price: 'N/A'
          };
        } else {
          updatedInventory[i] = {
            ...item,
            steam_price: 'N/A',
            market_dota2_price: 'N/A',
            lis_skins_price: 'N/A'
          };
          cachedPrices[cacheKey] = {
            steam_price: 'N/A',
            market_dota2_price: 'N/A',
            lis_skins_price: 'N/A'
          };
        }
      }

      setLoadedCount(prev => prev + 1);
      setInventory([...updatedInventory]);
      setOriginalInventory([...updatedInventory]);
      localStorage.setItem('price_cache', JSON.stringify(cachedPrices));
    }

    setPriceLoading(false);
    setFilteredInventory(applyFilters(updatedInventory));
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
      const convertedHistory = response.data.history.map(data => {
        const price = parseFloat(data[1]);
        const convertedPrice = currency === '$' ? price : price * exchangeRate[currency];
        return [data[0], convertedPrice.toString()];
      });
      setItemHistory(convertedHistory);
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
          setOriginalInventory([]);
          setFilteredInventory([]);
        } else {
          setInventory(inventoryData);
          setOriginalInventory(inventoryData);
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

  const checkIfItemInFavorites = async (item) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.get('http://localhost:8000/auth/favorites', { params: { token } });
      const favorites = response.data.items;
      const isInFavorites = favorites.some(fav =>
        fav.appid === item.appid && fav.market_hash_name === item.market_hash_name
      );
      setIsItemInFavorites(isInFavorites);
      return isInFavorites;
    } catch (error) {
      console.error('Failed to check favorites:', error);
      setFavoritesMessage('Ошибка проверки избранного');
      return false;
    }
  };

  const addToFavorites = async (item) => {
    const isAlreadyInFavorites = await checkIfItemInFavorites(item);
    if (isAlreadyInFavorites) {
      setFavoritesMessage('Этот предмет уже в избранном!');
      setTimeout(() => setFavoritesMessage(''), 3000);
      return;
    }

    try {
      const token = localStorage.getItem('auth_token');
      await axios.post('http://localhost:8000/auth/favorites/add', item, {
        params: { token }
      });
      setFavoritesMessage('Предмет добавлен в избранное!');
      setIsItemInFavorites(true);
      setTimeout(() => setFavoritesMessage(''), 3000);
    } catch (error) {
      console.error('Failed to add to favorites:', error);
      setFavoritesMessage('Ошибка при добавлении в избранное');
      setTimeout(() => setFavoritesMessage(''), 3000);
    }
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
      checkIfItemInFavorites(selectedItem);
    } else {
      document.body.style.overflow = 'auto';
      setFavoritesMessage('');
      setIsItemInFavorites(false);
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [selectedItem]);

  useEffect(() => {
    calculateTotalInventoryValue();
  }, [filteredInventory, currency]);

  useEffect(() => {
    if (itemHistory) {
      const convertedHistory = itemHistory.map(data => {
        const price = parseFloat(data[1]);
        const priceInUSD = currency === '$' ? price : price / exchangeRate[currency];
        const convertedPrice = currency === '$' ? priceInUSD : priceInUSD * exchangeRate[currency];
        return [data[0], convertedPrice.toString()];
      });
      setItemHistory(convertedHistory);
    }
  }, [currency]);

  useEffect(() => {
    if (inventory.length > 0) {
      const filtered = applyFilters(inventory);
      setFilteredInventory([...filtered]);
    }
  }, [filters, inventory]);

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
      sorted.sort((a, b) => (parseFloat(a.steam_price?.replace('$', '')) || 0) - (parseFloat(b.steam_price?.replace('$', '')) || 0));
    } else if (sortType === 'price_desc') {
      sorted.sort((a, b) => (parseFloat(b.steam_price?.replace('$', '')) || 0) - (parseFloat(a.steam_price?.replace('$', '')) || 0));
    } else if (sortType === '') {
      const filtered = applyFilters(originalInventory);
      sorted = [...filtered];
    }
    setFilteredInventory(sorted);
  };

  const handleFilter = (key, value) => {
    if (key === 'game') {
      setFilters(prev => ({
        ...prev,
        game: value,
        cs2: { type: '', rarity: '', wear: '', stattrak: false },
        dota2: { rarity: 'Any', hero: 'Any' }
      }));
    } else {
      const isCS2 = filters.game === '730';
      setFilters(prev => ({
        ...prev,
        [isCS2 ? 'cs2' : 'dota2']: {
          ...prev[isCS2 ? 'cs2' : 'dota2'],
          [key]: value
        }
      }));
    }
  };

  const handleResetFilters = () => {
    setFilters({
      game: filters.game,
      cs2: { type: '', rarity: '', wear: '', stattrak: false },
      dota2: { rarity: 'Any', hero: 'Any' }
    });
    const resetFiltered = applyFilters(originalInventory);
    setFilteredInventory([...resetFiltered]);
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

  const predictPrice = (item) => {
    console.log(`Predicting price for ${item.name}`);
  };

  const chartData = itemHistory ? {
    labels: itemHistory.map(data => {
      const [day, month, year] = data[0].split(' ');
      return `${day} ${month} ${year}`;
    }),
    datasets: [{
      label: `Цена (${currency === '¥JPY' ? '¥ (JPY)' : currency === '¥CNY' ? '¥ (CNY)' : currency})`,
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
        title: { display: true, text: `Цена (${currency === '¥JPY' ? '¥ (JPY)' : currency === '¥CNY' ? '¥ (CNY)' : currency})` },
        min: chartState.yMin,
        max: chartState.yMax
      }
    }
  };

  return (
    <DashboardContainer>
      <Navbar user={user} currency={currency} setCurrency={setCurrency} />
      <Sidebar
        onSort={handleSort}
        onFilter={handleFilter}
        game={filters.game}
        cs2Filters={filters.cs2}
        dota2Filters={filters.dota2}
        onResetFilters={handleResetFilters}
      />
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
            <TotalValue>
              Стоимость инвентаря (Steam): {totalInventoryValueSteam}{currency === '¥JPY' || currency === '¥CNY' ? currency : currency}
              <br />
              Стоимость инвентаря ({filters.game === '730' ? 'Market.CSGO' : 'Market.Dota2'}): {totalInventoryValueMarket}{currency === '¥JPY' || currency === '¥CNY' ? currency : currency}
              <br />
              Стоимость инвентаря (Lis-Skins): {totalInventoryValueLisSkins}{currency === '¥JPY' || currency === '¥CNY' ? currency : currency}
            </TotalValue>
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
                <InventoryCard
                  key={`${item.classid}-${index}`}
                  item={item}
                  onClick={handleItemClick}
                  convertPrice={convertPrice}
                />
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
                  <img src={selectedItem.icon_url} alt={selectedItem.name} style={{ width: '100%', maxHeight: '150px', objectFit: 'contain' }} />
                </ImageWrapper>
                <PriceWrapper>
                  <PriceTable>
                    <p>Steam: {convertPrice(selectedItem.steam_price)}</p>
                    {selectedItem.appid === '730' ? (
                      <>
                        <p>Market.CSGO: {convertPrice(selectedItem.market_csgo_price)}</p>
                        <p>Lis-Skins: {convertPrice(selectedItem.lis_skins_price)}</p>
                      </>
                    ) : (
                      <>
                        <p>Market.Dota2: {convertPrice(selectedItem.market_dota2_price)}</p>
                        <p>Lis-Skins: {convertPrice(selectedItem.lis_skins_price)}</p>
                      </>
                    )}
                  </PriceTable>
                </PriceWrapper>
              </ItemInfoContainer>
              {favoritesMessage && (
                <ErrorMessage style={{ backgroundColor: isItemInFavorites && favoritesMessage.includes('добавлен') ? '#ccffcc' : '#ffcccc', color: isItemInFavorites && favoritesMessage.includes('добавлен') ? '#008000' : '#d8000c' }}>
                  {favoritesMessage}
                </ErrorMessage>
              )}
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
                  <ModalButton primary onClick={() => addToFavorites(selectedItem)} warning={isItemInFavorites}>
                    {isItemInFavorites ? 'Уже в избранном' : 'Добавить в избранное'}
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