export enum IpMode{
    Unknown = 0,
    IPv4 = (1 << 0),
    IPv6 = (1 << 1),
    Both = IPv4 | IPv6
}