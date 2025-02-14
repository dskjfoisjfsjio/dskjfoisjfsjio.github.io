const endpoints = [
  'https://149-28-36-73.colyseus.dev/', // New Jersey
  'https://158-247-241-242.colyseus.dev/', // Seoul
];

async function ping(endpoint) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    fetch(`${endpoint}ping`, { method: 'GET', mode: 'no-cors' })
      .then(() => {
        const latency = Date.now() - start;
        resolve(latency);
      })
      .catch(() => {
        resolve(Infinity); // Treat unreachable endpoints with highest latency
      });
  });
}

async function averagePing(endpoint, count = 5) {
  let total = 0;
  for (let i = 0; i < count; i++) {
    const result = await ping(endpoint);
    total += result;
  }
  return {
    endpoint,
    latency: total / count,
  }
}

export async function getBestEndpoint(includeLocal = false) {

// 	for testing
//  return 'https://144-202-76-68.colyseus.dev/'
	
  let testPoints = [...endpoints]
  // see if more endpoints exist by fetching /endpoints on the first endpoint
  const response = await fetch(`${endpoints[0]}endpoints`, { method: 'GET' })
  console.log(response)
  if (response.ok) {
    const moreEndpoints = await response.json()
    testPoints = moreEndpoints;
  }

  if (includeLocal) testPoints.push("http://localhost:2567/")
  const results = await Promise.all(testPoints.map(endpoint => averagePing(endpoint)));
  results.sort((a, b) => a.latency - b.latency);
  return results[0].endpoint;
}
