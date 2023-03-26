import { useState, useEffect } from 'react';
import axios from 'axios';
import { sortData } from './utils';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import useSubnet from './useSubnet';

export default function Home() {
  const [subnet, setSubnet] = useSubnet('', 'subnet');
  const [subnetMask, setSubnetMask] = useSubnet('', 'subnetMask');

  const [pingResults, setPingResults] = useState([]);
  const [sortDirection, setSortDirection] = useState({
    property: 'ip',
    direction: 'asc',
  });
  const [loading, setLoading] = useState(false);
  const [pinged, setPinged] = useState(false);

  useEffect(() => {
    if (pinged) {
      setPingResults(sortData(pingResults, 'ip', 'asc'));
    }
  }, [pinged]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setPingResults([]);
    setPinged(true);
    setLoading(true);
    const response = await axios.post('/api/ping', {
      subnet,
      subnetMask,
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

  // Helper function to render an arrow icon
  const renderSortArrow = (property) => {
    if (sortDirection.property === property) {
      if (sortDirection.direction === 'asc') {
        return <span>&uarr;</span>;
      } else {
        return <span>&darr;</span>;
      }
    } else {
      return null;
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <h1 style={{ fontSize: 40 }}>Subnet Pinger</h1>
      <form
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'end',
          height: '100%',
        }}
        onSubmit={handleSubmit}
      >
        <label>
          CIDR:
          <input
            type="text"
            value={subnet}
            onChange={(e) => setSubnet(e.target.value)}
            placeholder="192.168.68.1/24"
          />
        </label>
        <span
          style={{
            width: '100%',
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center',
          }}
        >
          Or
        </span>
        <label>
          Subnet:
          <input
            type="text"
            value={subnet}
            onChange={(e) => setSubnet(e.target.value)}
            placeholder="192.168.68.1"
          />
        </label>

        <label>
          Subnet Mask:
          <input
            type="text"
            value={subnetMask}
            onChange={(e) => setSubnetMask(e.target.value)}
            placeholder="255.255.255.0"
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
                  {Array.from(Array(20), (_, i) => (
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
                    <th onClick={() => handleSort('ip')}>
                      IP Address {renderSortArrow('ip')}
                    </th>
                    <th onClick={() => handleSort('responseTime')}>
                      Response Time {renderSortArrow('responseTime')}
                    </th>
                    <th onClick={() => handleSort('status')}>
                      Status {renderSortArrow('status')}
                    </th>
                    <th onClick={() => handleSort('hostname')}>
                      Hostname {renderSortArrow('hostname')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pingResults.map((result, index) => {
                    return (
                      <tr key={index}>
                        <td>{result.ip}</td>
                        <td>
                          {result.responseTime !== null
                            ? `${result.responseTime} ms`
                            : '-'}
                        </td>
                        <td>
                          {result.status}
                          <span
                            style={{ marginLeft: 3 }}
                            className={
                              result.status === 'Online' ? 'online' : 'offline'
                            }
                          ></span>
                        </td>
                        <td>{result.hostname ? result.hostname : '-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}
