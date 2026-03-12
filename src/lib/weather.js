const CACHE_KEY = 'bb_weather'
const CACHE_TTL = 30 * 60 * 1000 // 30分钟

const WMO = {
  0: ['☀️', '晴天'], 1: ['🌤', '晴间多云'], 2: ['⛅', '多云'], 3: ['☁️', '阴天'],
  45: ['🌫', '有雾'], 48: ['🌫', '冻雾'],
  51: ['🌦', '毛毛雨'], 53: ['🌦', '小雨'], 55: ['🌧', '中雨'],
  61: ['🌧', '小雨'], 63: ['🌧', '中雨'], 65: ['⛈', '大雨'],
  71: ['🌨', '小雪'], 73: ['❄️', '中雪'], 75: ['❄️', '大雪'],
  80: ['🌦', '阵雨'], 81: ['🌧', '中阵雨'], 82: ['⛈', '大阵雨'],
  95: ['⛈', '雷阵雨'], 96: ['⛈', '雷雨夹雹'], 99: ['⛈', '强雷暴'],
}

function clothing(t) {
  if (t <= 0) return '大衣加厚毛衣，帽子手套都带上'
  if (t <= 8) return '厚外套，帽子记得戴'
  if (t <= 14) return '夹克或外套，早晚会凉'
  if (t <= 19) return '薄外套，早出门多带一件'
  if (t <= 24) return '长袖就够了，舒适'
  if (t <= 29) return '短袖，清爽'
  return '短袖加防晒，多喝水'
}

// 默认 Bridgeport, CT（桥普林/布里奇波特）
const DEFAULT_LOC = { lat: 41.18, lon: -73.19, city: 'Bridgeport, CT' }

async function locate() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(DEFAULT_LOC)
    navigator.geolocation.getCurrentPosition(
      p => resolve({ lat: p.coords.latitude, lon: p.coords.longitude, city: null }),
      () => resolve(DEFAULT_LOC),
      { timeout: 4000, maximumAge: 600000 }
    )
  })
}

async function doFetch() {
  const loc = await locate()
  const { lat, lon } = loc
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=temperature_2m,apparent_temperature,precipitation_probability&timezone=auto&forecast_days=1`
  const data = await (await fetch(url)).json()

  // 尝试反向地理编码获取城市名
  let city = loc.city
  if (!city) {
    try {
      const geo = await (await fetch(`https://geocoding-api.open-meteo.com/v1/search?latitude=${lat}&longitude=${lon}&count=1&format=json`)).json()
      city = geo?.results?.[0]?.name || `${lat.toFixed(2)}, ${lon.toFixed(2)}`
    } catch {
      city = `${lat.toFixed(2)}, ${lon.toFixed(2)}`
    }
  }

  const h = new Date().getHours()
  const code = data.current_weather.weathercode
  const temp = Math.round(data.current_weather.temperature)
  const feels = Math.round(data.hourly.apparent_temperature[h] ?? temp)
  const rainNow = data.hourly.precipitation_probability[h] ?? 0
  const rainEvening = Math.max(...(data.hourly.precipitation_probability.slice(17, 22) ?? [0]))
  const [emoji, condition] = WMO[code] ?? ['🌡', '未知']

  return {
    temp, feels, emoji, condition, city,
    cloth: clothing(feels),
    rainNow,
    rainEvening,
    rainAlert: rainNow > 40 ? `降雨概率 ${rainNow}%，出门带伞` : null,
    eveningAlert: rainEvening > 50 ? `晚间有雨，开车慢点` : null,
  }
}

export async function fetchWeather() {
  // 先读缓存
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (raw) {
      const { data, ts } = JSON.parse(raw)
      if (Date.now() - ts < CACHE_TTL) return data
    }
  } catch { /* ignore */ }

  const data = await doFetch()

  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ data, ts: Date.now() }))
  } catch { /* ignore */ }

  return data
}
