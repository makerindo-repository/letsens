<aside class="w-64 bg-[#0B132B] text-white flex flex-col shadow-xl z-20 relative">
    <div class="p-6 flex flex-col items-center border-b border-gray-700">
        <div class="w-16 h-16 bg-white rounded-lg flex items-center justify-center mb-3 shadow-lg">
            <span class="text-[#0B132B] font-bold text-[9px] text-center leading-tight">Universitas Komputer Indonesia</span>
        </div>
        <h1 class="text-xl font-bold text-blue-400">LetSens V1.0</h1>
        <p class="text-xs text-gray-400 text-center mt-1">Sistem Manajemen Toilet Cerdas</p>
    </div>

    <nav class="flex-1 px-4 py-6 overflow-y-auto no-scrollbar space-y-6">
        <div>
            <p class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-2">MENU UTAMA</p>
            <a href="/" class="{{ request()->is('/') ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'text-gray-300 hover:text-white hover:bg-gray-800' }} flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition">
                <i class="fa-solid fa-chart-pie w-5"></i> Monitor Dashboard
            </a>
            <a href="#" class="flex items-center gap-3 text-gray-300 hover:text-white hover:bg-gray-800 px-3 py-2.5 rounded-lg mb-1 transition">
                <i class="fa-solid fa-chart-line w-5"></i> Analitik
            </a>
            <a href="#" class="flex items-center gap-3 text-gray-300 hover:text-white hover:bg-gray-800 px-3 py-2.5 rounded-lg transition">
                <i class="fa-solid fa-robot w-5"></i> LetSens AI
            </a>
        </div>
        <div>
            <p class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-2">MANAJEMEN DATA</p>
            <a href="#" class="flex items-center gap-3 text-gray-300 hover:text-white hover:bg-gray-800 px-3 py-2.5 rounded-lg mb-1 transition">
                <i class="fa-solid fa-restroom w-5"></i> Data Toilet
            </a>
            <a href="#" class="flex items-center gap-3 text-gray-300 hover:text-white hover:bg-gray-800 px-3 py-2.5 rounded-lg transition">
                <i class="fa-solid fa-users w-5"></i> Data Petugas
            </a>
        </div>
        <div>
            <p class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-2">OPERASIONAL</p>
            <a href="#" class="flex items-center gap-3 text-gray-300 hover:text-white hover:bg-gray-800 px-3 py-2.5 rounded-lg mb-1 transition">
                <i class="fa-solid fa-wrench w-5"></i> Riwayat Perbaikan
            </a>
            <a href="#" class="flex items-center gap-3 text-gray-300 hover:text-white hover:bg-gray-800 px-3 py-2.5 rounded-lg transition">
                <i class="fa-solid fa-broom w-5"></i> Riwayat Perawatan
            </a>
        </div>
    </nav>

    <div class="p-4 border-t border-gray-800 text-center bg-[#0B132B] flex flex-col items-center">
        <div class="relative w-20 h-20 mb-2">
            <svg class="w-full h-full" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="46" fill="none" stroke="#1e293b" stroke-width="4"/>
                <line x1="50" y1="8" x2="50" y2="14" stroke="#64748b" stroke-width="2" stroke-linecap="round"/>
                <line x1="50" y1="86" x2="50" y2="92" stroke="#64748b" stroke-width="2" stroke-linecap="round"/>
                <line x1="8" y1="50" x2="14" y2="50" stroke="#64748b" stroke-width="2" stroke-linecap="round"/>
                <line x1="86" y1="50" x2="92" y2="50" stroke="#64748b" stroke-width="2" stroke-linecap="round"/>
                
                <line id="hour-hand" x1="50" y1="50" x2="50" y2="28" stroke="#ffffff" stroke-width="4" stroke-linecap="round"/>
                <line id="min-hand" x1="50" y1="50" x2="50" y2="20" stroke="#94a3b8" stroke-width="3" stroke-linecap="round"/>
                <line id="sec-hand" x1="50" y1="50" x2="50" y2="16" stroke="#3b82f6" stroke-width="1.5" stroke-linecap="round"/>
                <circle cx="50" cy="50" r="3" fill="#3b82f6"/>
            </svg>
        </div>
        <div id="live-clock" class="text-sm font-semibold text-blue-400 tracking-wider">00:00:00</div>
        <div id="live-date" class="text-[11px] text-gray-400 mt-0.5">01 Jan 2026</div>
    </div>

    <div class="p-4 border-t border-gray-700">
        <a href="#" class="flex items-center gap-3 text-red-400 hover:text-red-300 px-3 py-2 transition">
            <i class="fa-solid fa-right-from-bracket w-5"></i> Logout
        </a>
    </div>
</aside>