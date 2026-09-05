<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>LetSens V1.0 - @yield('title', 'Dashboard')</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Inter', sans-serif; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
    </style>
</head>
<body class="bg-gray-50 text-gray-800 flex h-screen overflow-hidden">

    <!-- Panggil Komponen Sidebar -->
    @include('partials.sidebar')

    <!-- AREA KANAN (MAIN CONTENT) -->
    <div class="flex-1 flex flex-col h-screen relative">
        
        <!-- Panggil Komponen Header -->
        @include('partials.header')

        <!-- Tempat Konten Halaman Disisipkan -->
        @yield('content')
        
    </div>

    <!-- Script Jam Real-time -->
    <script>
        function updateClock() {
            const now = new Date();
            const hours = now.getHours();
            const minutes = now.getMinutes();
            const seconds = now.getSeconds();

            const hourDeg = (hours % 12) * 30 + minutes * 0.5;
            const minDeg = minutes * 6 + seconds * 0.1;
            const secDeg = seconds * 6;

            const hourHand = document.getElementById('hour-hand');
            if(hourHand) {
                hourHand.setAttribute('transform', `rotate(${hourDeg} 50 50)`);
                document.getElementById('min-hand').setAttribute('transform', `rotate(${minDeg} 50 50)`);
                document.getElementById('sec-hand').setAttribute('transform', `rotate(${secDeg} 50 50)`);
                
                let hStr = String(hours).padStart(2, '0');
                let mStr = String(minutes).padStart(2, '0');
                let sStr = String(seconds).padStart(2, '0');
                document.getElementById('live-clock').innerText = `${hStr}:${mStr}:${sStr}`;

                const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                let day = String(now.getDate()).padStart(2, '0');
                let month = months[now.getMonth()];
                let year = now.getFullYear();
                document.getElementById('live-date').innerText = `${day} ${month} ${year}`;
            }
        }
        updateClock();
        setInterval(updateClock, 1000);
    </script>
    @stack('scripts')
</body>
</html>