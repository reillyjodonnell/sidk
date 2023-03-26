// pages/api/ping.js

import { spawn } from 'child_process';
import { IPv4, SubnetMask } from 'ip-address';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).end('Method Not Allowed');
    return;
  }

  const { subnet, subnetMask } = req.body;

  let ips = [];

  if (subnet.includes('/')) {
    const cidr = IPv4.parse(subnet);
    ips = Array.from(cidr.iterator());
  } else if (subnet && subnetMask) {
    const cidr = new IPv4(`${subnet}/${subnetMask}`);
    ips = Array.from(cidr.iterator());
  } else {
    res.status(400).json({ error: 'Invalid input' });
    return;
  }

  const successfulPings = await Promise.all(
    ips.map((ip) => {
      return ping(ip);
    })
  );

  const results = [];

  for (let i = 0; i < ips.length; i++) {
    if (successfulPings[i]) {
      const hostnames = await reverseLookup(ips[i]).catch(() => []);
      results.push({
        ipAddress: ips[i].address,
        hostnames,
      });
    }
  }

  res.status(200).json({ results });
}

async function ping(ipAddress) {
  return new Promise((resolve) => {
    const child = spawn('ping', ['-c', '1', '-w', '2', ipAddress.address]);
    child.on('close', (code) => {
      resolve(code === 0);
    });
  });
}

async function reverseLookup(ipAddress) {
  return new Promise((resolve) => {
    const child = spawn('nslookup', [ipAddress.address]);
    let output = '';
    child.stdout.on('data', (data) => {
      output += data.toString();
    });
    child.on('close', (code) => {
      if (code === 0) {
        const matches = output.match(/Name: (.+)/);
        if (matches && matches[1]) {
          resolve(matches[1].trim());
        } else {
          resolve([]);
        }
      } else {
        resolve([]);
      }
    });
  });
}
