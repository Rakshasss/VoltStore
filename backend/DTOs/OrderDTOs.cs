namespace Adashop.DTOs;

// ── DELIVERY ──────────────────────────────────────────────────────────────────

public record DeliveryMethodResponse(
    int Id,
    string Name,
    string Description,
    decimal Price,
    int EstimatedDays
);

// ── ORDER REQUEST ─────────────────────────────────────────────────────────────

public record CreateOrderRequest(
    string ShippingAddress,
    string PaymentMethod,        // "Card" or "Cash"
    int DeliveryMethodId,
    // Simulated card details (not stored, just validated)
    string? CardNumber,
    string? CardExpiry,
    string? CardCvv,
    string? CardHolder
);

public record UpdateOrderStatusRequest(
    string Status,               // Pending, Paid, Processing, Shipped, Delivered, Cancelled
    string? TrackingNumber,
    string? TrackingNotes
);

// ── ORDER RESPONSE ────────────────────────────────────────────────────────────

public record OrderItemResponse(
    int Id,
    int ProductId,
    string ProductName,
    decimal ProductPriceSnapshot,
    int Quantity,
    decimal SubTotal
);

public record OrderResponse(
    int Id,
    string Status,
    string ShippingAddress,
    decimal TotalPrice,
    decimal DeliveryPrice,
    decimal GrandTotal,
    string PaymentMethod,
    bool IsPaid,
    string? TrackingNumber,
    string? TrackingNotes,
    string? EstimatedDeliveryDate,
    string? ShippedAt,
    string? DeliveredAt,
    DeliveryMethodResponse? DeliveryMethod,
    List<OrderItemResponse> Items,
    string CreatedAt,
    string Currency
);

public record UserOrdersResponse(
    List<OrderResponse> Orders,
    int TotalCount,
    string Currency
);
