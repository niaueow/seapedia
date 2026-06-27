// Shared formatting + label helpers used across the app.

export const formatIDR = (value: number) =>
    new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
    }).format(value ?? 0);

export const formatDateTime = (iso: string) =>
    new Intl.DateTimeFormat("id-ID", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(new Date(iso));

export const formatDate = (iso: string) =>
    new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(
        new Date(iso),
    );

export type RoleName = "ADMIN" | "SELLER" | "BUYER" | "DRIVER";

export const ROLE_LABELS: Record<RoleName, string> = {
    ADMIN: "Admin",
    SELLER: "Penjual",
    BUYER: "Pembeli",
    DRIVER: "Kurir",
};

export type OrderStatus =
    | "SEDANG_DIKEMAS"
    | "MENUNGGU_PENGIRIM"
    | "SEDANG_DIKIRIM"
    | "PESANAN_SELESAI"
    | "DIKEMBALIKAN";

export const ORDER_STATUS_LABELS: Record<string, string> = {
    SEDANG_DIKEMAS: "Sedang Dikemas",
    MENUNGGU_PENGIRIM: "Menunggu Pengirim",
    SEDANG_DIKIRIM: "Sedang Dikirim",
    PESANAN_SELESAI: "Pesanan Selesai",
    DIKEMBALIKAN: "Dikembalikan",
};

// Maps an order status to its status-chip CSS modifier class.
export const ORDER_STATUS_CLASS: Record<string, string> = {
    SEDANG_DIKEMAS: "status-dikemas",
    MENUNGGU_PENGIRIM: "status-menunggu",
    SEDANG_DIKIRIM: "status-dikirim",
    PESANAN_SELESAI: "status-selesai",
    DIKEMBALIKAN: "status-dikembalikan",
};

export const DELIVERY_LABELS: Record<string, string> = {
    INSTANT: "Instan",
    NEXT_DAY: "Hari Berikutnya",
    REGULAR: "Reguler",
};

export const DELIVERY_FEES: Record<string, number> = {
    INSTANT: 30000,
    NEXT_DAY: 20000,
    REGULAR: 10000,
};

export const WALLET_TXN_LABELS: Record<string, string> = {
    TOPUP: "Isi saldo",
    PURCHASE: "Pembayaran pesanan",
    REFUND: "Pengembalian dana",
};
