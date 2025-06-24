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
  padding-top: 50px;
  color: #E0E0E0;
`;

const MainContent = styled.div`
  flex-grow: 1;
  padding: 2rem;
  background-color: #323040;
  margin-left: 288px;
  transition: margin-right 0.3s ease;
  margin-right: ${props => props.isRecommendationSidebarOpen ? '400px' : '0'};
  color: #E0E0E0;
`;

const HeaderContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  h1 {
    color: #E0E0E0;
  }
`;

const InventoryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1.5rem;
`;


const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(17, 24, 39, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
  overflow: hidden;
`;

const ModalContent = styled.div`
  background: #323040;
  color: #E0E0E0;
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
  border: 1px solid #4A475C;
`;

const PredictModalContent = styled(ModalContent)`
  width: 500px;
  gap: 1rem;
`;

const ItemInfoContainer = styled.div`
  display: flex;
  gap: 1.5rem;
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
  gap: 1.5rem;
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
  background-color: #282633;
  border-radius: 8px;
  padding: 1rem;
  canvas {
    max-height: 100% !important;
    max-width: 100% !important;
  }
`;

const ButtonContainer = styled.div`
  flex: 0 0 150px;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  justify-content: center;
`;

const ModalButton = styled.button`
  background-color: ${props => props.primary ? '#7C3AED' : props.warning ? '#F59E0B' : '#EF4444'};
  color: #fff;
  border: none;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  width: 100%;
  font-weight: 600;
  transition: background-color 0.2s ease;
  &:hover {
    background-color: ${props => props.primary ? '#8B5CF6' : props.warning ? '#FBBF24' : '#F87171'};
  }
  &:disabled {
    background-color: #4A475C;
    color: #9CA3AF;
    cursor: not-allowed;
  }
`;

const HorizonInput = styled.input`
  margin-left: 0.5rem;
  padding: 0.5rem;
  border-radius: 8px;
  width: 60px;
  background-color: #282633;
  color: #E0E0E0;
  border: 1px solid #4A475C;
`;

const PredictionResult = styled.div`
  margin-top: 1rem;
  padding: 1rem;
  border: 1px solid #4A475C;
  border-radius: 8px;
  text-align: left;
  background-color: #282633;
`;

const PredictionList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const PredictionItem = styled.li`
  margin: 0.5rem 0;
`;

const ErrorMessage = styled.div`
  padding: 1rem;
  background-color: rgba(239, 68, 68, 0.2);
  border-radius: 8px;
  color: #F87171;
  border: 1px solid #EF4444;
  text-align: center;
`;

const PriceTable = styled.div`
  margin: 0;
`;

const PriceText = styled.p`
  margin: 0.5rem 0;
  font-size: 1.1rem;
  color: ${props => (props.isLowest ? '#22C55E' : 'inherit')};
  font-weight: ${props => (props.isLowest ? 'bold' : 'normal')};
`;

const ResetCacheButton = styled.button`
  background-color: #EF4444;
  color: #fff;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  margin-bottom: 1rem;
  font-weight: 600;
  transition: background-color 0.2s ease;
  &:hover {
    background-color: #F87171;
  }
  &:disabled {
    background-color: #4A475C;
    cursor: not-allowed;
  }
`;

const UpdateInfoContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
`;

const UpdateTimestamp = styled.span`
  font-size: 0.9rem;
  color: #9CA3AF;
`;

const ProgressText = styled.p`
  margin: 0.5rem 0;
  color: #E0E0E0;
`;

const TotalValue = styled.div`
  background-color: #282633;
  color: #E0E0E0;
  padding: 1.5rem;
  border-radius: 8px;
  border: 1px solid #4A475C;
  margin-bottom: 1.5rem;
  text-align: center;
  font-size: 1.2rem;
  font-weight: bold;
`;

const RecommendationSidebar = styled.div`
  position: fixed;
  top: 60px;
  right: 0;
  min-width: 600px;
  height: calc(100vh - 60px);
  background-color: #282633;
  color: #E0E0E0;
  box-shadow: -4px 0 10px rgba(0, 0, 0, 0.25);
  transform: ${props => (props.isOpen ? 'translateX(0)' : 'translateX(100%)')};
  transition: transform 0.3s ease-in-out;
  z-index: 1000;
  overflow-y: auto;
  padding: 1.5rem;
`;

const AllRecommendationsModal = styled(ModalOverlay)``;

const SidebarHeader = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const CloseButtonContainer = styled.div`
  display: flex;
  width: 100%;
  justify-content: flex-end;
