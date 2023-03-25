import { useState } from 'react';
import axios from 'axios';
import { sortData } from './utils';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

export default function Home() {
  const [subnet, setSubnet] = useState('192.168.1');
  const [ipRange, setIpRange] = useState(10);
  const [pingResults, setPingResults] = useState([]);
  const [sortDirection, setSortDirection] = useState({
    property: '',
    direction: 'asc',
  });
  const [loading, setLoading] = useState(false);
  const [pinged, setPinged] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setPingResults([]);
    setPinged(true);
    setLoading(true);
    const response = await axios.post('/api/ping', {
      subnet,
      ipRange,
    });
    setPingResults(response.data);
    setLoading(false);
  };

  const handleSort = (property) => {
    const direction =
      sortDirection.property === property && sortDirection.direction === 'asc'
        ? 'desc'
        : 'asc';
    setSortDirection({ property, direction });
    setPingResults(sortData(pingResults, property, direction));
  };

  return (
    <div>
      <h1>Subnet Pinger</h1>
      <form onSubmit={handleSubmit}>
        <label>
          Subnet:
          <input
            type="text"
            value={subnet}
            onChange={(e) => setSubnet(e.target.value)}
            placeholder="192.168.1"
          />
        </label>
        <label>
          IP Range:
          <input
            type="number"
            value={ipRange}
            onChange={(e) => setIpRange(parseInt(e.target.value, 10))}
            min="1"
            max="255"
          />
        </label>
        <button type="submit">Ping</button>
      </form>
      <div>
        {pinged ? (
          <>
            <h2>Ping Results</h2>
            {pingResults.length === 0 && (
              <table className="table-skeleton">
                <thead>
                  <tr>
                    <th onClick={() => handleSort('ip')}>IP Address</th>
                    <th onClick={() => handleSort('responseTime')}>
                      Response Time
                    </th>
                    <th onClick={() => handleSort('status')}>Status</th>
                    <th onClick={() => handleSort('hostname')}>Hostname</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from(Array(ipRange), (_, i) => (
                    <tr key={i}>
                      <td>
                        <Skeleton
                          width={100}
                          height={20}
                          duration={1.2}
                          animation={loading ? 'wave' : undefined}
                          style={{ borderRadius: '4px' }}
                        />
                      </td>
                      <td>
                        <Skeleton
                          width={100}
                          height={20}
                          duration={1.2}
                          animation={loading ? 'wave' : undefined}
                          style={{ borderRadius: '4px' }}
                        />
                      </td>
                      <td>
                        <Skeleton
                          width={100}
                          height={20}
                          duration={1.2}
                          animation={loading ? 'wave' : undefined}
                          style={{ borderRadius: '4px' }}
                        />
                      </td>

                      <td>
                        <Skeleton
                          enableAnimation={true}
                          width={100}
                          height={20}
                          duration={1.2}
                          animation={loading ? 'wave' : undefined}
                          style={{ borderRadius: '4px' }}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {pingResults.length > 0 && (
              <table>
                <thead>
                  <tr>
                    <th onClick={() => handleSort('ip')}>IP Address</th>
                    <th onClick={() => handleSort('responseTime')}>
                      Response Time
                    </th>
                    <th onClick={() => handleSort('status')}>Status</th>
                    <th onClick={() => handleSort('hostname')}>Hostname</th>
                  </tr>
                </thead>
                <tbody>
                  {pingResults.map((result, index) => (
                    <tr key={index}>
                      <td>{result.ip}</td>
                      <td>
                        {result.responseTime !== null
                          ? `${result.responseTime} ms`
                          : '-'}
                      </td>
                      <td>{result.status}</td>
                      <td>{result.hostname}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}
