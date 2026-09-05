<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Configure Rate Limiting for LetSens REST API
        RateLimiter::for('api', function (Request $request) {
            return Limit::perMinute(120)->by($request->user()?->id ?: $request->ip());
        });

        // Configure Higher Threshold Rate Limiter for IoT Sensor Telemetry Ingestion
        RateLimiter::for('sensor-ingestion', function (Request $request) {
            return Limit::perMinute(600)->by($request->ip());
        });
    }
}
