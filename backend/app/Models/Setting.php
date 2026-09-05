<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Setting extends Model
{
    use HasFactory;

    protected $fillable = [
        'key',
        'value',
        'group',
    ];

    /**
     * Get settings as key-value pairs for a specific group.
     *
     * @param string $group
     * @return array
     */
    public static function getByGroup(string $group): array
    {
        return self::where('group', $group)->pluck('value', 'key')->toArray();
    }

    /**
     * Upsert key-value pairs for a specific group.
     *
     * @param string $group
     * @param array $data
     * @return void
     */
    public static function setByGroup(string $group, array $data): void
    {
        foreach ($data as $key => $value) {
            self::updateOrCreate(
                ['key' => $key],
                [
                    'value' => $value,
                    'group' => $group,
                ]
            );
        }
    }

    /**
     * Get a single setting value.
     *
     * @param string $key
     * @param mixed $default
     * @return mixed
     */
    public static function getValue(string $key, $default = null)
    {
        $setting = self::where('key', $key)->first();
        
        return $setting ? $setting->value : $default;
    }
}
