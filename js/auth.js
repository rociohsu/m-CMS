import { state } from './state.js';
import { supabaseClient, initSupabase } from './supabase.js';

const DB_TABLE_NAME = 'profiles';

const levelMap = {
  0: '管理員',
  1: '一般員工',
  2: '店長'
};

const levelBadgeStyleMap = {
  0: 'bg-red-100 text-red-600',
  1: 'bg-orange-100 text-orange-600',
  2: 'bg-amber-100 text-amber-700'
};

export async function initAuth() {
  await initSupabase();
  if (!supabaseClient) return;

  supabaseClient.auth.onAuthStateChange(async (event, session) => {
    if (session) {
      state.user = session.user;
      await syncUserProfile(session.user);
    } else {
      state.user = null;
      state.userProfile = null;
    }
    renderAuthUI();
  });

  try {
    const { data: { session }, error } = await supabaseClient.auth.getSession();
    if (error) {
      console.error('Supabase 取得 Session 發生錯誤:', error);
    }
    if (session?.user) {
      state.user = session.user;
      await syncUserProfile(session.user);
    }
  } catch (err) {
    console.error('Supabase 取得 session 發生未預期錯誤:', err);
  }

  renderAuthUI();
}

export async function syncUserProfile(authUser) {
  if (!authUser) return;

  try {
    const { data, error } = await supabaseClient
      .from(DB_TABLE_NAME)
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (error && (error.code === 'PGRST116' || error.message.includes('0 rows'))) {
      const newProfile = {
        id: authUser.id,
        email: authUser.email,
        display_name: authUser.user_metadata?.full_name || authUser.email.split('@')[0] || '新員工',
        avatar_url: authUser.user_metadata?.avatar_url || '',
        level: 1
      };

      const { data: insertedData, error: insertError } = await supabaseClient
        .from(DB_TABLE_NAME)
        .insert([newProfile])
        .select()
        .single();

      if (insertError) {
        console.error('Supabase 寫入新會員資料失敗 (請檢查 RLS 寫入政策是否允許)：', insertError);
        state.userProfile = {
          id: authUser.id,
          email: authUser.email,
          display_name: newProfile.display_name,
          avatar_url: newProfile.avatar_url,
          created_at: new Date().toISOString(),
          level: 1
        };
      } else {
        state.userProfile = insertedData;
      }
    } else if (error) {
      console.error('查詢 Supabase 資料表發生錯誤 (請檢查資料表結構或啟用 RLS)：', error);
      state.userProfile = {
        id: authUser.id,
        email: authUser.email,
        display_name: authUser.user_metadata?.full_name || '新員工',
        avatar_url: authUser.user_metadata?.avatar_url || '',
        created_at: authUser.created_at || new Date().toISOString(),
        level: 1
      };
    } else {
      state.userProfile = data;
    }
  } catch (err) {
    console.error('同步會員資料庫時發生未預期錯誤:', err);
  }
}

