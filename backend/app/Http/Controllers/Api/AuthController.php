<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use App\Models\ActivityLog;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Authenticate User & Issue Sanctum Bearer Token.
     */
    public function login(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $validated['email'])->first();

        if (!$user || !Hash::check($validated['password'], $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Kredensial email atau kata sandi tidak valid.'
            ], 401);
        }

        $token = $user->createToken('letsens-auth-token')->plainTextToken;

        // Log login action if ActivityLog exists
        try {
            ActivityLog::create([
                'timestamp' => now()->toIso8601String(),
                'level' => 'INFO',
                'category' => 'AUTH',
                'action' => 'USER_LOGIN',
                'details' => "Pengguna {$user->name} ({$user->email}) berhasil masuk ke sistem",
                'performed_by' => $user->name,
                'ip_address' => $request->ip() ?? '127.0.0.1',
            ]);
        } catch (\Throwable $e) {}

        return response()->json([
            'success' => true,
            'message' => 'Login berhasil!',
            'data' => [
                'token' => $token,
                'tokenType' => 'Bearer',
                'user' => [
                    'id' => (string) $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role ?? 'Super Admin',
                    'profile_photo' => $user->profile_photo ?? null,
                    'institution' => 'Universitas Komputer Indonesia',
                ]
            ]
        ], 200);
    }

    /**
     * Get Current Authenticated User Profile.
     */
    public function me(Request $request)
    {
        $user = $request->user();

        return response()->json([
            'success' => true,
            'data' => [
                'id' => (string) $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role ?? 'Super Admin',
                'profile_photo' => $user->profile_photo ?? null,
                'institution' => 'Universitas Komputer Indonesia',
            ]
        ], 200);
    }

    /**
     * Update Profile (Name & Profile Photo).
     */
    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'profile_photo' => 'nullable|string',
        ]);

        $user->name = $validated['name'];
        if (array_key_exists('profile_photo', $validated)) {
            $user->profile_photo = $validated['profile_photo'];
        }

        $user->save();

        try {
            ActivityLog::create([
                'timestamp' => now()->toIso8601String(),
                'level' => 'INFO',
                'category' => 'USER',
                'action' => 'PROFILE_UPDATED',
                'details' => "Pengguna {$user->email} memperbarui biodata nama/foto profil",
                'performed_by' => $user->name,
                'ip_address' => $request->ip() ?? '127.0.0.1',
            ]);
        } catch (\Throwable $e) {}

        return response()->json([
            'success' => true,
            'status' => 'success',
            'message' => 'Informasi profil berhasil diperbarui!',
            'user' => [
                'id' => (string) $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role ?? 'Super Admin',
                'profile_photo' => $user->profile_photo ?? null,
                'institution' => 'Universitas Komputer Indonesia',
            ]
        ], 200);
    }

    /**
     * Update User Password.
     */
    public function updatePassword(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:8',
            'new_password_confirmation' => 'required|string|same:new_password',
        ]);

        if (!Hash::check($validated['current_password'], $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Kata sandi lama Anda tidak cocok.'
            ], 422);
        }

        $user->password = Hash::make($validated['new_password']);
        $user->save();

        try {
            ActivityLog::create([
                'timestamp' => now()->toIso8601String(),
                'level' => 'WARNING',
                'category' => 'AUTH',
                'action' => 'PASSWORD_CHANGED',
                'details' => "Pengguna {$user->name} ({$user->email}) memperbarui kata sandi akun",
                'performed_by' => $user->name,
                'ip_address' => $request->ip() ?? '127.0.0.1',
            ]);
        } catch (\Throwable $e) {}

        return response()->json([
            'success' => true,
            'status' => 'success',
            'message' => 'Kata sandi akun Anda berhasil diperbarui!'
        ], 200);
    }

    /**
     * Revoke Current Access Token.
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Sesi berhasil diakhiri (Logout).'
        ], 200);
    }
}

