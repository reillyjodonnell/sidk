import { exec } from 'child_process';
import dns from 'dns';

export default async function Ping(req, res) {
  if (req.method === 'POST') {
    const { subnet, ipRange } = req.body;

    const pingIP = (i) => {
      return new Promise((resolve, reject) => {
        exec(`ping -c 1 ${subnet}.${i}`, (error, stdout, stderr) => {
          if (error) {
            resolve({
              ip: `${subnet}.${i}`,
              status: 'Offline',
              responseTime: null,
              hostname: null,
            });
          } else {
            dns.reverse(`${subnet}.${i}`, (err, hostnames) => {
              const hostname = err ? '' : hostnames[0] || '';
              resolve({
                ip: `${subnet}.${i}`,
                status: 'Online',
                responseTime: null,
                hostname: hostname,
              });
            });
          }
        });
      });
    };

    const promises = [];
    for (let i = 1; i <= ipRange; i++) {
      promises.push(pingIP(i));
    }

    const concurrency = 10;
    const chunks = Array.from(Array(Math.ceil(ipRange / concurrency)), (_, i) =>
      promises.slice(i * concurrency, i * concurrency + concurrency)
    );
    const results = (
      await Promise.all(chunks.map((chunk) => Promise.all(chunk)))
    ).flat();
    res.status(200).json(results);
  } else {
    res.status(405).end(); // Method Not Allowed
  }
}
