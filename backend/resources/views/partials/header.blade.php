<header class="bg-white shadow-sm border-b px-8 py-4 flex justify-between items-center z-10">
    <div>
        <h2 class="text-2xl font-bold text-gray-800">@yield('page_name', 'Monitor Dashboard')</h2>
        <p class="text-sm text-gray-500">@yield('page_desc', 'Status real-time penggunaan dan kebersihan toilet')</p>
    </div>
    <div class="flex items-center gap-4">
        <div class="text-right hidden md:block">
            <p class="text-sm font-bold text-gray-700">Admin Fasilitas</p>
            <p class="text-xs text-gray-500">admin@unikom.ac.id</p>
        </div>
        <div class="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold border border-blue-200">
            AD
        </div>
    </div>
</header>