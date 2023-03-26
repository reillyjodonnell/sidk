import { exec } from 'child_process';

export default async function Ping(req, res) {
  if (req.method === 'POST') {
    const { subnet, subnetMask = null } = req.body;

    try {
      const results = await pingSubnet({ subnet, subnetMask });
      res.status(200).json(results);
    } catch (err) {
      console.log(err);
      res.status(500).send(err.message);
    }
  } else {
    res.status(405).end(); // Method Not Allowed
  }
}

async function pingSubnet({ subnet, subnetMask }) {
  // If subnet mask is not provided, calculate it from CIDR notation
  const { subnet: validSubnet, subnetMask: validSubnetMask } =
    cidrToSubnetAndSubnetMask(subnet, subnetMask);

  // Calculate the number of IP addresses based on the validSubnetMask
  const subnetMaskInt = validSubnetMask
    .split('.')
    .reduce((acc, octet) => (acc << 8) + parseInt(octet), 0);
  const numIPAddresses = ~subnetMaskInt + 1 - 2;

  // Calculate the first usable IP address in the subnet
  function ipStringToNumber(ipString) {
    const octets = ipString.split('.').map(Number);
    return (octets[0] << 24) + (octets[1] << 16) + (octets[2] << 8) + octets[3];
  }

  function ipNumberToString(ipNumber) {
    return [
      (ipNumber >>> 24) & 255,
      (ipNumber >>> 16) & 255,
      (ipNumber >>> 8) & 255,
      ipNumber & 255,
    ].join('.');
  }

  function getFirstUsableIP(subnet, subnetMask) {
    const subnetNumber = ipStringToNumber(subnet);
    const subnetMaskNumber = ipStringToNumber(subnetMask);
    const firstUsableIPNumber = (subnetNumber & subnetMaskNumber) + 1;
    return ipNumberToString(firstUsableIPNumber);
  }

  function getLastUsableIP(subnet, subnetMask) {
    const subnetNumber = ipStringToNumber(subnet);
    const subnetMaskNumber = ipStringToNumber(subnetMask);
    const broadcastAddressNumber =
      (subnetNumber & subnetMaskNumber) + (~subnetMaskNumber & 0xffffffff);
    const lastUsableIPNumber = broadcastAddressNumber - 1;
    return ipNumberToString(lastUsableIPNumber);
  }

  const pingIP = (ip) => {
    return new Promise((resolve, reject) => {
      const start = performance.now();
      exec(`ping -c 1 ${ip}`, (error, stdout, stderr) => {
        if (error) {
          resolve({
            ip: ip,
            status: 'Offline',
            responseTime: null,
            hostname: null,
          });
        } else {
          exec(`nslookup ${ip}`, (err, stdout, stderr) => {
            if (err) {
              resolve({
                ip: ip,
                status: 'Online',
                responseTime: null,
                hostname: null,
              });
            } else {
              const output = stdout.toString();
              const match = output.match(/name = ([^\s]+)/i);
              const hostname = match ? match[1] : null;

              const dns = {
                ip: ip,
                status: 'Online',
                responseTime: null,
                hostname: hostname,
              };
              resolve(dns);
            }
          });
        }
      });
    });
  };

  // Calculate the first and last usable IP addresses in the subnet
  const firstUsableIP = getFirstUsableIP(validSubnet, validSubnetMask);
  const lastUsableIP = getLastUsableIP(validSubnet, validSubnetMask);

  const firstUsableIPNumber = ipStringToNumber(firstUsableIP);
  const lastUsableIPNumber = ipStringToNumber(lastUsableIP);

  const promises = [];
  for (
    let ipNumber = firstUsableIPNumber;
    ipNumber <= lastUsableIPNumber;
    ipNumber++
  ) {
    const ip = ipNumberToString(ipNumber);
    promises.push(pingIP(ip));
  }

  const concurrency = 10;
  const chunks = Array.from(
    Array(Math.ceil(promises.length / concurrency)),
    (_, i) => promises.slice(i * concurrency, i * concurrency + concurrency)
  );
  const results = (
    await Promise.all(chunks.map((chunk) => Promise.all(chunk)))
  ).flat();

  return results;
}

function cidrToSubnetAndSubnetMask(subnetInput, subnetMaskInput) {
  const cidrIndex = subnetInput.indexOf('/');
  console.log(subnetMaskInput);

  if (cidrIndex === -1 && !subnetMaskInput) {
    throw new Error(
      'Input string does not contain a forward slash (/) to denote CIDR notation and subnet mask is not provided.'
    );
  }

  if (cidrIndex === -1 && subnetMaskInput) {
    // Subnet mask is not provided and CIDR notation is not present, so return null
    return { subnet: subnetInput, subnetMask: subnetMaskInput };
  }

  let subnet = subnetInput;
  let subnetMask;

  if (cidrIndex !== -1) {
    // CIDR notation is present
    const cidr = parseInt(subnetInput.slice(cidrIndex + 1), 10);

    if (isNaN(cidr) || cidr < 0 || cidr > 32) {
      throw new Error('Invalid CIDR value. Must be between 0 and 32.');
    }

    subnet = subnetInput.slice(0, cidrIndex); // Remove CIDR notation
    subnetMask = (0xffffffff << (32 - cidr)) >>> 0;
  } else {
    // Subnet mask is provided
    subnetMask = subnetMaskInput;
  }

  const maskOctets = [
    (subnetMask >>> 24) & 0xff,
    (subnetMask >>> 16) & 0xff,
    (subnetMask >>> 8) & 0xff,
    subnetMask & 0xff,
  ];

  const maskString = maskOctets.join('.');
  const subnetOctets = subnet.split('.');
  if (subnetOctets.length !== 4) {
    throw new Error('Invalid subnet address. Must have four octets.');
  }
  for (let i = 0; i < 4; i++) {
    if (
      isNaN(subnetOctets[i]) ||
      subnetOctets[i] < 0 ||
      subnetOctets[i] > 255
    ) {
      throw new Error(
        'Invalid subnet address. Octets must be between 0 and 255.'
      );
    }
  }
  // Add zeroes for the host bits in the subnet
  const subnetInt =
    (parseInt(subnetOctets[0]) << 24) |
    (parseInt(subnetOctets[1]) << 16) |
    (parseInt(subnetOctets[2]) << 8) |
    parseInt(subnetOctets[3]);
  const subnetMaskInt =
    (maskOctets[0] << 24) |
    (maskOctets[1] << 16) |
    (maskOctets[2] << 8) |
    maskOctets[3];
  const validSubnetInt = subnetInt & subnetMaskInt;
  const validSubnetOctets = [
    (validSubnetInt >>> 24) & 0xff,
    (validSubnetInt >>> 16) & 0xff,
    (validSubnetInt >>> 8) & 0xff,
    validSubnetInt & 0xff,
  ];
  const validSubnetString = validSubnetOctets.join('.');
  const validSubnetMask = maskString;
  return { subnet: validSubnetString, subnetMask: validSubnetMask };
}
