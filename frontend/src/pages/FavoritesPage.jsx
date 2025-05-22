import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import axios from 'axios';
import Navbar from '../components/Navbar';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const FavoritesPageContainer = styled.div`
  display: flex;
  min-height: 100vh;
  padding-top: 60px;
  position: relative;
`;

const MainContent = styled.div`
  flex-grow: 1;
  padding: 2rem;
  background-color: #f0f0f0;
  transition: margin-right 0.3s ease;
  margin-right: ${props => props.isSidebarOpen ? '400px' : '0'};
`;

const HeaderContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
`;

const FavoritesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
`;

const FavoriteCard = styled.div`
  background-color: #fff;
  padding: 1rem;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  text-align: center;
  cursor: pointer;
  position: relative;
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

const RemoveButton = styled.button`
  position: absolute;
  top: 5px;
  right: 5px;
  background-color: #d8000c;
  color: #fff;
  border: none;
  padding: 0.3rem 0.6rem;
  border-radius: 4px;
  cursor: pointer;
  &:hover {
    background-color: #ff3333;
  }
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

const PredictModalContent = styled.div`
  background: #fff;
  padding: 2rem;
  border-radius: 8px;
  width: 500px;
  max-width: 95%;
  max-height: 90vh;
  overflow-y: auto;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 1rem;
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

const ButtonGroup = styled.div`
  display: flex;
  gap: 0.5rem;
  justify-content: center;
`;

const HorizonInput = styled.input`
  margin-left: 0.5rem;
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  width: 60px;
`;

const PredictionResult = styled.div`
  margin-top: 1rem;
  padding: 1rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  text-align: left;
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
  background-color: #ffcccc;
  border-radius: 4px;
  color: #d8000c;
  text-align: center;
`;

const Sidebar = styled.div`
  position: fixed;
  top: 60px;
  right: 0;
  width: 600px;
  height: calc(100vh - 60px);
  background-color: #fff;
  box-shadow: -2px 0 5px rgba(0, 0, 0, 0.2);
  transform: ${props => (props.isOpen ? 'translateX(0)' : 'translateX(100%)')};
  transition: transform 0.3s ease;
  z-index: 1000;
  overflow-y: auto;
  padding: 1rem;
`;

const SidebarHeader = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  margin-bottom: 1rem;
`;

const CloseButtonContainer = styled.div`
  display: flex;
  width: 100%;
  flex-direction: row-reverse;
`;

