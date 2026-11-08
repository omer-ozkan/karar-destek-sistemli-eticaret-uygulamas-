import { BasketModel } from "./basket.model";

export const ORDER_STATUSES = [
    "Hazırlanıyor",
    "Kargoya Verildi",
    "Teslim Edildi",
    "İptal Edildi",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export function normalizeOrderStatus(status: string | undefined | null): OrderStatus {
    const trimmed = status?.trim();

    if (trimmed === "Kargoda") {
        return "Kargoya Verildi";
    }

    if (trimmed && ORDER_STATUSES.includes(trimmed as OrderStatus)) {
        return trimmed as OrderStatus;
    }

    return "Hazırlanıyor";
}

export interface OrderModel{
    id?: string;
    userId: string;
    orderNumber: string;
    date: Date;
    fullName: string;
    phoneNumber: string;
    city: string;
    district: string;
    fullAddress: string;
    cardNumber: string;
    cardOwnerName: string;
    expiresDate: string;
    cvv: number;
    installmentOptions: string;
    status: string;
    baskets: BasketModel[];
}

export const initialOrder: OrderModel = {
    fullName: "",
    userId: "",
    orderNumber: "",
    date: new Date(),
    phoneNumber: "",
    city: "",
    district: "",
    fullAddress: "",
    cardNumber: "",
    cardOwnerName: "",
    expiresDate: "",
    cvv: 0,
    installmentOptions: "Tek çekim",
    status: "Hazırlanıyor",
    baskets: []
}