export function renderAuthUI() {
  const headerAuthArea = document.getElementById('header-auth-area');
  const profileContainer = document.getElementById('profile-content-container');

  if (!headerAuthArea || !profileContainer) return;

  if (state.user) {
    const avatarUrl = state.userProfile?.avatar_url || state.user.user_metadata?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop';
    const fullName = state.userProfile?.display_name || state.user.user_metadata?.full_name || state.user.email || '管理員';
    const email = state.userProfile?.email || state.user.email || '未設定電子信箱';
    const levelNum = state.userProfile?.level !== undefined ? state.userProfile.level : 1;
    const levelText = levelMap[levelNum] || '一般員工';
    const levelBadgeClass = levelBadgeStyleMap[levelNum] || 'bg-orange-100 text-orange-600';

    let joinedDateStr = '讀取中...';
    const rawCreatedAt = state.userProfile?.created_at || state.user.created_at;
    if (rawCreatedAt) {
      const date = new Date(rawCreatedAt);
      joinedDateStr = date.toLocaleDateString('zh-TW', {
        year: 'numeric', month: 'long', day: 'numeric'
      });
    }

    headerAuthArea.innerHTML = `
      <div onclick="handleHeaderClick()" class="cursor-pointer active:scale-90 transition-all select-none">
        <img src="${avatarUrl}" class="w-9 h-9 rounded-full object-cover border border-gray-200/80 shadow-sm" onerror="this.src='https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop'" />
      </div>
    `;

    profileContainer.innerHTML = `
      <div class="space-y-6">
        <div class="text-center py-6 space-y-3 bg-white border-b border-gray-100">
          <img src="${avatarUrl}" class="w-24 h-24 rounded-full mx-auto object-cover border border-gray-200/50 shadow-sm" onerror="this.src='https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop'" />
          <h3 class="text-[20px] font-bold text-gray-900">${fullName}</h3>
          <span class="inline-block ${levelBadgeClass} text-[13px] px-4 py-1 rounded-full font-bold">${levelText}</span>
        </div>

        <div class="bg-white rounded-3xl border border-gray-100 divide-y divide-gray-100 overflow-hidden shadow-sm">
          <div class="p-4 flex justify-between items-center text-[15px]">
            <span class="text-gray-400 font-medium">電子信箱</span>
            <span class="text-gray-800 font-bold truncate max-w-[200px]">${email}</span>
          </div>
          <div class="p-4 flex justify-between items-center text-[15px]">
            <span class="text-gray-400 font-medium">加入時間</span>
            <span class="text-gray-800 font-bold">${joinedDateStr}</span>
          </div>
        </div>
      </div>

      <button onclick="handleLogoutFromProfile()" class="w-full py-4 bg-red-50 text-red-500 hover:bg-red-100 active:scale-95 transition-all text-[15px] font-bold rounded-2xl flex items-center justify-center space-x-2 border border-red-100">
        <i data-lucide="log-out" class="w-5 h-5"></i>
        <span>登出</span>
      </button>
    `;
  } else {
    headerAuthArea.innerHTML = `
      <button onclick="handleHeaderClick()" class="bg-orange-500 text-white px-3.5 py-2.5 rounded-full text-[13px] font-bold shadow-sm hover:bg-orange-600 active:scale-95 transition-all flex items-center space-x-1">
        <i data-lucide="log-in" class="w-4 h-4"></i>
        <span>立即登入</span>
      </button>
    `;

    profileContainer.innerHTML = `
      <div class="space-y-6 flex-grow flex flex-col justify-center select-none">
        <div class="bg-gray-900 border border-gray-800 rounded-[2rem] p-8 text-center space-y-6 shadow-2xl">
          <div class="w-20 h-20 bg-orange-500 rounded-full mx-auto flex items-center justify-center shadow-lg shadow-orange-500/30">
            <i data-lucide="store" class="text-white w-10 h-10"></i>
          </div>
          <h3 class="text-[20px] font-bold text-white tracking-wide">歡迎使用菜單管理系統</h3>
        </div>

        <button onclick="handleGoogleLogin()" class="w-full flex items-center justify-center bg-white text-gray-800 font-bold py-4 px-4 rounded-full shadow-md hover:bg-gray-50 active:scale-95 transition-all text-[15px] space-x-3 mt-4 border border-gray-200">
          <svg class="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#EA4335" d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.54 14.98 1 12 1 7.35 1 3.37 3.67 1.39 7.56l3.89 3.02C6.24 7.6 8.88 5.04 12 5.04z"/>
            <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.46c-.29 1.48-1.14 2.73-2.4 3.58l3.73 2.89c2.18-2.01 3.7-4.97 3.7-8.62z"/>
            <path fill="#FBBC05" d="M5.28 14.78c-.23-.69-.36-1.42-.36-2.18s.13-1.49.36-2.18L1.39 7.56C.5 9.36 0 11.4 0 12.6s.5 3.24 1.39 5.04l3.89-3.02z"/>
            <path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.73-2.89c-1.03.69-2.35 1.1-3.96 1.1-3.12 0-5.76-2.56-6.72-5.54l-3.89 3.02C3.37 20.33 7.35 23 12 23z"/>
          </svg>
          <span>使用 Google 帳戶安全登入</span>
        </button>
      </div>

      <div class="text-center pt-2">
        <p class="text-gray-600 text-[10px] tracking-wider uppercase select-none">Secured by Supabase Authentication</p>
      </div>
    `;
  }

  lucide.createIcons();
}

export function handleHeaderClick() {
  openProfileModal();
}

export function openProfileModal() {
  const modalProfile = document.getElementById('modal-profile');
  const modalHeader = modalProfile?.querySelector('.sticky');
  const backBtn = modalProfile?.querySelector('button');
  const title = document.getElementById('profile-modal-title');

  if (!modalProfile || !title) return;

  if (state.user) {
    modalProfile.className = 'fixed inset-0 bg-white z-[90] flex flex-col hidden overflow-y-auto text-gray-800 animate-in';
    if (modalHeader) modalHeader.className = 'px-4 py-5 flex items-center justify-between border-b border-gray-100 bg-white sticky top-0 shadow-sm z-10';
    if (backBtn) backBtn.className = 'p-1 text-gray-600 active:scale-90 transition-transform';
    title.className = 'text-[20px] font-bold text-gray-900';
    title.innerText = '使用者資訊';
  } else {
    modalProfile.className = 'fixed inset-0 bg-gray-950 z-[90] flex flex-col hidden overflow-y-auto text-white animate-in';
    if (modalHeader) modalHeader.className = 'px-4 py-5 flex items-center justify-between border-b border-gray-900 bg-gray-950 sticky top-0 shadow-sm z-10';
    if (backBtn) backBtn.className = 'p-1 text-gray-300 hover:text-white active:scale-90 transition-transform';
    title.className = 'text-[20px] font-bold text-white';
    title.innerText = '請登入系統';
  }

  modalProfile.classList.remove('hidden');
  lucide.createIcons();
}

export function closeProfileModal() {
  const modalProfile = document.getElementById('modal-profile');
  if (modalProfile) modalProfile.classList.add('hidden');
}

export async function handleGoogleLogin() {
  if (!supabaseClient) {
    alert('Supabase 服務尚未初始化，請重整頁面後再試一次。');
    return;
  }

  try {
    const { error } = await supabaseClient.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });
    if (error) throw error;
  } catch (e) {
    alert('Google 登入失敗: ' + e.message);
  }
}

export async function handleLogout() {
  if (supabaseClient) {
    await supabaseClient.auth.signOut();
  }
  state.user = null;
  state.userProfile = null;
  renderAuthUI();
}

export async function handleLogoutFromProfile() {
  closeProfileModal();
  await handleLogout();
}

Object.assign(window, {
  handleHeaderClick,
  openProfileModal,
  closeProfileModal,
  handleGoogleLogin,
  handleLogoutFromProfile
});