const SidebarButton = styled.button`
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

const UpdateTimestamp = styled.span`
  font-size: 0.9rem;
  color: #555;
  display: block;
  margin-top: 0.5rem;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #d8000c;
  &:hover {
    color: #ff3333;
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

const AllRecommendationsModal = styled.div`
  position: fixed;
  top: 60px;
  left: 0;
  width: 80%;
  max-width: 1200px;
  height: calc(100vh - 60px);
  background-color: #fff;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  z-index: 2000;
  overflow-y: auto;
  padding: 1rem;
  transform: ${props => (props.isOpen ? 'translateX(0)' : 'translateX(-100%)')};
  transition: transform 0.3s ease;
  margin: 0 auto;
`;

const AllRecommendationsTableWrapper = styled.div`
  width: 100%;
  overflow-x: auto;
`;

const AllRecommendationsTable = styled.table`
  width: 100%;
  min-width: 800px;
  border-collapse: collapse;
  font-size: 0.9rem;
`;

const TableHeader = styled.th`
  padding: 0.5rem;
  background-color: #f5f5f5;
  border-bottom: 1px solid #ddd;
  text-align: left;
  font-weight: bold;
  cursor: pointer;
  &:hover {
    background-color: #e5e5e5;
  }
`;

const TableRow = styled.tr`
  &:hover {
    background-color: #f9f9f9;
  }
`;

const TableCell = styled.td`
  padding: 0.5rem;
  border-bottom: 1px solid #eee;
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
  color: ${props => (props.isUp ? '#008000' : '#d8000c')};
`;

const RecommendationText = styled.span`
  font-weight: ${props => (props.isUp ? 'bold' : 'normal')};
  color: ${props => (props.isUp ? '#008000' : '#d8000c')};
`;

const FavoritesPage = () => {
  const [user, setUser] = useState(null);
  const [currency, setCurrency] = useState('$');
  const [favorites, setFavorites] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [predictItem, setPredictItem] = useState(null);
  const [horizon, setHorizon] = useState(1);
  const [prediction, setPrediction] = useState(null);
  const [predictionError, setPredictionError] = useState(null);
  const [predictionLoading, setPredictionLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [itemHistory, setItemHistory] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [recommendations, setRecommendations] = useState({ favorites: [] });
  const [allRecommendations, setAllRecommendations] = useState([]);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showAllRecommendations, setShowAllRecommendations] = useState(false);
  const [sortDirection, setSortDirection] = useState({});
  const chartRef = useRef(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [chartState, setChartState] = useState({
    xMin: null,
    xMax: null,
    yMin: null,
    yMax: null
  });

  const exchangeRate = {
    '$': 1,
    '₽': 95,
    '€': 0.92,
    '¥JPY': 150,
    '¥CNY': 7.10
  };

  const convertPrice = (price, fromCurrency = '$') => {
    if (!price || price === 'N/A' || price === 'Загрузка...') return price;
    const numericPrice = parseFloat(price.replace(/[^0-9.]/g, '')) || 0;
    if (fromCurrency === currency) return `${numericPrice.toFixed(2)}${currency === '¥JPY' || currency === '¥CNY' ? currency : currency}`;

    const priceInUSD = fromCurrency === '$' ? numericPrice : numericPrice / exchangeRate[fromCurrency];
    const convertedPrice = currency === '$' ? priceInUSD : priceInUSD * exchangeRate[currency];
    return `${convertedPrice.toFixed(2)}${currency === '¥JPY' || currency === '¥CNY' ? currency : currency}`;
  };

  const getCachedPrediction = (appid, marketHashName, horizon) => {
    const cacheKey = `${appid}:${marketHashName}:${horizon}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      const now = new Date();
      if ((now - new Date(timestamp)) / 1000 / 3600 < 24) {
        return data;
      }
    }
    return null;
  };

  const setCachedPrediction = (appid, marketHashName, horizon, data) => {
    const cacheKey = `${appid}:${marketHashName}:${horizon}`;
    const now = new Date().toISOString();
    localStorage.setItem(cacheKey, JSON.stringify({ data, timestamp: now }));
  };

  const fetchHistoryForPrediction = async (appid, marketHashName) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.get(`http://localhost:8000/auth/history`, {
        params: { token, market_hash_name: marketHashName, appid }
      });
      return response.data.history;
    } catch (error) {
      console.error(`Failed to fetch history for ${marketHashName}:`, error);
      throw error;
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
      console.error(`Failed to fetch price for ${marketHashName}:`, error);
      return 'N/A';
    }
  };

  const fetchPrediction = async (appid, marketHashName, horizon) => {
    try {
      await fetchHistoryForPrediction(appid, marketHashName);

      const token = localStorage.getItem('auth_token');
      const response = await axios.get(`http://localhost:8000/auth/predict_price`, {
        params: { token, market_hash_name: marketHashName, appid, horizon },
      });
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
      console.error(`Failed to fetch prediction for ${marketHashName}:`, error);
      return null;
    }
  };

  const updateRecommendations = async () => {
    setIsUpdating(true);
    const newRecommendations = { favorites: [] };
    const newAllRecommendations = [];

    const favoritesPromises = favorites.map(async (item) => {
      let pred = getCachedPrediction(item.appid, item.market_hash_name, 7);
      if (!pred) pred = await fetchPrediction(item.appid, item.market_hash_name, 7);
      const steamPrice = await fetchPriceForItem(item.appid, item.market_hash_name);
      if (pred && pred.predictions.length > 0 && steamPrice !== 'N/A') {
        const lastPred = pred.predictions[pred.predictions.length - 1];
        const recommendation = {
          ...item,
          steam_price: steamPrice,
          predictedPrice: lastPred.predicted_price,
          overallChange: calculateOverallChange(steamPrice, lastPred.predicted_price),
        };
        newAllRecommendations.push(recommendation);
        return recommendation;
      }
      return null;
    });

    const favoritesData = (await Promise.all(favoritesPromises)).filter(Boolean);

    const recommendedItems = favoritesData
      .filter(item => item.overallChange > 0)
      .sort((a, b) => b.overallChange - a.overallChange)
      .slice(0, 5);
    const notRecommendedItems = favoritesData
      .filter(item => item.overallChange <= 0)
      .sort((a, b) => a.overallChange - b.overallChange)
      .slice(0, 5);

    newRecommendations.favorites = [...recommendedItems, ...notRecommendedItems];

    setRecommendations(newRecommendations);
    setAllRecommendations(newAllRecommendations);
    setLastUpdate(new Date().toLocaleString('en-GB', { timeZone: 'Europe/Paris' }));
    setIsUpdating(false);
  };

  const calculateOverallChange = (steamPrice, predictedPrice) => {
    const currentPriceNumeric = parseFloat(steamPrice.replace(/[^0-9.]/g, '')) || 0;
    const predictedPriceNumeric = parseFloat(predictedPrice.replace(/[^0-9.]/g, '')) || 0;
    if (currentPriceNumeric === 0) return 0;
    return ((predictedPriceNumeric - currentPriceNumeric) / currentPriceNumeric) * 100;
  };

  const handleSortAllRecommendations = (type) => {
    const currentDirection = sortDirection[type] || 'asc';
    const newDirection = currentDirection === 'asc' ? 'desc' : 'asc';

    let sorted = [...allRecommendations];
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

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      window.location.href = '/';
      return;
    }

    axios.get('http://localhost:8000/auth/verify', { params: { token } })
      .then(response => setUser(response.data))
      .catch(error => {
        console.error('Error:', error);
        if (error.response?.status === 401) {
          localStorage.removeItem('auth_token');
          window.location.href = '/';
        }
      });

    axios.get('http://localhost:8000/auth/favorites', { params: { token } })
      .then(response => {
        setFavorites(response.data.items);
        updateRecommendations();
      })
      .catch(error => console.error('Failed to fetch favorites:', error));
  }, []);

  const fetchHistory = async (item) => {
    setHistoryLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.get(`http://localhost:8000/auth/history`, {
        params: { token, market_hash_name: item.market_hash_name, appid: item.appid }
      });
      const convertedHistory = response.data.history.map(data => {
        const price = parseFloat(data[1]);
        const convertedPrice = currency === '$' ? price : price * exchangeRate[currency];
        return [data[0], convertedPrice.toString()];
      });
      setItemHistory(convertedHistory);
      setChartState({ xMin: null, xMax: null, yMin: null, yMax: null });
    } catch (error) {
      console.error(`Failed to fetch history for ${item.name}:`, error);
      setItemHistory([]);
    }
    setHistoryLoading(false);
  };

  const removeFromFavorites = async (item) => {
    try {
      const token = localStorage.getItem('auth_token');
      await axios.delete('http://localhost:8000/auth/favorites/remove', {
        params: { token, appid: item.appid, market_hash_name: item.market_hash_name }
      });
      setFavorites(prev => prev.filter(fav => !(fav.appid === item.appid && fav.market_hash_name === item.market_hash_name)));
      updateRecommendations();
    } catch (error) {
      console.error('Failed to remove item from favorites:', error);
    }
  };

  const handleItemClick = async (item) => {
    setSelectedItem(item);
    setPredictItem(null);
    setItemHistory(null);
    setPrediction(null);
    setPredictionError(null);
    setChartState({ xMin: null, xMax: null, yMin: null, yMax: null });

    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.get('http://localhost:8000/auth/price', {
        params: { token, market_hash_name: item.market_hash_name, appid: item.appid }
      });
      setSelectedItem(prev => ({ ...prev, ...response.data }));
    } catch (error) {
      console.error('Failed to fetch price for selected item:', error);
      setSelectedItem(prev => ({
        ...prev,
        steam_price: 'N/A',
        market_csgo_price: 'N/A',
        market_dota2_price: 'N/A',
        lis_skins_price: 'N/A'
      }));
    }
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

  const predictPrice = async (item) => {
    setPredictItem(item);
    setPrediction(null);
    setPredictionError(null);
    setHorizon(1);
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

      await fetchHistoryForPrediction(predictItem.appid, predictItem.market_hash_name);
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
      console.error(`Failed to fetch prediction for ${predictItem.name}:`, error.response ? error.response.data : error.message);
      setPredictionError(error.response?.data?.detail || 'Не удалось получить прогноз цены');
    } finally {
      setPredictionLoading(false);
    }
  };

  useEffect(() => {
    if (selectedItem || predictItem) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [selectedItem, predictItem]);

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

  const getRecommendationText = (overallChange) => {
    if (overallChange > 0) return 'рекомендуется к покупке';
    if (overallChange < 0) return 'не рекомендуется к покупке';
    return 'стабильная цена';
  };

  return (
    <FavoritesPageContainer>
      <Navbar user={user} currency={currency} setCurrency={setCurrency} />
      <MainContent isSidebarOpen={isSidebarOpen}>
        <HeaderContainer>
          <h1>Избранное</h1>
          <SidebarButton onClick={() => setIsSidebarOpen(true)}>Рекомендации</SidebarButton>
        </HeaderContainer>
        {favorites.length === 0 ? (
          <p>Ваш список избранного пуст.</p>
        ) : (
          <FavoritesGrid>
            {favorites.map((item, index) => (
              <FavoriteCard key={`${item.appid}-${item.market_hash_name}-${index}`} onClick={() => handleItemClick(item)}>
                <ItemImage src={item.icon_url} alt={item.name} />
                <ItemName>{item.name}</ItemName>
                <RemoveButton onClick={(e) => { e.stopPropagation(); removeFromFavorites(item); }}>
                  Удалить
                </RemoveButton>
              </FavoriteCard>
            ))}
          </FavoritesGrid>
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
                  <div>
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
                  </div>
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
                  <ModalButton onClick={() => fetchHistory(selectedItem)}>
                    {historyLoading ? 'Загрузка...' : 'Загрузить историю'}
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
              <ButtonGroup>
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
              </ButtonGroup>
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
      <Sidebar isOpen={isSidebarOpen}>
        <SidebarHeader>
          <CloseButtonContainer>
            <CloseButton onClick={() => setIsSidebarOpen(false)}>×</CloseButton>
          </CloseButtonContainer>
          <div>
            <SidebarButton onClick={updateRecommendations} disabled={isUpdating}>
              {isUpdating ? 'Обновление...' : 'Обновить рекомендации'}
            </SidebarButton>
            {lastUpdate && <UpdateTimestamp>Обновлено: {lastUpdate}</UpdateTimestamp>}
          </div>
          <SidebarButton onClick={() => setShowAllRecommendations(true)}>Все рекомендации</SidebarButton>
        </SidebarHeader>
        <RecommendationSection>
          <h3>Рекомендации по избранным (на 1 неделю)</h3>
          {recommendations.favorites.length === 0 ? (
            <p>Рекомендации отсутствуют. Добавьте предметы в избранное.</p>
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
                {recommendations.favorites.map((item, index) => (
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
      </Sidebar>
      <AllRecommendationsModal isOpen={showAllRecommendations}>
        <CloseButtonContainer>
          <CloseButton onClick={() => setShowAllRecommendations(false)}>×</CloseButton>
        </CloseButtonContainer>
        <h3>Все рекомендации</h3>
        <AllRecommendationsTableWrapper>
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
    </FavoritesPageContainer>
  );
};

export default FavoritesPage;