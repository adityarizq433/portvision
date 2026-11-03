<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Crypt;

class Setting extends Model
{
    protected $fillable = ['key', 'value', 'is_encrypted', 'description'];

    protected $casts = [
        'is_encrypted' => 'boolean',
    ];

    /**
     * Get a setting value by key, auto-decrypting if needed.
     */
    public static function getValue(string $key, mixed $default = null): mixed
    {
        try {
            $setting = static::where('key', $key)->first();

            if (! $setting) {
                return $default;
            }

            if ($setting->is_encrypted && $setting->value) {
                return Crypt::decryptString($setting->value);
            }

            return $setting->value ?? $default;
        } catch (\Throwable) {
            return $default;
        }
    }

    /**
     * Set a setting value by key, auto-encrypting if needed.
     */
    public static function setValue(string $key, mixed $value): void
    {
        $setting = static::where('key', $key)->firstOrFail();

        if ($setting->is_encrypted && $value) {
            $value = Crypt::encryptString($value);
        }

        $setting->update(['value' => $value]);
    }
}
