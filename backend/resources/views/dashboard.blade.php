@extends('layouts.app')

@section('title', 'Dashboard')
@section('page_name', 'Monitor Dashboard')
@section('page_desc', 'Status real-time penggunaan dan kebersihan toilet')

@section('content')
<main class="flex-1 overflow-y-auto p-8 bg-gray-50">
    
    <div class="mb-6 flex justify-between items-center">
        <h3 class="text-lg font-bold text-gray-800">Status Bilik Saat Ini</h3>
        <select class="bg-white border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block p-2.5 shadow-sm outline-none">
            <option selected>T-A1-M (Gedung A, Lt 1, Pria)</option>
            <option value="2">T-A1-F (Gedung A, Lt 1, Wanita)</option>
        </select>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 relative overflow-hidden flex flex-col justify-between min-h-[140px]">
            <div class="flex justify-between items-center z-10 relative">
                <div class="flex items-center gap-2">
                    <div class="w-8 h-8 rounded-full bg-green-50 text-green-500 flex items-center justify-center text-sm">
                        <i class="fa-solid fa-door-open"></i>
                    </div>
                    <span class="text-xs font-bold text-gray-700 uppercase tracking-wider">Status Bilik</span>
                </div>
                <div class="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.8)]"></div>
            </div>
            <div class="mt-4 z-10 relative pb-2">
                <h4 class="text-3xl font-extrabold text-gray-900" id="val-pir">Kosong</h4>
            </div>
            <div class="absolute bottom-0 left-0 w-full opacity-[0.15]">
                <svg viewBox="0 0 100 30" preserveAspectRatio="none" class="w-full h-12 text-green-500 fill-current">
                    <path d="M0,30 V15 Q25,25 50,15 T100,10 V30 Z"></path>
                </svg>
            </div>
        </div>

        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 relative overflow-hidden flex flex-col justify-between min-h-[140px]">
            <div class="flex justify-between items-center z-10 relative">
                <div class="flex items-center gap-2">
                    <div class="w-8 h-8 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center text-sm">
                        <i class="fa-solid fa-wind"></i>
                    </div>
                    <span class="text-xs font-bold text-gray-700 uppercase tracking-wider">Kadar Amonia</span>
                </div>
                <div class="w-2 h-2 rounded-full bg-orange-400"></div>
            </div>
            <div class="mt-4 z-10 relative pb-2 flex items-baseline gap-1">
                <h4 class="text-3xl font-extrabold text-gray-900" id="val-ammonia">0.0</h4>
                <span class="text-xs font-bold text-gray-400 uppercase tracking-widest">PPM</span>
            </div>
            <div class="absolute bottom-0 left-0 w-full opacity-[0.15]">
                <svg viewBox="0 0 100 30" preserveAspectRatio="none" class="w-full h-12 text-orange-500 fill-current">
                    <path d="M0,30 V20 Q20,5 50,20 T100,15 V30 Z"></path>
                </svg>
            </div>
        </div>

        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 relative overflow-hidden flex flex-col justify-between min-h-[140px]">
            <div class="flex justify-between items-center z-10 relative">
                <div class="flex items-center gap-2">
                    <div class="w-8 h-8 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center text-sm">
                        <i class="fa-solid fa-temperature-half"></i>
                    </div>
                    <span class="text-xs font-bold text-gray-700 uppercase tracking-wider">Suhu Udara</span>
                </div>
                <div class="w-2 h-2 rounded-full bg-blue-400"></div>
            </div>
            <div class="mt-4 z-10 relative pb-2 flex items-baseline gap-1">
                <h4 class="text-3xl font-extrabold text-gray-900" id="val-temp">0</h4>
                <span class="text-xs font-bold text-gray-400 uppercase tracking-widest">°C</span>
            </div>
            <div class="absolute bottom-0 left-0 w-full opacity-[0.15]">
                <svg viewBox="0 0 100 30" preserveAspectRatio="none" class="w-full h-12 text-blue-500 fill-current">
                    <path d="M0,30 V10 Q25,20 50,10 T100,20 V30 Z"></path>
                </svg>
            </div>
        </div>

        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 relative overflow-hidden flex flex-col justify-between min-h-[140px]">
            <div class="flex justify-between items-center z-10 relative">
                <div class="flex items-center gap-2">
                    <div class="w-8 h-8 rounded-full bg-yellow-50 text-yellow-500 flex items-center justify-center text-sm">
                        <i class="fa-solid fa-lightbulb"></i>
                    </div>
                    <span class="text-xs font-bold text-gray-700 uppercase tracking-wider">Pencahayaan</span>
                </div>
                <div class="w-2 h-2 rounded-full bg-yellow-400"></div>
            </div>
            <div class="mt-4 z-10 relative pb-2 flex items-baseline gap-1">
                <h4 class="text-3xl font-extrabold text-gray-900" id="val-lux">0</h4>
                <span class="text-xs font-bold text-gray-400 uppercase tracking-widest">LUX</span>
            </div>
            <div class="absolute bottom-0 left-0 w-full opacity-[0.15]">
                <svg viewBox="0 0 100 30" preserveAspectRatio="none" class="w-full h-12 text-yellow-500 fill-current">
                    <path d="M0,30 V18 Q30,8 60,18 T100,5 V30 Z"></path>
                </svg>
            </div>
        </div>

    </div>
</main>

<script>
    function fetchLatestData() {
        fetch('/api/latest-sensor-data')
            .then(response => response.json())
            .then(data => {
                console.log("Data diterima dari server:", data);

                if(data && data.id) {
                    const pirText = data.pir_presence ? 'Terisi' : 'Kosong';
                    document.getElementById('val-pir').innerText = pirText;

                    const amonia = (data.gas_index != null) ? Number(data.gas_index).toFixed(2) : '0.00';
                    document.getElementById('val-ammonia').innerText = amonia;

                    const temp = (data.temperature_c != null) ? Number(data.temperature_c).toFixed(1) : '0';
                    document.getElementById('val-temp').innerText = temp;

                    const lux = (data.light_lux != null) ? Math.round(data.light_lux) : '0';
                    document.getElementById('val-lux').innerText = lux;
                }
            })
            .catch(error => console.error('Gagal mengambil data:', error));
    }

    fetchLatestData();
    setInterval(fetchLatestData, 5000);
</script>
@endsection