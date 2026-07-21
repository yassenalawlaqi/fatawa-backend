import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 100 }, // Ramp-up to 100 users over 30s
    { duration: '1m', target: 100 },  // Stay at 100 users for 1m
    { duration: '30s', target: 500 }, // Ramp-up to 500 users
    { duration: '1m', target: 500 },  // Stay at 500 users
    { duration: '30s', target: 1000 }, // Ramp-up to 1000 users
    { duration: '1m', target: 1000 },  // Stay at 1000 users
    { duration: '30s', target: 0 },    // Ramp-down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<200'], // 95% of requests should be below 200ms
    http_req_failed: ['rate<0.01'],   // Error rate should be less than 1%
  },
};

export default function () {
  const searchQueries = [
    'صلاة',
    'زكاة الفطر',
    'الحج',
    'رمضان',
    'الطلاق',
  ];

  const randomQuery = searchQueries[Math.floor(Math.random() * searchQueries.length)];
  
  const payload = JSON.stringify({
    query: randomQuery,
    limit: 20,
    page: 1,
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const res = http.post('http://localhost:3000/v1/search', payload, params);
  
  check(res, {
    'is status 201 or 200': (r) => r.status === 201 || r.status === 200,
    'transaction time OK': (r) => r.timings.duration < 200,
  });
  
  // Optionally check autocomplete
  const acRes = http.get(`http://localhost:3000/v1/search/autocomplete?q=${randomQuery.substring(0, 2)}`);
  check(acRes, {
    'autocomplete status 200': (r) => r.status === 200,
  });

  sleep(1); // Think time
}
