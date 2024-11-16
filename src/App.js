import { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [ticker, setTicker] = useState('');
  const [stockData, setStockData] = useState(null);
  const [stockList, setStockList] = useState(() => {
    // 초기 상태를 함수로 설정하여 localStorage에서 데이터 불러오기
    const savedStocks = localStorage.getItem('stockList');
    return savedStocks ? JSON.parse(savedStocks) : [];
  });
  const API_KEY = 'DQTM0OGQP5YD1YE2';

  // stockList가 변경될 때마다 localStorage에 저장
  useEffect(() => {
    try {
      localStorage.setItem('stockList', JSON.stringify(stockList));
      console.log('데이터 저장됨:', stockList); // 디버깅용
    } catch (error) {
      console.error('localStorage 저장 실패:', error);
    }
  }, [stockList]);

  // 주식 데이터 삭제 함수
  const deleteStock = (tickerToDelete) => {
    try {
      const updatedList = stockList.filter(stock => stock.ticker !== tickerToDelete);
      setStockList(updatedList);
      localStorage.setItem('stockList', JSON.stringify(updatedList));
    } catch (error) {
      console.error('삭제 중 오류 발생:', error);
    }
  };

  // 전체 데이터 삭제 함수 추가
  const clearAllStocks = () => {
    try {
      setStockList([]);
      localStorage.removeItem('stockList');
    } catch (error) {
      console.error('전체 삭제 중 오류 발생:', error);
    }
  };

  const validateInput = (input) => {
    const englishOnly = /^[A-Za-z]*$/;
    return englishOnly.test(input);
  };

  const handleInputChange = (e) => {
    const input = e.target.value;
    if (validateInput(input)) {
      setTicker(input.toUpperCase());
    } else {
      alert('영어로 입력하세요.');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      searchStock();
    }
  };

  const searchStock = async () => {
    if (!ticker) {
      alert('틱커 심볼을 입력하세요.');
      return;
    }

    // 이미 존재하는 티커인지 확인
    if (stockList.some(stock => stock.ticker === ticker.toUpperCase())) {
      alert('이미 검색된 종목입니다.');
      setTicker('');
      return;
    }

    try {
      setStockData({ loading: true });

      const response = await fetch(
        `https://www.alphavantage.co/query?function=TIME_SERIES_MONTHLY&symbol=${ticker}&apikey=${API_KEY}`
      );
      
      const data = await response.json();

      if (data['Error Message']) {
        alert('존재하지 않는 틱커 심볼입니다.');
        setStockData(null);
        return;
      }

      if (!data['Monthly Time Series']) {
        alert('주가 데이터를 가져올 수 없습니다.');
        setStockData(null);
        return;
      }

      const monthlyData = data['Monthly Time Series'];
      const dates = Object.keys(monthlyData).sort().reverse();
      
      const currentPrice = parseFloat(monthlyData[dates[0]]['4. close']);
      
      const currentYear = new Date().getFullYear();
      const yearStartDate = dates.find(date => date.startsWith(currentYear + '-01'));
      const yearStartPrice = parseFloat(monthlyData[yearStartDate]['4. close']);
      
      const priceDiff = currentPrice - yearStartPrice;
      const returnRate = (priceDiff / yearStartPrice) * 100;

      const newStockData = {
        ticker: ticker.toUpperCase(),
        yearStartPrice: yearStartPrice.toFixed(2),
        currentPrice: currentPrice.toFixed(2),
        priceDiff: priceDiff.toFixed(2),
        returnRate: returnRate.toFixed(2),
        timestamp: new Date().toISOString()
      };

      // 새로운 데이터를 목록에 추가하고 localStorage에 즉시 저장
      const updatedList = [...stockList, newStockData];
      setStockList(updatedList);
      localStorage.setItem('stockList', JSON.stringify(updatedList));
      
      setStockData(null);
      setTicker('');

    } catch (error) {
      console.error('Error fetching stock data:', error);
      alert('주식 데이터를 가져오는데 실패했습니다. API 호출 횟수가 초과되었을 수 있습니다.');
      setStockData(null);
    }
  };

  return (
    <div className="App">
      <h1 className="title">American Stock Search Program</h1>
      <div className="search-container">
        <input
          type="text"
          id="stockTicker"
          name="stockTicker"
          value={ticker}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          placeholder="틱커 심볼을 입력하세요 (예: AAPL)"
          style={{ textTransform: 'uppercase' }}
        />
        <button onClick={searchStock}>검색</button>
        {stockList.length > 0 && (
          <button className="clear-btn" onClick={clearAllStocks}>
            전체 삭제
          </button>
        )}
      </div>

      <div className="table-container">
        {stockData?.loading ? (
          <div className="loading">데이터를 불러오는 중...</div>
        ) : (
          <table className="stock-table">
            <thead>
              <tr>
                <th>틱커명</th>
                <th>년초주가</th>
                <th>현재주가</th>
                <th>등락폭</th>
                <th>수익률</th>
                <th>삭제</th>
              </tr>
            </thead>
            <tbody>
              {stockList.map((stock) => (
                <tr key={stock.ticker}>
                  <td>{stock.ticker}</td>
                  <td>${stock.yearStartPrice}</td>
                  <td>${stock.currentPrice}</td>
                  <td style={{ color: parseFloat(stock.priceDiff) >= 0 ? 'green' : 'red' }}>
                    ${stock.priceDiff}
                  </td>
                  <td style={{ color: parseFloat(stock.returnRate) >= 0 ? 'green' : 'red' }}>
                    {stock.returnRate}%
                  </td>
                  <td>
                    <button 
                      className="delete-btn"
                      onClick={() => deleteStock(stock.ticker)}
                    >
                      삭제
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default App;