`;

const SidebarButton = styled.button`
  background-color: #7C3AED;
  color: #fff;
  border: none;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: background-color 0.2s ease;
  &:hover {
    background-color: #8B5CF6;
  }
  &:disabled {
    background-color: #4A475C;
    color: #9CA3AF;
    cursor: not-allowed;
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #EF4444;
  transition: color 0.2s ease;
  &:hover {
    color: #F87171;
  }
`;

const RecommendationSection = styled.div`
  margin-bottom: 1.5rem;
`;

const RecommendationTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
`;

const AllRecommendationsTableWrapper = styled.div`
  width: 100%;
  overflow-x: auto;
  background: #323040;
  padding: 1rem;
  border-radius: 8px;
`;

const AllRecommendationsTable = styled(RecommendationTable)`
    min-width: 800px;
`;

const TableHeader = styled.th`
  padding: 0.75rem;
  background-color: #323040;
  border-bottom: 1px solid #4A475C;
  text-align: left;
  font-weight: bold;
  cursor: pointer;
  &:hover {
    background-color: #4A475C;
  }
`;

const TableRow = styled.tr`
  transition: background-color 0.2s ease;
  &:hover {
    background-color: #3a384a;
  }
`;

const TableCell = styled.td`
  padding: 0.75rem;
  border-bottom: 1px solid #4A475C;
  text-align: left;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ItemNameCell = styled(TableCell)`
  max-width: 120px;
`;

const RecommendationCell = styled(TableCell)`
  white-space: normal;
  max-width: 150px;
`;

const TrendIcon = styled.span`
  color: ${props => (props.isUp ? '#22C55E' : '#EF4444')};
`;

const RecommendationText = styled.span`
  font-weight: ${props => (props.isUp ? 'bold' : 'normal')};
  color: ${props => (props.isUp ? '#22C55E' : '#EF4444')};
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
  const [predictItem, setPredictItem] = useState(null);
  const [horizon, setHorizon] = useState(1);
  const [prediction, setPrediction] = useState(null);
  const [predictionError, setPredictionError] = useState(null);
  const [predictionLoading, setPredictionLoading] = useState(false);
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
  const [lastPriceUpdate, setLastPriceUpdate] = useState(null);
  const [resetSorting, setResetSorting] = useState(false);
  const [isRecommendationSidebarOpen, setIsRecommendationSidebarOpen] = useState(false);
  const [recommendations, setRecommendations] = useState({ inventory: [], favorites: [] });
  const [allRecommendations, setAllRecommendations] = useState([]);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [recommendationProgress, setRecommendationProgress] = useState(0);
  const [estimatedTimeMin, setEstimatedTimeMin] = useState(0);
  const [remainingTimeSec, setRemainingTimeSec] = useState(0);
  const [showAllRecommendations, setShowAllRecommendations] = useState(false);
  const [sortType, setSortType] = useState('default');
  const [sortDirection, setSortDirection] = useState({});

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

  const getCachedPrediction = (appid, marketHashName, horizon) => {
    const cacheKey = `${appid}:${marketHashName}:${horizon}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      return { data, timestamp };
    }
    return null;
  };

  const setCachedPrediction = (appid, marketHashName, horizon, data) => {
    const cacheKey = `${appid}:${marketHashName}:${horizon}`;
    const now = new Date().toISOString();
    localStorage.setItem(cacheKey, JSON.stringify({ data, timestamp: now }));
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

      if (useCache && cachedPrices[cacheKey] && !forceRefresh) {
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
        if (error.response && error.response.status === 429 && cachedPrices[cacheKey]) {
          console.log(`429 Too Many Requests for ${item.name}. Using cached data: ${cachedPrices[cacheKey]}`);
          updatedInventory[i] = { ...item, ...cachedPrices[cacheKey] };
        } else {
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
      }

      setLoadedCount(prev => prev + 1);
      setInventory([...updatedInventory]);
      setOriginalInventory([...updatedInventory]);
      localStorage.setItem('price_cache', JSON.stringify(cachedPrices));
    }

    setPriceLoading(false);
    setLastPriceUpdate(new Date());
    setFilteredInventory(applyFilters(updatedInventory));
  };

  const resetCache = async () => {
    const token = localStorage.getItem('auth_token');
    try {
      localStorage.removeItem('price_cache');
      localStorage.removeItem('history_cache');
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('history:')) localStorage.removeItem(key);
      });
      await axios.get('http://localhost:8000/auth/reset_cache', { params: { token } });
      fetchPrices(inventory, token, false, true);
    } catch (error) {
      console.error('Failed to reset cache:', error.response ? error.response.data : error.message);
    }
  };

  const fetchHistory = async (item, token) => {
    setHistoryLoading(true);
    const cacheKey = `history:${item.appid}:${item.market_hash_name}`;
    const cachedHistory = localStorage.getItem(cacheKey);

    if (cachedHistory) {
      const { data, timestamp } = JSON.parse(cachedHistory);
      const now = new Date();
      console.log(`Cached history for ${item.name} exists, age: ${(now - new Date(timestamp)) / 1000 / 3600} hours`);
      const convertedHistory = data.map(data => {
        const price = parseFloat(data[1]);
        const convertedPrice = currency === '$' ? price : price * exchangeRate[currency];
        return [data[0], convertedPrice.toString()];
      });
      setItemHistory(convertedHistory);
      setChartState({ xMin: null, xMax: null, yMin: null, yMax: null });
      setHistoryLoading(false);
      return;
    }

    try {
      const response = await axios.get(`http://localhost:8000/auth/history`, {
        params: { token, market_hash_name: item.market_hash_name, appid: item.appid }
      });
      console.log(`History response for ${item.name}:`, response.data);
      const historyData = response.data.history;
      localStorage.setItem(cacheKey, JSON.stringify({ data: historyData, timestamp: new Date().toISOString() }));
      const convertedHistory = historyData.map(data => {
        const price = parseFloat(data[1]);
        const convertedPrice = currency === '$' ? price : price * exchangeRate[currency];
        return [data[0], convertedPrice.toString()];
      });
      setItemHistory(convertedHistory);
      setChartState({ xMin: null, xMax: null, yMin: null, yMax: null });
    } catch (error) {
      if (error.response && error.response.status === 429 && cachedHistory) {
        console.log(`429 Too Many Requests for ${item.name}. Using cached history`);
        const { data } = JSON.parse(cachedHistory);
        const convertedHistory = data.map(data => {
          const price = parseFloat(data[1]);
          const convertedPrice = currency === '$' ? price : price * exchangeRate[currency];
          return [data[0], convertedPrice.toString()];
        });
        setItemHistory(convertedHistory);
      } else {
        console.error(`Failed to fetch history for ${item.name}:`, error.response ? error.response.data : error.message);
        setItemHistory([]);
      }
    }
    setHistoryLoading(false);
  };

  const fetchHistoryForPrediction = async (appid, marketHashName) => {
    const cacheKey = `history:${appid}:${marketHashName}`;
    const cachedHistory = localStorage.getItem(cacheKey);

    if (cachedHistory) {
      const { data, timestamp } = JSON.parse(cachedHistory);
      const now = new Date();
      console.log(`Cached history for ${marketHashName} exists, age: ${(now - new Date(timestamp)) / 1000 / 3600} hours`);
      return data;
    }

    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.get(`http://localhost:8000/auth/history`, {
        params: { token, market_hash_name: marketHashName, appid }
      });
      const historyData = response.data.history;
      localStorage.setItem(cacheKey, JSON.stringify({ data: historyData, timestamp: new Date().toISOString() }));
      console.log(`Fetched and cached history for ${marketHashName}`);
      return historyData;
    } catch (error) {
      if (error.response && error.response.status === 429 && cachedHistory) {
        console.log(`429 Too Many Requests for ${marketHashName}. Using cached history`);
        return JSON.parse(cachedHistory).data;
      }
      console.error(`Failed to fetch history for ${marketHashName}:`, error);
      return [];
    }
  };

  const predictPrice = async (item) => {
    setPredictItem(item);
    setPrediction(null);
    setPredictionError(null);
    setHorizon(1);
  };

  const fetchPrediction = async (appid, marketHashName, horizon) => {
    let cached = getCachedPrediction(appid, marketHashName, horizon);
    if (cached) {
      console.log(`Using cached prediction for ${marketHashName}, age: ${(new Date() - new Date(cached.timestamp)) / 1000 / 3600} hours`);
      const convertedPrediction = {
        ...cached.data,
        last_known_price: convertPrice(`$${cached.data.last_known_price}`),
        predictions: cached.data.predictions.map(pred => ({
          ...pred,
          predicted_price: convertPrice(`$${pred.predicted_price}`),
        })),
      };
      return convertedPrediction;
    }

    try {
      await fetchHistoryForPrediction(appid, marketHashName);
      const token = localStorage.getItem('auth_token');
      const response = await axios.get(`http://localhost:8000/auth/predict_price`, {
        params: { token, market_hash_name: marketHashName, appid, horizon },
      });
      console.log(`Prediction response for ${marketHashName}:`, response.data);
      const convertedPrediction = {
        ...response.data,
        last_known_price: convertPrice(`$${response.data.last_known_price}`),
        predictions: response.data.predictions.map(pred => ({
          ...pred,
          predicted_price: convertPrice(`$${pred.predicted_price}`),
        })),
      };
      setCachedPrediction(appid, marketHashName, horizon, convertedPrediction);
      return convertedPrediction;
    } catch (error) {
      if (error.response && error.response.status === 429) {
        console.log(`429 Too Many Requests for ${marketHashName}. Using cached prediction if available`);
        if (cached) {
          const convertedPrediction = {
            ...cached.data,
            last_known_price: convertPrice(`$${cached.data.last_known_price}`),
            predictions: cached.data.predictions.map(pred => ({
              ...pred,
              predicted_price: convertPrice(`$${pred.predicted_price}`),
            })),
          };
          return convertedPrediction;
        }
      }
      console.error(`Failed to fetch prediction for ${marketHashName}:`, error);
      return null;
    }
  };

  const fetchPriceForItem = async (appid, marketHashName) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.get(`http://localhost:8000/auth/price`, {
        params: { token, market_hash_name: marketHashName, appid }
      });
      return response.data.steam_price || 'N/A';
    } catch (error) {
      if (error.response && error.response.status === 429) {
        const cachedPrices = JSON.parse(localStorage.getItem('price_cache') || '{}');
        const cacheKey = `${appid}:${marketHashName}`;
        if (cachedPrices[cacheKey]) {
          console.log(`429 Too Many Requests for ${marketHashName}. Using cached price: ${cachedPrices[cacheKey].steam_price}`);
          return cachedPrices[cacheKey].steam_price || 'N/A';
        }
      }
      console.error(`Failed to fetch price for ${marketHashName}:`, error);
      return 'N/A';
    }
  };

  const fetchPredictionForModal = async () => {
    if (!predictItem) return;

    setPredictionLoading(true);
    setPredictionError(null);
    setPrediction(null);

    try {
      const currentPrice = await fetchPriceForItem(predictItem.appid, predictItem.market_hash_name);
      if (currentPrice === 'N/A') throw new Error('Не удалось получить текущую цену предмета');

      const currentPriceNumeric = parseFloat(currentPrice.replace(/[^0-9.]/g, '')) || 0;

      const history = await fetchHistoryForPrediction(predictItem.appid, predictItem.market_hash_name);
      if (history.length === 0) throw new Error('Нет исторических данных для прогнозирования');

      const token = localStorage.getItem('auth_token');
      const response = await axios.get(`http://localhost:8000/auth/predict_price`, {
        params: {
          token,
          market_hash_name: predictItem.market_hash_name,
          appid: predictItem.appid,
          horizon,
        },
      });

      const apiLastKnownPriceNumeric = parseFloat(response.data.last_known_price) || 0;
      const adjustmentFactor = apiLastKnownPriceNumeric !== 0 ? currentPriceNumeric / apiLastKnownPriceNumeric : 1;

      const adjustedPredictions = response.data.predictions.map(pred => {
        const predictedPriceNumeric = parseFloat(pred.predicted_price) || 0;
        const adjustedPriceNumeric = predictedPriceNumeric * adjustmentFactor;
        const adjustedPrice = convertPrice(`$${adjustedPriceNumeric}`);
        const predictedPctChange = ((adjustedPriceNumeric - currentPriceNumeric) / currentPriceNumeric) * 100;

        return {
          ...pred,
          predicted_price: adjustedPrice,
          predicted_pct_change: predictedPctChange,
        };
      });

      const convertedPrediction = {
        ...response.data,
        last_known_price: convertPrice(currentPrice),
        predictions: adjustedPredictions,
      };

      setPrediction(convertedPrediction);
    } catch (error) {
      if (error.response && error.response.status === 429) {
        console.log(`429 Too Many Requests for ${predictItem.name}. Using cached prediction if available`);
        const cached = getCachedPrediction(predictItem.appid, predictItem.market_hash_name, horizon);
        if (cached) {
          const currentPrice = await fetchPriceForItem(predictItem.appid, predictItem.market_hash_name);
          const currentPriceNumeric = parseFloat(currentPrice.replace(/[^0-9.]/g, '')) || 0;
          const apiLastKnownPriceNumeric = parseFloat(cached.data.last_known_price.replace(/[^0-9.]/g, '')) || 0;
          const adjustmentFactor = apiLastKnownPriceNumeric !== 0 ? currentPriceNumeric / apiLastKnownPriceNumeric : 1;

          const adjustedPredictions = cached.data.predictions.map(pred => {
            const predictedPriceNumeric = parseFloat(pred.predicted_price.replace(/[^0-9.]/g, '')) || 0;
            const adjustedPriceNumeric = predictedPriceNumeric * adjustmentFactor;
            const adjustedPrice = convertPrice(`$${adjustedPriceNumeric}`);
            const predictedPctChange = ((adjustedPriceNumeric - currentPriceNumeric) / currentPriceNumeric) * 100;

            return {
              ...pred,
              predicted_price: adjustedPrice,
              predicted_pct_change: predictedPctChange,
            };
          });

          setPrediction({
            ...cached.data,
            last_known_price: convertPrice(currentPrice),
            predictions: adjustedPredictions,
          });
        } else {
          setPredictionError('Превышен лимит запросов, и нет кешированных данных.');
        }
      } else {
        console.error(`Failed to fetch prediction for ${predictItem.name}:`, error.response ? error.response.data : error.message);
        setPredictionError(error.response?.data?.detail || 'Не удалось получить прогноз цены');
      }
    } finally {
      setPredictionLoading(false);
    }
  };

  const updateRecommendations = async () => {
    setIsUpdating(true);
    setRecommendationProgress(0);
    const newAllRecommendations = [];
    const totalItems = filteredInventory.length;
    const delayMs = 6000;
    let itemsNeedingDelay = 0;

    for (let i = 0; i < totalItems; i++) {
      const item = filteredInventory[i];
      const cacheKey = `history:${item.appid}:${item.market_hash_name}`;
      const cachedHistory = localStorage.getItem(cacheKey);
      if (!cachedHistory) itemsNeedingDelay++;
    }

    const totalEstimatedTimeMs = totalItems * delayMs;
    setEstimatedTimeMin(Math.ceil(totalEstimatedTimeMs / 60000));
    setRemainingTimeSec(Math.ceil((totalItems * delayMs) / 1000));

    for (let i = 0; i < totalItems; i++) {
      const item = filteredInventory[i];
      const cacheKey = `history:${item.appid}:${item.market_hash_name}`;
      let wasRequestMade = false;

      try {
        const history = await fetchHistoryForPrediction(item.appid, item.market_hash_name);
        if (!localStorage.getItem(cacheKey) || history.length === 0) {
          wasRequestMade = true;
        }
        let steamPrice = item.steam_price;
        if (!steamPrice || steamPrice === 'N/A') {
          steamPrice = await fetchPriceForItem(item.appid, item.market_hash_name);
        }
        const pred = await fetchPrediction(item.appid, item.market_hash_name, 7);
        if (pred && pred.predictions.length > 0 && steamPrice !== 'N/A') {
          const lastPred = pred.predictions[pred.predictions.length - 1];
          const recommendation = {
            ...item,
            steam_price: steamPrice,
            predictedPrice: lastPred.predicted_price,
            overallChange: calculateOverallChange(steamPrice, lastPred.predicted_price),
          };
          newAllRecommendations.push(recommendation);
        } else {
          console.log(`Skipping ${item.market_hash_name}: Invalid data (steamPrice=${steamPrice}, prediction=${pred ? 'available' : 'unavailable'})`);
        }
      } catch (error) {
        console.error(`Error processing ${item.name}:`, error);
      }

      const currentProgress = ((i + 1) / totalItems) * 100;
      setRecommendationProgress(currentProgress);

      const remainingItems = totalItems - (i + 1);
      setRemainingTimeSec(Math.ceil((remainingItems * delayMs) / 1000));

      if (wasRequestMade && i < totalItems - 1) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }

    const recommendedItems = newAllRecommendations
      .filter(item => item.overallChange > 0)
      .sort((a, b) => b.overallChange - a.overallChange)
      .slice(0, 5);
    const notRecommendedItems = newAllRecommendations
      .filter(item => item.overallChange <= 0)
      .sort((a, b) => a.overallChange - b.overallChange)
      .slice(0, 5);

    const newRecommendations = { inventory: [...recommendedItems, ...notRecommendedItems] };
    const updateTime = new Date();
    setRecommendations(newRecommendations);
    setAllRecommendations(newAllRecommendations);
    setLastUpdate(updateTime);
    setRecommendationProgress(100);
    setRemainingTimeSec(0);
    setIsUpdating(false);

    try {
      await axios.post('http://localhost:8000/auth/recommendations', {
        recommendations: newRecommendations,
        allRecommendations: newAllRecommendations,
        timestamp: updateTime.toISOString()
      }, { params: { token: localStorage.getItem('auth_token') } });
    } catch (error) {
      console.error('Failed to save recommendations:', error.response ? error.response.data : error.message);
    }
  };

  const calculateOverallChange = (steamPrice, predictedPrice) => {
    const currentPriceNumeric = parseFloat(steamPrice.replace(/[^0-9.]/g, '')) || 0;
    const predictedPriceNumeric = parseFloat(predictedPrice.replace(/[^0-9.]/g, '')) || 0;
    if (currentPriceNumeric === 0) return 0;
    return ((predictedPriceNumeric - currentPriceNumeric) / currentPriceNumeric) * 100;
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
        const fetchCachedRecommendations = async () => {
          try {
            const response = await axios.get('http://localhost:8000/auth/recommendations', { params: { token } });
            setRecommendations(response.data.recommendations || { inventory: [] });
            setAllRecommendations(response.data.allRecommendations || []);
            setLastUpdate(response.data.timestamp ? new Date(response.data.timestamp) : null);
          } catch (error) {
            console.error('No cached recommendations or error:', error.response ? error.response.data : error.message);
          }
        };
        fetchCachedRecommendations();
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
    if (selectedItem || predictItem) {
      document.body.style.overflow = 'hidden';
      if (selectedItem) {
        checkIfItemInFavorites(selectedItem);
      }
    } else {
      document.body.style.overflow = 'auto';
      setFavoritesMessage('');
      setIsItemInFavorites(false);
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [selectedItem, predictItem]);

  useEffect(() => {
    calculateTotalInventoryValue();
  }, [filteredInventory, currency]);

  useEffect(() => {
    if (inventory.length > 0) {
      const filtered = applyFilters(inventory);
      setFilteredInventory(prev => {
        if (JSON.stringify(prev) !== JSON.stringify(filtered)) {
          return [...filtered];
        }
        return prev;
      });
    }
  }, [filters, inventory]);

  useEffect(() => {
    if (resetSorting) {
      setResetSorting(false);
    }
  }, [resetSorting]);

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
    let hasChanged = false;

    if (sortType === 'price_asc') {
      sorted.sort((a, b) => (parseFloat(a.steam_price?.replace('$', '')) || 0) - (parseFloat(b.steam_price?.replace('$', '')) || 0));
      hasChanged = true;
    } else if (sortType === 'price_desc') {
      sorted.sort((a, b) => (parseFloat(b.steam_price?.replace('$', '')) || 0) - (parseFloat(a.steam_price?.replace('$', '')) || 0));
      hasChanged = true;
    } else if (sortType === '') {
      const filtered = applyFilters(originalInventory);
      sorted = [...filtered];
      hasChanged = true;
    }

    if (hasChanged) {
    setFilteredInventory(sorted);
    }
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
    setResetSorting(true);
  };

  const handleItemClick = (item) => {
    setSelectedItem(item);
    setPredictItem(null);
    setItemHistory(null);
    setChartState({ xMin: null, xMax: null, yMin: null, yMax: null });
  };

  const closeModal = () => {
    setSelectedItem(null);
    setPredictItem(null);
    setItemHistory(null);
    setPrediction(null);
    setPredictionError(null);
    setChartState({ xMin: null, xMax: null, yMin: null, yMax: null });
  };

  const closePredictionModal = () => {
    setPredictItem(null);
    setPrediction(null);
    setPredictionError(null);
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
      borderColor: '#8B5CF6',
      tension: 0.1
    }]
  } : null;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            labels: {
                color: '#E0E0E0'
            }
        }
    },
    scales: {
      x: {
        title: { display: true, text: 'Дата', color: '#9CA3AF' },
        ticks: {
          color: '#9CA3AF',
          maxTicksLimit: 8,
          maxRotation: 45,
          minRotation: 45
        },
        grid: {
          color: '#4A475C'
        },
        min: chartState.xMin,
        max: chartState.xMax
      },
      y: {
        title: { display: true, text: `Цена (${currency === '¥JPY' ? '¥ (JPY)' : currency === '¥CNY' ? '¥ (CNY)' : currency})`, color: '#9CA3AF' },
        ticks: {
            color: '#9CA3AF'
        },
        grid: {
          color: '#4A475C'
        },
        min: chartState.yMin,
        max: chartState.yMax
      }
    }
  };

  const getRecommendationText = (overallChange) => {
    if (overallChange > 0) return 'рекомендуется сохранить';
    if (overallChange < 0) return 'рекомендуется продать';
    return 'стабильная цена';
  };

  const handleSortAllRecommendations = (type) => {
    const currentDirection = sortDirection[type] || 'asc';
    const newDirection = currentDirection === 'asc' ? 'desc' : 'asc';

    let sorted = [...allRecommendations];
    setSortType(type);
    setSortDirection(prev => ({ ...prev, [type]: newDirection }));

    switch (type) {
      case 'price':
        sorted.sort((a, b) => {
          const priceA = parseFloat(a.steam_price.replace(/[^0-9.]/g, '')) || 0;
          const priceB = parseFloat(b.steam_price.replace(/[^0-9.]/g, '')) || 0;
          return newDirection === 'asc' ? priceA - priceB : priceB - priceA;
        });
        break;
      case 'name':
        sorted.sort((a, b) => {
          return newDirection === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
        });
        break;
      case 'predictedPrice':
        sorted.sort((a, b) => {
          const priceA = parseFloat(a.predictedPrice.replace(/[^0-9.]/g, '')) || 0;
          const priceB = parseFloat(b.predictedPrice.replace(/[^0-9.]/g, '')) || 0;
          return newDirection === 'asc' ? priceA - priceB : priceB - priceA;
        });
        break;
      case 'change':
        sorted.sort((a, b) => {
          return newDirection === 'asc' ? (a.overallChange || 0) - (b.overallChange || 0) : (b.overallChange || 0) - (a.overallChange || 0);
        });
        break;
      default:
        sorted.sort((a, b) => a.name.localeCompare(b.name));
    }
    setAllRecommendations(sorted);
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
        resetSorting={resetSorting}
      />
      <MainContent isRecommendationSidebarOpen={isRecommendationSidebarOpen}>
<HeaderContainer>
  <h1>Ваш инвентарь</h1>
  {filters.game && (
    <SidebarButton onClick={() => setIsRecommendationSidebarOpen(true)}>Рекомендации</SidebarButton>
  )}
</HeaderContainer>
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
            <UpdateInfoContainer>
              <ResetCacheButton
                onClick={resetCache}
                disabled={priceLoading || inventory.length === 0}
              >
                {priceLoading ? 'Обновление...' : 'Обновить цены'}
              </ResetCacheButton>
              {lastPriceUpdate && (
                <UpdateTimestamp>
                  Последнее обновление: {new Date(lastPriceUpdate).toLocaleString()}
                </UpdateTimestamp>
              )}
            </UpdateInfoContainer>
            {priceLoading && (
              <ProgressText>Загружено: {loadedCount}/{totalCount}</ProgressText>
            )}
            <InventoryGrid>
              {filteredInventory.map((item, index) => (
                <InventoryCard
                  key={`${item.classid}-${index}`}
                  item={item}
                  onClick={handleItemClick}
                  onPredict={predictPrice}
                  convertPrice={convertPrice}
                />
              ))}
            </InventoryGrid>
          </>
        )}
        {selectedItem && (() => {
          const getNumericPrice = (priceString) => {
            if (!priceString || typeof priceString !== 'string' || priceString === 'N/A' || priceString === 'Загрузка...') {
              return Infinity;
            }
            const numericValue = parseFloat(priceString.replace(/[^0-9.]/g, ''));
            return isNaN(numericValue) ? Infinity : numericValue;
          };

          const steamPriceNum = getNumericPrice(selectedItem.steam_price);
          const marketPriceNum = getNumericPrice(selectedItem.appid === '730' ? selectedItem.market_csgo_price : selectedItem.market_dota2_price);
          const lisSkinsPriceNum = getNumericPrice(selectedItem.lis_skins_price);

          const allPrices = [steamPriceNum, marketPriceNum, lisSkinsPriceNum].filter(p => p !== Infinity);
          const minPrice = allPrices.length > 0 ? Math.min(...allPrices) : Infinity;

          return (
            <ModalOverlay onClick={closeModal}>
              <ModalContent onClick={(e) => e.stopPropagation()}>
                <h2>{selectedItem.name}</h2>
                <ItemInfoContainer>
                  <ImageWrapper>
                    <img src={selectedItem.icon_url} alt={selectedItem.name} style={{ width: '100%', maxHeight: '150px', objectFit: 'contain' }} />
                  </ImageWrapper>
                  <PriceWrapper>
                    <PriceTable>
                      <PriceText isLowest={steamPriceNum !== Infinity && steamPriceNum === minPrice}>
                        Steam: {convertPrice(selectedItem.steam_price)}
                      </PriceText>
                      {selectedItem.appid === '730' ? (
                        <>
                          <PriceText isLowest={marketPriceNum !== Infinity && marketPriceNum === minPrice}>
                            Market.CSGO: {convertPrice(selectedItem.market_csgo_price)}
                          </PriceText>
                          <PriceText isLowest={lisSkinsPriceNum !== Infinity && lisSkinsPriceNum === minPrice}>
                            Lis-Skins: {convertPrice(selectedItem.lis_skins_price)}
                          </PriceText>
                        </>
                      ) : (
                        <>
                          <PriceText isLowest={marketPriceNum !== Infinity && marketPriceNum === minPrice}>
                            Market.Dota2: {convertPrice(selectedItem.market_dota2_price)}
                          </PriceText>
                          <PriceText isLowest={lisSkinsPriceNum !== Infinity && lisSkinsPriceNum === minPrice}>
                            Lis-Skins: {convertPrice(selectedItem.lis_skins_price)}
                          </PriceText>
                        </>
                      )}
                    </PriceTable>
                  </PriceWrapper>
                </ItemInfoContainer>
                {favoritesMessage && (
                  <ErrorMessage style={{ backgroundColor: isItemInFavorites && favoritesMessage.includes('добавлен') ? '#ccffcc' : '#ffcccc', color: isItemInFavorites && favoritesMessage.includes('добавлен') ? '#008000' : '#d800c' }}>
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
          );
        })()}
        {predictItem && (
          <ModalOverlay onClick={closePredictionModal}>
            <PredictModalContent onClick={(e) => e.stopPropagation()}>
              <h2>Прогноз цены для {predictItem.name}</h2>
              <div>
                <label>
                  Горизонт прогнозирования (дни):
                  <HorizonInput
                    type="number"
                    min="1"
                    max="14"
                    value={horizon}
                    onChange={(e) => setHorizon(Number(e.target.value))}
                  />
                </label>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                <ModalButton
                  primary
                  onClick={fetchPredictionForModal}
                  disabled={predictionLoading || horizon < 1 || horizon > 14}
                >
                  {predictionLoading ? 'Прогнозирование...' : 'Прогнозировать'}
                </ModalButton>
                <ModalButton onClick={closePredictionModal}>
                  Закрыть
                </ModalButton>
              </div>
              {predictionError && (
                <ErrorMessage>{predictionError}</ErrorMessage>
              )}
              {prediction && (
                <PredictionResult>
                  <h3>Результат прогноза</h3>
                  <p>Последняя известная цена на {prediction.last_known_date}: {prediction.last_known_price}</p>
                  <h4>Прогноз:</h4>
                  <PredictionList>
                    {prediction.predictions.map((pred, index) => (
                      <PredictionItem key={index}>
                        {pred.date}: {pred.predicted_price} (
                        {pred.predicted_pct_change > 0 ? '+' : ''}{pred.predicted_pct_change.toFixed(3)}%)
                      </PredictionItem>
                    ))}
                  </PredictionList>
                </PredictionResult>
              )}
            </PredictModalContent>
          </ModalOverlay>
        )}
      </MainContent>
      <RecommendationSidebar isOpen={isRecommendationSidebarOpen}>
        <SidebarHeader>
          <CloseButtonContainer>
            <CloseButton onClick={() => setIsRecommendationSidebarOpen(false)}>×</CloseButton>
          </CloseButtonContainer>
          <div>
            <SidebarButton onClick={updateRecommendations} disabled={isUpdating || filteredInventory.length === 0}>
              {isUpdating ? 'Обновление...' : 'Обновить рекомендации'}
            </SidebarButton>
            {lastUpdate && <UpdateTimestamp>Обновлено: {new Date(lastUpdate).toLocaleString()}</UpdateTimestamp>}
            {isUpdating && (
              <ProgressText>
                Обработка: {Math.round(recommendationProgress)}% (примерно {estimatedTimeMin} мин, осталось {remainingTimeSec} сек)
              </ProgressText>
            )}
          </div>
          <SidebarButton onClick={() => setShowAllRecommendations(true)}>Все рекомендации</SidebarButton>
        </SidebarHeader>
        <RecommendationSection>
          <h3>Рекомендации по инвентарю (на 1 неделю)</h3>
          {recommendations.inventory.length === 0 ? (
            <p>Рекомендации отсутствуют. Обновите данные или выберите игру.</p>
          ) : (
            <RecommendationTable>
              <thead>
                <tr>
                  <TableHeader>Предмет</TableHeader>
                  <TableHeader>Текущая цена</TableHeader>
                  <TableHeader>Прогноз цены</TableHeader>
                  <TableHeader>Изменение</TableHeader>
                  <TableHeader>Рекомендация</TableHeader>
                </tr>
              </thead>
              <tbody>
                {recommendations.inventory.map((item, index) => (
                  <TableRow key={index}>
                    <ItemNameCell title={item.name}>{item.name}</ItemNameCell>
                    <TableCell>{convertPrice(item.steam_price)}</TableCell>
                    <TableCell>{item.predictedPrice}</TableCell>
                    <TableCell>
                      <TrendIcon isUp={item.overallChange > 0}>
                        {item.overallChange > 0 ? '↑' : '↓'} {Math.abs(item.overallChange).toFixed(2)}%
                      </TrendIcon>
                    </TableCell>
                    <RecommendationCell>
                      <RecommendationText isUp={item.overallChange > 0}>
                        {getRecommendationText(item.overallChange)}
                      </RecommendationText>
                    </RecommendationCell>
                  </TableRow>
                ))}
              </tbody>
            </RecommendationTable>
          )}
        </RecommendationSection>
      </RecommendationSidebar>
      {showAllRecommendations && (
        <AllRecommendationsModal isOpen={showAllRecommendations}>
            <AllRecommendationsTableWrapper>
                <CloseButtonContainer>
                    <CloseButton onClick={() => setShowAllRecommendations(false)}>×</CloseButton>
                </CloseButtonContainer>
                <h3>Все рекомендации</h3>
                <AllRecommendationsTable>
                    <thead>
                    <tr>
                        <TableHeader onClick={() => handleSortAllRecommendations('name')}>
                        Предмет {sortDirection['name'] === 'asc' ? '↑' : '↓'}
                        </TableHeader>
                        <TableHeader onClick={() => handleSortAllRecommendations('price')}>
                        Текущая цена {sortDirection['price'] === 'asc' ? '↑' : '↓'}
                        </TableHeader>
                        <TableHeader onClick={() => handleSortAllRecommendations('predictedPrice')}>
                        Прогноз цены {sortDirection['predictedPrice'] === 'asc' ? '↑' : '↓'}
                        </TableHeader>
                        <TableHeader onClick={() => handleSortAllRecommendations('change')}>
                        Изменение {sortDirection['change'] === 'asc' ? '↑' : '↓'}
                        </TableHeader>
                        <TableHeader>Рекомендация</TableHeader>
                    </tr>
                    </thead>
                    <tbody>
                    {allRecommendations.map((item, index) => (
                        <TableRow key={index}>
                        <ItemNameCell title={item.name}>{item.name}</ItemNameCell>
                        <TableCell>{convertPrice(item.steam_price)}</TableCell>
                        <TableCell>{item.predictedPrice}</TableCell>
                        <TableCell>
                            <TrendIcon isUp={item.overallChange > 0}>
                            {item.overallChange > 0 ? '↑' : '↓'} {Math.abs(item.overallChange).toFixed(2)}%
                            </TrendIcon>
                        </TableCell>
                        <RecommendationCell>
                            <RecommendationText isUp={item.overallChange > 0}>
                            {getRecommendationText(item.overallChange)}
                            </RecommendationText>
                            </RecommendationCell>
                        </TableRow>
                    ))}
                    </tbody>
                </AllRecommendationsTable>
            </AllRecommendationsTableWrapper>
        </AllRecommendationsModal>
      )}
    </DashboardContainer>
  );
};

export default Dashboard;