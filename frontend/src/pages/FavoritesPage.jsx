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
`;

const MainContent = styled.div`
  flex-grow: 1;
  padding: 2rem;
  background-color: #f0f0f0;
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

const ItemPrice = styled.p`
  margin: 0;
  color: #666;
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

const ErrorMessage = styled.div`
  padding: 1rem;
  background-color: #ffcccc;
  border-radius: 4px;
  color: #d8000c;
  text-align: center;
`;

const FavoritesPage = () => {
  const [user, setUser] = useState(null);
  const [currency, setCurrency] = useState('$');
  const [favorites, setFavorites] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [itemHistory, setItemHistory] = useState(null);
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

  const convertPrice = (price) => {
    if (!price || price === 'N/A' || price === 'Загрузка...') return price;
    const numericPrice = parseFloat(price.replace('$', '')) || 0;
    if (currency === '$') return `${numericPrice.toFixed(2)}${currency}`;

    const priceInUSD = numericPrice;
    const convertedPrice = priceInUSD * exchangeRate[currency];
    return `${convertedPrice.toFixed(2)}${currency === '¥JPY' || currency === '¥CNY' ? currency : currency}`;
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

    axios.get('http://localhost:8000/auth/favorites', { params: { token } })
      .then(response => {
        setFavorites(response.data.items);
      })
      .catch(error => {
        console.error('Failed to fetch favorites:', error);
      });
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
    } catch (error) {
      console.error('Failed to remove item from favorites:', error);
    }
  };

  const handleItemClick = async (item) => {
    setSelectedItem(item);
    setItemHistory(null);
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
    setItemHistory(null);
    setChartState({ xMin: null, xMax: null, yMin: null, yMax: null });
  };

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
    <FavoritesPageContainer>
      <Navbar user={user} currency={currency} setCurrency={setCurrency} />
      <MainContent>
        <h1>Избранное</h1>
        {favorites.length === 0 ? (
          <p>Ваш список избранного пуст.</p>
        ) : (
          <FavoritesGrid>
            {favorites.map((item, index) => (
              <FavoriteCard key={`${item.appid}-${item.market_hash_name}-${index}`} onClick={() => handleItemClick(item)}>
                <ItemImage src={item.icon_url} alt={item.name} />
                <ItemName>{item.name}</ItemName>
                <ItemPrice>{item.price ? convertPrice(item.price) : 'N/A'}</ItemPrice>
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
                  <ModalButton onClick={closeModal}>
                    Закрыть
                  </ModalButton>
                </ButtonContainer>
              </ChartButtonContainer>
            </ModalContent>
          </ModalOverlay>
        )}
      </MainContent>
    </FavoritesPageContainer>
  );
};

export default FavoritesPage;