const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';

export async function fetchHealth() {
  try {
    const res = await fetch(`${API_BASE_URL}/health`);
    if (!res.ok) throw new Error('Health check failed');
    return await res.json();
  } catch (err) {
    console.warn('API Health Check warning:', err.message);
    return { status: 'offline', model_loaded: false };
  }
}

export async function fetchModelInfo() {
  try {
    const res = await fetch(`${API_BASE_URL}/model-info`);
    if (!res.ok) throw new Error('Failed to fetch model info');
    return await res.json();
  } catch (err) {
    console.error('fetchModelInfo error:', err);
    throw err;
  }
}

export async function fetchEvaluationData() {
  try {
    const res = await fetch(`${API_BASE_URL}/evaluation-data`);
    if (!res.ok) throw new Error('Failed to fetch evaluation data');
    return await res.json();
  } catch (err) {
    console.error('fetchEvaluationData error:', err);
    throw err;
  }
}

export async function fetchFeaturesSchema() {
  try {
    const res = await fetch(`${API_BASE_URL}/features-schema`);
    if (!res.ok) throw new Error('Failed to fetch schema');
    return await res.json();
  } catch (err) {
    console.error('fetchFeaturesSchema error:', err);
    throw err;
  }
}

export async function predictPrice(propertyData) {
  try {
    const res = await fetch(`${API_BASE_URL}/predict`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(propertyData),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || `Server responded with ${res.status}`);
    }

    return await res.json();
  } catch (err) {
    console.error('predictPrice error:', err);
    throw err;
  }
}
