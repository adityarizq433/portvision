<?php

namespace App\Services\LibreNMS;

use App\Models\Setting;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Adapter for LibreNMS REST API.
 *
 * SECURITY: The token is read from encrypted settings (DB),
 * never exposed to the frontend. SNMP credentials are stripped
 * from every response before returning.
 */
class LibreNMSClient
{
    private string $baseUrl;

    private string $token;

    private int $timeout = 30;

    private int $retries = 2;

    private int $retryDelay = 500; // ms

    /**
     * Columns that must NEVER be forwarded to the frontend.
     */
    private const SENSITIVE_FIELDS = [
        'community', 'authlevel', 'authname', 'authpass', 'authalgo',
        'cryptopass', 'cryptoalgo', 'snmpver', 'snmp_disable',
        'v3authname', 'v3authpass', 'v3authalgo', 'v3cryptopass', 'v3cryptoalgo',
        'bgpLocalAs', 'sysPassword',
    ];

    public function __construct(?string $baseUrl = null, ?string $token = null)
    {
        $rawUrl = $baseUrl ?? Setting::getValue('librenms_url', '');
        $cleaned = preg_replace('#/(devices|ports|api(/v\d+)?)/?$#i', '', trim($rawUrl));
        $this->baseUrl = rtrim($cleaned, '/');
        $this->token = $token ?? Setting::getValue('librenms_token', '');
    }

    // ------------------------------------------------------------------
    // Public API methods
    // ------------------------------------------------------------------

    /**
     * Test connection to LibreNMS.
     *
     * @return array{ok: bool, message: string, version: string|null}
     */
    public function testConnection(): array
    {
        try {
            $response = $this->get('/api/v0/system');

            if ($response->successful()) {
                $data = $response->json();

                return [
                    'ok' => true,
                    'message' => 'Connected successfully',
                    'version' => $data['system']['local_ver'] ?? null,
                ];
            }

            return [
                'ok' => false,
                'message' => "HTTP {$response->status()}: {$response->reason()}",
                'version' => null,
            ];
        } catch (ConnectionException $e) {
            return [
                'ok' => false,
                'message' => 'Connection failed: '.$e->getMessage(),
                'version' => null,
            ];
        }
    }

    /**
     * Get all devices. Strips sensitive SNMP credentials.
     */
    public function getDevices(): array
    {
        $response = $this->get('/api/v0/devices');

        if (! $response->successful()) {
            Log::warning('LibreNMS: getDevices failed', ['status' => $response->status()]);

            return [];
        }

        $devices = $response->json('devices', []);

        // Strip sensitive fields — NEVER send SNMP creds to caller
        return array_map(fn ($d) => $this->stripSensitiveFields($d), $devices);
    }

    /**
     * Get all ports in bulk (single request — efficient for 300+ devices).
     * Uses pagination to handle large datasets.
     */
    public function getAllPorts(int $pageSize = 1000): array
    {
        $columns = 'device_id,port_id,ifName,ifDescr,ifAlias,ifType,ifOperStatus,ifAdminStatus,ifSpeed';
        $page = 1;
        $all = [];

        do {
            $response = $this->get('/api/v0/ports', [
                'columns' => $columns,
                'paginate' => 1,
                'rowCount' => $pageSize,
                'current' => $page,
            ]);

            if (! $response->successful()) {
                Log::warning('LibreNMS: getAllPorts page failed', [
                    'page' => $page,
                    'status' => $response->status(),
                ]);
                break;
            }

            $data = $response->json();
            $ports = $data['ports'] ?? [];
            $all = array_merge($all, $ports);

            // Check if more pages exist
            $total = $data['total'] ?? count($ports);
            $fetched = count($all);
            $page++;
        } while ($fetched < $total);

        return $all;
    }

    /**
     * Get ports for a specific device.
     */
    public function getDevicePorts(int $libreNmsDeviceId): array
    {
        $columns = 'port_id,ifName,ifDescr,ifAlias,ifType,ifOperStatus,ifAdminStatus,ifSpeed';
        $response = $this->get("/api/v0/devices/{$libreNmsDeviceId}/ports", [
            'columns' => $columns,
        ]);

        if (! $response->successful()) {
            return [];
        }

        return $response->json('ports', []);
    }

    /**
     * Get LLDP/CDP links.
     */
    public function getLinks(): array
    {
        $response = $this->get('/api/v0/resources/links');

        if (! $response->successful()) {
            // LibreNMS returns 404 "Links do not exist" when the links table
            // is empty, which is not an error worth logging.
            if (! ($response->status() === 404 && str_contains($response->json('message', ''), 'Links do not exist'))) {
                Log::warning('LibreNMS: getLinks failed', ['status' => $response->status()]);
            }

            return [];
        }

        return $response->json('links', []);
    }

    /**
     * Get locations from LibreNMS.
     */
    public function getLocations(): array
    {
        $response = $this->get('/api/v0/resources/locations');

        if (! $response->successful()) {
            return [];
        }

        return $response->json('locations', []);
    }

    /**
     * Check if the client is properly configured.
     */
    public function isConfigured(): bool
    {
        return ! empty($this->baseUrl) && ! empty($this->token);
    }

    // ------------------------------------------------------------------
    // Internal helpers
    // ------------------------------------------------------------------

    private function get(string $path, array $query = []): Response
    {
        $url = $this->baseUrl.$path;

        return Http::timeout($this->timeout)
            ->retry($this->retries, $this->retryDelay, throw: false)
            ->withHeaders(['X-Auth-Token' => $this->token])
            ->get($url, $query ?: null);
    }

    private function stripSensitiveFields(array $data): array
    {
        foreach (self::SENSITIVE_FIELDS as $field) {
            unset($data[$field]);
        }

        return $data;
    }
}
