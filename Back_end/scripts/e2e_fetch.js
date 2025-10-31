(async () => {
  const base = 'http://127.0.0.1:8000';
  const cases = [
    { path: '/ask', body: new URLSearchParams({ question: 'How do I treat tomato early blight?' }) },
    { path: '/ask', body: new URLSearchParams({ question: "What's the capital of France?" }) },
    { path: '/diagnose', body: new URLSearchParams({ text: 'I have yellow spots on my tomato leaves' }) },
  ];

  for (const c of cases) {
    try {
      console.log('\n---- Request ->', c.path, '----');
      const res = await fetch(base + c.path, {
        method: 'POST',
        headers: {
          'accept': 'application/json, text/plain, */*',
          'content-type': 'application/x-www-form-urlencoded;charset=UTF-8',
          // Simulate a typical browser origin header (not required for server call but useful for logs)
          'origin': 'http://localhost:3000'
        },
        body: c.body.toString(),
      });

      console.log('Status:', res.status);
      console.log('Content-Type:', res.headers.get('content-type'));
      const text = await res.text();
      try {
        const json = JSON.parse(text);
        console.log('Body (JSON):', JSON.stringify(json, null, 2));
      } catch (e) {
        console.log('Body (text):', text);
      }
    } catch (err) {
      console.error('Fetch error:', err);
    }
  }
})();
