export type Role = 'admin' | 'viewer';

export interface User {
    id: number;
    name: string;
    email: string;
    email_verified_at?: string;
    role: Role;
    created_at?: string;
}

export interface Location {
    id: number;
    name: string;
    slug: string;
    description?: string | null;
    parent_id?: number | null;
    parent?: Location | null;
    devices_count?: number;
    devices_up_count?: number;
    devices_down_count?: number;
    created_at?: string;
}

export type DeviceTier = 'core' | 'distribution' | 'access' | 'unknown';
export type DeviceStatus = 'up' | 'down' | 'unknown';

export interface Device {
    id: number;
    librenms_device_id: number;
    hostname: string;
    ip?: string | null;
    vendor?: string | null;
    model?: string | null;
    os?: string | null;
    os_version?: string | null;
    hardware?: string | null;
    serial?: string | null;
    location_id?: number | null;
    location?: Location | null;
    location_string?: string | null;
    tier: DeviceTier;
    status: DeviceStatus;
    is_hidden: boolean;
    snmp_disable: boolean;
    last_seen_at?: string | null;
    last_polled_at?: string | null;
    port_count: number;
    port_up_count: number;
    port_down_count: number;
    ports?: Port[];
    port_events?: PortEvent[];
    topology_node?: TopologyNode | null;
}

export interface Port {
    id: number;
    device_id: number;
    librenms_port_id: number;
    if_name: string;
    if_descr?: string | null;
    if_alias?: string | null;
    display_name?: string;
    if_type?: string | null;
    if_speed?: number | null;
    speed_human?: string | null;
    oper_status: 'up' | 'down' | 'unknown';
    admin_status: 'up' | 'down' | 'testing' | 'unknown';
    is_physical: boolean;
    is_critical: boolean;
    status_changed_at?: string | null;
    device?: Device;
    events?: PortEvent[];
}

export interface PortEvent {
    id: number;
    port_id: number;
    device_id: number;
    from_status: 'up' | 'down' | 'unknown';
    to_status: 'up' | 'down' | 'unknown';
    occurred_at: string;
    device?: Device;
    port?: Port;
}

export interface TopologyNode {
    id: number;
    device_id: number;
    location_id?: number | null;
    x: number;
    y: number;
    is_locked: boolean;
    device?: Device;
}

export interface TopologyLink {
    id: number;
    source_device_id: number;
    target_device_id: number;
    source_port_id?: number | null;
    target_port_id?: number | null;
    location_id: number;
    source_type: 'lldp' | 'cdp' | 'fdb_suggested' | 'manual';
    status: 'active' | 'suggested' | 'rejected';
    is_hidden: boolean;
    local_port_name?: string | null;
    remote_port_name?: string | null;
    is_confirmed?: boolean;
    source_port?: Port | null;
    target_port?: Port | null;
    source_device?: Device | null;
    target_device?: Device | null;
}

export interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

export interface Paginated<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    links: PaginationLink[];
}

export interface DashboardStats {
    deviceStats: {
        total: number;
        up: number;
        down: number;
        unknown: number;
    };
    portStats: {
        total: number;
        up: number;
        down: number;
        critical_down: number;
    };
    tierStats: {
        core: number;
        distribution: number;
        access: number;
        unknown: number;
    };
    systemStatus: {
        librenms_url: string | null;
        librenms_connected: boolean;
        last_port_poll_at: string | null;
        last_device_sync_at: string | null;
        port_poll_interval: number;
    };
    locations: Location[];
    recentEvents: PortEvent[];
}

export interface SystemSettings {
    librenms_url: string;
    librenms_has_token: boolean;
    port_poll_interval: number;
    device_sync_interval: number;
    link_sync_interval: number;
    librenms_connected: boolean;
    last_port_poll_at: string | null;
    last_device_sync_at: string | null;
}
