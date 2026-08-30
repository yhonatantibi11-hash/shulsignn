const RESOURCES = {
  Synagogue: 'synagogue', SynagogueSettings: 'settings', PrayerTime: 'prayers',
  TorahLesson: 'lessons', Event: 'events', DisplayTheme: 'themes',
};

let adminCache = null;
let publicCache = null;

async function jsonFetch(url, options) {
  const response = await fetch(url, { cache: 'no-store', ...options });
  if (response.status === 401 && url.startsWith('/api/admin/')) {
    window.location.assign('/admin');
  }
  if (!response.ok) {
    let detail = '';
    try {
      const body = await response.json();
      detail = body.detail || body.error || '';
    } catch {
      detail = await response.text().catch(() => '');
    }
    const error = new Error(detail || `Request failed: ${response.status}`);
    error.status = response.status;
    throw error;
  }
  return response.json();
}

const isPublicDisplay = () => window.location.hash.startsWith('#/display');

async function loadPublic() {
  if (!publicCache) publicCache = jsonFetch(`/api/public/display?slug=mizmor-ledavid&_=${Date.now()}`);
  return publicCache;
}

async function refreshPublic() {
  publicCache = null;
  return loadPublic();
}

async function loadAdmin() {
  if (!adminCache) adminCache = jsonFetch(`/api/admin/data?_=${Date.now()}`);
  return adminCache;
}

function normalizePublic(data, name) {
  return ({
    Synagogue: data.synagogue ? [data.synagogue] : [],
    SynagogueSettings: data.settings ? [{
      ...data.settings,
      synagogue_id: data.synagogue?.id,
      synagogue_name: data.settings.synagogue_name || data.synagogue?.name,
      latitude: data.synagogue?.latitude,
      longitude: data.synagogue?.longitude,
      timezone: data.synagogue?.timezone || 'Asia/Jerusalem',
    }] : [],
    PrayerTime: data.prayer_times || [], TorahLesson: data.lessons || [],
    Event: data.events || [], DisplayTheme: data.themes || [],
  })[name] || [];
}

function normalizeAdmin(data, name) {
  const value = data[RESOURCES[name]];
  return name === 'Synagogue' || name === 'SynagogueSettings' ? (value ? [value] : []) : (value || []);
}

async function filterEntity(name) {
  return isPublicDisplay() ? normalizePublic(await loadPublic(), name) : normalizeAdmin(await loadAdmin(), name);
}

async function mutate(name, action, id, values) {
  // Drop every in-memory snapshot before writing so an invalidated React Query
  // can never reuse data that was loaded before this mutation finished.
  adminCache = null;
  const result = await jsonFetch('/api/admin/data', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ resource: RESOURCES[name], action, id, values }),
  });
  adminCache = null;
  publicCache = null;
  if (!result.rows?.length) throw new Error('השינוי לא נשמר במסד הנתונים');
  return result.rows[0];
}

function entity(name) {
  return {
    filter: () => filterEntity(name),
    get: async (id) => (await filterEntity(name)).find((item) => item.id === id) || null,
    create: (values) => mutate(name, 'create', undefined, values),
    update: (id, values) => mutate(name, 'update', id, values),
    delete: (id) => mutate(name, 'delete', id),
    subscribe: () => () => {},
  };
}

export const base44 = {
  public: { refresh: refreshPublic },
  auth: {
    me: async () => { const data = await loadAdmin(); return { id: data.user_id, role: data.role }; },
    logout: async () => { await fetch('/api/auth/logout', { method: 'POST' }); window.location.assign('/admin'); },
    redirectToLogin: () => window.location.assign('/admin'),
  },
  entities: Object.fromEntries(Object.keys(RESOURCES).map((name) => [name, entity(name)])),
  integrations: { Core: { UploadFile: async ({ file }) => {
    const form = new FormData(); form.append('file', file);
    return jsonFetch('/api/admin/upload', { method: 'POST', body: form });
  } } },
};
